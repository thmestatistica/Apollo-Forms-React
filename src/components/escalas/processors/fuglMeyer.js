export const processarFuglMeyerSuperior = (respostas) => {
  const [pos, pre] = coletarFuglMeyerSuperior(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarFuglMeyerSuperior(pos),
      pre: normalizarFuglMeyerSuperior(pre),
    },
  };
};

export const normalizarFuglMeyerSuperior = (pontuacao, pontuacaoTotal = 104) => {
    /**
     * Normaliza o Fugl-Meyer – Membros Superiores (0–104) para escala 0–10
     *
     * @param {number} pontuacao - Pontuação bruta do teste (0 a 104)
     * @param {number} pontuacaoTotal - Pontuação total do teste (padrão: 104)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Normalização linear: (escoreBruto / pontuacaoTotal) * 10
    let escorePadronizado =
        Math.round(((escoreBruto / pontuacaoTotal) * 10) * 100) / 100;

    // Garante que o valor fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'Fugl-Meyer - Membros Superiores',
        descricao: 'Avalia a função motora dos membros superiores após AVC',
        interpretacao: 'Maior pontuação = melhor função motora',
        faixa_referencia: 'Máximo: 104 pontos (Pode ter Adaptações)',
        referencia:
            'Fugl-Meyer, A. R., Jääskö, L., Leyman, I., Olsson, S., & Steglind, S. (1975). The post-stroke hemiplegic patient. 1. a method for evaluation of physical performance. Scandinavian Journal of Rehabilitation Medicine, 7(1), 13-31.',
        categoria: 'Fugl-Meyer<br>Superior'
    };
};

export const coletarFuglMeyerSuperior = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Começa, Fim, Anormais
    const ids = [741, 780, 792];

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

        // Questões normais
        const questoesNormais = dfSession.filter(
            item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
        );

        // Questões anormais
        const questoesAnormais = dfSession.filter(
            item => item.pergunta_id > ids[1] && item.pergunta_id <= ids[2]
        );

        // Normais
        for (const item of questoesNormais) {
            const num = String(item.valor_resposta[0]).trim();

            if (count === 0) {
                pos.push(Number(num));
            } else if (count === 1) {
                pre.push(Number(num));
            }
        }

        // Anormais (lista serializada)
        for (const item of questoesAnormais) {
            let lista;

            try {
                lista = JSON.parse(item.valor_resposta);
            } catch {
                continue;
            }

            for (const valor of lista) {
                const num = String(valor[0]).trim();

                if (count === 0) {
                    pos.push(Number(num));
                } else if (count === 1) {
                    pre.push(Number(num));
                }
            }
        }

        count += 1;
    }

    if (pre.length === 0 || pos.length === 0) {
        console.warn(
            "Atenção: Apenas uma sessão encontrada para Fugl Meyer Superior. É necessário pelo menos duas para pré e pós."
        );
        if(pre.length === 0){
          return ["", pos.reduce((acc, v) => acc + v, 0)]
        }
        if(pos.length === 0){
          return [pre.reduce((acc, v) => acc + v, 0), ""]
        }
    }

    return [
        pos.reduce((acc, v) => acc + v, 0),
        pre.reduce((acc, v) => acc + v, 0)
    ];
};

export const processarFuglMeyerInferior = (respostas) => {
    const [pos, pre] = coletarFuglMeyerInferior(respostas);

    if (pos == null || pre == null) {
        return null;
    }

    return {
        valores: [pos, pre],
        normalizado: {
            pos: normalizarFuglMeyerInferior(pos),
            pre: normalizarFuglMeyerInferior(pre),
        },
    };
};

export const normalizarFuglMeyerInferior = (pontuacao, pontuacaoTotal = 34) => {
    /**
     * Normaliza o Fugl-Meyer – Membros Inferiores (0–34) para escala 0–10
     *
     * @param {number} pontuacao - Pontuação bruta do teste (0 a 34)
     * @param {number} pontuacaoTotal - Pontuação total do teste (padrão: 34)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Normalização linear
    let escorePadronizado =
        Math.round(((escoreBruto / pontuacaoTotal) * 10) * 100) / 100;

    // Garante intervalo 0–10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'Fugl-Meyer - Membros Inferiores',
        descricao: 'Avalia a função motora dos membros inferiores após AVC',
        interpretacao: 'Maior pontuação = melhor função motora',
        faixa_referencia: 'Máximo: 34 pontos',
        referencia:
            'Fugl-Meyer, A. R., Jääskö, L., Leyman, I., Olsson, S., & Steglind, S. (1975). The post-stroke hemiplegic patient. 1. a method for evaluation of physical performance. Scandinavian Journal of Rehabilitation Medicine, 7(1), 13-31.',
        categoria: 'Fugl-Meyer<br>Inferior'
    };
};

export const coletarFuglMeyerInferior = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Começa, Fim
    const ids = [590, 622];

    // Buckets
    const pre = [];
    const pos = [];

    // Ordena sessões em ordem decrescente
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
            const num = String(item.valor_resposta[0]).trim();

            if (count === 0) {
                pos.push(Number(num));
            } else if (count === 1) {
                pre.push(Number(num));
            }
        }

        count += 1;
    }

    if (pre.length === 0 || pos.length === 0) {
        console.warn(
            "Atenção: Apenas uma sessão encontrada para Fugl Meyer Inferior. É necessário pelo menos duas para pré e pós."
        );
        return [null, null];
    }

    return [
        pos.reduce((acc, v) => acc + v, 0),
        pre.reduce((acc, v) => acc + v, 0)
    ];
};
