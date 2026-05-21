export const processarPHQ9 = (respostas) => {
  const [pos, pre] = coletarPHQ9(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarPHQ9(pos),
      pre: normalizarPHQ9(pre),
    },
  };
};

export const normalizarPHQ9 = (pontuacao) => {
    /**
     * Normaliza PHQ-9 (0–27) para escala 0–10 (invertida)
     * Quanto menor a depressão, maior a pontuação
     *
     * @param {number} pontuacao - Pontuação bruta do PHQ-9 (0 a 27)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Escala invertida: 10 - (escoreBruto / 27) * 10
    let escorePadronizado =
        Math.round((10 - (escoreBruto / 27) * 10) * 100) / 100;

    // Garante que fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'PHQ-9 – Questionário de Depressão',
        descricao: 'Avalia a depressão/tristeza do paciente',
        interpretacao: 'Menor pontuação = menor intensidade de depressão',
        faixa_referencia: '0-4: mínima | 5-9: leve | 10-14: moderada | 15-19: moderadamente grave | 20-27: grave',
        referencia:
            'Kroenke, K., Spitzer, R. L., & Williams, J. B. W. (2001). The PHQ-9: Validity of a brief depression severity measure. Journal of General Internal Medicine, 16(9), 606–613.',
        categoria: 'PHQ9<br>Depressão'
    };
};

export const coletarPHQ9 = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Começa, Fim
    const ids = [670, 678];

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
            const num = String(item.valor_resposta[0]).trim();

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
            "Atenção: Apenas uma sessão encontrada para PHQ-9. É necessário pelo menos duas para pré e pós."
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
