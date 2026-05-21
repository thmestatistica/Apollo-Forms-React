export const processarBristol = (respostas) => {
  const [pos, pre] = coletarBristol(respostas);

  if (pos == null || pre == null) {
    return null;
  }

  return {
    valores: [pos, pre],
    normalizado: {
      pos: normalizarBristol(pos),
      pre: normalizarBristol(pre),
    },
  };
};

export const normalizarBristol = (tipoFezes) => {
    /**
     * Normaliza a Escala de Bristol (1–7) para escala 0–10.
     * Tipos 3 e 4 = ideal (10 pontos)
     * Tipos 1 e 7 = pior (0 pontos)
     *
     * @param {number} tipoFezes - Tipo de fezes na Escala de Bristol (1 a 7)
     * @returns {Object} Objeto com escore bruto, padronizado e metadados
     */

    const escoreBruto = Number(tipoFezes);
    let escorePadronizado;

    // Regras de normalização
    if (escoreBruto === 3 || escoreBruto === 4) {
        escorePadronizado = 10.0;
    } else if (escoreBruto === 1 || escoreBruto === 7) {
        escorePadronizado = 0.0;
    } else {
        if (escoreBruto === 2) {
            escorePadronizado = Math.round((10 - (1 / 2 * 10)) * 100) / 100;
        } else if (escoreBruto === 5) {
            escorePadronizado = Math.round((10 - (1 / 3 * 10)) * 100) / 100;
        } else { // tipo 6
            escorePadronizado = Math.round((10 - (2 / 3 * 10)) * 100) / 100;
        }
    }

    // Mapeamento de descrições
    const descricoes = {
        1: "Grumos duros separados (como nozes)",
        2: "Em forma de salsicha, mas grumosa",
        3: "Como uma salsicha, mas com fissuras na superfície",
        4: "Como uma salsicha ou serpente, lisa e macia",
        5: "Massas moles com bordas bem definidas",
        6: "Pedaços fofos com bordas irregulares",
        7: "Aquosa, sem pedaços sólidos"
    };

    const interpretacoes = {
        1: "Constipação severa",
        2: "Constipação leve",
        3: "Normal (ideal)",
        4: "Normal (ideal)",
        5: "Falta de fibras",
        6: "Inflamação leve",
        7: "Diarréia severa"
    };

    return {
        escore_bruto: escoreBruto,
        unidade: 'tipo',
        escore_padronizado: escorePadronizado,
        nome: 'Escala de Bristol - Forma das Fezes',
        descricao: 'Classifica a forma das fezes para avaliação do trânsito intestinal',
        interpretacao: interpretacoes[escoreBruto] ?? "Tipo não classificado",
        faixa_referencia: 'Ideal: tipos 3 e 4 | Problemático: tipos 1, 2, 5, 6, 7',
        referencia:
            'Lewis, S. J., & Heaton, K. W. (1997). Stool form scale as a useful guide to intestinal transit time. Scandinavian Journal of Gastroenterology, 32(9), 920-924.',
        categoria: 'Bristol<br>Fezes',
        descricao_detalhada: descricoes[escoreBruto] ?? "Tipo não especificado"
    };
};


export const coletarBristol = (dfForm) => {
    // Sessões únicas
    const uniqueSessions = [
        ...new Set(dfForm.map(item => item.sessao_resposta_id))
    ];

    let count = 0;

    // Pergunta única
    const id = 649;

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
            const num = String(valor[5]).trim();

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
            "Atenção: Apenas uma sessão encontrada para a Escala Bristol. É necessário pelo menos duas para pré e pós."
        );
        if(pre.length === 0){
          return ["", pos.reduce((acc, v) => acc + v, 0)]
        }
        if(pos.length === 0){
          return [pre.reduce((acc, v) => acc + v, 0), ""]
        }
    }

    // Retorna valor único (não soma)
    return [pos[0], pre[0]];
};
