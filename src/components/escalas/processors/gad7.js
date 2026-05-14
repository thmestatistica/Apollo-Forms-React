export const processarGAD7 = (respostas) => {

    const pontuacao = coletarGAD7(respostas);

    return {
        "resultado": pontuacao,
        "descricao": "Escala de Ansiedade GAD-7",
        "doi": "10.1001/archinte.166.10.1092",
        "nome_curto": "GAD-7",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + p6 + p7",
        "calculo_processado": "Padronização Radar = 10 - ((base / 21) × 10)",
        "interpretacao" : "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 21. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (21 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarGAD7 = (form) => {
    let count = 0;

    for (let id = 653; id <= 659; id++) {

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

    return count;
};