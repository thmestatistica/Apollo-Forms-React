// Importa a biblioteca axios para fazer requisições HTTP
import axios from "axios";

// Obtém a URL base do backend a partir das variáveis de ambiente do Vite
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/**
 * Faz login de um paciente usando CPF para autenticação.
 *
 * @param {string} cpf - CPF do paciente
 * @returns {Promise<Object|null>} - Dados do paciente ou null em caso de erro
 *
 * @example
 * // Exemplo de utilização dentro de um componente React:
 * async function handleLogin() {
 *   const resposta = await authenticate_pacientes("12345678900");
 *   if (resposta) {
 *     console.log("Login bem-sucedido", resposta);
 *   } else {
 *     console.log("Erro no login");
 *   }
 * }
 */
export const authenticate_pacientes = async (cpf) => {
    // Monta a URL de login do backend
    const url = `${BACKEND_URL}/login/paciente`;

    try {
        // Envia uma requisição POST para o endpoint de login
        const response = await axios.post(url, { cpf });

        return response.data; // Retorna dados de login

    } catch (error) {
        console.error("Erro ao fazer login:", error);
        return null; // Retorna null para indicar falha
    }
}

/**
 * Realiza o login de um usuário no sistema.
 *
 * @param {Object} usuario - Objeto contendo os dados de login (ex: { username: "admin", password: "1234" })
 * @returns {Promise<Object|null>} - Retorna os dados do usuário autenticado ou null se ocorrer um erro
 *
 * @example
 * // Exemplo de uso dentro de um componente React:
 * const handleLogin = async () => {
 *   const usuario = { username: "admin", password: "1234" };
 *   const resposta = await login(usuario);
 *   if (resposta) {
 *     console.log("Login bem-sucedido:", resposta);
 *   } else {
 *     console.log("Erro ao fazer login.");
 *   }
 * };
 */
export const authenticate_terapeuta = async (usuario) => {
    // Monta a URL de login do backend
    const url = `${BACKEND_URL}/login`;

    try {
        // Envia uma requisição POST para o endpoint de login
        const response = await axios.post(url, usuario);

        // Retorna os dados retornados pelo backend (ex: token, nome, etc.)
        return response.data;
    } catch (error) {
        // Exibe o erro no console (pode ser tratado com uma notificação visual no app)
        console.error("Erro ao fazer login:", error);

        // Retorna null para indicar falha no login
        return null;
    }
};
