export const processarMIFAutocuidados = (respostas) => {
  const [pos, pre] = coletarMIFAutocuidados(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarMIFAutocuidados(pos),
      pre: normalizarMIFAutocuidados(pre),
    },
  };
};

export const normalizarMIFAutocuidados = (pontuacao) => {
    /**
     * Normaliza MIF – Autocuidados (0–42) para escala 0–10
     *
     * @param {number} pontuacao - Pontuação bruta do subitem Autocuidados da MIF
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(pontuacao);

    // Normalização linear: (escoreBruto / 42) * 10
    let escorePadronizado =
        Math.round(((escoreBruto / 42) * 10) * 100) / 100;

    // Garante que fique entre 0 e 10
    escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

    return {
        escore_bruto: escoreBruto,
        unidade: 'pontos',
        escore_padronizado: escorePadronizado,
        nome: 'MIF - Autocuidados',
        descricao: 'Avalia a capacidade para realizar atividades de autocuidado',
        interpretacao: 'Maior pontuação = maior independência em autocuidados',
        faixa_referencia: 'Máximo: 42 pontos (independência total)',
        referencia:
            'Granger, C. V., Hamilton, B. B., & Sherwin, F. S. (1986). Guide for the use of the uniform data set for medical rehabilitation. Buffalo, NY: Uniform Data System for Medical Rehabilitation.',
        categoria: 'MIF<br>Autocuidados'
    };
};

export const coletarMIFAutocuidados = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Começa, Fim
    const ids = [728, 733];

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
            "Atenção: Apenas uma sessão encontrada para MIF - Autocuidados. É necessário pelo menos duas para pré e pós."
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

export const processarMIFControleEsfincteres = (respostas) => {
  const [pos, pre] = coletarMIFControleEsfincteres(respostas);

  if (pos == null || pre == null) return null;

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarMIFControleEsfincteres(pos),
      pre: normalizarMIFControleEsfincteres(pre),
    },
  };
};

export const normalizarMIFControleEsfincteres = (pontuacao) => {
  const escoreBruto = Number(pontuacao);

  let escorePadronizado =
    Math.round(((escoreBruto / 14) * 10) * 100) / 100;

  escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

  return {
    escore_bruto: escoreBruto,
    unidade: 'pontos',
    escore_padronizado: escorePadronizado,
    nome: 'MIF - Controle de Esfíncteres',
    descricao: 'Avalia o controle vesical e intestinal',
    interpretacao: 'Maior pontuação = melhor controle esfincteriano',
    faixa_referencia: 'Máximo: 14 pontos (controle total)',
    referencia:
      'Granger, C. V., Hamilton, B. B., & Sherwin, F. S. (1986). Guide for the use of the uniform data set for medical rehabilitation.',
    categoria: 'MIF<br>Esfíncteres',
  };
};

export const coletarMIFControleEsfincteres = (dfForm) => {
  const uniqueSessions = [
    ...new Set(dfForm.map(item => item.sessao_resposta_id))
  ];

  let count = 0;
  const ids = [734, 735];
  const pre = [];
  const pos = [];

  const sortedSessions = uniqueSessions.sort((a, b) => b - a);

  for (const session of sortedSessions) {
    if (count >= 2) break;

    const dfSession = dfForm
      .filter(item => item.sessao_resposta_id === session)
      .sort((a, b) => a.pergunta_id - b.pergunta_id);

    const questoes = dfSession.filter(
      item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
    );

    for (const item of questoes) {
      const num = String(item.valor_resposta[0]).trim();
      count === 0 ? pos.push(Number(num)) : pre.push(Number(num));
    }

    count++;
  }

  if (!pre.length || !pos.length) {
    console.warn(
      'Atenção: Apenas uma sessão encontrada para MIF - Controle de Esfíncteres.'
    );
    if(pre.length === 0){
      return ["", pos.reduce((acc, v) => acc + v, 0)]
    }
    if(pos.length === 0){
      return [pre.reduce((acc, v) => acc + v, 0), ""]
    }
  }

  return [
    pos.reduce((a, v) => a + v, 0),
    pre.reduce((a, v) => a + v, 0),
  ];
};

export const processarMIFComunicacao = (respostas) => {
  const [pos, pre] = coletarMIFComunicacao(respostas);

  if (pos == null || pre == null) return null;

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarMIFComunicacao(pos),
      pre: normalizarMIFComunicacao(pre),
    },
  };
};

export const normalizarMIFComunicacao = (pontuacao) => {
  const escoreBruto = Number(pontuacao);

  let escorePadronizado =
    Math.round(((escoreBruto / 14) * 10) * 100) / 100;

  escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

  return {
    escore_bruto: escoreBruto,
    unidade: 'pontos',
    escore_padronizado: escorePadronizado,
    nome: 'MIF - Comunicação',
    descricao: 'Avalia habilidades de compreensão e expressão comunicativa',
    interpretacao: 'Maior pontuação = melhor capacidade comunicativa',
    faixa_referencia: 'Máximo: 14 pontos (comunicação eficaz)',
    referencia:
      'Granger, C. V., Hamilton, B. B., & Sherwin, F. S. (1986). Guide for the use of the uniform data set for medical rehabilitation.',
    categoria: 'MIF<br>Comunicação',
  };
};

export const coletarMIFComunicacao = (dfForm) => {
  const uniqueSessions = [
    ...new Set(dfForm.map(item => item.sessao_resposta_id))
  ];

  let count = 0;
  const ids = [736, 737];
  const pre = [];
  const pos = [];

  const sortedSessions = uniqueSessions.sort((a, b) => b - a);

  for (const session of sortedSessions) {
    if (count >= 2) break;

    const dfSession = dfForm
      .filter(item => item.sessao_resposta_id === session)
      .sort((a, b) => a.pergunta_id - b.pergunta_id);

    const questoes = dfSession.filter(
      item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
    );

    for (const item of questoes) {
      const num = String(item.valor_resposta[0]).trim();
      count === 0 ? pos.push(Number(num)) : pre.push(Number(num));
    }

    count++;
  }

  if (!pre.length || !pos.length) {
    console.warn(
      'Atenção: Apenas uma sessão encontrada para MIF - Comunicação.'
    );
    if(pre.length === 0){
      return ["", pos.reduce((acc, v) => acc + v, 0)]
    }
    if(pos.length === 0){
      return [pre.reduce((acc, v) => acc + v, 0), ""]
    }
  }

  return [
    pos.reduce((a, v) => a + v, 0),
    pre.reduce((a, v) => a + v, 0),
  ];
};

export const processarMIFMobilidade = (respostas) => {
  const [pos, pre] = coletarMIFMobilidade(respostas);

  if (pos == null || pre == null) return null;

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarMIFMobilidade(pos),
      pre: normalizarMIFMobilidade(pre),
    },
  };
};

export const normalizarMIFMobilidade = (pontuacao) => {
  const escoreBruto = Number(pontuacao);

  let escorePadronizado =
    Math.round(((escoreBruto / 35) * 10) * 100) / 100;

  escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

  return {
    escore_bruto: escoreBruto,
    unidade: 'pontos',
    escore_padronizado: escorePadronizado,
    nome: 'MIF - Mobilidade/Locomoção',
    descricao: 'Avalia a capacidade de mobilidade e locomoção',
    interpretacao: 'Maior pontuação = melhor mobilidade funcional',
    faixa_referencia: 'Máximo: 35 pontos (mobilidade independente)',
    referencia:
      'Granger, C. V., Hamilton, B. B., & Sherwin, F. S. (1986). Guide for the use of the uniform data set for medical rehabilitation.',
    categoria: 'MIF<br>Mobilidade',
  };
};

export const coletarMIFMobilidade = (dfForm) => {
  const uniqueSessions = [
    ...new Set(dfForm.map(item => item.sessao_resposta_id))
  ];

  let count = 0;
  const ids = [723, 727];
  const pre = [];
  const pos = [];

  const sortedSessions = uniqueSessions.sort((a, b) => b - a);

  for (const session of sortedSessions) {
    if (count >= 2) break;

    const dfSession = dfForm
      .filter(item => item.sessao_resposta_id === session)
      .sort((a, b) => a.pergunta_id - b.pergunta_id);

    const questoes = dfSession.filter(
      item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
    );

    for (const item of questoes) {
      const num = String(item.valor_resposta[0]).trim();
      count === 0 ? pos.push(Number(num)) : pre.push(Number(num));
    }

    count++;
  }

  if (!pre.length || !pos.length) {
    console.warn(
      'Atenção: Apenas uma sessão encontrada para MIF - Mobilidade.'
    );
    if(pre.length === 0){
      return [pos.reduce((acc, v) => acc + v, 0), ""]
    }
    if(pos.length === 0){
      return ["", pre.reduce((acc, v) => acc + v, 0)]
    }
  }

  return [
    pos.reduce((a, v) => a + v, 0),
    pre.reduce((a, v) => a + v, 0),
  ];
};

export const processarMIFConhecimentoSocial = (respostas) => {
  const [pos, pre] = coletarMIFConhecimentoSocial(respostas);

  if (pos == null || pre == null) return null;

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarMIFConhecimentoSocial(pos),
      pre: normalizarMIFConhecimentoSocial(pre),
    },
  };
};

export const normalizarMIFConhecimentoSocial = (pontuacao) => {
  const escoreBruto = Number(pontuacao);

  let escorePadronizado =
    Math.round(((escoreBruto / 21) * 10) * 100) / 100;

  escorePadronizado = Math.max(0, Math.min(escorePadronizado, 10));

  return {
    escore_bruto: escoreBruto,
    unidade: 'pontos',
    escore_padronizado: escorePadronizado,
    nome: 'MIF - Conhecimento Social',
    descricao: 'Avalia habilidades cognitivas e interação social',
    interpretacao: 'Maior pontuação = melhor funcionamento social',
    faixa_referencia: 'Máximo: 21 pontos (funcionamento social adequado)',
    referencia:
      'Granger, C. V., Hamilton, B. B., & Sherwin, F. S. (1986). Guide for the use of the uniform data set for medical rehabilitation.',
    categoria: 'MIF<br>Social',
  };
};

export const coletarMIFConhecimentoSocial = (dfForm) => {
  const uniqueSessions = [
    ...new Set(dfForm.map(item => item.sessao_resposta_id))
  ];

  let count = 0;
  const ids = [738, 740];
  const pre = [];
  const pos = [];

  const sortedSessions = uniqueSessions.sort((a, b) => b - a);

  for (const session of sortedSessions) {
    if (count >= 2) break;

    const dfSession = dfForm
      .filter(item => item.sessao_resposta_id === session)
      .sort((a, b) => a.pergunta_id - b.pergunta_id);

    const questoes = dfSession.filter(
      item => item.pergunta_id >= ids[0] && item.pergunta_id <= ids[1]
    );

    for (const item of questoes) {
      const num = String(item.valor_resposta[0]).trim();
      count === 0 ? pos.push(Number(num)) : pre.push(Number(num));
    }

    count++;
  }

  if (!pre.length || !pos.length) {
    console.warn(
      'Atenção: Apenas uma sessão encontrada para MIF - Conhecimento Social.'
    );
    if(pre.length === 0){
      return ["", pos.reduce((acc, v) => acc + v, 0)]
    }
    if(pos.length === 0){
      return [pre.reduce((acc, v) => acc + v, 0), ""]
    }
  }

  return [
    pos.reduce((a, v) => a + v, 0),
    pre.reduce((a, v) => a + v, 0),
  ];
};
