export const processarGRBASI = (respostas) => {

    const pontuacao = coletarGRBASI(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "GRBASI",
        "doi": "10.23925/2176-2724.2022v34i1e54343",
        "nome_curto": "GRBASI",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + p6",
        "calculo_processado": "Padronização Radar = (base / 18) × 10",
        "interpretacao": "O escore bruto é o resultado da pergunta. Valor mínimo = 0; Valor máximo = 18. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (18 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarGRBASI = (form) => {

    let count = 0;

    for (let id = 1361; id <= 1366; id++) {

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

    if (count >= 18){
        count = 18;
    }

    return count;
};
