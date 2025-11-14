import axiosInstance from "../axiosInstance";

/**
 * Lista agendamentos com filtros opcionais.
 *
 * @param {Object} filters - Filtros opcionais.
 * @param {string} [filters.startDate] - Data no formato YYYY-MM-DD.
 * @param {number} [filters.usuarioId] - ID do usuário (inteiro).
 */
export const listar_agendamentos = async (filters = {}) => {
  try {
    // Monta os parâmetros apenas se existirem
    const params = {};

    // Adiciona startDate se fornecido
    if (filters.startDate) {
      params.startDate = filters.startDate;
    }

    // Adiciona usuarioId se for número
    if (typeof filters.usuarioId === "number") {
      params.usuarioId = filters.usuarioId;
    }

    console.log("Listando agendamentos com parâmetros:", params);
    // Requisição GET com query params
    const response = await axiosInstance.get("/pacientes/agendamentos", {
      params,
    });

    console.log("Agendamentos carregados:", response.data);

    return response.data;

  } catch (err) {
    // Log detalhado para debugging
    try {
      console.error("Erro ao listar agendamentos:", {
        message: err.message,
        code: err.code,
        config: err.config,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        request: err.request,
        axiosBaseURL: axiosInstance.defaults?.baseURL,
      });
    } catch (loggingError) {
      console.error("Erro ao registrar detalhes do erro:", loggingError);
    }

    return null;
  }
};
