import axiosInstance from "../axiosInstance";
import { stockcareApi } from "../stockcare/axiosInstanceStockCare";

/**
 * Login de paciente via CPF
 * @param {string} cpf
 * @returns {Promise<Object|null>}
 */
export const authenticate_pacientes = async (cpf) => {
  try {
    const response = await axiosInstance.post("/login/paciente", { cpf });
    return response.data;
  } catch (err) {
    console.error("Erro no login do paciente:", err);
    return null;
  }
};

/**
 * Login de terapeuta com usuário e senha
 * @param {{ username: string, password: string }} usuario
 * @returns {Promise<Object|null>}
 */
export const authenticate_terapeuta = async (usuario) => {
  try {
    const response = await axiosInstance.post("/login", usuario);
    return response.data;
  } catch (err) {
    // Debugging: log resolved baseURL and detailed error info
    try {
      console.error("Erro no login do terapeuta:", {
        message: err.message,
        code: err.code,
        config: err.config,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        request: err.request,
        event: err.event,
        axiosBaseURL: axiosInstance.defaults?.baseURL,
      });
    } catch (loggingError) {
      console.error("Erro ao logar o erro do login do terapeuta:", loggingError);
    }

    return null;
  }
};

/**
 * Login de medico parceiro com a API do stockcare
 * @param {{ username: string, password: string }} usuario
 * @returns {Promise<Object|null>}
 */
export async function authenticate_stockcare({ username, password }) {
    const { data } = await stockcareApi.post("/auth/login-journey", {
        username: username,
        senha: password,
    });

    if (data?.token) {
        localStorage.setItem("stockcareToken", data.token);
    }

    return {
        ...data,
        token: data.token,
    };
}