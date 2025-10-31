
const API_URL = import.meta.process.env.URL_JOURNEY || 'http://localhost:5000/pacientes';

/**
 * Função para listar pacientes
 * 
 * @returns {Promise<Array>} Lista de pacientes
 * 
 * @throws {Error} Se ocorrer um erro na requisição
 * 
 * @example
 * // Uso da função
 * listarPacientes()
 *   .then(pacientes => console.log(pacientes))
 *   .catch(error => console.error(error));
 * 
 */ 
export const listarPacientes = async () => {
    // Realiza a requisição para listar pacientes
    try {

        // Faz a chamada à API
        const response = await fetch(`${API_URL}`);

        // Verifica se a resposta foi bem-sucedida
        if (!response.ok) {
            throw new Error('Erro ao listar pacientes');
        }

        // Converte a resposta para JSON
        const data = await response.json();
        
        // Retorna os dados dos pacientes
        return data;
    
    // Captura erros de rede ou outros
    } catch (error) {
        // Loga o erro para depuração
        console.error('Erro na requisição:', error);

        // Re-lança o erro para ser tratado pelo chamador
        throw error;
    }
};