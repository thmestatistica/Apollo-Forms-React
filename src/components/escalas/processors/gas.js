export const processarGAS = (respostas) => {
    const { pontuacao, texto } = coletarGAS(respostas);

    console.log(pontuacao, texto);

    return {
        resultado: pontuacao,
        descricao: texto,
        doi: "Sem referência",
        nome_curto: "GAS",
        calculo: "Escore = p3",
        calculo_processado: "Essa escala não é exibida no radar",
        interpretacao: "",
    };
};

export const coletarGAS = (form) => {
    console.log(form);

    let count = 0;

    const itemPontuacao = form.find(
        (resposta) => Number(resposta.perguntaId) === 830
    );

    const valor = itemPontuacao?.resposta;

    if (valor !== undefined && valor !== null) {
        count = Number(valor);
    }

    if (count >= 2) {
        count = 2;
    } else if (count <= -2) {
        count = -2;
    }

    const itemTexto = form.find(
        (resposta) => Number(resposta.perguntaId) === 829
    );

    const texto = itemTexto?.resposta;

    return {
        pontuacao: count,
        texto
    };
};