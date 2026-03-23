/**
 * Filtra as escalas para mostrar apenas aquelas cuja data_referencia
 * está dentro de um intervalo de dias para trás e para frente em relação à data atual.
 *
 * Exemplo:
 * - dias = 15 → 
 *
 * @param {Array<Object>} escalas - Lista de objetos de escala (cada objeto deve ter a propriedade data_referencia).
 * @param {number} dias - Quantidade de dias para trás e para frente (default: 15).
 * @param {Date} [hoje=new Date()] - Data base para cálculo (default: data atual).
 * @returns {Array<Object>} Lista de escalas filtradas dentro do intervalo.
 */
export function filterEscalasByRange(escalas, dias = 15, hoje = new Date()) {
  // Validação defensiva: garante que escalas é um array
  if (!Array.isArray(escalas)) return [];

  // Normaliza a data base (remove horas/minutos/segundos)
  const base = new Date(hoje);
  base.setHours(0, 0, 0, 0);

  // Define o limite inferior (dias para trás)
  const inicio = new Date(base);
  inicio.setDate(inicio.getDate() - dias);

  // Define o limite superior (dias para frente)
  const fim = new Date(base);
  fim.setDate(fim.getDate() + dias);

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
