export const processarADDENBROK = (respostas) => {

    const pontuacao = coletarADDENBROK(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala ADDENBROK",
        "doi": "10.1590/S1980-57642008DN10200015",
        "nome_curto": "ADDENBROK",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5",
        "calculo_processado": "Padronização Radar = (base / 100) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 100. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (100 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarADDENBROK = (form) => {
    let count = 0;

    for (let id = 1238; id <= 1242; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 100) {
        count = 100;
    }

    return count;
}