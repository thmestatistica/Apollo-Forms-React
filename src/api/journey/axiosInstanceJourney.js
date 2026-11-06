import axios from "axios";

const baseURLJourney = import.meta.env.VITE_API_JOURNEY || "http://127.0.0.1:8000";

const axiosInstanceJourney = axios.create({
  baseURL: baseURLJourney,
  headers: { "Content-Type": "application/json" },
});

function getTokenNova() {
  try {
    const stored = localStorage.getItem("userAuthData");
    return stored ? JSON.parse(stored)?.tokenNova : null;
  } catch {
    return null;
  }
}

axiosInstanceJourney.interceptors.request.use((config) => {
  const token = getTokenNova();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstanceJourney.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Journey 401: tokenNova ausente, expirado ou inválido");
    }
    return Promise.reject(error);
  }
);

export default axiosInstanceJourney;