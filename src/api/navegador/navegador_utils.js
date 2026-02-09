import axiosInstance from "../axiosInstance";

export const atribuir_profissional_paciente = async (pacienteId, profissionalId) => {
  try {
    const payload = {
      pacienteId: Number(pacienteId),
      profissionalId: Number(profissionalId),
    };
    const { data } = await axiosInstance.post("/pendencias/admin/atribuir-profissional", payload);
    return data;
  } catch (error) {
    console.error("Erro ao atribuir profissional ao paciente:", error);
    throw error;
  }
};
