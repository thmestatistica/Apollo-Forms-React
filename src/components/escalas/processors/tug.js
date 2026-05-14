export const processarTUG = (respostas, interpretacao) => {
  const [pos, pre] = coletarTUG(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarTUG(pos, interpretacao),
      pre: normalizarTUG(pre, interpretacao),
    },
  };
};

export const normalizarTUG = (menorTempo, interpretacao) => {
  const tempo = Number(menorTempo);

  let escorePadronizado = null;

  if (!Array.isArray(interpretacao) || interpretacao.length === 0) {
    if (tempo <= 14) {
      escorePadronizado = 10;
    } else if (tempo >= 20) {
      escorePadronizado = 0;
    } else {
      escorePadronizado =
        Math.round((((20 - tempo) / 6) * 10) * 100) / 100;
    }
  } else {
    for (const regra of interpretacao) {
      const valor = Number(String(regra.valor).replaceAll(",", "."));
      const nota = Number(regra.nota);

      switch (regra.operador) {
        case '<=':
          if (tempo <= valor) {
            escorePadronizado = nota;
            break;
          }
          else continue;

        case '>=':
          if (tempo >= valor) {
            escorePadronizado = nota;
            break;
          }
          else continue;

        case '<':
          if (tempo < valor) {
            escorePadronizado = nota;
            break;
          }
          else continue;

        case '>':
          if (tempo > valor) {
            escorePadronizado = nota;
            break;
          }
          else continue;

        case '=':
          if (tempo == valor) {
            escorePadronizado = nota;
            break;
          }
          else continue;
        default:
          escorePadronizado =
            Math.round((((20 - tempo) / 6) * 10) * 100) / 100;
      }

      if (escorePadronizado !== null) break;
    }

    if (escorePadronizado == null) {
      escorePadronizado =
        Math.round((((20 - tempo) / 6) * 10) * 100) / 100;
    }

  }

  return {
    escore_bruto: tempo,
    unidade: 's',
    escore_padronizado: escorePadronizado,
    nome: 'Teste de Levantar e Andar (TUG)',
    descricao: 'Mede o tempo para levantar de uma cadeira, andar 3 metros e retornar',
    interpretacao: 'Menor tempo = melhor mobilidade e menor risco de quedas',
    faixa_referencia: 'Ideal: <14 segundos | >20s = risco aumentado',
    referencia:
      'Podsiadlo, D., & Richardson, S. (1991). The timed "Up & Go".',
    categoria: 'TUG<br>Tempo',
  };
};

export const coletarTUG = (dfForm) => {
  const uniqueSessions = [
    ...new Set(dfForm.map(item => item.sessao_resposta_id))
  ];

  let count = 0;
  const id = 5;

  const pre = [];
  const pos = [];

  const sortedSessions = uniqueSessions.sort((a, b) => b - a);

  for (const session of sortedSessions) {
    if (count >= 2) break;

    const tempos = dfForm
      .filter(
        item =>
          item.sessao_resposta_id === session &&
          item.pergunta_id === id
      )
      .map(item => Number(item.valor_resposta))
      .filter(v => !isNaN(v));

    if (!tempos.length) continue;

    const melhorTempo = Math.min(...tempos);

    if (count === 0) pos.push(melhorTempo);
    else pre.push(melhorTempo);

    count++;
  }

  if (!pre.length || !pos.length) {
    console.warn(
      'Atenção: Apenas uma sessão encontrada para TUG.'
    );
    if (pre.length === 0) {
      return ["", pos.reduce((acc, v) => acc + v, 0)]
    }
    if (pos.length === 0) {
      return [pre.reduce((acc, v) => acc + v, 0), ""]
    }
  }

  return [pos[0], pre[0]];
};

