/**
 * Verifica se uma data ISO corresponde ao dia atual (no fuso local)
 * @param {string} dataISO
 * @returns {boolean}
 */
export const isHoje = (dataISO) => {
  const hoje = new Date();
  const data = new Date(dataISO);

  return (
    data.getDate() === hoje.getDate() &&
    data.getMonth() === hoje.getMonth() &&
    data.getFullYear() === hoje.getFullYear()
  );
};