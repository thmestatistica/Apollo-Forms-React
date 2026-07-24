// src/api/jornada/jornada_utils.js
import axiosInstance from "../axiosInstance";
import axiosInstanceForms from "../forms/axiosInstanceForms";
import { stockcareApi } from "../stockcare/axiosInstanceStockCare";

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

export const listar_respostas_prontuario = async (pacienteId) => {
    try {
        const response = await axiosInstanceForms.get(`/forms/answered_last/${pacienteId}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar prontuário:`, error);
        return [];
    }
};

export const buscar_profissionais = async () => {
    try{
        const response = await axiosInstance.get(`/pacientes/profissionais/`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar profissionais:`, error);
        return [];
    }
};

export const buscar_profissionais_stockcare = async () => {
    try{
        const response = await stockcareApi.get(`/usuarios/`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar profissionais cadastrados no stockcare: `, error);
        return [];
    }
}

export const buscar_agendamentos_stockcare = async ({usuarioId = null, pacienteId = null, data_inicial = null, data_final = null, paciente_apollo = true}) => {
    try{
        const params = {};

        if (usuarioId){
            params.id_usuario = usuarioId;
        }
        if (pacienteId){
            params.id_paciente = pacienteId;
        }
        if (data_inicial){
            params.data_inicial = data_inicial
        }
        if (data_final){
            params.data_final = data_final
        }
        if (paciente_apollo){
            params.paciente_apollo = paciente_apollo
        }

        const response = await stockcareApi.get(`/agendamento/filtro/`, {params});
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar agendamentos cadastrados no stockcare: `, error);
        return [];
    }
}