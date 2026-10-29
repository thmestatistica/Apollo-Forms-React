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

export const buscar_sessoes_paciente = async (pacienteId) => {
    try {
        const response = await axiosInstanceForms.get(`/forms/sessions/patient/${pacienteId}`)
        return response.data
    } catch (error) {
        console.error(`Erro ao buscar sessoes: `, error);
        return [];
    }
}

export const atualizar_status_resposta = async (id, status, observacoes_inativacao = null) => {
  try {
    // Aceita tanto string ("INATIVO") quanto objeto ({ status_registro, observacoes_inativacao })
    const payload = typeof status === 'string' ? { status_registro: status } : { ...status };

    if (observacoes_inativacao !== null && observacoes_inativacao !== undefined) {
      payload.observacoes_inativacao = observacoes_inativacao;
    }

    const { data } = await axiosInstanceForms.patch(`/forms/answered/${id}/status`, payload);

    return data;
  } catch (error) {
    console.error(`Erro ao atualizar status da resposta ${id}:`, error);
    throw error;
  }
};