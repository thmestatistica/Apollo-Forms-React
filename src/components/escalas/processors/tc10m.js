export const processarTC10m = (respostas) => {

    console.log(respostas);

    const pontuacao = coletarTC10m(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Teste de Caminhada de 10 Metros (TC-10m)",
        "doi": "10.1590/S1413-35552011000200006",
        "nome_curto": "TC10m",
        "calculo": "Escore = max(p2, p3, p4)",
        "calculo_processado": "Padronização Radar = ((base - 0.8) / (1.3 - 0.8)) * 10",
        "interpretacao": "O escore bruto é o maior valor dentre os três informados no formulário. Valor mínimo = 0.8; Valor máximo = 1.3; Valores fora do intervalo viram 0 (se menor que 0.8 m/s) ou 10 (se maior que 1.3 m/s). O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (1.3 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarTC10m = (form) => {
    // 2043 - condicional (tempo segundos)
    // 625 a 627 - s

    // 2043 - condicional (velocidade)
    // 2044 a 2046

    const item = form.find((resposta) => Number(resposta.perguntaId) == 2043)

    let result = null;

    if (item?.resposta === "Velocidade (m/s),em metros por segundo" || form.find((resposta) => Number(resposta.perguntaId) === 2044)) {
        for (let id = 2044; id <= 2046; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = Number(item?.resposta);

            if (result === null || valor > result) {
                result = valor;
            }
        }

    } else if (item?.resposta === "Tempo (s), em segundos" || form.find((resposta) => Number(resposta.perguntaId) === 625)) {
        for (let id = 625; id <= 627; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = 10 / Number(item?.resposta);

            if (result === null || valor > result) {
                result = valor;
            }
        }

    }

    return result;

};