import axios from "axios";

const baseURLForms = import.meta.env.VITE_API_FORMS || "http://127.0.0.1:8000";


// Instância dedicada para a API de Forms
// Ajuste a baseURL se o backend expuser outro host/porta.
const axiosInstanceForms = axios.create({
  baseURL: baseURLForms,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstanceForms;
