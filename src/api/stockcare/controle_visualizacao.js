import { stockcareApi } from "./axiosInstanceStockCare";

/**
 * Busca a lista de IDs de pacientes adicionados e bloqueados do médico
 */
export const obter_pacientes_controle_do_medico = async (idMedico) => {
    try {
        // Atualizado para a nova rota de pacientes-controle
        const response = await stockcareApi.get(`/controle-visualizacao/medico/${idMedico}/pacientes-controle`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar pacientes em controle do médico ID ${idMedico}:`, error);
        return { id_medico: idMedico, nome_medico: "", ids_pacientes_adicionados: [], ids_pacientes_bloqueados: [] };
    }
};

export const listar_bloqueios_detalhados = async ({
    tipoEntidadeOrigem = "USUARIO",
    idOrigem = null,
    tipoEntidadeDestino = "PACIENTE"
} = {}) => {
    try {
        const params = {};
        if (tipoEntidadeOrigem) params.tipo_entidade_origem = tipoEntidadeOrigem;
        if (idOrigem) params.id_origem = idOrigem;
        if (tipoEntidadeDestino) params.tipo_entidade_destino = tipoEntidadeDestino;

        const response = await stockcareApi.get(`/controle-visualizacao/`, { params });
        return response.data;
    } catch (error) {
        console.error("Erro ao listar controle de visualização:", error);
        return [];
    }
};

/**
 * Cadastra um novo controle de paciente (Adicionar ou Bloquear)
 */
export const criar_controle_paciente = async ({
    idMedico,
    idPaciente,
    motivo = null,
    tipoVisualizacao = "ADICIONAR", // Pode ser "ADICIONAR" ou "BLOQUEIO"
    criadoPor = null
}) => {
    try {
        const payload = {
            tipo_entidade_origem: "USUARIO",
            id_origem: idMedico,
            tipo_entidade_destino: "PACIENTE",
            id_destino: idPaciente,
            motivo: motivo,
            tipo_visualizacao: tipoVisualizacao,
            criado_por: criadoPor
        };

        const response = await stockcareApi.post(`/controle-visualizacao/`, payload);
        return response.data;
    } catch (error) {
        console.error("Erro ao criar controle de paciente:", error);
        throw error;
    }
};

/**
 * Remove/Deleta um controle de visualização pelo ID
 */
export const remover_controle_paciente = async (idControleVisualizacao) => {
    try {
        const response = await stockcareApi.delete(`/controle-visualizacao/${idControleVisualizacao}`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao remover controle ID ${idControleVisualizacao}:`, error);
        throw error;
    }
};
