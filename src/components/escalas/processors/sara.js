export const processarSARA = (respostas) => {

    const pontuacao = coletarSARA(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "SARA - Escala de classificação de ataxia",
        "doi": "10.1590/S0004-282X2010000200014",
        "nome_curto": "SARA",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8",
        "calculo_processado": "Padronização Radar = 10 - ((base / 38) × 10)",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 38. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (38 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarSARA = (form) => {
    console.log(form)
    let count = 0;

    for (let id = 1367; id <= 1374; id++) {

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

    if (count >= 38){
        count = 38;
    }

    if (count <= 0){
        count = 0
    }

    return count;
}