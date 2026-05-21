export const processarEDT = (respostas) => {

    const pontuacao = coletarEDT(respostas);

    return {
        "resultado": pontuacao,
        "descricao": "Escala de Deficiências de Tronco (EDT)",
        "doi": "10.1590/S1809-29502008000300006",
        "nome_curto": "EDT",
        "calculo": "Escore = (p3 + p4 + p5) + (p8 + ... + p17) + (p20 + p21 + p22 + p23)",
        "calculo_processado": "Padronização Radar = (base / 23) × 10",
        "interpretacao" : "O escore bruto é a soma dos resultados das três sessões de resposta, porém se a resposta da primeira pergunta tiver o valor 0 o resultado é 0. Valor mínimo = 0; Valor máximo = 23. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (23 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarEDT = (form) => {
    const perguntas1 = [1698, 1259, 1260];

    let resultado1 = 0;

    for (const pergunta of perguntas1) {
        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === pergunta
        );

        const resposta = Number(
            item?.resposta?.match(/\d+/)?.[0] ?? 0
        );

        // Se o resultado da primeira pergunta for 0 então o resultado da Escala é 0
        if (pergunta === 1698 && resposta === 0) {
            return 0;
        }

        resultado1 += resposta;
    }

    let resultado2 = 0;

    for ( let id = 1261; id <= 1269; id ++){
        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const resposta = Number(
            item?.resposta?.match(/\d+/)?.[0] ?? 0
        );

        if (resposta != NaN){
            resultado2 += resposta;
        }
    }

    const item = form.find((resposta) => Number(resposta.perguntaId) === 1701);
    const resposta = Number(
        item?.resposta?.match(/\d+/)?.[0] ?? 0
    );

    if(resposta){
        resultado2 += resposta;
    }

    let resultado3 = 0;

    for ( let id = 1704; id <= 1707; id ++){
        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const resposta = Number(
            item?.resposta?.match(/\d+/)?.[0] ?? 0
        );

        if (resposta != NaN){
            resultado3 += resposta;
        }
    }

    return (resultado1 + resultado2 + resultado3);
};