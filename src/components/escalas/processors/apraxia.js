export const processarApraxia = (respostas) => {

    const pontuacao = coletarApraxia(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala Apraxia da Fala",
        "doi": "10.1590/2317-1782/20192018121",
        "nome_curto": "Apraxia da Fala",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + ... + p71",
        "calculo_processado": "Padronização Radar = 10 - ((base / 476) × 10)",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 476. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (476 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarApraxia = (form) => {
    let count = 0;

    const idsExcluidos = new Set([
        1042,
        1070,
        1071,
        1094,
        1099,
        1102,
        1110,
        1475,
        1476,
        1477,
        1478,
    ]);

    const intervalos = [
        [1042, 1112],
        [1475, 1478]
    ];

    for (const [inicio, fim] of intervalos) {
        for (let id = inicio; id <= fim; id++) {

            if (idsExcluidos.has(id)) {
                continue;
            }

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(String(valor),10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (count >= 476) {
        count = 476;
    }

    return count;
};