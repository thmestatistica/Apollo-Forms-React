export const processarGASantiga = (respostas) => {
    const { pontuacao, texto, justificativa } = coletarGASantiga(respostas);

    console.log(pontuacao, texto, justificativa);

    return {
        resultado: pontuacao,
        descricao: `["${texto}"], ["${justificativa}"]`,
        doi: "10.1007/BF01530764",
        nome_curto: "GAS",
        calculo: "Escore = p3",
        calculo_processado: "Essa escala não é exibida no radar",
        interpretacao: "",
    };
};

export const coletarGASantiga = (form) => {
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

    const itemJustificativa = form.find(
        (resposta) => Number(resposta.perguntaId) === 1756
    );

    const texto = itemTexto?.resposta;
    const justificativa = itemJustificativa?.resposta;

    return {
        pontuacao: count,
        texto,
        justificativa
    };
};

export const processarGAS = (respostas) => {
    const { pontuacao, objetivos, justificativa } = coletarGAS(respostas);

    console.log(pontuacao, objetivos, justificativa);

    return {
        resultado: pontuacao,
        descricao: {
            objetivos: { objetivos },
            justificativa: { justificativa }
        },
        doi: "10.1007/BF01530764",
        nome_curto: "GAS Avaliação / Reavaliação",
        calculo: "Escore = p3 \n A pergunta p4 é sempre relativa ao preenchimento anterior.",
        calculo_processado: "Essa escala não é exibida no radar",
        interpretacao: "O resultado da GAS é composto pelos objetivos informados na av. inicial ou na reavaliação anterior e o resultado do objetivo informado na primeira reavaliação (caso só haja uma reavaliação), ou pelos objetivos informados na reavaliação anterior e o resultado do objetivo informado uma reavaliação no futuro.",
    };
};

export const coletarGAS = (form) => {
    console.log(form);

    let count = 0;

    const AVALIACAO_PERGUNTA = form.find((resposta) => Number(resposta.perguntaId) === 2206)
    const AVALIACAO = AVALIACAO_PERGUNTA?.resposta === "Avaliação"

    console.log("É avaliação?", AVALIACAO)

    let valor = 0;

    if (AVALIACAO) {
        valor = 0
    } else {
        const itemPontuacao = form.find(
            (resposta) => Number(resposta.perguntaId) === 2207
        );

        valor = itemPontuacao?.resposta;
    }

    if (valor !== undefined && valor !== null) {
        const match = String(valor).match(/[+-]?\d+(\.\d+)?/);

        count = match ? Number(match[0]) : null;
    }

    if (count >= 2) {
        count = 2;
    } else if (count <= -2) {
        count = -2;
    }

    const objetivosMatrix = form.find(
        (resposta) => Number(resposta.perguntaId) === 2188
    );

    const itemJustificativa = form.find(
        (resposta) => Number(resposta.perguntaId) === 2205
    );

    const objetivos = objetivosMatrix?.resposta;
    const justificativa = itemJustificativa?.resposta;

    return {
        pontuacao: count,
        objetivos,
        justificativa
    };
};