import axiosInstance from "../axiosInstance";

/**
 * Busca a lista de todos os pacientes ativos
 * Rota Backend: GET /pacientes
 */
export const listar_pacientes = async () => {
    try {
        const response = await axiosInstance.get('/pacientes');
        return response.data; 
    } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
        throw error;
    }
};

/**
 * Busca o histórico de agendamentos usando a rota oficial de agendamentos com filtro
 * Rota Backend: GET /agendamentos?pacienteId=123
 */
export const listar_agendamentos_paciente = async (pacienteId) => {
    try {

        const response = await axiosInstance.get('/agendamentos', {
            params: {
                pacienteId: pacienteId
            }
        });

        // O backend retorna um objeto: { page: 1, agendamentos: [...] }
        // Precisamos retornar apenas o array que está dentro de .agendamentos
        return response.data.agendamentos || [];
        
    } catch (error) {
        console.error(`Erro ao buscar histórico do paciente ${pacienteId}:`, error);
        return [];
    }
};