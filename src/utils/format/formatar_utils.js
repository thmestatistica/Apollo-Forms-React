
/**
 * Formata uma data ISO em formato legível (DD/MM/YYYY)
 * @param {string} dataISO - Ex: "2025-12-31T15:00:00.000Z"
 * @returns {string} - Ex: "31/12/2025"
 */
export const formatarData = (dataISO) => {
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formata uma data ISO em horário legível (HH:mm)
 * @param {string} dataISO - Ex: "2025-12-31T15:00:00.000Z"
 * @returns {string} - Ex: "12:00"
 */
export const formatarHora = (dataISO) => {
  const data = new Date(dataISO);
  return data.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};