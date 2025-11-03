// src/services/pacienteService.js

// O objeto global import.meta.env é injetado pelo Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/pacientes';

/**
 * Função para buscar a lista de profissionais
 * @returns {Promise<Array>} Lista de Terapeutas
 */
export const listarTerapeutas = async () => {
    try {
        // Acessa o endpoint: <VITE_API_URL>/profissionais
        const response = await fetch(`${API_BASE_URL}/profissionais`);
        
        // ... (restante da lógica de erro e retorno)
        if (!response.ok) {
            throw new Error(`Erro ao carregar profissionais: ${response.status}`);
        }
        return await response.json();

    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
};