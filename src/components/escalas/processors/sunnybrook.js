export const processarSUNNYBROOK = (respostas) => {

    const pontuacao = coletarSUNNYBROOK(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Sunnybrook",
        "doi": "10.1590/fm.2022.35123",
        "nome_curto": "Sunnybrook",
        "calculo": "Escore = p2 + ... + p4 + p6 + ... + p10 + p12 + ... + p16",
        "calculo_processado": "Padronização Radar = 10 - ((base / 21) × 10)",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 21. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (21 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    }
}

export const coletarSUNNYBROOK = (form) => {
    let perguntas1 = 0;
    let perguntas2 = 0;
    let perguntas3 = 0;
    let count = 0;

    for (let id = 1114; id <= 1116; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.split(" - ")[0], 10);

            if (!isNaN(numero)) {
                perguntas1 += numero;
            }
        }
    }

    for (let id = 1118; id <= 1122; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.split(" - ")[0], 10);

            if (!isNaN(numero)) {
                perguntas2 += numero;
            }
        }
    }

    for (let id = 1124; id <= 1128; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.split(" - ")[0], 10);

            if (!isNaN(numero)) {
                perguntas3 += numero;
            }
        }
    }

    perguntas1 = perguntas1 * 5;
    perguntas2 = perguntas2 * 4;

    console.log(perguntas1);
    console.log(perguntas2);
    console.log(perguntas3);

    count = perguntas2 - perguntas1 - perguntas3;

    if (count <= 0){
        count = 0;
    }

    if (count >= 100){
        count = 100;
    }

    return count;
}