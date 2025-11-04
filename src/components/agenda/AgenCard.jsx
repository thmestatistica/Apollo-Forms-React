import { formatarData, formatarHora } from "../../utils/format/formatar_utils";

function AgenCard({ agendamentosAgrupados, pacientesPaginados }) {
  return (
    <div className="flex flex-col gap-6 p-4">
        {pacientesPaginados.length > 0 ? (
          pacientesPaginados.map((nomePaciente) => (
            <div key={nomePaciente} className="border border-apollo-200 rounded-md">
              {/* Header do paciente */}
              <div className="bg-apollo-200/20 px-4 py-2 rounded-t-md font-semibold text-black">
                {nomePaciente}
              </div>

              {/* Lista dos agendamentos do paciente */}
              <div className="flex flex-col divide-y divide-apollo-200">
                {agendamentosAgrupados[nomePaciente].map((agendamento) => (
                  <div
                    key={agendamento.id}
                    className="px-4 py-2 text-sm sm:text-base flex flex-col sm:flex-row sm:justify-between"
                  >
                    <p><strong>Dia:</strong> {formatarData(agendamento.inicio)}</p>
                    <p>
                      <strong>Horário:</strong>{" "}
                      {`${formatarHora(agendamento.inicio)} - ${formatarHora(agendamento.fim)}`}
                    </p>
                    <p><strong>Equipamento:</strong> {agendamento.slot.nome}</p>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <InfoGen message="📑 Nenhum agendamento disponível." />
        )}
      </div>
  )
}

export default AgenCard