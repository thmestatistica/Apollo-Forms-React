import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_API_URL;

// Cria instância global do axios
const axiosInstance = axios.create({
  baseURL: BACKEND_URL,
});

// Interceptor: adiciona token em todas as requisições
axiosInstance.interceptors.request.use((config) => {
  const storedAuth = localStorage.getItem("userAuthData");
  const token = storedAuth ? JSON.parse(storedAuth)?.token : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: captura erros de autenticação
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    const isLoginAttempt = config && (config.url.endsWith('/login') || config.url.endsWith('/login/paciente'));

    // Se o erro for 401 e NÃO for uma tentativa de login, redirecione.
    if (response?.status === 401 && !isLoginAttempt) {
      // Token expirado ou inválido em rota protegida → limpa sessão e recarrega
      localStorage.removeItem("userAuthData");
      localStorage.removeItem("escalasPorAgendamento"); // Limpeza completa
      window.location.href = "/"; // Redireciona para a home/login
    }
    
    // Rejeita a promessa para que a falha possa ser tratada no local da chamada (ex: no login)
    return Promise.reject(error);
  }
);

export const api = axiosInstance; 

export default axiosInstance;