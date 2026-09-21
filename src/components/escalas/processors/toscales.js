// FORMULARIO NOVO - 118

export const processarTOScales = (respostas) => {
    const pontuacaoAIVDs = coletarAIVDs(respostas);
    const pontuacaoSensPercept = coletarSensPercept(respostas);
    const pontuacaoMotor = coletarMotor(respostas)

    return [
        {
            resultado: pontuacaoAIVDs,
            descricao: "AIVDs",
            doi: "Sem referência",
            nome_curto: "AIVDs",
            calculo: "Escore = p1 + p2 + p3 + p4 + p5",
            calculo_processado: "Padronização Radar = 10 - ((base / 20) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 20; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        },
        {
            resultado: pontuacaoSensPercept,
            descricao: "Sensorial e Perceptual",
            doi: "Sem referência",
            nome_curto: "Sensorial e Perceptual",
            calculo: "Escore = p1 + p3 + p5 + p6 + p7",
            calculo_processado: "Padronização Radar = 10 - ((base / 20) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 20; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        },
        {
            resultado: pontuacaoMotor,
            descricao: "Motor",
            doi: "Sem referência",
            nome_curto: "Motor",
            calculo: "Escore = p1 + p2 + p3 + p5 + p7 + p8 + p9 + p10",
            calculo_processado: "Padronização Radar = 10 - ((base / 32) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 36; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        }
    ]
}

export const coletarAIVDs = (form) => {

    let count = 0;

    for (let id = 2389; id <= 2393; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.match(/\d+/)?.[0], 10);

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

export const coletarSensPercept = (form) => {

    let count = 0;

    const ids = [2396, 2398, 2400, 2401, 2402]

    for (const id of ids) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.match(/\d+/)?.[0], 10);

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

export const coletarMotor = (form) => {

    let count = 0;

    const ids = [2405, 2406, 2407, 2409, 2411, 2412, 2413, 2414]

    for (const id of ids) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.match(/\d+/)?.[0], 10);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 32) {
        count = 32;
    }

    return count;
}


// FORMULARIOS ANTIGOS - 32 e 61

export const processarTOScalesAntigo = (respostas) => {
    const pontuacaoAvCog = coletarAvCogAntigo(respostas);
    const pontuacaoAIVDs = coletarAIVDsAntigo(respostas);
    const pontuacaoSensPercept = coletarSensPerceptAntigo(respostas);
    const pontuacaoMotor = coletarMotorAntigo(respostas);
    console.log(pontuacaoAvCog);
    console.log(pontuacaoAIVDs);
    console.log(pontuacaoSensPercept);
    console.log(pontuacaoMotor);

    return [
        {
            resultado: pontuacaoAvCog,
            descricao: "Avaliação Cognitiva",
            doi: "Sem referência",
            nome_curto: "Av. Cognitiva",
            calculo: "Escore = p1 + p2",
            calculo_processado: "Padronização Radar = 10 - ((base / 8) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 8; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        },
        {
            resultado: pontuacaoAIVDs,
            descricao: "AIVDs",
            doi: "Sem referência",
            nome_curto: "AIVDs",
            calculo: "Escore = p1 + p2 + p3 + p4 + p5",
            calculo_processado: "Padronização Radar = 10 - ((base / 20) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 20; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        },
        {
            resultado: pontuacaoSensPercept,
            descricao: "Sensorial e Perceptual",
            doi: "Sem referência",
            nome_curto: "Sensorial e Perceptual",
            calculo: "Escore = p1 + p3 + p5 + p6 + p7",
            calculo_processado: "Padronização Radar = 10 - ((base / 20) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 20; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        },
        {
            resultado: pontuacaoMotor,
            descricao: "Motor",
            doi: "Sem referência",
            nome_curto: "Motor",
            calculo: "Escore = p1 + p2 + p3 + p5 + p9 + p11 + p12 + p13 + p14",
            calculo_processado: "Padronização Radar = 10 - ((base / 36) × 10)",
            interpretacao: "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 36; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (0 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
        }
    ];
};

export const coletarAvCogAntigo = (form) => {

    let count = 0;

    const incial = form.find(
        (resposta) => Number(resposta.perguntaId) === 703
    );

    const reavaliacao = form.find(
        (resposta) => Number(resposta.perguntaId) === 1199
    );

    if (incial !== null) {

        for (let id = 703; id <= 704; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (reavaliacao !== null) {

        for (let id = 1199; id <= 1200; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);
                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (count >= 8) {
        count = 8;
    }

    return count;
}

export const coletarAIVDsAntigo = (form) => {

    let count = 0;

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
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

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
            const numero = parseInt(valor.match(/\d+/)?.[0], 10);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (reavaliacao !== null) {

        for (let id = 1203; id <= 1207; id++) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

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
            const numero = parseInt(valor.match(/\d+/)?.[0], 10);

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

export const coletarSensPerceptAntigo = (form) => {

    let count = 0;

    const incial = form.find(
        (resposta) => Number(resposta.perguntaId) === 1149
    );

    const reavaliacao = form.find(
        (resposta) => Number(resposta.perguntaId) === 1210
    );

    if (incial !== null) {

        const ids = [1149, 1151, 1153, 1154, 1155]

        for (const id of ids) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (reavaliacao !== null) {

        const ids = [1210, 1212, 1214, 1215, 1216]

        for (const id of ids) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (count >= 20) {
        count = 20;
    }

    return count;
}

export const coletarMotorAntigo = (form) => {

    let count = 0;

    const incial = form.find(
        (resposta) => Number(resposta.perguntaId) === 1158
    );

    const reavaliacao = form.find(
        (resposta) => Number(resposta.perguntaId) === 1219
    );

    if (incial !== null) {

        const ids = [710, 711, 713, 714, 715, 716, 1158, 1159, 1165]

        for (const id of ids) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (reavaliacao !== null) {

        const ids = [1219, 1220, 1221, 1223, 1227, 1229, 1230, 1231, 1232]

        for (const id of ids) {

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(valor.match(/\d+/)?.[0], 10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (count >= 36) {
        count = 36;
    }

    return count;
}
