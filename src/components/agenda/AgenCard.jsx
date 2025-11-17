import { abreviarNome, formatarData, formatarHora } from "../../utils/format/formatar_utils";
import InfoGen from "../info/InfoGen";

// Exibe cartões de agendamentos (sem agrupamento), mantendo o mesmo estilo visual do Card
function AgenCard({ agendamentosPaginados = [] }) {
  return (
    <div className="flex flex-col gap-6 p-4">
      {agendamentosPaginados.length > 0 ? (
        agendamentosPaginados.map((agendamento) => (
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
          </div>
        ))
      ) : (
        <InfoGen message="📑 Nenhum agendamento disponível." />
      )}
    </div>
  );
}

export default AgenCard;