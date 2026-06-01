export const processarMOCA = (respostas) => {

    const pontuacao = coletarMOCA(respostas);
    console.log(pontuacao)

    return {
        "resultado": pontuacao,
        "descricao": "Escala de Rastreio Cognitivo - MoCA",
        "doi": "10.1002/alz.086424",
        "nome_curto": "MOCA",
        "calculo": "Escore = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9 + p10 + p11 (caso (p1 <= 12) +1)",
        "calculo_processado": "Padronização Radar = (base / 30) × 10",
        "interpretacao" : "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 30. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (30 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente. 18-25 = comprometimento cognitivo leve | 10-17 = comprometimento cognitivo moderado | 0-9 = comprometimento cognitivo grave"
    };
};

export const coletarMOCA = (form) => {
    console.log(form)
    let count = 0;

    for (let id = 908; id <= 917; id++) {

        const item = form.find(
            (resposta) => Number(resposta.perguntaId) === id
        );

        const valor = item?.resposta;

        if (valor) {
            const numero = parseInt(valor, 0);

            if (!isNaN(numero)) {
                count += numero;
            }
        }
    }

    const item = form.find(
            (resposta) => Number(resposta.perguntaId) === 907
        );
    
    const valor = item?.resposta;

    if (valor && valor <= 12){
        count += 1;
    }

    if (count >= 30){
        count = 30;
    }

    return count;
};