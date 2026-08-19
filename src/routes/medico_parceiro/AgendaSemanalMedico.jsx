
import AgendaSemanalGenerica from "../../components/agenda/AgendaSemanalGenerica.jsx";
import CardAgendamentoPaciente from "../../components/agenda/CardAgendamentoPaciente.jsx";

import { listar_pacientes } from "../../api/jornada/jornada_utils.js";
import { listar_agendamentos_filtrados } from "../../api/agenda/agenda_utils.js";
import CardAgendamentoJornada from "../../components/agenda/CardAgendamentoJornada.jsx";

function AgendaSemanalMedico() {
    // Função para buscar agendamentos filtrados por paciente
    const listarAgendamentos = async ({ startDate, endDate, pacienteId }) => {
        // O backend espera pacienteId como parâmetro
        return await listar_agendamentos_filtrados({ startDate, endDate, pacienteId });
    };
    return (
        <AgendaSemanalGenerica
            listarAgendamentos={listarAgendamentos}
            listarPacientes={listar_pacientes}
            medicoParceiro={true}
            CardComponent={CardAgendamentoJornada}
            tipo="paciente"
            titulo="🗓️ Agenda Semanal do Paciente"
        />
    );
}

export default AgendaSemanalMedico;
