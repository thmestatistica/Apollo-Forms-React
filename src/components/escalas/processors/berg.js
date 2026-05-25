export const processarBerg = (respostas) => {

    const pontuacao = coletarBerg(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala de Equilíbrio de Berg",
        "doi": "10.3138/ptc.41.6.304",
        "nome_curto": "Berg",
        "calculo": "Escore = p1 + ... + p14",
        "calculo_processado": "Padronização Radar = (base / 56) × 10",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 56. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (56 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
};

export const coletarBerg = (form) => {
    let count = 0;

    for (let id = 634; id <= 647; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor.split(" pontos: ")[0], 10);
            console.log(numero)

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    if (count >= 56) {
        count = 56;
    }

    return count;
}