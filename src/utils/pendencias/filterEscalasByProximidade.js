/**
 * Filtra as escalas para mostrar apenas aquelas cuja data_referencia
 * está dentro de um intervalo de dias para trás e para frente em relação à data atual.
 *
 * Exemplo:
 * - diasAtras = 15 e diasFrente = 7
 *
 * @param {Array<Object>} escalas - Lista de objetos de escala (cada objeto deve ter a propriedade data_referencia).
 * @param {number} diasAtras - Quantidade de dias para trás (default: 15).
 * @param {Date} [hoje=new Date()] - Data base para cálculo (default: data atual).
 * @param {number} diasFrente - Quantidade de dias para frente (default: 7).
 * @returns {Array<Object>} Lista de escalas filtradas dentro do intervalo.
 */
export function filterEscalasByRange(escalas, diasAtras = 15, hoje = new Date(), diasFrente = 7) {
  // Validação defensiva: garante que escalas é um array
  if (!Array.isArray(escalas)) return [];

  // Normaliza a data base (remove horas/minutos/segundos)
  const base = new Date(hoje);
  base.setHours(0, 0, 0, 0);

  // Define o limite inferior (15 dias para trás, por padrão)
  const inicio = new Date(base);
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - diasAtras);

  // Define o limite superior (7 dias para frente, por padrão)
  const fim = new Date(base);
  fim.setHours(23, 59, 59, 999);
  fim.setDate(fim.getDate() + diasFrente);

  // Filtra as escalas dentro do intervalo
  return escalas.filter((escala) => {
    // Ignora itens inválidos ou sem data
    if (!escala?.data_referencia) return false;

    // Converte a data da escala
    const data = new Date(escala.data_referencia);

    // Valida se a data é válida (evita "Invalid Date")
    if (isNaN(data.getTime())) return false;

    // Normaliza a data da escala (remove horas)
    data.setHours(0, 0, 0, 0);

    // Verifica se está dentro do intervalo (inclusive)
    return data >= inicio && data <= fim;
  });
}
