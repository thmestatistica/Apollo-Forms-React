import axiosInstanceJourney from "../journey/axiosInstanceJourney";

export const buscar_escalas_formulario = async (filtros = {}) => {
  try {
    const { data } = await axiosInstanceJourney.get('/escalas-formulario', { params: filtros });
    return data;
  } catch (error) {
    console.error("Erro ao buscar formulários associados a diagnósticos e especialidades:", error);
    throw error;
  }
};