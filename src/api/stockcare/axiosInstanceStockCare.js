import axios from "axios";

const STOCKCARE_URL = import.meta.env.VITE_API_STOCKCARE;

export const stockcareApi = axios.create({
  baseURL: STOCKCARE_URL,
});

stockcareApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("stockcareToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

stockcareApi.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);