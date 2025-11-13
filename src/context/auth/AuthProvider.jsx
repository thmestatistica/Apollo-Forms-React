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
     * Realiza login de terapeuta ou paciente e armazena token.
     */
    const login = async (credentials, type) => {
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

            // Redireciona após login
            navigate(
                type === "terapeuta"
                    ? "/forms-terapeuta/tela-inicial"
                    : "/forms-paciente/tela-inicial",
                { replace: true }
            );
        } catch (error) {
            console.error("Erro no login:", error);
            alert("Usuário ou senha inválidos!");
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
