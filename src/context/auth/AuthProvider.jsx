import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { authenticate_terapeuta, authenticate_pacientes, authenticate_stockcare, authenticate_terapeuta_apinova } from "../../api/auth/auth_utils";

const LS_AUTH_KEY = "userAuthData";

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem(LS_AUTH_KEY);
        return stored ? JSON.parse(stored) : null;
    });

    const navigate = useNavigate();

    // Sincroniza estado com localStorage
    useEffect(() => {
        if (user) localStorage.setItem(LS_AUTH_KEY, JSON.stringify(user));
        else localStorage.removeItem(LS_AUTH_KEY);
    }, [user]);

    /** Logout com limpeza geral */
    const logout = useCallback(() => {
        setUser(null);
        localStorage.clear();
        navigate("/", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (user?.expirada === true) logout();
    }, [user, logout]);


    /**
     * Realiza login e retorna objeto de resultado.
     * @param {*} credentials Credenciais (usuario ou cpf)
     * @param {string} type Tipo: 'terapeuta' | 'paciente'
     * @param {{redirect?: boolean, delayMs?: number}} options Controle de redirecionamento
     * @returns {{success: boolean, error?: any}}
     */
    const login = async (credentials, type, options = {}) => {
        const { redirect = true, delayMs = 0 } = options;
        try {
            let response = null;
            let response_nova = null;

            if (type === "terapeuta") {
                const [r1, r2] = await Promise.allSettled([
                    authenticate_terapeuta(credentials),
                    authenticate_terapeuta_apinova(credentials),
                ]);
                response = r1.status === "fulfilled" ? r1.value : null;
                response_nova = r2.status === "fulfilled" ? r2.value : null;
            } else if (type === "medico-parceiro") {
                response = await authenticate_stockcare(credentials);
            } else if (type === "paciente") {
                response = await authenticate_pacientes(credentials);
            }

            if (!response || !response.token) {
                throw new Error("Falha na autenticação");
            }

            const authData = {
                ...response,
                role: type,
                tokenNova: response_nova?.token ?? null,
                expirada: response_nova?.senha_expirada ?? null,
            };

            // Senha expirada: não mantém sessão e manda para o login
            if (authData.expirada === true) {
                logout();
                return { success: false, expirada: true, error: new Error("Senha expirada") };
            }

            setUser(authData);

            // Redireciona SOMENTE se a autenticação teve sucesso e um token foi recebido
            if (redirect) {
                const destino = type === "terapeuta"
                    ? "/forms-terapeuta/tela-inicial"
                    : type === "medico-parceiro"
                        ? "/forms-medico-parceiro/jornada"
                        : "/forms-paciente/tela-inicial";
                const go = () => navigate(destino, { replace: true });
                if (delayMs > 0) setTimeout(go, delayMs); else go();
            }

            return { success: true, user: authData };
        } catch (error) {
            console.error("Erro no login:", error);
            return { success: false, error };
        }
    };

    const value = {
        user,
        token: user?.token || null,
        tokenNova: user?.tokenNova || null,
        isAuthenticated: !!user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
