import axiosInstanceForms from "../forms/axiosInstanceForms";

export const STATUS_RESPOSTA = {
    ATIVO: "ATIVO",
    PENDENTE: "PENDENTE",
    INATIVO: "INATIVO"
}

export const buscar_respostas_pendentes = async () => {
    try {
        const response = await axiosInstanceForms.get(`/forms/answered_all_pending`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar respostas pendentes:`, error);
        return [];
    }
};

export const buscar_respostas_inativas = async () => {
    try {
        const response = await axiosInstanceForms.get(`/forms/answered_all_inactive`);
        return response.data;
    } catch (error) {
        console.error(`Erro ao buscar respostas inativas:`, error);
        return [];
    }
};

export const atualizar_status_resposta = async (id, status) => {
  try {
    // Garante o envio do objeto { status_registro: status } se for passada apenas a string
    const payload = typeof status === 'string' ? { status_registro: status } : status;

    const { data } = await axiosInstanceForms.patch(`/forms/answered/${id}/status`, payload);
    
    return data;
  } catch (error) {
    console.error(`Erro ao atualizar status da resposta ${id}:`, error);
    throw error;
  }
};