// src/api/jornada/jornada_utils.js
import axiosInstance from "../axiosInstance";

// Busca lista de pacientes
export const listar_pacientes = async () => {
    try {
        const response = await axiosInstance.get('/pacientes');
        return response.data;
    } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        return [];
    }
};

// Busca histórico de agendamentos
export const listar_agendamentos_paciente = async (pacienteId) => {
    try {
        const response = await axiosInstance.get('/agendamentos', {
            params: {
                pacienteId: pacienteId,
                pageSize: 1000
            }
        });
        return response.data.agendamentos || [];
    } catch (error) {
        console.error(`Erro ao buscar histórico:`, error);
        return [];
    }
};

// NOVO: Busca Prontuário (Rota baseada no seu código Python)
export const listar_respostas_prontuario = async (pacienteId) => {
    try {
        // Ajuste a URL se necessário. O Python usa 'BACKEND_FORMS_URL'.
        // Assumindo que o axiosInstance aponta para o gateway principal ou que a rota existe:
        const response = await axiosInstance.get(`/forms/answered_last/${pacienteId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar prontuário:`, error);
        return [];
    }
};