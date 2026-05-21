export const processarBerg = (respostas) => {
    const [pos, pre] = coletarBerg(respostas);

    if (pos == null || pre == null) {
        return null;
    }

    return {
        valores: [pos, pre],
        normalizado: {
            pos: normalizarBerg(pos),
            pre: normalizarBerg(pre),
        },
    };
};

export const normalizarBerg = (pontuacao) => {
    /**
     * Normaliza a Escala de Equilíbrio de Berg (0–56) para escala 0–10
     *
     * @param {number} pontuacao - Pontuação bruta da Escala de Berg
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Normalização linear: (escoreBruto / 56) * 10
    let escorePadronizado = Math.round((escoreBruto / 56) * 10 * 100) / 100;

    // Garante que fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'Escala de Equilíbrio de Berg',
        descricao: 'Avalia o equilíbrio estático e dinâmico em adultos',
        interpretacao: 'Maior pontuação = melhor equilíbrio e menor risco de quedas',
        faixa_referencia: 'Máximo: 56 pontos (equilíbrio ótimo)',
        referencia:
            'Berg, K., Wood-Dauphinee, S., Williams, J. I., & Gayton, D. (1989). Measuring balance in the elderly: validation of an instrument. Canadian Journal of Public Health, 80(Suppl 2), S7-S11.',
        categoria: 'Berg<br>Equilíbrio'
    };
};

export const coletarBerg = (dfForm) => {
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    const ids = [634, 647];

    const pre = [];
    const pos = [];

    const sortedSessions = uniqueSessions.sort((a, b) => b - a);

    for (const session of sortedSessions) {
        if (count >= 2) break;

        const dfSession = dfForm
            .filter(item => item.sessao_resposta_id === session)
            .sort((a, b) => a.pergunta_id - b.pergunta_id);

        const questoesNormais = dfSession.filter(
            item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
        );

        for (const item of questoesNormais) {
            const valor = item.valor_resposta;

            if (!valor) continue;

            let texto = "";

            // Caso antigo (string normal)
            if (typeof valor === "string") {
                texto = valor;
            } else if (typeof valor === "object" && valor !== null) {
                texto = valor.valor || valor.label || "";
            }

            // Extrai número antes de "pontos"
            const match = texto.match(/(\d+)\s*pontos?/i);

            if (!match) continue;

            const numero = Number(match[1]);

            if (count === 0) {
                pos.push(numero);
            } else if (count === 1) {
                pre.push(numero);
            } else {
                break;
            }
        }

        count += 1;
    }

    if (pre.length === 0 || pos.length === 0) {
        console.warn(
            "Atenção: Apenas uma sessão encontrada para a Escala de Berg. É necessário pelo menos duas para pré e pós."
        );
        if (pre.length === 0) {
            return [pos.reduce((acc, v) => acc + v, 0), ""];
        }
        if (pos.length === 0) {
            return ["", pre.reduce((acc, v) => acc + v, 0)];
        }
    }

    return [
        pos.reduce((acc, v) => acc + v, 0),
        pre.reduce((acc, v) => acc + v, 0)
    ];
};
