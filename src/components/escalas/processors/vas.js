export const processarVAS = (respostas) => {
  const [pos, pre] = coletarVAS(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarVAS(pos),
      pre: normalizarVAS(pre),
    },
  };
};

export const normalizarVAS = (pontuacao) => {
    /**
     * Normaliza a Escala Visual Analógica de Dor (VAS/EVA) (0–10)
     * para escala 0–10 (invertida)
     * Quanto menor a dor, maior a pontuação
     *
     * @param {number} pontuacao - Pontuação bruta da EVA (0 a 10)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Escala invertida: 10 - escoreBruto
    let escorePadronizado = Math.round((10 - escoreBruto) * 100) / 100;

    // Garante que fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'Escala Visual Analógica de Dor (VAS)',
        descricao: 'Avalia a intensidade da dor autorrelatada pelo paciente',
        interpretacao: 'Menor pontuação = menor intensidade de dor',
        faixa_referencia: '0 = sem dor, 10 = pior dor imaginável (escala invertida)',
        referencia:
            'Huskisson, E. C. (1974). Measurement of pain. The Lancet, 304(7889), 1127-1131.',
        categoria: 'Analgesia<br>Melhora<br>da Dor'
    };
};

export const coletarVAS = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Pergunta única
    const id = 161;

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

        // Filtra pergunta específica
        const questoesNormais = dfSession.filter(
            item => item.pergunta_id === id
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

    if (pos.length === 0) {
        console.warn(
            "Atenção: Apenas uma sessão VAS encontrada. É necessário pelo menos duas para pré e pós."
        );
        if(pre.length === 0){
          return ["", pos.reduce((acc, v) => acc + v, 0)]
        }
        if(pos.length === 0){
          return [pre.reduce((acc, v) => acc + v, 0), ""]
        }
    }

    // Retorna valor único
    return [pos[0], pre[0]];
};
