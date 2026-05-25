export const processarFOIS = (respostas) => {

    const pontuacao = coletarFOIS(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "FOIS – Escala Funcional de Alimentação Oral",
        "doi": "10.1016/j.apmr.2004.11.049",
        "nome_curto": "FOIS",
        "calculo": "Escore = Pergunta única (p1)",
        "calculo_processado": "Padronização Radar = (base / 7) × 10",
        "interpretacao": "O escore bruto é o resultado da pergunta. Valor mínimo = 0; Valor máximo = 7. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (7 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarFOIS = (form) => {

    let count = 0;

    const item = form.find(
        (resposta) => Number(resposta.perguntaId) === 651
    );

    const valor = item?.resposta;

    if (valor) {
        const match = valor.match(/^nível\s*(\d+)/i);

        if (match) {
            count = parseInt(match[1], 10);
        }
    }

    if (count >= 7) {
        count = 7;
    }

    return count;
};