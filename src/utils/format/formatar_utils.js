
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

/**
 * @file format.js
 * @description Funções utilitárias para formatação e conversão de dados.
 */

/**
 * Converte uma string ISO em um objeto Date, imitando o comportamento de `datetime.fromisoformat` do Python.
 *
 * - Remove o sufixo 'Z' (indicador UTC literal)
 * - Remove milissegundos (ex.: ".123")
 * - Retorna `null` se não conseguir interpretar a data
 *
 * @param {string | null | undefined} iso - String ISO no formato "YYYY-MM-DDTHH:mm:ss[.sss][Z]"
 * @returns {Date | null} - Objeto Date válido ou `null` se a string for inválida
 *
 * @example
 * _parseIso("2024-11-04T06:00:00Z")   // -> Date 2024-11-04 06:00:00
 * _parseIso("2024-11-04T06:00:00.999") // -> Date 2024-11-04 06:00:00
 */
export const _parseIso = (iso) => {
  if (!iso || typeof iso !== "string") return null;

  try {
    // Remove o "Z" (timezone literal) e milissegundos
    let s = iso.replace("Z", "");
    if (s.includes(".")) s = s.split(".")[0];

    // Converte em objeto Date
    const dt = new Date(s);
    return isNaN(dt.getTime()) ? null : dt;
  } catch {
    return null;
  }
};

/**
 * @function abreviarNome
 * @description
 * Abrevia um nome completo, exibindo apenas uma quantidade máxima de nomes antes do sobrenome abreviado.
 * Exemplo: "Ana Clara Bulhões" com limite 2 → "Ana Clara B."
 *
 * @param {string} nomeCompleto - Nome completo da pessoa.
 * @param {number} limiteNomes - Quantidade máxima de nomes a exibir antes do sobrenome (mínimo 1).
 * @returns {string} Nome abreviado no formato "Nome(s) S."
 *
 * @example
 * abreviarNome("Ana Clara Bulhões", 2); // "Ana Clara B."
 * abreviarNome("João Pedro Almeida Souza", 1); // "João P."
 * abreviarNome("Maria", 2); // "Maria"
 */
export const abreviarNome = (nomeCompleto, limiteNomes = 1) => {
  // Remove espaços extras e divide o nome em partes
  const partes = nomeCompleto.trim().split(/\s+/);

  // Caso o nome tenha apenas uma palavra, retorna como está
  if (partes.length === 1) return partes[0];

  // Garante que o limite mínimo seja 1
  const limite = Math.max(1, limiteNomes);

  // Se o limite for maior que a quantidade de partes, usa todas exceto o último sobrenome
  const nomesSelecionados = partes.slice(0, Math.min(limite, partes.length - 1));

  // Define o primeiro sobrenome (logo após os nomes selecionados)
  const primeiroSobrenome = partes[limite] ?? partes[partes.length - 1];

  // Retorna o nome abreviado com a inicial do primeiro sobrenome
  return `${nomesSelecionados.join(" ")} ${primeiroSobrenome[0].toUpperCase()}.`;
};

