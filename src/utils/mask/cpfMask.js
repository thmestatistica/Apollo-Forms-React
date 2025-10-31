/**
 * Aplica a máscara de CPF no formato XXX.XXX.XXX-XX.
 * @param {string} value O valor do CPF sem máscara (apenas números).
 * @returns {string} O valor do CPF com a máscara aplicada.
 */
export const cpfMask = (value) => {
    // 1. Remove tudo que não for dígito
    value = value.replace(/\D/g, "");

    // 2. Limita o valor a 11 dígitos (tamanho máximo do CPF)
    value = value.substring(0, 11);

    // 3. Aplica a máscara: XXX.XXX.XXX-XX
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d)/, "$1.$2");
    value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    return value;
};