export const processarVAS = (respostas) => {

    const pontuacao = coletarVAS(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "VAS - Escala Visual Analógica de Dor",
        "doi": "10.1016/S0140-6736(74)90884-8",
        "nome_curto": "VAS",
        "calculo": "Escore = Pergunta única (p1)",
        "calculo_processado": "Padronização Radar = base",
        "interpretacao": "O escore bruto é o resultado da pergunta. Valor mínimo = 0; Valor máximo = 10. O escore padronizado se mantém igual ao escore bruto pois o mesmo ja está em uma pontuação de 0 a 10."
    };
};

export const coletarVAS = (form) => {
    let count = 0;

    const item = form.find(
        (resposta) => Number(resposta.perguntaId) === 161
    );

    const valor = item?.resposta;

    if (valor) {
        const numero = parseInt(valor.split(" - ")[0], 10);

        if (!isNaN(numero)) {
            count += numero;
        }
    }

    if (count >= 10) {
        count = 10;
    }

    return count;
};
