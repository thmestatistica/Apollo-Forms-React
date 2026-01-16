import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { abreviarNome, formatarData, formatarHora } from "../../utils/format/formatar_utils";
import InfoGen from "../info/InfoGen";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";

function AgenCard({ agendamentosPaginados = [] }) {
  const [escalasMap, setEscalasMap] = useState({});
  // eslint-disable-next-line no-unused-vars
  const [carregandoEscalas, setCarregandoEscalas] = useState(false);
  const navigate = useNavigate();

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
    const nome = escala?.formulario?.nomeEscala ?? escala?.nome ?? escala?.titulo ?? `Escala ${escala.id}`;
    
    // Propriedade identificada no log: criadaEm
    const dataRaw = escala.criadaEm || escala.createdAt; 
    
    if (dataRaw) {
        // Formata para DD/MM
        const dataCurta = formatarData(dataRaw).slice(0, 5); 
        return (
            <span className="flex items-center gap-1">
                {nome} 
                <span className="opacity-70 font-normal text-[10px] bg-black/5 px-1 rounded-sm">
                   ({dataCurta})
                </span>
            </span>
        );
    }
    return nome;
  };

  const handleEscalaClick = (e, agendamento, escala) => {
    e.stopPropagation(); 

    const formularioId = escala?.formularioId ?? escala?.formularioID ?? escala?.formulario_id;

    if (!formularioId) {
      Swal.fire({
        icon: 'warning',
        title: 'Indisponível',
        text: 'Formulário da escala não identificado.',
        confirmButtonColor: '#7C3AED'
      });
      return;
    }

    navigate(`/forms-terapeuta/formulario/escala/${formularioId}`, {
      state: {
        pendencia: montarDadosPendencia(agendamento),
        pendenciaEscala: {
          ...escala,
          ...montarDadosPendencia(agendamento)
        },
        fromEscalaTag: true
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {agendamentosPaginados.length > 0 ? (
        agendamentosPaginados.map((agendamento) => {
          const escalas = escalasMap[agendamento.id] || [];
          return (
            <div 
                key={agendamento.id} 
                className="border border-apollo-200 rounded-md bg-white hover:shadow-sm transition-shadow duration-200"
            >
              <div className="bg-apollo-200/20 px-4 py-2 rounded-t-md font-semibold text-black capitalize">
                {abreviarNome(agendamento?.paciente?.nome ?? "Paciente", 2)}
              </div>

              <div className="px-4 py-2 text-sm sm:text-base grid gap-1 sm:grid-cols-3">
                <p><strong>Dia:</strong> {formatarData(agendamento.inicio)}</p>
                <p><strong>Horário:</strong> {`${formatarHora(agendamento.inicio)} até ${formatarHora(agendamento.fim)}`}</p>
                <p><strong>Equipamento:</strong> {agendamento?.slot?.nome ?? "-"}</p>
              </div>

              {escalas.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto pr-2 custom-scrollbar">

                    {escalas.map((escala) => (
                      <button
                      key={escala.id}
                      type="button"
                      onClick={(e) => handleEscalaClick(e, agendamento, escala)}
                      className="
                      flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-all 
                      bg-purple-50 text-purple-700 border border-purple-200
                      hover:bg-purple-100 hover:border-purple-300 hover:scale-105 cursor-pointer
                      "
                      title={`Pendente desde: ${formatarData(escala.criadaEm)}`}
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
        <InfoGen message="📑 Nenhum agendamento disponível." />
      )}
    </div>
  );
}

export default AgenCard;