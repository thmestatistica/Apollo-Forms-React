export const processarGMFM = (respostas) => {

    const pontuacao = coletarGMFM(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala GMFM",
        "doi": "10.1590/S1413-35552008000500011",
        "nome_curto": "GMFM",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + ... + p88",
        "calculo_processado": "Padronização Radar = (base / 264) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 264. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (264 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarGMFM = (form) => {   
    let count = 0;

    for (let id = 1273; id <= 1360; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        let valor = item?.resposta;

        if (valor) {

            valor = (valor.split(" - ")[0]);

            const numero = parseInt(valor);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 264) {
        count = 264;
    }

    return count;
}