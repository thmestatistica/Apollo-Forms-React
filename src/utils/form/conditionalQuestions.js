/**
 * Engine de perguntas condicionais.
 *
 * Este arquivo concentra TODA a regra de:
 * 1) identificar perguntas condicionais e condicionadas
 * 2) normalizar metadados para evitar formatos inválidos
 * 3) resolver "tipo efetivo" de perguntas condicionadas (tipo_real)
 * 4) sincronizar automaticamente o status CONDICIONADA
 * 5) validar autorreferência e loops (grafo de dependências)
 *
 * Observação importante:
 * O sistema evita alterar estrutura de banco e usa somente metadados.
 */
const CONDITIONAL_TYPE = "CONDICIONAL";
const CONDITIONED_TYPE = "CONDICIONADA";
const CONDITIONAL_META_KEY = "condicoes";
const REAL_TYPE_META_KEY = "tipo_real";

/**
 * Converte qualquer valor para string com fallback seguro.
 *
 * "Estranho" mas intencional:
 * - IDs podem vir como número, string, null, undefined, etc.
 * - padronizar tudo como string simplifica comparação e mapeamentos
 *   (Map/Set/chaves de objeto) entre telas e payloads.
 */
const toStringSafe = (value, fallback = "") => String(value ?? fallback);

/**
 * Extrai o label de uma opção em formatos heterogêneos.
 *
 * A API e a UI podem fornecer opção como:
 * - objeto { label, nome, valor, value }
 * - string simples
 *
 * Se nada existir, gera "Opção N" para manter consistência.
 */
const normalizeOptionLabel = (option, index) => {
  if (typeof option === "object" && option !== null) {
    return toStringSafe(option.label ?? option.nome ?? option.valor ?? option.value, `Opção ${index + 1}`);
  }
  return toStringSafe(option, `Opção ${index + 1}`);
};

/**
 * Retorna uma referência estável para uma pergunta.
 *
 * Prioridade de identificação:
 * 1) id/pergunta_id (persistido)
 * 2) chave_pergunta (temporária/local)
 * 3) nome (fallback legacy)
 * 4) fallback recebido
 *
 * "Estranho" mas necessário:
 * - durante criação, muitas perguntas ainda não têm ID do banco,
 *   então chave_pergunta temporária precisa funcionar como "ID lógico".
 */
export const getQuestionReference = (question, fallback = "") => {
  if (question == null || typeof question !== "object") return toStringSafe(fallback);

  const rawId = question.id ?? question.pergunta_id;
  if (rawId !== undefined && rawId !== null && rawId !== "") {
    return toStringSafe(rawId);
  }

  if (question.chave_pergunta) return toStringSafe(question.chave_pergunta);
  if (question.nome) return toStringSafe(question.nome);

  return toStringSafe(fallback);
};

/**
 * Resolve o tipo efetivo da pergunta para renderização/validação.
 *
 * Regra:
 * - se tipo for CONDICIONADA, usa metadados.tipo_real
 * - caso contrário, usa o próprio tipo
 *
 * "Estranho" mas esperado:
 * - pergunta CONDICIONADA não representa um tipo de resposta final,
 *   e sim um estado de controle; o tipo de fato fica em tipo_real.
 */
export const getEffectiveQuestionType = (question) => {
  if (!question) return "TEXTO_LIVRE";

  const tipo = question.tipo ?? question.tipo_resposta_esperada;
  if (tipo === CONDITIONED_TYPE) {
    const meta = question.metadados_pergunta ?? question.meta_dados ?? {};
    return toStringSafe(meta?.[REAL_TYPE_META_KEY], "TEXTO_LIVRE");
  }

  return toStringSafe(tipo, "TEXTO_LIVRE");
};

/**
 * Normaliza metadados de pergunta CONDICIONAL.
 *
 * Objetivos:
 * - garantir que exista estrutura condicoes
 * - manter somente chaves de opções atualmente válidas
 * - forçar targets a serem array de strings não vazias
 * - se opção foi removida/renomeada, a condição antiga some na normalização.
 *   Isso evita lixo de metadados e referências órfãs.
 */
export const normalizeConditionalMetadata = (meta = {}, options = []) => {
  const condicoesRaw = meta?.[CONDITIONAL_META_KEY] ?? {};
  const optionLabels = Array.isArray(options)  ? options.map((option, index) => normalizeOptionLabel(option, index)) : [];

  const condicoes = {};

  optionLabels.forEach((label) => {
    const targets = condicoesRaw?.[label];
    condicoes[label] = Array.isArray(targets)
      ? targets
          .filter((target) => target !== undefined && target !== null && String(target).trim() !== "")
          .map((target) => toStringSafe(target))
      : [];
  });

  return {
    ...meta,
    [CONDITIONAL_META_KEY]: condicoes,
  };
};

/**
 * Dada uma pergunta condicional e a opção selecionada,
 * retorna as referências das perguntas que devem ser ativadas.
 *
 * Importante:
 * - selectedValue é convertido para string para casar com as chaves
 *   normalizadas durante persistência/leitura.
 */
export const getConditionalTargetsForAnswer = (question, selectedValue) => {
  const meta = question?.metadados_pergunta ?? question?.meta_dados ?? {};
  const condicoes = meta?.[CONDITIONAL_META_KEY] ?? {};
  const key = toStringSafe(selectedValue);

  if (!Array.isArray(condicoes?.[key])) return [];
  return condicoes[key].map((target) => toStringSafe(target));
};

/**
 * Inverte o mapeamento condicional para uso visual (badges).
 *
 * Saída:
 * - Map<targetRef, string[]>
 * - cada target recebe lista de "origem -> opção"
 *
 * Exemplo:
 * - P1 opção "Sim" aponta para P3
 * - badge de P3 recebe "Pergunta 1 -> Sim"
 */
export const collectConditionalBadges = (questions = []) => {
  const badgesByTarget = new Map();

  questions.forEach((question) => {
    const sourceType = question?.tipo ?? question?.tipo_resposta_esperada;
    if (sourceType !== CONDITIONAL_TYPE) return;

    const meta = question?.metadados_pergunta ?? question?.meta_dados ?? {};
    const condicoes = meta?.[CONDITIONAL_META_KEY] ?? {};
    const sourceLabel = toStringSafe(question?.texto ?? question?.texto_pergunta, "Pergunta condicional");

    Object.entries(condicoes).forEach(([optionLabel, targets]) => {
      if (!Array.isArray(targets)) return;

      targets.forEach((target) => {
        const targetRef = toStringSafe(target);
        if (!targetRef) return;

        if (!badgesByTarget.has(targetRef)) badgesByTarget.set(targetRef, []);
        badgesByTarget.get(targetRef).push(`${sourceLabel} -> ${optionLabel}`);
      });
    });
  });

  return badgesByTarget;
};

/**
 * Sincroniza automaticamente perguntas CONDICIONADAS.
 *
 * Fase 1: descobre todas as perguntas controladas por alguma condicional.
 * Fase 2: percorre perguntas e:
 * - promove para CONDICIONADA quando passar a ser controlada
 * - remove estado CONDICIONADA quando deixar de ser controlada
 * - ao promover para CONDICIONADA, preserva o tipo anterior em tipo_real.
 * - ao despromover, restaura tipo_real no tipo principal e remove tipo_real.
 */
export const syncConditionedQuestions = (questions = []) => {
  const referencesControlled = new Set();

  questions.forEach((question) => {
    const sourceType = question?.tipo ?? question?.tipo_resposta_esperada;
    if (sourceType !== CONDITIONAL_TYPE) return;

    const meta = question?.metadados_pergunta ?? question?.meta_dados ?? {};
    const condicoes = meta?.[CONDITIONAL_META_KEY] ?? {};

    Object.values(condicoes).forEach((targets) => {
      if (!Array.isArray(targets)) return;
      targets.forEach((target) => {
        const ref = toStringSafe(target);
        if (ref) referencesControlled.add(ref);
      });
    });
  });

  return questions.map((question, index) => {
    const ref = getQuestionReference(question, `tmp_${index + 1}`);
    const isControlled = referencesControlled.has(ref);
    const tipoAtual = question?.tipo ?? question?.tipo_resposta_esperada;
    const metaAtual = { ...(question?.metadados_pergunta ?? question?.meta_dados ?? {}) };

    // Caso 1: pergunta passou a ser controlada por alguma condicional.
    if (isControlled && tipoAtual !== CONDITIONAL_TYPE) {
      const tipoRealAtual = tipoAtual === CONDITIONED_TYPE
        ? metaAtual?.[REAL_TYPE_META_KEY] ?? "TEXTO_LIVRE"
        : tipoAtual;

      return {
        ...question,
        tipo: CONDITIONED_TYPE,
        tipo_resposta_esperada: CONDITIONED_TYPE,
        metadados_pergunta: {
          ...metaAtual,
          [REAL_TYPE_META_KEY]: tipoRealAtual,
        },
      };
    }

    // Caso 2: pergunta deixou de ser controlada, volta ao tipo normal.
    if (!isControlled && tipoAtual === CONDITIONED_TYPE) {
      const tipoReal = metaAtual?.[REAL_TYPE_META_KEY] ?? "TEXTO_LIVRE";
      const nextMeta = { ...metaAtual };
      delete nextMeta[REAL_TYPE_META_KEY];

      return {
        ...question,
        tipo: tipoReal,
        tipo_resposta_esperada: tipoReal,
        metadados_pergunta: nextMeta,
      };
    }

    return question;
  });
};

/**
 * Valida regras estruturais de condicionais.
 *
 * Regras atuais:
 * 1) uma pergunta não pode apontar para ela mesma
 * 2) não pode existir ciclo (loop) no grafo de dependências
 *
 * Implementação:
 * - monta grafo de adjacência (source -> targets)
 * - executa DFS com marcação de estado:
 *   0 = não visitado, 1 = em processamento, 2 = finalizado
 * - aresta para nó em estado 1 indica ciclo
 */
export const validateConditionalRules = (questions = []) => {
  const errors = [];
  const adjacency = new Map();

  const getRef = (question, index) => getQuestionReference(question, `tmp_${index + 1}`);

  questions.forEach((question, index) => {
    const sourceType = question?.tipo ?? question?.tipo_resposta_esperada;
    const sourceRef = getRef(question, index);
    const meta = question?.metadados_pergunta ?? question?.meta_dados ?? {};

    if (!adjacency.has(sourceRef)) adjacency.set(sourceRef, new Set());

    if (sourceType !== CONDITIONAL_TYPE) return;

    const condicoes = meta?.[CONDITIONAL_META_KEY] ?? {};
    Object.entries(condicoes).forEach(([optionLabel, targets]) => {
      if (!Array.isArray(targets)) return;

      targets.forEach((target) => {
        const targetRef = toStringSafe(target);
        if (!targetRef) return;

        if (targetRef === sourceRef) {
          errors.push(`Pergunta ${index + 1}: a opção "${optionLabel}" não pode apontar para a própria pergunta.`);
        }

        adjacency.get(sourceRef).add(targetRef);
      });
    });
  });

  const state = new Map();
  const stack = [];

  const dfs = (node) => {
    state.set(node, 1);
    stack.push(node);

    const neighbours = adjacency.get(node) ?? new Set();
    for (const next of neighbours) {
      const nextState = state.get(next) ?? 0;
      if (nextState === 0) {
        if (dfs(next)) return true;
      } else if (nextState === 1) {
        // Encontrou ciclo: recorta do ponto em que o nó reaparece
        // para montar uma mensagem de diagnóstico legível.
        const cycleStart = stack.indexOf(next);
        const cyclePath = stack.slice(cycleStart).concat(next).join(" -> ");
        errors.push(`Loop condicional detectado: ${cyclePath}`);
        return true;
      }
    }

    stack.pop();
    state.set(node, 2);
    return false;
  };

  for (const node of adjacency.keys()) {
    if ((state.get(node) ?? 0) === 0) {
      dfs(node);
    }
  }

  return errors;
};

export const CONDITIONAL_CONSTANTS = {
  CONDITIONAL_TYPE,
  CONDITIONED_TYPE,
  CONDITIONAL_META_KEY,
  REAL_TYPE_META_KEY,
};
