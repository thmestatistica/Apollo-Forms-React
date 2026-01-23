import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { abreviarNome, formatarData, formatarHora } from "../../utils/format/formatar_utils";
import InfoGen from "../info/InfoGen";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";
import { nao_aplicar_pendencia_escala } from "../../api/pendencias/pendencias_utils";

function AgenCard({ agendamentosPaginados = [] }) {
  const [escalasMap, setEscalasMap] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [carregandoEscalas, setCarregandoEscalas] = useState(false);
  const navigate = useNavigate();

  // Função auxiliar para subtrair 5 dias da data visualmente
  const getDataVisual = (dataIso) => {
    if (!dataIso) return null;
    const d = new Date(dataIso);
    d.setDate(d.getDate() - 4); // Subtrai 5 dias
    return d.toLocaleDateString('pt-BR'); // Retorna DD/MM/AAAA
  };

  useEffect(() => {
    const carregarEscalasParaAgendamentos = async () => {
      if (!agendamentosPaginados || agendamentosPaginados.length === 0) return;
      setCarregandoEscalas(true);
      try {
        const promessas = agendamentosPaginados.map(async (agendamento) => {
          const pacienteId = agendamento?.paciente?.id ?? agendamento?.PacienteID;
          const especialideProf = agendamento?.profissional?.especialidade?.[0] ?? agendamento?.ProfissionalEspecialidade;

          if (typeof pacienteId === "number" && typeof especialideProf === "string" && especialideProf) {
            const escalas = await carregar_escalas_pendentes(pacienteId, especialideProf);
            return { id: agendamento.id, escalas: escalas || [] };
          }
          return { id: agendamento.id, escalas: [] };
        });
        const resultados = await Promise.all(promessas);
        const novoMap = {};
        resultados.forEach(r => { if (r) novoMap[r.id] = r.escalas; });
        setEscalasMap(novoMap);
      } catch (err) {
        console.error("Erro ao carregar escalas pendentes:", err);
      } finally {
        setCarregandoEscalas(false);
      }
    };
    carregarEscalasParaAgendamentos();
  }, [agendamentosPaginados]);

  const montarDadosPendencia = (agendamento) => {
    return {
      Paciente: agendamento?.paciente?.nome || "Paciente",
      PacienteID: agendamento?.paciente?.id ?? agendamento?.PacienteID,
      Data: agendamento.inicio, 
      AgendamentoID: agendamento.id,
      ProfissionalEspecialidade: agendamento?.profissional?.especialidade?.[0]
    };
  };

  const getEscalaLabel = (escala) => {
    // Tenta pegar o nome de várias formas para garantir que não venha vazio
    const nome = escala?.formulario?.nomeEscala ?? escala?.nome ?? escala?.titulo ?? `Escala ${escala.id}`;
    const dataRaw = escala.data_referencia;
    
    if (dataRaw) {
        // Usa a data com -5 dias para exibição
        const dataVisualFull = getDataVisual(dataRaw);
        const dataCurta = dataVisualFull ? dataVisualFull.slice(0, 5) : ""; // Pega só DD/MM
        
        return (
            <span className="flex items-center gap-1">
                <span className="truncate max-w-[150px]">{nome}</span>
                <span className="opacity-70 font-normal text-[10px] bg-black/5 px-1 rounded-sm whitespace-nowrap">
                   ({dataCurta})
                </span>
            </span>
        );
    }
    return <span className="truncate max-w-[150px]">{nome}</span>;
  };

  const handleEscalaClick = async (e, agendamento, escala) => {
    e.stopPropagation(); 

    const formularioId = escala?.formularioId ?? escala?.formularioID ?? escala?.formulario_id;
    // CORREÇÃO 1: Extração robusta do nome para o Swal
    const nomeReal = escala?.formulario?.nomeEscala ?? escala?.nome ?? escala?.titulo ?? "Escala";

    if (!formularioId) {
      Swal.fire({ icon: 'warning', title: 'Indisponível', text: 'ID do formulário não encontrado.' });
      return;
    }

    // --- SWAL 1: DECISÃO ---
    const result = await Swal.fire({
      title: `${nomeReal}`, 
      text: "Selecione uma ação:",
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      reverseButtons: true, // Botão de confirmação na esquerda
      
      confirmButtonColor: '#7C3AED',
      denyButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      
      confirmButtonText: '📝 Preencher',
      denyButtonText: '🚫 Não Aplicável',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        navigate(`/forms-terapeuta/formulario/escala/${formularioId}`, {
            state: {
                pendencia: montarDadosPendencia(agendamento),
                pendenciaEscala: {
                    ...escala,
                    agendamentoId: agendamento.id, 
                    ...montarDadosPendencia(agendamento)
                },
                fromEscalaTag: true
            }
        });
    }
    else if (result.isDenied) {
        // --- SWAL 2: CONFIRMAÇÃO DE EXCLUSÃO ---
        const confirmacao = await Swal.fire({
            title: 'Tem certeza?',
            html: `A escala <b>${nomeReal}</b> será removida deste atendimento.<br/>Essa ação não pode ser desfeita.`,
            icon: 'warning',
            showCancelButton: true,
            reverseButtons: true, // CORREÇÃO 2: Inverte os botões aqui também
            
            confirmButtonColor: '#d33',    // Vermelho (Sim, remover)
            cancelButtonColor: '#3085d6',  // Azul (Voltar)
            
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Voltar'
        });

        if (confirmacao.isConfirmed) {
            try {
                const payload = {
                    formularioId: formularioId,
                    agendamentoId: agendamento.id,
                    pacienteId: agendamento?.paciente?.id ?? agendamento?.PacienteID,
                    status: 'NAO_APLICAVEL'
                };

                const resp = await nao_aplicar_pendencia_escala(payload);

                if (resp) {
                    await Swal.fire({
                        title: 'Atualizado!',
                        text: 'Escala removida.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    setEscalasMap(prev => {
                        const listaAntiga = prev[agendamento.id] || [];
                        const listaNova = listaAntiga.filter(item => item.id !== escala.id);
                        return { ...prev, [agendamento.id]: listaNova };
                    });
                } else {
                     throw new Error("Erro na API");
                }
            } catch (error) {
                console.error(error);
                Swal.fire('Erro', 'Não foi possível atualizar.', 'error');
            }
        }
    }
  };

  return (
    <div className="flex flex-col gap-4 p-2 w-full">
      {agendamentosPaginados.length > 0 ? (
        agendamentosPaginados.map((agendamento) => {
          const escalas = escalasMap[agendamento.id] || [];
          return (
            <div 
                key={agendamento.id} 
                className="w-full border border-apollo-200 rounded-md bg-white hover:shadow-sm transition-shadow duration-200 flex flex-col"
            >
              <div className="bg-apollo-200/20 px-4 py-2 rounded-t-md font-semibold text-black wrap-break-word">
                {abreviarNome(agendamento?.paciente?.nome ?? "Paciente", 2)}
              </div>

              <div className="px-4 py-2 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                <p className="flex flex-col sm:flex-row sm:gap-1">
                    <strong className="text-black">Dia:</strong> 
                    <span className="whitespace-nowrap">{formatarData(agendamento.inicio)}</span>
                </p>
                <p className="flex flex-col sm:flex-row sm:gap-1">
                    <strong className="text-black">Horário:</strong> 
                    <span className="whitespace-nowrap">
                        {`${formatarHora(agendamento.inicio)} - ${formatarHora(agendamento.fim)}`}
                    </span>
                </p>
                <p className="flex flex-col sm:flex-row sm:gap-1">
                    <strong className="text-black">Equipamento:</strong> 
                    <span className="wrap-break-word">{agendamento?.slot?.nome ?? "-"}</span>
                </p>
              </div>

              {escalas.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-md">
                   <div className="flex flex-wrap gap-2"> 
                    {escalas.map((escala) => (
                      <button
                        key={escala.id}
                        type="button"
                        onClick={(e) => handleEscalaClick(e, agendamento, escala)}
                        className="
                          flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all 
                          bg-purple-100 text-purple-700 border border-purple-200
                          hover:bg-purple-200 hover:border-purple-300 hover:scale-[1.02] cursor-pointer
                          max-w-full
                        "
                        // Mostra a data antecipada no hover também
                        title={escala.data_referencia ? `Aplicar a partir de: ${getDataVisual(escala.data_referencia)}` : ""}
                      >
                        {getEscalaLabel(escala)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      ) : (
        <InfoGen message="📑 Nenhum agendamento." />
      )}
    </div>
  );
}

export default AgenCard;