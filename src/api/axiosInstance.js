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
    if (error.response?.status === 401) {
      // Token expirado → limpa sessão e recarrega
      localStorage.removeItem("userAuthData");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
