import axiosInstanceForms from "./axiosInstanceForms";
import axiosInstance from "../axiosInstance"
/**
 * Busca as perguntas de um formulário por ID.
 * Endpoint esperado: GET /forms/:id/questions
 * Retorna um array de perguntas no formato do backend.
 */
export const carregar_perguntas_form = async (formId) => {
  if (!formId) return [];
  try {
    const { data } = await axiosInstanceForms.get(`/forms/${formId}/questions`);
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.questions)) return data.questions;
    return [];
  } catch (err) {
    console.error("Erro ao carregar perguntas do formulário:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return [];
  }
};

/**
 * Envia respostas do formulário para a API de Forms.
 * Endpoint: POST /forms/:id/answers
 * payload: { paciente_id, profissional_id, disponibilizado_id?, respostas }
 */
export const enviar_respostas_form = async (formId, payload) => {
  try {
    const { data } = await axiosInstanceForms.post(`/forms/${formId}/answers`, payload);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao enviar respostas do formulário:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};

/**
 * Busca metadados do formulário (inclui nome/título) por ID.
 * Endpoint esperado: GET /forms/:id
 */
export const carregar_info_form = async (formId) => {
  if (!formId) return null;
  try {
    const { data } = await axiosInstanceForms.get(`/forms/${formId}`);
    return data ?? null;
  } catch (err) {
    console.error("Erro ao carregar informações do formulário:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return null;
  }
};

/**
 * Mapeia a pergunta do backend para o schema de campo usado no front (CampoDinamico).
 */
export const mapPerguntaParaCampo = (p) => {
  // Normaliza opções, aceitando strings, números ou objetos vindos do backend
  const opcoes = Array.isArray(p?.opcoes_resposta)
    ? p.opcoes_resposta.map((opt) => {
        if (opt && typeof opt === "object") {
          const valor = opt.valor ?? opt.value ?? opt.id ?? String(opt);
          const label = opt.label ?? opt.nome ?? String(valor);
          return { valor, label };
        }
        return { valor: opt, label: String(opt) };
      })
    : [];

  const required = p?.obrigatoria === true;

  return {
    id: p?.pergunta_id ?? p?.id ?? `${p?.chave_pergunta ?? "pergunta"}`,
    nome: p?.chave_pergunta ?? `pergunta_${p?.pergunta_id ?? ""}`,
    label: p?.texto_pergunta ?? "Pergunta",
    tipo_resposta_esperada: p?.tipo_resposta_esperada ?? "TEXTO_LIVRE",
    opcoes,
    meta_dados: {
      ...(p?.metadados_pergunta ?? {}),
      required,
    },
  };
};

/**
 * Monta o objeto de formulário completo a partir da lista de perguntas da API.
 */
export const montarFormularioGenerico = (formId, perguntas, meta = {}) => {
  const ordenadas = [...(perguntas || [])].sort((a, b) => {
    const oa = a?.ordem_pergunta ?? 0;
    const ob = b?.ordem_pergunta ?? 0;
    return oa - ob;
  });

  const campos = ordenadas.map(mapPerguntaParaCampo);
  // Tenta obter um título amigável a partir de meta ou heurísticas
  const tituloInferido =
    meta?.titulo ??
    // Possíveis locais onde o backend pode mandar o nome do formulário
    perguntas?.[0]?.formulario?.nome ??
    perguntas?.[0]?.formulario?.nomeEscala ??
    perguntas?.[0]?.formulario_nome ??
    perguntas?.[0]?.metadados_pergunta?.formulario_nome ??
    `Formulário ${formId}`;

  return {
    id: Number(formId),
    titulo: tituloInferido,
    campos,
  };
};

/**
 * Lista todos os formulários disponíveis.
 */
export const listar_formularios =async () => {
  try {
    const { data } = await axiosInstanceForms.get(`/forms/all`);

    if (Array.isArray(data)) return data;

    return [];
  } catch (err) {
    console.error("Erro ao listar formulários:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return [];
  }
}

/**
 * Lista todas as escalas (associações) no Journey API.
 */
export const listar_escalas = async () => {
  try {
    const { data } = await axiosInstance.get('/escalas');
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.escalas)) return data.escalas;
    return [];
  } catch (err) {
    console.error("Erro ao listar escalas:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return [];
  }
}

/**
 * Cria ou atualiza associação de escala no Journey API.
 * Se escalaId for informado, tenta PUT /escalas/:id, senão POST /escalas.
 */
export const salvar_associacao_escala = async (payload, escalaId) => {
  try {
    if (escalaId) {
      const { data } = await axiosInstance.put(`/escalas/${escalaId}`, payload);
      return { ok: true, data };
    }
    const { data } = await axiosInstance.post('/escalas', payload);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao salvar associação:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
}

/**
 * Atualiza metadados do formulário por ID.
 * Tenta PUT /forms/:id e faz fallback para PATCH.
 * Remove `pagina_streamlit` do payload para evitar sobrescrita acidental.
 */
export const atualizar_info_form = async (formId, payload = {}) => {
  if (!formId) return { ok: false, error: new Error("formId inválido") };
  const body = { ...payload };
  delete body.pagina_streamlit;
  try {
    const { data } = await axiosInstanceForms.put(`/forms/${formId}`, body);
    return { ok: true, data };
  } catch (err1) {
    try {
      const { data } = await axiosInstanceForms.patch(`/forms/${formId}`, body);
      return { ok: true, data };
    } catch (err2) {
      console.error("Erro ao atualizar informações do formulário:", {
        message: err2?.message,
        status: err2?.response?.status,
        data: err2?.response?.data,
        firstError: err1?.response?.data,
      });
      return { ok: false, error: err2 };
    }
  }
}

/**
 * Atualiza ou cria perguntas de um formulário (upsert em lote).
 * Tenta `PUT /forms/:id/questions` com um array de perguntas.
 * Caso o backend não suporte, faz fallback para `POST /forms/:id/questions/bulk` ou `POST /forms/:id/questions`.
 * Cada pergunta deve conter ao menos: { texto_pergunta, tipo_resposta_esperada, ordem_pergunta }
 * Para perguntas de seleção, enviar `opcoes_resposta` como array de { valor, label }.
 */
export const upsert_perguntas_form = async (formId, perguntas = []) => {
  if (!formId) return { ok: false, error: new Error("formId inválido") };
  const payload = Array.isArray(perguntas) ? perguntas : [];

  // Sanitiza: remove chaves internas e normaliza options
  const normalize = (p, idx) => {
    const tipo = p?.tipo_resposta_esperada ?? "TEXTO_LIVRE";
    const opcoes = Array.isArray(p?.opcoes_resposta)
      ? p.opcoes_resposta
          .filter((o) => o != null)
          .map((o) => {
            if (typeof o === "object") {
              const valor = o?.valor ?? o?.value ?? o?.id ?? String(o?.label ?? "opcao");
              const label = o?.label ?? o?.nome ?? String(valor);
              return { valor, label };
            }
            return { valor: o, label: String(o) };
          })
      : [];

    return {
      pergunta_id: p?.pergunta_id ?? p?.id ?? undefined,
      texto_pergunta: p?.texto_pergunta ?? p?.label ?? "Pergunta",
      tipo_resposta_esperada: tipo,
      ordem_pergunta: p?.ordem_pergunta ?? idx + 1,
      chave_pergunta: p?.chave_pergunta ?? undefined,
      metadados_pergunta: p?.metadados_pergunta ?? p?.meta_dados ?? undefined,
      opcoes_resposta: opcoes,
      inativa: p?.inativa === true,
      obrigatoria: p?.obrigatoria === true,
    };
  };

  const bodyArray = payload.map(normalize);
  // Constrói o payload no formato esperado pelo backend
  const updates = [];
  const new_questions = [];
  const toSlug = (txt, idx) => {
    const base = String(txt || "pergunta").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return base ? `${base}_${idx + 1}` : `pergunta_${idx + 1}`;
  };
  bodyArray.forEach((p, idx) => {
    const opcoes = Array.isArray(p?.opcoes_resposta) ? p.opcoes_resposta : [];
    if (p?.pergunta_id) {
      updates.push({
        pergunta_id: p.pergunta_id,
        chave_pergunta: p?.chave_pergunta,
        texto_pergunta: p?.texto_pergunta,
        tipo_resposta_esperada: p?.tipo_resposta_esperada,
        ordem_pergunta: p?.ordem_pergunta ?? idx + 1,
        opcoes_resposta: opcoes,
        metadados_pergunta: p?.metadados_pergunta,
        inativa: p?.inativa === true,
        obrigatoria: p?.obrigatoria === true,
      });
    } else {
      new_questions.push({
        formulario_id: Number(formId),
        chave_pergunta: p?.chave_pergunta ?? toSlug(p?.texto_pergunta, idx),
        texto_pergunta: p?.texto_pergunta,
        tipo_resposta_esperada: p?.tipo_resposta_esperada,
        ordem_pergunta: p?.ordem_pergunta ?? idx + 1,
        opcoes_resposta: opcoes,
        metadados_pergunta: p?.metadados_pergunta,
        inativa: p?.inativa === true,
        obrigatoria: p?.obrigatoria === true,
      });
    }
  });

  const requestBody = { updates, new_questions };
  try {
    const { data } = await axiosInstanceForms.put(`/forms/${formId}/questions`, requestBody);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao upsert perguntas do formulário (schema esperado updates/new_questions):", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
      requestBody,
    });
    return { ok: false, error: err };
  }
}

export const criar_formulario_completo = async (payload) => {
  let idCriadoParaRollback = null;

  try {
    // ---------------------------------------------------------
    // 1. PYTHON: Criar a "Casca" do Formulário
    // ---------------------------------------------------------
    const formPayload = {
        nome_formulario: payload.nome_formulario,
        descricao_formulario: payload.descricao_formulario,
        tipo_formulario: payload.tipo_formulario
    };
    
    // POST /forms/ (FastAPI)
    const { data: formCriado } = await axiosInstanceForms.post('/forms/', formPayload);
    
    // Garante que pegamos o ID corretamente (alguns backends retornam _id, id ou formulario_id)
    const novoId = formCriado.formulario_id || formCriado.id;
    
    if (!novoId) throw new Error("ID do formulário não retornado pelo Python.");
    
    // Salva o ID para caso precisemos desfazer tudo no catch
    idCriadoParaRollback = novoId;

    // ---------------------------------------------------------
    // 2. PYTHON: Salvar as Perguntas (Vinculadas ao ID)
    // ---------------------------------------------------------
    if (payload.perguntas && payload.perguntas.length > 0) {
        const perguntasPayload = {
            updates: [],
            new_questions: payload.perguntas.map((p, index) => ({
                formulario_id: novoId,
                chave_pergunta: `p_${novoId}_${index + 1}`, // Chave única
                texto_pergunta: p.texto_pergunta,
                tipo_resposta_esperada: p.tipo_resposta_esperada,
                opcoes_resposta: p.opcoes_resposta, // Array JSON
                obrigatoria: p.obrigatoria,
                ordem_pergunta: index + 1,
                inativa: false
            }))
        };
        // PUT /forms/{id}/questions (FastAPI - Upsert)
        await axiosInstanceForms.put(`/forms/${novoId}/questions`, perguntasPayload);
    }

    // ---------------------------------------------------------
    // 3. NODE: Salvar Metadados da Escala (Classificação)
    // ---------------------------------------------------------
    const escalaPayload = {
        formularioId: Number(novoId), // Vincula ao pai criado no Python
        nomeEscala: payload.nome_formulario,
        tipoFormulario: payload.tipo_formulario,
        especialidade: payload.especialidades, // Array
        listaDiagnosticos: payload.diagnosticos, // Array
        significado: payload.descricao_formulario
    };

    // POST /escalas (Express/Node)
    // ATENÇÃO: Aqui usamos a instância do Node, pois 'axiosInstanceForms' aponta para o Python
    await axiosInstance.post('/escalas', escalaPayload);

    return { id: novoId };

  } catch (error) {
    console.error("Erro na criação do formulário completo:", error);

    // --- ROLLBACK (LIMPEZA DE SEGURANÇA) ---
    // Se criou o ID no Python mas falhou depois (ex: erro no Node), apaga o form do Python.
    if (idCriadoParaRollback) {
        try {
            console.warn(`Rollback: Apagando formulário órfão ID ${idCriadoParaRollback}...`);
            await axiosInstance.delete(`/forms/${idCriadoParaRollback}`);
        } catch (deleteError) {
            console.error("Falha crítica no rollback:", deleteError);
        }
    }
    
    throw error; // Joga o erro para a tela (Swal)
  }
};

// 3. DELETAR (ORQUESTRADO: Tenta apagar nos dois sistemas)
export const deletar_formulario = async (id) => {
  try {
    // --- PASSO 1: Tentar apagar a Escala no Node (Metadados) ---
    // Fazemos isso primeiro como "best effort". Se falhar (ex: ID diferente ou não existe),
    // apenas logamos o aviso e continuamos para apagar o principal.
    try {
        await axiosInstance.delete(`/escalas/${id}`);
    } catch (nodeError) {
        // Ignora erro 404 (já não existe) ou outros erros para não impedir a deleção do form principal
        console.warn(`Aviso: Falha ao deletar escala no Node (ID: ${id}). Pode não existir ou ID diferente.`, nodeError.message);
    }

    // --- PASSO 2: Apagar o Formulário no Python (Principal) ---
    // Essa é a parte crítica. Se der erro aqui, lançamos o erro para o usuário saber.
    await axiosInstanceForms.delete(`/forms/${id}`);
    
    return true;

  } catch (error) {
    console.error("Erro fatal ao deletar formulário:", error);
    throw error;
  }
};