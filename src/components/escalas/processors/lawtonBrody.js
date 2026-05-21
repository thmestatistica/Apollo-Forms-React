export const processarLawtonBrody = (respostas) => {
  const [pos, pre] = coletarLawtonBrody(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarLawtonBrody(pos),
      pre: normalizarLawtonBrody(pre),
    },
  };
};

export const normalizarLawtonBrody = (pontuacao) => {
    /**
     * Normaliza Lawton & Brody – AVDs Instrumentais (0–27) para escala 0–10
     *
     * @param {number} pontuacao - Pontuação bruta da escala Lawton & Brody
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Normalização linear: (escoreBruto / 27) * 10
    let escorePadronizado =
        Math.round(((escoreBruto / 27) * 10) * 100) / 100;

    // Garante que fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'Escala Lawton & Brody - AVDs Instrumentais',
        descricao: 'Avalia a capacidade para realizar atividades instrumentais da vida diária',
        interpretacao: 'Maior pontuação = maior independência em AVDs instrumentais',
        faixa_referencia: 'Máximo: 27 pontos (independência total)',
        referencia:
            'Lawton, M. P., & Brody, E. M. (1969). Assessment of older people: self-maintaining and instrumental activities of daily living. The Gerontologist, 9(3), 179-186.',
        categoria: 'Lawton <br>& Brody<br>AVDs'
    };
};

export const coletarLawtonBrody = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Começa, Fim
    const ids = [661, 669];

    // Buckets
    const pre = [];
    const pos = [];

    // Ordena sessões em ordem decrescente
    const sortedSessions = uniqueSessions.sort((a, b) => b - a);

    for (const session of sortedSessions) {
        if (count >= 2) break;

        // Filtra sessão atual e ordena por pergunta_id
        const dfSession = dfForm
            .filter(item => item.sessao_resposta_id === session)
            .sort((a, b) => a.pergunta_id - b.pergunta_id);

        // Filtra perguntas no intervalo
        const questoesNormais = dfSession.filter(
            item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
        );

        for (const item of questoesNormais) {
            const valor = item.valor_resposta;
            const num = String(valor[0]).trim();

            if (count === 0) {
                pos.push(Number(num));
            } else if (count === 1) {
                pre.push(Number(num));
            } else {
                break;
            }
        }

        count += 1;
    }

    if (pre.length === 0 || pos.length === 0) {
        console.warn(
            "Atenção: Apenas uma sessão encontrada para Lawton & Brody. É necessário pelo menos duas para pré e pós."
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
