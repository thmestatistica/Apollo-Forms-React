import axiosInstance from "../axiosInstance";

/**
 * Remove agendamento das presenças do profissional.
 * Endpoint esperado: POST profissionais/{profissionalId}/presencas/remove
 * payload: { agendamentoId: number }
 */
export const remover_presenca_profissional = async (profissionalId, agendamentoId) => {
  try {
    const payload = { agendamentoId: Number(agendamentoId) };
    const { data } = await axiosInstance.post(
      `/pacientes/profissionais/${Number(profissionalId)}/presencas/remove`,
      payload
    );
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao remover presença do profissional:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};
