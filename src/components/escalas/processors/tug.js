export const processarTUG = (respostas) => {

    const pontuacao = coletarTUG(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Timed Up & Go (TUG)",
        "doi": "10.1111/j.1532-5415.1991.tb01616.x",
        "nome_curto": "TUG",
        "calculo": "Escore = min(p2, p3, p4)",
        "calculo_processado": "Padronização Radar = ((30 - base) / (30 - 10)) * 10",
        "interpretacao": "O escore bruto é o menor valor dentre os três informados no formulário. Valor mínimo = 10; Valor máximo = 30; O escore padronizado lineariza a relação de tal que forma que uma resposta mínima (10 no escore bruto) seja um valor no radar igual a 10. O valor máximo ou maior fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarTUG = (form) => {
    let result = null;

    for (let id = 2; id <= 4; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = Number(item?.resposta);

        if (result === null || valor < result) {
            result = valor;
        }
    }

    return result;
};