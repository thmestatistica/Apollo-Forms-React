
export const obterNumeroResposta = (perguntaId, respostas) => {
    const item = respostas.find(
        item => Number(item.perguntaId) === perguntaId
    );

    const valor = item?.resposta;

    if(valor) {
        const numero = parseInt(valor);

        if (!isNaN(numero)) {
            return numero;
        }
    }
};
