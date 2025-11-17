import axiosInstanceForms from "./axiosInstanceForms";

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
