export const processarAIVDs = (respostas) => {

    const pontuacao = coletarAIVDs(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "AIVDs",
        "doi": "Escala interna",
        "nome_curto": "AIVDs",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5",
        "calculo_processado": "Padronização Radar = 10 - (base / 20) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 20. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (20 no escore bruto) seja um valor no radar igual a 0. O valor mínimo fica com 10 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarAIVDs = (form) => {
    let count = 0;
    console.log(form)

    const incial = form.find(
        (resposta) => Number(resposta.perguntaId) === 706
    );

    const reavaliacao = form.find(
        (resposta) => Number(resposta.perguntaId) === 1203
    );

    if (incial !== null) {

        for (let id = 706; id <= 709; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)[0], 10);
                console.log(numero)

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === 1146
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.match(/\d+/)[0], 10);
            console.log(numero)

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (incial !== null) {

        for (let id = 1203; id <= 1207; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)[0], 10);
                console.log(numero)

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === 1146
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.match(/\d+/)[0], 10);
            console.log(numero)

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 20) {
        count = 20;
    }

    return count;
}