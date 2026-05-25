export const processarFuglMeyerSuperior = (respostas) => {

    const pontuacao = coletarFuglMeyerSuperior(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala Fugl Meyer (AVC) - Extremidades Superiores",
        "doi": "10.1016/j.apmr.2012.06.017",
        "nome_curto": "Fugl-Meyer - Superiores",
        "calculo": "Escore = soma das perguntas marcadas na tabela",
        "calculo_processado": "Padronização Radar = (base / 104) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 104. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (104 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarFuglMeyerSuperior = (form) => {
    let count = 0;

    for (let id = 741; id <= 780; id++) {
        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(String(valor).split(" - ")[0], 10);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    for (let id = 781; id <= 792; id++) {
        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        console.log(item);

        if (!item?.resposta) continue;

        const lista = item.resposta;

        console.log(lista);

        for (const valor of lista) {
            const numero = parseInt(
                String(valor).split(" - ")[0],
                10
            );

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 104){
        count = 104;
    }

    return count;
};

export const processarFuglMeyerInferior = (respostas) => {

    const pontuacao = coletarFuglMeyerInferior(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala Fugl-Meyer (AVC) - Membros Inferiores",
        "doi": "10.1016/j.apmr.2012.06.017",
        "nome_curto": "Fugl-Meyer - Inferiores",
        "calculo": "Escore = soma das perguntas marcadas na tabela",
        "calculo_processado": "Padronização Radar = (base / 34) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 34. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (34 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarFuglMeyerInferior = (form) => {
    let count = 0;

    for (let id = 590; id <= 622; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.split(" - ")[0], 10);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 34) {
        count = 34;
    }

    return count;

};
