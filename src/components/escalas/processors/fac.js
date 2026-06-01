export const processarFAC = (respostas) => {

    const pontuacao = coletarFAC(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Functional Ambulatory Scale - FAC",
        "doi": "10.1093/ptj/64.1.35",
        "nome_curto": "FAC",
        "calculo": "Escore = Pergunta única (p1)",
        "calculo_processado": "Padronização Radar = (base / 5) × 10",
        "interpretacao": "O escore bruto é o resultado da pergunta. Valor mínimo = 0; Valor máximo = 5. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (5 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarFAC = (form) => {

    let count = 0;

    const item = form.find(
        (resposta) => Number(resposta.perguntaId) === 1026
    );

    const valor = item?.resposta;

    if (valor) {
        count = parseInt(valor.split(" - ")[0], 10);
    }

    if (count >= 5) {
        count = 5;
    }

    return count;
};
