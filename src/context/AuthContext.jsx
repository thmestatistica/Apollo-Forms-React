// Importações necessárias
// createContext para criar o contexto
// useState e useEffect para gerenciar estado e efeitos colaterais
// useNavigate para navegação programática
// contexto: significa um estado global acessível em qualquer componente filho
import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Criação do contexto de autenticação
export const AuthContext = createContext(null);

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
            navigate('/terapeuta/dashboard', { replace: true });
        } else if (type === 'paciente') {
            // Exemplo de redirecionamento
            navigate('/paciente/dashboard', { replace: true });
        }
    };

    // Função de logout
    const logout = () => {
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