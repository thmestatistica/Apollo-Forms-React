export const processarParkinsonUPDRS = (respostas) => {

    const pontuacao = coletarParkinsonUPDRS(respostas);
    console.log(pontuacao);

    return {
        "resultado": pontuacao,
        "descricao": "Escala ParkinsonUPDRS",
        "doi": "10.1590/1809-2950/16659423042016 ",
        "nome_curto": "ParkinsonUPDRS",
        "calculo": "Escore = p1 + p2 + p3 + p4 + p5 + ... + p71",
        "calculo_processado": "Padronização Radar = 10 - ((base / 216) × 10)",
        "interpretacao": "O escore bruto é a soma da pontuação individual de cada pergunta. Valor mínimo = 0; Valor máximo = 216. O escore padronizado lineariza a relação de tal que forma que uma resposta máxima (216 no escore bruto) seja um valor no radar igual a 10. O valor mínimo fica com 0 e qualquer outra pontuação está interpolada linearmente"
    };
}

export const coletarParkinsonUPDRS = (form) => {
    let count = 0;

    const idsExcluidos = new Set([
        1500,
        1507,
        1776,
        1777,
        1778,
        1779,
        1780,
        1781,
        1806,
        1807,
        1808,
        1809,
        1810,
        1815,
        1819,
        1820
    ]);

    const intervalos = [
        [1500, 1514],
        [1763, 1820]
    ];

    for (const [inicio, fim] of intervalos) {
        for (let id = inicio; id <= fim; id++) {

            if (idsExcluidos.has(id)) {
                continue;
            }

            const item = form.find(
                (resposta) => Number(resposta.perguntaId) === id
            );

            const valor = item?.resposta;

            if (valor) {
                const numero = parseInt(String(valor),10);

                if (!isNaN(numero)) {
                    count += numero;
                }
            }
        }
    }

    if (count >= 216) {
        count = 216;
    }

    return count;
};