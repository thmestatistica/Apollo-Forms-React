export const processarFOIS = (respostas) => {
  const [pos, pre] = coletarFOIS(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarFOIS(pos),
      pre: normalizarFOIS(pre),
    },
  };
};

export const normalizarFOIS = (pontuacao) => {
    /**
     * Normaliza FOIS (1–7) para escala 0–10
     *
     * @param {number} pontuacao - Nível FOIS (1 a 7)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Normalização linear: ((escoreBruto - 1) / 6) * 10
    let escorePadronizado =
        Math.round((((escoreBruto - 1) / 6) * 10) * 100) / 100;

    // Garante que o valor fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'nível',
        escore_padronizado: escorePadronizado,
        nome: 'Escala de Ingestão Funcional Oral (FOIS)',
        descricao: 'Avalia o nível funcional de ingestão oral e deglutição',
        interpretacao: 'Maior nível = melhor função de deglutição e alimentação oral',
        faixa_referencia: '1 = nada por via oral, 7 = dieta total sem restrições',
        referencia:
            'Crary, M. A., Mann, G. D., & Groher, M. E. (2005). Initial psychometric assessment of a functional oral intake scale for dysphagia in stroke patients. Archives of Physical Medicine and Rehabilitation, 86(8), 1516-1520.',
        categoria: 'FOIS<br>Deglutição'
    };
};

export const coletarFOIS = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Pergunta única
    const id = 651;

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

        // Filtra pergunta específica
        const questoesNormais = dfSession.filter(
            item => item.pergunta_id === id
        );

        for (const item of questoesNormais) {
            const valor = item.valor_resposta;
            const num = String(valor[6]).trim();

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
            "Atenção: Apenas uma sessão encontrada para FOIS. É necessário pelo menos duas para pré e pós."
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
