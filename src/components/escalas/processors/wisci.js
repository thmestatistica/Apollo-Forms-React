export const processarWISCI = (respostas) => {

    const pontuacao = coletarWISCI(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Walking Index for Spinal Cord Injury",
        "doi": "10.1590/S1808-18512009000400010 ",
        "nome_curto": "WISCI",
        "calculo": "Escore = Escore = Pergunta única (p1)",
        "calculo_processado": "Padronização Radar = (base / 20) × 10",
        "interpretacao": "O escore bruto é o resultado da pergunta. Valor mínimo = 0; Valor máximo = 20. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (20 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    }
}

export const coletarWISCI = (form) => {

    let count = 0;

    const item = form.find(
        (resposta) => Number(resposta.perguntaId) === 1018
    );

    const valor = item?.resposta;

    if (valor) {
        const numero = parseInt(valor.split(" - ")[0], 10);

        if (numero) {
            count = parseInt(numero, 10);
        }
    }

    if (count >= 20) {
        count = 20;
    }

    return count;
};