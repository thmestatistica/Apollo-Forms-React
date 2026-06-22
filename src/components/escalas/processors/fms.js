export const processarFMS = (respostas) => {

    const pontuacao = coletarFMS(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala FMS",
        "doi": "10.1590/1517-8692202228052022_0046",
        "nome_curto": "FMS",
        "calculo": "Escore = p1 + p2 + p3",
        "calculo_processado": "Padronização Radar = (base / 18) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 18. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (18 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarFMS = (form) => {
    let count = 0;

    for (let id = 1270; id <= 1272; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        let valor = item?.resposta;

        if (valor) {

            valor = (valor.split(" - ")[0]);

            console.log(valor)

            if (valor === "C") {
                count += 3;
                continue;
            }
            const numero = parseInt(valor);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 18) {
        count = 18;
    }

    return count;
}