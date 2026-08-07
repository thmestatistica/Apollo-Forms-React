import { stockcareApi } from "./axiosInstanceStockCare";

/**
 * Busca a lista de IDs de pacientes bloqueados e dados do médico
 */
export const obter_pacientes_bloqueados_do_medico = async (idMedico) => {
    try {
        const response = await stockcareApi.get(`/controle-visualizacao/medico/${idMedico}/pacientes-bloqueados`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar pacientes bloqueados do médico ID ${idMedico}:`, error);
        return { id_medico: idMedico, nome_medico: "", ids_pacientes_bloqueados: [] };
    }
};

/**
 * Busca os registros de bloqueios com suporte a filtros opcionais
 */
export const listar_bloqueios_detalhados = async ({
    tipoEntidadeOrigem = "USUARIO",
    idOrigem = null,
    tipoEntidadeDestino = "PACIENTE"
} = {}) => {
    try {
        const params = {};

        if (tipoEntidadeOrigem) {
            params.tipo_entidade_origem = tipoEntidadeOrigem;
        }
        if (idOrigem) {
            params.id_origem = idOrigem;
        }
        if (tipoEntidadeDestino) {
            params.tipo_entidade_destino = tipoEntidadeDestino;
        }

        const response = await stockcareApi.get(`/controle-visualizacao/`, { params });
        return response.data;
    } catch (error) {
        console.error("Erro ao listar bloqueios de visualização:", error);
        return [];
    }
};

/**
 * Cadastra um novo bloqueio de visualização de paciente para um médico
 */
export const criar_bloqueio_paciente = async ({
    idMedico,
    idPaciente,
    motivo = null,
    tipoEntidadeOrigem = "USUARIO",
    tipoEntidadeDestino = "PACIENTE"
}) => {
    try {
        const payload = {
            tipo_entidade_origem: tipoEntidadeOrigem,
            id_origem: idMedico,
            tipo_entidade_destino: tipoEntidadeDestino,
            id_destino: idPaciente,
            motivo: motivo
        };

        const response = await stockcareApi.post(`/controle-visualizacao/`, payload);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar bloqueio de paciente:", error);
        throw error;
    }
};

/**
 * Remove/Deleta um bloqueio de visualização pelo ID da restrição
 */
export const remover_bloqueio_paciente = async (idControleVisualizacao) => {
    try {
        const response = await stockcareApi.delete(`/controle-visualizacao/${idControleVisualizacao}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao remover bloqueio ID ${idControleVisualizacao}:`, error);
        throw error;
    }
};