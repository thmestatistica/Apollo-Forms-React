/**
 * @file Provedor de autenticação responsável por gerenciar login, logout e persistência do usuário.
 * @example
 * <AuthProvider>
 *    <App />
 * </AuthProvider>
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

// Chave para armazenar no Local Storage
const LS_AUTH_KEY = 'userAuthData';

export const AuthProvider = ({ children }) => {
    // Inicializa o estado lendo do Local Storage
    const [user, setUser] = useState(() => {
        // Lê os dados do Local Storage
        const storedData = localStorage.getItem(LS_AUTH_KEY);
        // Se houver dados armazenados, retorna como objeto, senão retorna null
        return storedData ? JSON.parse(storedData) : null;
    });

    const navigate = useNavigate();

    // Efeito para sincronizar o estado com o Local Storage
    // Toda vez que 'user' mudar, este efeito será executado
    useEffect(() => {

        // Se houver usuário, salva no Local Storage
        if (user) {
            localStorage.setItem(LS_AUTH_KEY, JSON.stringify(user));

        // Se não houver, remove do Local Storage
        } else {
            localStorage.removeItem(LS_AUTH_KEY);
        }

    }, [user]);

    /**
     * Função de login
     * Realiza o login do usuário e redireciona conforme o tipo
     * 
     * @param {dicionário} userData 
     * @param {string} type 
     * 
     * @example
     * // Para login de terapeuta
     * login({ id: 1, username: 'terapeuta' }, 'terapeuta');
     * 
     * // Para login de usuário comum
     * login({ id: 2, username: 'normalUser' }, 'paciente');
     */
    const login = (userData, type) => {
        // userData deve ter pelo menos { id, username, role }
        const authData = { ...userData, role: type, token: 'mock-token-123' };
        // Atualiza o estado do usuário
        setUser(authData);

        // Redireciona para o dashboard apropriado
        if (type === 'terapeuta') {
            // Exemplo de redirecionamento
            navigate('/forms-terapeuta/tela-inicial', { replace: true });
        } else if (type === 'paciente') {
            // Exemplo de redirecionamento
            navigate('/forms-paciente/tela-inicial', { replace: true });
        } else {
            // Tipo desconhecido, redireciona para a home
            console.warn('Tipo de usuário desconhecido durante o login:', type);
            navigate('/', { replace: true });
        }
    };

    // Função de login comentada que utiliza chamadas assíncronas ao backend
    /**
     * Faz o login do usuário de acordo com o tipo.
     *
     * @param {Object|string} userData - Dados do login (CPF ou credenciais).
     * @param {"terapeuta"|"paciente"} type - Tipo do usuário.
     * @returns {Promise<void>}
     *
     * @example
     * await login({ username: "admin", password: "1234" }, "terapeuta");
     * await login("12345678900", "paciente");
     */
    // const login = async (userData, type) => {
    //     try {
    //         let responseData = null;

    //         // Verifica o tipo e chama a função correspondente
    //         if (type === "terapeuta") {
    //             responseData = await authenticate_terapeuta(userData);
    //         } else if (type === "paciente") {
    //             responseData = await authenticate_pacientes(userData);
    //         }

    //         // Caso o backend retorne erro ou nulo
    //         if (!responseData) {
    //             console.error("Falha no login. Verifique as credenciais.");
    //             return;
    //         }

    //         // Adiciona o tipo e salva no contexto
    //         const authData = { ...responseData, role: type };
    //         setUser(authData);

    //         // Redirecionamento conforme o tipo
    //         if (type === "terapeuta") {
    //             navigate("/forms-terapeuta/tela-inicial", { replace: true });
    //         } else {
    //             navigate("/forms-paciente/tela-inicial", { replace: true });
    //         }

    //     } catch (error) {
    //         console.error("Erro ao autenticar usuário:", error);
    //     }
    // };

    /**
     * Remove todos os dados relacionados a agendamentos do localStorage.
     * Mantemos a lista em sincronia com o que a aplicação realmente persiste.
     */
    const limparDadosAgendamento = () => {
        try {
            const chaves = [
                // Persistido em FormProvider.jsx
                "escalasPorAgendamento",
            ];

            chaves.forEach((chave) => localStorage.removeItem(chave));
        } catch (err) {
            // Evita que um erro no localStorage impeça o logout
            console.warn("Falha ao limpar dados de agendamento do localStorage:", err);
        }
    };

    // Função de logout
    const logout = () => {
        // Limpa dados relacionados a agendamentos
        limparDadosAgendamento();

        // Atualiza o estado do usuário para null
        setUser(null);

        // Navegação para a página inicial
        navigate('/', { replace: true }); // Redireciona para a home
    };

    // Valor fornecido pelo contexto
    const value = {
        user,
        isAuthenticated: !!user,
        login,
        logout,
    };

    // Renderiza o provedor do contexto com os valores definidos
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};