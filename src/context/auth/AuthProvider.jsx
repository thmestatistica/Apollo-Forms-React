import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { authenticate_terapeuta, authenticate_pacientes } from "../../api/auth/auth_utils";

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

            if (type === "terapeuta") {
                response = await authenticate_terapeuta(credentials);
            } else if (type === "paciente") {
                response = await authenticate_pacientes(credentials);
            }

            if (!response || !response.token) {
                throw new Error("Falha na autenticação");
            }

            const authData = { ...response, role: type };
            setUser(authData);

            if (redirect) {
                const go = () => navigate(
                    type === "terapeuta"
                        ? "/forms-terapeuta/tela-inicial"
                        : "/forms-paciente/tela-inicial",
                    { replace: true }
                );
                if (delayMs > 0) setTimeout(go, delayMs); else go();
            }

            return { success: true };
        } catch (error) {
            console.error("Erro no login:", error);
            return { success: false, error };
        }
    };

    /** Logout com limpeza geral */
    const logout = () => {
        setUser(null);
        localStorage.removeItem(LS_AUTH_KEY);
        localStorage.removeItem("escalasPorAgendamento");
        navigate("/", { replace: true });
    };

    const value = {
        user,
        token: user?.token || null,
        isAuthenticated: !!user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
