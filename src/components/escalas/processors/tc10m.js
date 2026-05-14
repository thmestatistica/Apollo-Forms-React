export const processarTC10m = (respostas) => {
    const [pos, pre] = coletarTC10m(respostas);

    if (pos == null || pre == null) {
        return null;
    }

    return {
        valores: [pos, pre],
        normalizado: {
            pos: normalizarTC10m(pos),
            pre: normalizarTC10m(pre),
        },
    };
};

export const normalizarTC10m = (tempoSegundos, distanciaMetros = 10.0) => {
    /**
     * Normaliza o Teste de Caminhada de 10 metros para escala 0–10
     * Calcula a velocidade (m/s) e considera 0,8 m/s como ideal
     *
     * @param {number} tempoSegundos - Tempo para percorrer a distância (em segundos)
     * @param {number} distanciaMetros - Distância percorrida (padrão: 10 metros)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const tempo = Number(tempoSegundos);

    // Velocidade = distância / tempo (m/s)
    const velocidade = distanciaMetros / tempo;
    /*console.log(`Velocidade calculada: ${velocidade} m/s`);*/

    // Normalização:
    // ≥ 0,8 m/s → 10 pontos
    // < 0,8 m/s → proporcional
    let escorePadronizado = (velocidade / 0.8) * 10;

    // Garante limites entre 0 e 10
    escorePadronizado = Math.min(10, Math.max(0, Number(escorePadronizado.toFixed(2))));

    return {
        escore_bruto: velocidade,
        unidade: 'm/s',
        escore_padronizado: escorePadronizado,
        nome: 'Teste de Caminhada de 10 Metros',
        descricao: 'Avalia a velocidade de marcha em metros por segundo',
        interpretacao: 'Maior velocidade = melhor capacidade de deambulação',
        faixa_referencia: 'Ideal: >0,8 m/s | <0,4 m/s = limitação severa',
        referencia:
            'Salbach, N. M., Mayo, N. E., Higgins, J., Ahmed, S., Finch, L. E., & Richards, C. L. (2001). Responsiveness and predictability of gait speed and other disability measures in acute stroke. Archives of Physical Medicine and Rehabilitation, 82(9), 1204-1212.',
        categoria: 'TC-10m<br>Velocidade'
    };
};

export const coletarTC10m = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Começa, Fim
    const ids = [625, 627];

    // Buckets
    const pre = [];
    const pos = [];

    // Ordena sessões em ordem decrescente
    const sortedSessions = uniqueSessions.sort((a, b) => b - a);

    for (const session of sortedSessions) {
        if (count >= 2) break;

        // Filtra sessão atual e ordena
        const dfSession = dfForm
            .filter(item => item.sessao_resposta_id === session)
            .sort((a, b) => a.pergunta_id - b.pergunta_id);

        // Filtra perguntas no intervalo
        const questoesNormais = dfSession.filter(
            item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
        );

        for (const item of questoesNormais) {
            let tentativa = Number(item.valor_resposta);

            if (!tentativa || tentativa <= 0 || isNaN(tentativa)) {
                continue;
            }

            if (tentativa > 0 && tentativa < 1) {
                tentativa = tentativa * 10;
            }

            if (count === 0) {
                pos.push(tentativa);
            } else if (count === 1) {
                pre.push(tentativa);
            }
        }

        count += 1;
    }

    if (pre.length === 0 || pos.length === 0) {
        console.warn(
            "Atenção: Apenas uma sessão encontrada para TC-10m. É necessário pelo menos duas para pré e pós."
        );
        if (pre.length === 0) {
            return ["", pos.reduce((acc, v) => acc + v, 0)]
        }
        if (pos.length === 0) {
            return [pre.reduce((acc, v) => acc + v, 0), ""]
        }
    }

    // Menor tempo = melhor desempenho
    return [
        Math.min(...pos),
        Math.min(...pre)
    ];
};
