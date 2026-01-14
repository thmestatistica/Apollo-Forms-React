import { abreviarNome, formatarData, formatarHora } from "../../utils/format/formatar_utils";
import InfoGen from "../info/InfoGen";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


// Exibe cartões de agendamentos (sem agrupamento), mantendo o mesmo estilo visual do Card
function AgenCard({ agendamentosPaginados = [] }) {
  const [escalasMap, setEscalasMap] = useState({}); // { agendamentoId: [escalas] }
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

  const handleEscalaClick = (agendamento, escala) => {
    const formularioId = escala?.formularioId ?? escala?.formularioID ?? escala?.formulario_id;
    if (!formularioId) {
      console.warn("Escala sem formularioId identificável:", escala);
      return;
    }
    navigate(`/forms-terapeuta/formulario/escala/${formularioId}`, {
      state: {
        pendenciaEscala: {
          ...escala,
          agendamentoId: agendamento.id,
          pacienteId: agendamento?.paciente?.id ?? agendamento?.PacienteID,
          especialidade: agendamento?.profissional?.especialidade?.[0] ?? agendamento?.ProfissionalEspecialidade
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
            <div key={agendamento.id} className="border border-apollo-200 rounded-md">
              {/* Header com nome do paciente */}
              <div className="bg-apollo-200/20 px-4 py-2 rounded-t-md font-semibold text-black capitalize">
                {abreviarNome(agendamento?.paciente?.nome ?? "Paciente", 2)}
              </div>

              {/* Detalhes do agendamento */}
              <div className="px-4 py-2 text-sm sm:text-base grid gap-1 sm:grid-cols-3">
                <p>
                  <strong>Dia:</strong> {formatarData(agendamento.inicio)}
                </p>
                <p>
                  <strong>Horário:</strong> {`${formatarHora(agendamento.inicio)} até ${formatarHora(agendamento.fim)}`}
                </p>
                <p>
                  <strong>Equipamento:</strong> {agendamento?.slot?.nome ?? "-"}
                </p>
              </div>

              {/* Tags de escalas pendentes */}
              {carregandoEscalas && escalas.length === 0 && (
                <div className="px-4 pb-3 text-xs text-gray-500">Carregando escalas…</div>
              )}
              {escalas.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                  {escalas.map((escala) => (
                    <button
                      key={escala.id}
                      type="button"
                      onClick={() => handleEscalaClick(agendamento, escala)}
                      className="text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-medium px-2 py-1 rounded-full transition-colors"
                      title="Abrir formulário da escala"
                    >
                      {escala?.formulario?.nomeEscala 
                        ?? escala?.nome 
                        ?? escala?.titulo 
                        ?? `Escala ${escala.id}`}

                    </button>
                  ))}
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