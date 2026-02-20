import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { abreviarNome, formatarData, formatarHora } from "../../utils/format/formatar_utils";
import InfoGen from "../info/InfoGen";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";
import { nao_aplicar_pendencia_escala } from "../../api/pendencias/pendencias_utils";
import {
  formatDataVisual,
  getEscalaNome,
  uniqueEscalasByNomeClosestDate,
} from "../../utils/pendencias/escala_utils";

function AgenCard({ agendamentosPaginados = [] }) {
  const [escalasMap, setEscalasMap] = useState({});
  const [, setCarregandoEscalas] = useState(false);
  const navigate = useNavigate();

  const getEscalaTagClass = (status) => status === "APLICADO_NAO_LANCADO" ? "bg-amber-100/20 text-amber-800 border-amber-200" : null;

  const getPresencaClasses = (agendamento) => {
    const presenca = agendamento?.presenca;

    switch (presenca) {
      case "Cancelado":
        return {
          header: "bg-red-600/10 text-red-700 border-l-4 border-red-600",
          text: "text-red-600",
          dot: "bg-red-600/90",
        };
      case "Ausência sem Aviso":
        return {
          header: "bg-gray-500/10 text-gray-700 border-l-4 border-gray-500",
          text: "text-gray-500",
          dot: "bg-gray-500/90",
        };
      case "Presente":
        return {
          header: "bg-green-600/10 text-green-800 border-l-4 border-green-600",
          text: "text-green-600",
          dot: "bg-green-600/90",
        };
      default:
        return {
          header: "bg-apollo-200/10 text-gray-800 border-l-4 border-apollo-200",
          text: "text-apollo-200",
          dot: "bg-apollo-200",
        };
    }
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
            const normalizadas = uniqueEscalasByNomeClosestDate(escalas || []);
            return { id: agendamento.id, escalas: normalizadas };
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

  const getEscalaLabel = (escala, status) => {
    const nome = getEscalaNome(escala) ?? `Escala ${escala.id}`;
    const dataRaw = escala.data_referencia;
    
    if (dataRaw) {
        const dataVisualFull = formatDataVisual(dataRaw);
        const dataCurta = dataVisualFull ? dataVisualFull.slice(0, 5) : ""; 
        return (
          <span className="flex items-center gap-1">
            <span className="truncate max-w-[150px]">{nome}</span>
            <span
              className={`opacity-70 font-normal text-[10px] px-1 rounded-sm whitespace-nowrap ${
              status === "APLICADO_NAO_LANCADO"
                ? "bg-amber-100/30 text-amber-800"
                : "bg-black/5"
              }`}
            >
               ({dataCurta})
            </span>
          </span>
        );
    }
    return <span className="truncate max-w-[150px]">{nome}</span>;
  };

  const handleEscalaClick = async (e, agendamento, escala) => {
    e.stopPropagation(); 

    if (escala?.status === "APLICADO_NAO_LANCADO") return;

    const formularioId = escala?.formularioId ?? escala?.formularioID ?? escala?.formulario_id;
    const nomeReal = escala?.formulario?.nomeEscala ?? escala?.nome ?? escala?.titulo ?? "Escala";
    const pendenciaId = escala?.id;

    console.log("Escala clicada:", { escala, formularioId });

    if (!formularioId) {
      Swal.fire({ icon: 'warning', title: 'Indisponível', text: 'ID do formulário não encontrado.' });
      return;
    }

    const result = await Swal.fire({
      title: `${nomeReal}`, 
      text: "Selecione uma ação:",
      icon: 'question',
      showCancelButton: true,
      showDenyButton: true,
      reverseButtons: true, 
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
        const confirmacao = await Swal.fire({
            title: 'Tem certeza?',
            html: `A escala <b>${nomeReal}</b> será marcada como não aplicável.<br/>Essa pendência será removida da lista.`,
            icon: 'warning',
            showCancelButton: true,
            reverseButtons: true, 
            confirmButtonColor: '#d33',    
            cancelButtonColor: '#3085d6',  
            confirmButtonText: 'Sim, remover',
            cancelButtonText: 'Voltar'
        });

        if (confirmacao.isConfirmed) {
            try {
                // CORREÇÃO CRÍTICA DO ERRO 400:
                // O Backend exige string em 'especialidade' e 'diagnosticoMacro'.
                // Se vier null/undefined, colocamos "Geral" ou "Não Informado" para passar na validação.
                const diagRaw = agendamento?.paciente?.diagnosticoMacro;
                const diagFinal = Array.isArray(diagRaw) && diagRaw.length > 0 ? diagRaw[0] : "Geral";
                const espRaw = agendamento?.profissional?.especialidade?.[0];
                const espFinal = espRaw || "Geral";

                const payload = {
                    id: pendenciaId,
                    formularioId: formularioId,
                    agendamentoId: agendamento.id,
                    pacienteId: agendamento?.paciente?.id ?? agendamento?.PacienteID,
                    status: 'NAO_APLICA', 
                    especialidade: espFinal,
                    diagnosticoMacro: diagFinal,
                    data_referencia: escala.data_referencia ?? null
                };

                const resp = await nao_aplicar_pendencia_escala(payload);

                if (resp && resp.ok) {
                    await Swal.fire({
                        title: 'Atualizado!',
                        text: 'Escala removida.',
                        icon: 'success',
                        timer: 1500,
                        showConfirmButton: false
                    });

                    setEscalasMap(prev => {
                        const listaAntiga = prev[agendamento.id] || [];
                        const listaNova = listaAntiga.filter(item => {
                            const itemId = item.formularioId ?? item.id;
                            return itemId !== formularioId;
                        });
                        return { ...prev, [agendamento.id]: listaNova };
                    });
                } else {
                     // Captura detalhe do erro se vier do backend
                     const msg = resp?.error?.response?.data?.error || "Erro na API";
                     throw new Error(msg);
                }
            } catch (error) {
                console.error("Erro ao remover escala:", error);
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
          const presenca = getPresencaClasses(agendamento);
          return (
            <div 
                key={agendamento.id} 
                className="w-full border-apollo-200/30 border rounded-md bg-white hover:shadow-sm transition-shadow duration-200 flex flex-col overflow-hidden"
            >
              <div className={`${presenca.header} px-4 py-2 rounded-t-md font-semibold wrap-break-words`}> 
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${presenca.dot}`} aria-hidden="true" />
                  <span className="truncate">{abreviarNome(agendamento?.paciente?.nome ?? "Paciente", 2)}</span>
                </div>
              </div>

              <div className="px-4 py-2 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 justify-center">
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
                
                <p className="flex flex-col sm:flex-row sm:gap-1 min-w-0 sm:col-span-2 lg:col-span-1">
                    <strong className="text-black">Equipamento:</strong> 
                    <span className="wrap-break-word font-medium text-gray-800" title={agendamento?.slot?.nome ?? "-"}>
                        {agendamento?.slot?.nome ?? "-"}
                    </span>
                </p>
                <p>
                    <strong className="text-black">Presença: </strong> 
                    <span className={`font-medium ${presenca.text}`}>
                      {agendamento.presenca ?? "-"}
                    </span>
                </p>
              </div>

              {escalas.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50 rounded-b-md">
                   <div className="flex flex-wrap gap-2"> 
                    {escalas.map((escala) => {
                      const tagClass = getEscalaTagClass(escala?.status);
                      const isAplicadoNaoLancado = escala?.status === "APLICADO_NAO_LANCADO";

                      return (
                      <button
                        key={escala.id}
                        type="button"
                        onClick={(e) => handleEscalaClick(e, agendamento, escala)}
                        disabled={isAplicadoNaoLancado}
                        className={`
                          flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full transition-all
                          ${tagClass || "bg-purple-200 text-purple-600 border border-purple-400"}
                          ${
                            isAplicadoNaoLancado
                              ? "cursor-not-allowed opacity-80"
                              : "hover:bg-purple-200 hover:border-purple-400 hover:scale-[1.02] cursor-pointer"
                          }
                          max-w-full text-left
                        `}
                        title={escala.data_referencia ? `Aplicar a partir de: ${formatDataVisual(escala.data_referencia)}` : ""}
                      >
                        {getEscalaLabel(escala, escala?.status)}
                      </button>
                    );
                  })}
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