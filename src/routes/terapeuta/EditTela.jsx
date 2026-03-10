/**
 * EditTela
 * ------------------------
 * Tela de edição de formulários do terapeuta.
 * Permite:
 * - Carregar e editar perguntas (ordem, texto, tipo, opções, inativação, matriz)
 * - Atualizar metadados do formulário (campos primitivos permitidos)
 * - Reordenar perguntas via Drag & Drop com pré-visualização e auto-scroll
 * - Validar perguntas antes de salvar
 * - Salvar detalhes do formulário e perguntas (upsert)
 */
// Componentes e hooks
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SingleSelect from "../../components/input/SingleSelect.jsx";
import MultiSelect from "../../components/input/MultiSelect.jsx";
import AdaptiveInput from "../../components/input/AdaptiveInput.jsx";
import { carregar_info_form, carregar_perguntas_form, upsert_perguntas_form, atualizar_info_form } from "../../api/forms/forms_utils";
import ErroGen from "../../components/info/ErroGen.jsx";
import SucessGen from "../../components/info/SucessGen.jsx";
import Swal from "sweetalert2";

// Tipos permitidos em células da Matriz
const MATRIZ_CELL_TYPES = [
  { id: "texto", label: "Texto" },
  { id: "numero", label: "Número" },
  { id: "selecao_unica", label: "Seleção Única" },
  { id: "selecao_multipla", label: "Seleção Múltipla" },
];

const createDefaultMatrizRowConfig = () => ({ tipo: "texto", opcoes: [] });

const normalizeMatrizOptions = (options = []) => {
  if (!Array.isArray(options)) return [];

  return options.map((option, index) => {
    if (typeof option === "object" && option !== null) {
      const label = String(option.label ?? option.nome ?? option.valor ?? option.value ?? `Opção ${index + 1}`);
      return {
        valor: String(option.valor ?? option.value ?? `opcao_${index + 1}`),
        label,
      };
    }

    return {
      valor: `opcao_${index + 1}`,
      label: String(option),
    };
  });
};

const normalizeMatrizConfigLinhas = (config, linhas) => {
  const source = Array.isArray(config)
    ? config
    : config && typeof config === "object"
      ? Object.keys(config)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => config[key])
      : [];

  return Array.from({ length: linhas }, (_, index) => {
    const current = source[index] ?? createDefaultMatrizRowConfig();
    const tipo = typeof current?.tipo === "string" ? current.tipo : "texto";
    const needsOptions = tipo === "selecao_unica" || tipo === "selecao_multipla";

    return {
      tipo,
      opcoes: needsOptions ? normalizeMatrizOptions(current?.opcoes) : [],
    };
  });
};

const normalizeMatrizMetadata = (meta = {}) => {
  const linhas = Math.max(1, Number.parseInt(meta?.linhas, 10) || 1);
  const colunas = Math.max(1, Number.parseInt(meta?.colunas, 10) || 1);
  const tituloLinhas = Array.isArray(meta?.titulo_linhas) ? [...meta.titulo_linhas] : [];
  const tituloColunas = Array.isArray(meta?.titulo_colunas) ? [...meta.titulo_colunas] : [];

  while (tituloLinhas.length < linhas) tituloLinhas.push(`Linha ${tituloLinhas.length + 1}`);
  while (tituloColunas.length < colunas) tituloColunas.push(`Coluna ${tituloColunas.length + 1}`);

  return {
    tipo: "matriz",
    linhas,
    colunas,
    titulo_linhas: tituloLinhas.slice(0, linhas),
    titulo_colunas: tituloColunas.slice(0, colunas),
    titulo_geral_linhas: String(meta?.titulo_geral_linhas ?? ""),
    titulo_geral_colunas: String(meta?.titulo_geral_colunas ?? ""),
    rodape: meta?.rodape === true,
    config_linhas: normalizeMatrizConfigLinhas(meta?.config_linhas, linhas),
  };
};

/**
 * Componente de edição de formulário.
 *
 * @returns {JSX.Element} Tela de edição do formulário com perguntas e metadados.
 */
function EditTela() {
  // Params e navegação
  const { id_form } = useParams();
  const navigate = useNavigate();
  // Estados de ciclo de vida e feedback
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  // Dados principais
  const [questions, setQuestions] = useState([]);
  const [formInfo, setFormInfo] = useState(null);
  const [formInfoEdit, setFormInfoEdit] = useState(null);
  // Estados de Drag & Drop
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverEdge, setDragOverEdge] = useState(null); // 'top' | 'bottom'
  // Refs para scroll e imagem de arraste
  const scrollRef = useRef(null);
  const dragImageRef = useRef(null);
  // Refs para inputs de texto das perguntas e foco pendente
  const inputRefs = useRef([]);
  const [pendingFocusIndex, setPendingFocusIndex] = useState(null);

  /**
   * Rola o container de scroll para o final (fallback: janela).
   *
   * @returns {void}
   */
  const scrollToBottom = () => {
    try {
      const el = scrollRef.current;
      if (el && typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        const top = Math.max(
          document.documentElement?.scrollHeight || 0,
          document.body?.scrollHeight || 0
        );
        window.scrollTo({ top, behavior: "smooth" });
      }
    } catch {
      // fallback sem smooth
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      else window.scrollTo(0, document.documentElement?.scrollHeight || 0);
    }
  };

  // Efeito: carregar perguntas e informações do formulário em paralelo
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      const [perguntasData, infoData] = await Promise.all([
        carregar_perguntas_form(id_form),
        carregar_info_form(id_form),
      ]);
      if (!mounted) return;
      // Normalização do payload de perguntas vindo da API
      const normalized = Array.isArray(perguntasData)
        ? perguntasData.map((p, idx) => ({
            id: p?.pergunta_id ?? p?.id ?? undefined,
            texto: p?.texto_pergunta ?? "Pergunta",
            tipo: p?.tipo_resposta_esperada ?? "TEXTO_LIVRE",
            ordem: p?.ordem_pergunta ?? idx + 1,
            inativa: p?.inativa === true,
            obrigatoria: p?.obrigatoria === true,
            metadados_pergunta:
              p?.tipo_resposta_esperada === "MATRIZ"
                ? normalizeMatrizMetadata(p?.metadados_pergunta)
                : p?.metadados_pergunta ?? {},
            opcoes: Array.isArray(p?.opcoes_resposta)
              ? p.opcoes_resposta.map((o) => {
                  if (typeof o === "object") {
                    return {
                      valor: o?.valor ?? o?.value ?? o?.id ?? String(o?.label ?? "opcao"),
                      label: o?.label ?? o?.nome ?? String(o?.valor ?? "opcao"),
                    };
                  }
                  return { valor: o, label: String(o) };
                })
              : [],
          }))
        : [];
      setQuestions(normalized);
      setFormInfo(infoData ?? null);
      setFormInfoEdit(infoData ? { ...infoData } : null);
      setLoading(false);
    })().catch((e) => {
      if (!mounted) return;
      setError("Falha ao carregar perguntas.");
      setLoading(false);
      console.error(e);
    });
    return () => {
      mounted = false;
    };
  }, [id_form]);

  // Opções de tipo de pergunta
  const tipoOptions = useMemo(
    () => [
      { value: "TEXTO_LIVRE", label: "Texto livre" },
      { value: "DATA", label: "Data" },
      { value: "NUMERO_INT", label: "Número inteiro" },
      { value: "NUMERO_FLOAT", label: "Número decimal" },
      { value: "SELECAO_UNICA", label: "Seleção única" },
      { value: "SELECAO_MULTIPLA", label: "Seleção múltipla" },
      { value: "TEXTO_TOPICO", label: "Tópico de texto" },
      { value: "TEXTO_SUBTOPICO", label: "Subtópico de texto" },
      { value: "MATRIZ", label: "Matriz (Tabela)" },
    ],
    []
  );

  // Helper: tipos que exigem opções
  const requiresOptions = (tipo) => tipo === "SELECAO_UNICA" || tipo === "SELECAO_MULTIPLA";

  // Entradas exibíveis/editáveis do formulário (exclui ids e datas)
  const infoEntries = useMemo(() => {
    const src = formInfoEdit ?? formInfo;
    if (!src || typeof src !== "object") return [];
    const shouldInclude = (key) => {
      const kk = String(key).toLowerCase();
      if (kk === "pagina_streamlit") return false;
      if (kk === "id") return false;
      if (kk === "formulario_id" || kk === "id_form" || kk === "idformulario" || kk === "formid") return false;
      if (kk.endsWith("_id")) return false;
      if (kk === "data_criacao" || kk === "datacriacao" || kk === "datacriação" || kk === "data_criação") return false;
      if (kk === "createdat" || kk === "created_at") return false;
      if (kk === "dataCriacao".toLowerCase()) return false;
      return true;
    };
    return Object.entries(src).filter(([k, v]) => shouldInclude(k) && v !== null && v !== undefined);
  }, [formInfo, formInfoEdit]);

  const handleInfoChange = (key, value) => {
    setFormInfoEdit((prev) => ({ ...(prev ?? {}), [key]: value }));
  };

  const tipoFormularioOptions = useMemo(
    () => [
      { value: "Evoluções", label: "Evoluções" },
      { value: "Online Survey", label: "Online Survey" },
      { value: "Escalas/testes", label: "Escalas/testes" },
      { value: "Avaliações", label: "Avaliações" },
      { value: "Cadastros", label: "Cadastros" },
    ],
    []
  );

  const renderInfoField = (key, value) => {
    const type = typeof value;
    const common = "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200";
    if (key === "id") return <span className="text-sm">{String(value)}</span>;
    if (String(key).toLowerCase() === "tipo_formulario") {
      const sel = tipoFormularioOptions.find((o) => o.value === value) ?? null;
      return (
        <SingleSelect
          options={tipoFormularioOptions}
          value={sel}
          onChange={(opt) => handleInfoChange(key, opt?.value ?? "")}
          placeholder="Selecione o tipo do formulário"
          isClearable={false}
          closeMenuOnSelect
        />
      );
    }
    if (type === "boolean") {
      return (
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleInfoChange(key, e.target.checked)}
          />
          <span>{value ? "Ativo" : "Inativo"}</span>
        </label>
      );
    }
    if (type === "number") {
      return (
        <input
          className={common}
          type="number"
          value={value}
          onChange={(e) => handleInfoChange(key, Number(e.target.value))}
        />
      );
    }
    if (type === "string") {
      return (
        <AdaptiveInput
          className={common}
          value={value ?? ""}
          onChange={(val) => handleInfoChange(key, val)}
          ariaLabel={`Campo ${String(key)}`}
          maxChars={60}
        />
      );
    }
    try {
      return <span className="text-sm">{JSON.stringify(value)}</span>;
    } catch {
      return <span className="text-sm">{String(value)}</span>;
    }
  };

  /**
   * Atualiza um atributo de uma pergunta e reordena quando necessário.
   */
  const updateField = (index, field, value) => {
    setQuestions((prev) => {
      let arr = [...prev];
      const current = { ...arr[index], [field]: value };
      if (current.tipo === "MATRIZ" || field === "metadados_pergunta") {
        current.metadados_pergunta = normalizeMatrizMetadata(current.metadados_pergunta);
      }
      if (field === "inativa" && value === true) {
        arr.splice(index, 1);
        arr = [...arr, current];
      } else {
        arr[index] = current;
      }
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
  };

  // ----- Funções Auxiliares para Manipulação da MATRIZ -----
  const updateMatrizMeta = (qIndex, field, value) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = { ...arr[qIndex] };
      const meta = normalizeMatrizMetadata(q.metadados_pergunta);
      q.metadados_pergunta = normalizeMatrizMetadata({
        ...meta,
        [field]: field === "linhas" || field === "colunas"
          ? Math.max(1, Number.parseInt(value, 10) || 1)
          : value,
      });
      arr[qIndex] = q;
      return arr;
    });
  };

  const updateMatrizTitle = (qIndex, type, index, value) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = { ...arr[qIndex] };
      const meta = normalizeMatrizMetadata(q.metadados_pergunta);
      const titleKey = type === "linha" ? "titulo_linhas" : "titulo_colunas";
      
      const newTitles = [...(meta[titleKey] || [])];
      newTitles[index] = value;
      q.metadados_pergunta = normalizeMatrizMetadata({ ...meta, [titleKey]: newTitles });
      arr[qIndex] = q;
      return arr;
    });
  };

  const updateMatrizRowType = (qIndex, rowIndex, newType) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = { ...arr[qIndex] };
      const meta = normalizeMatrizMetadata(q.metadados_pergunta);
      const config = [...meta.config_linhas];
      const rowConfig = { ...(config[rowIndex] ?? createDefaultMatrizRowConfig()) };
      
      rowConfig.tipo = newType;
      if (newType !== "selecao_unica" && newType !== "selecao_multipla") {
        rowConfig.opcoes = [];
      } else if (newType !== config[rowIndex]?.tipo && (!rowConfig.opcoes || rowConfig.opcoes.length === 0)) {
        rowConfig.opcoes = [{ valor: "opcao_1", label: "Opção 1" }];
      }

      config[rowIndex] = rowConfig;
      q.metadados_pergunta = normalizeMatrizMetadata({ ...meta, config_linhas: config });
      arr[qIndex] = q;
      return arr;
    });
  };

  const addMatrizRowOption = (qIndex, rowIndex) => {
    setQuestions((prev) => {
        const arr = [...prev];
        const q = { ...arr[qIndex] };
        const meta = normalizeMatrizMetadata(q.metadados_pergunta);
        const config = [...meta.config_linhas];
        const rowConfig = { ...(config[rowIndex] ?? { tipo: "selecao_unica", opcoes: [] }) };
        
        const nextIdx = (rowConfig.opcoes?.length ?? 0) + 1;
        const newOpt = { valor: `opcao_${nextIdx}`, label: `Opção ${nextIdx}` };
        rowConfig.opcoes = [...(rowConfig.opcoes ?? []), newOpt];
        
        config[rowIndex] = rowConfig;
        q.metadados_pergunta = normalizeMatrizMetadata({ ...meta, config_linhas: config });
        arr[qIndex] = q;
        return arr;
    });
  };

  const updateMatrizRowOption = (qIndex, rowIndex, optIndex, value) => {
      setQuestions((prev) => {
          const arr = [...prev];
          const q = { ...arr[qIndex] };
        const meta = normalizeMatrizMetadata(q.metadados_pergunta);
        const config = [...meta.config_linhas];
        const rowConfig = { ...(config[rowIndex] ?? { tipo: "selecao_unica", opcoes: [] }) };
          
          const newOpts = [...(rowConfig.opcoes ?? [])];
          if (newOpts[optIndex]) {
          newOpts[optIndex] = {
          ...newOpts[optIndex],
          label: value,
          valor: newOpts[optIndex]?.valor ?? `opcao_${optIndex + 1}`,
          };
          }
          
          rowConfig.opcoes = newOpts;
          config[rowIndex] = rowConfig;
        q.metadados_pergunta = normalizeMatrizMetadata({ ...meta, config_linhas: config });
          arr[qIndex] = q;
          return arr;
      });
  };

  const removeMatrizRowOption = (qIndex, rowIndex, optIndex) => {
      setQuestions((prev) => {
          const arr = [...prev];
          const q = { ...arr[qIndex] };
        const meta = normalizeMatrizMetadata(q.metadados_pergunta);
        const config = [...meta.config_linhas];
        const rowConfig = { ...(config[rowIndex] ?? { tipo: "selecao_unica", opcoes: [] }) };
          
          const newOpts = (rowConfig.opcoes ?? []).filter((_, i) => i !== optIndex);
          
          rowConfig.opcoes = newOpts;
          config[rowIndex] = rowConfig;
        q.metadados_pergunta = normalizeMatrizMetadata({ ...meta, config_linhas: config });
          arr[qIndex] = q;
          return arr;
      });
  };

  // Funções de DnD (Drag & Drop)
  const onDragStart = (index, e) => {
    try { e.dataTransfer.setData("text/plain", String(index)); } catch {
      console.warn("Falha ao definir dados para drag, usando padrão.");
    }
    setDragIndex(index);
    try {
      const preview = document.createElement("div");
      preview.style.position = "fixed";
      preview.style.top = "-1000px";
      preview.style.left = "-1000px";
      preview.style.zIndex = "9999";
      preview.style.background = "#ffffff";
      preview.style.padding = "6px 10px";
      preview.style.border = "1px solid #e5e7eb";
      preview.style.borderRadius = "10px";
      preview.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
      preview.style.fontSize = "12px";
      preview.style.fontWeight = "600";
      preview.style.color = "#374151";
      preview.textContent = `Pergunta #${index + 1}`;
      document.body.appendChild(preview);
      dragImageRef.current = preview;
      try { e.dataTransfer.setDragImage(preview, 12, 12); } catch {
        // fallback sem custom drag image
        console.warn("Custom drag image não suportado, usando padrão.");
      }
    } catch {
      // erro ao criar imagem de drag, seguir sem ela
      console.warn("Falha ao criar imagem de drag, usando padrão.");
    }
  };

  const onDragOver = (index, e) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
    const target = e.currentTarget;
    if (target && typeof target.getBoundingClientRect === "function") {
      const rect = target.getBoundingClientRect();
      const y = e.clientY;
      const edge = y - rect.top < rect.height / 2 ? "top" : "bottom";
      if (dragOverEdge !== edge) setDragOverEdge(edge);
    }
    const el = scrollRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const y = e.clientY;
      const threshold = 80;
      const scrollStep = 20;
      if (y - rect.top < threshold) el.scrollTop -= scrollStep;
      else if (rect.bottom - y < threshold) el.scrollTop += scrollStep;
    } else {
      const y = e.clientY;
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const threshold = 80;
      const scrollStep = 20;
      if (y < threshold) window.scrollBy(0, -scrollStep);
      else if (viewportH - y < threshold) window.scrollBy(0, scrollStep);
    }
  };

  const onDrop = (targetIndex, e) => {
    e.preventDefault();
    setQuestions((prev) => {
      const from = dragIndex;
      let to = targetIndex + (dragOverEdge === "bottom" ? 1 : 0);
      if (from == null || to == null) return prev;
      if (from === to || from === to - 1) return prev;
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      if (from < to) to -= 1;
      if (to < 0) to = 0;
      if (to > arr.length) to = arr.length;
      arr.splice(to, 0, moved);
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
    setDragIndex(null);
    setDragOverIndex(null);
    setDragOverEdge(null);
    if (dragImageRef.current) {
      try { dragImageRef.current.remove(); } catch {
        console.warn("Falha ao remover imagem de drag, pode permanecer na tela.");
      }
      dragImageRef.current = null;
    }
  };

  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    setDragOverEdge(null);
    if (dragImageRef.current) {
      try { dragImageRef.current.remove(); } catch {
        console.warn("Falha ao remover imagem de drag, pode permanecer na tela.");
      }
      dragImageRef.current = null;
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: undefined,
        texto: "Nova pergunta",
        tipo: "TEXTO_LIVRE",
        ordem: prev.length + 1,
        opcoes: [],
        metadados_pergunta: {},
      },
    ]);
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => requestAnimationFrame(() => scrollToBottom()));
      } else {
        setTimeout(scrollToBottom, 0);
      }
    } catch {
      setTimeout(scrollToBottom, 0);
    }
  };

  const insertQuestionAt = (index) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const newQ = {
        id: undefined,
        texto: "Nova pergunta",
        tipo: "TEXTO_LIVRE",
        ordem: index + 1,
        opcoes: [],
        metadados_pergunta: {},
      };
      if (index < 0) index = 0;
      if (index > arr.length) index = arr.length;
      arr.splice(index, 0, newQ);
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
    setPendingFocusIndex(index);
    const scrollToInserted = () => {
      try {
        const container = scrollRef.current || document;
        const selector = `[data-q-index="${index}"]`;
        const el = (container instanceof HTMLElement ? container : document).querySelector(selector);
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      } catch {
        console.warn("Falha ao rolar para a pergunta inserida, rolando para o final como fallback.");
      }
      scrollToBottom();
    };
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => requestAnimationFrame(scrollToInserted));
      } else {
        setTimeout(scrollToInserted, 0);
      }
    } catch {
      setTimeout(scrollToInserted, 0);
    }
  };

  useEffect(() => {
    if (pendingFocusIndex == null) return;
    const el = inputRefs.current?.[pendingFocusIndex];
    if (el && typeof el.focus === "function") {
      try {
        el.focus();
        if (typeof el.setSelectionRange === "function") {
          const len = (el.value ?? "").length;
          el.setSelectionRange(0, len);
        }
      } catch {
        console.warn("Falha ao focar input, foco manual necessário.");
      }
      setPendingFocusIndex(null);
    } else {
      try {
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => setPendingFocusIndex((i) => i));
        }
      } catch {
        console.warn("Falha ao agendar foco, foco manual necessário.");
      }
    }
  }, [pendingFocusIndex, questions]);

  const addOption = (index) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = arr[index];
      const nextIdx = (q?.opcoes?.length ?? 0) + 1;
      const newOpt = { valor: `opcao_${nextIdx}`, label: `Opção ${nextIdx}` };
      arr[index] = { ...q, opcoes: [...(q?.opcoes ?? []), newOpt] };
      return arr;
    });
  };

  const updateOption = (qIndex, optIndex, field, value) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = arr[qIndex];
      const ops = [...(q?.opcoes ?? [])];
      ops[optIndex] = { ...ops[optIndex], [field]: value };
      arr[qIndex] = { ...q, opcoes: ops };
      return arr;
    });
  };

  const removeOption = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = arr[qIndex];
      const ops = (q?.opcoes ?? []).filter((_, i) => i !== optIndex);
      arr[qIndex] = { ...q, opcoes: ops };
      return arr;
    });
  };

  const validate = () => {
    const errors = [];
    questions.forEach((q, idx) => {
      if (q?.inativa === true) return;
      if (!q?.texto || String(q?.texto).trim() === "") {
        errors.push(`Pergunta ${idx + 1}: texto é obrigatório.`);
      }
      if (!q?.tipo) {
        errors.push(`Pergunta ${idx + 1}: tipo é obrigatório.`);
      }
      if (requiresOptions(q?.tipo)) {
        if (!Array.isArray(q?.opcoes) || q.opcoes.length === 0) {
          errors.push(`Pergunta ${idx + 1}: precisa ter ao menos uma opção.`);
        } else {
          q.opcoes.forEach((o, j) => {
            if (!o?.label || String(o.label).trim() === "") {
              errors.push(`Pergunta ${idx + 1} opção ${j + 1}: label é obrigatório.`);
            }
            if (o?.valor == null || String(o.valor).trim() === "") {
              errors.push(`Pergunta ${idx + 1} opção ${j + 1}: valor é obrigatório.`);
            }
          });
        }
      }
      if (q?.tipo === "MATRIZ") {
        const m = normalizeMatrizMetadata(q.metadados_pergunta);
        if (!m?.linhas || m.linhas < 1) errors.push(`Pergunta ${idx + 1}: a matriz precisa de pelo menos 1 linha.`);
        if (!m?.colunas || m.colunas < 1) errors.push(`Pergunta ${idx + 1}: a matriz precisa de pelo menos 1 coluna.`);
        if (!Array.isArray(m?.config_linhas) || m.config_linhas.length !== m.linhas) {
          errors.push(`Pergunta ${idx + 1}: config_linhas deve ter exatamente ${m.linhas} itens.`);
        }

        if (m?.titulo_linhas) {
            for (let r = 0; r < (m.linhas || 0); r++) {
                if (!m.titulo_linhas[r] || !m.titulo_linhas[r].trim()) {
                     errors.push(`Pergunta ${idx + 1}: A Linha ${r + 1} precisa ter um título.`);
                }
            }
        }
        
        // Validation: Column Titles
        if (m?.titulo_colunas) {
            for (let c = 0; c < (m.colunas || 0); c++) {
                if (!m.titulo_colunas[c] || !m.titulo_colunas[c].trim()) {
                     errors.push(`Pergunta ${idx + 1}: A Coluna ${c + 1} precisa ter um título.`);
                }
            }
        }

        m.config_linhas.forEach((configLinha, rowIndex) => {
          if (!configLinha?.tipo) {
            errors.push(`Pergunta ${idx + 1}: A linha ${rowIndex + 1} precisa ter um tipo.`);
          }

          if (
            (configLinha?.tipo === "selecao_unica" || configLinha?.tipo === "selecao_multipla") &&
            (!Array.isArray(configLinha?.opcoes) || configLinha.opcoes.length === 0)
          ) {
            errors.push(`Pergunta ${idx + 1}: A linha ${rowIndex + 1} precisa ter ao menos uma opção.`);
          }
        });
      }
    });
    return errors;
  };

  const save = async () => {
    setSuccess("");
    setError("");
    
    const errs = validate();
    if (errs.length) {
      setError(errs.join("\n"));
      return;
    }
    
    setSaving(true);

    const payload = questions.map((q, idx) => ({
      id: q?.id,
      texto_pergunta: q?.texto,
      tipo_resposta_esperada: q?.tipo,
      ordem_pergunta: q?.ordem ?? idx + 1,
      opcoes_resposta: q?.opcoes ?? [],
      inativa: q?.inativa === true,
      obrigatoria: q?.obrigatoria === true,
      metadados_pergunta:
        q?.tipo === "MATRIZ"
          ? normalizeMatrizMetadata(q?.metadados_pergunta)
          : q?.metadados_pergunta ?? {}
    }));

    let detailsRes = { ok: true };
    try {
      if (formInfo && formInfoEdit) {
        const diff = {};
        for (const [k, v] of Object.entries(formInfoEdit)) {
          const kk = String(k).toLowerCase();
          if (
            kk === "pagina_streamlit" || kk === "id" ||
            kk === "formulario_id" || kk === "id_form" || kk === "idformulario" || kk === "formid" || kk.endsWith("_id") ||
            kk === "data_criacao" || kk === "datacriacao" || kk === "datacriação" || kk === "data_criação" ||
            kk === "createdat" || kk === "created_at"
          ) continue;
          const orig = formInfo?.[k];
          if (typeof v !== "object" && v !== orig) diff[k] = v;
        }
        if (Object.keys(diff).length > 0) {
          detailsRes = await atualizar_info_form(id_form, diff);
        }
      }
    } catch (e) {
      detailsRes = { ok: false, error: e };
    }

    const perguntasRes = await upsert_perguntas_form(id_form, payload);
    setSaving(false);

    if (detailsRes?.ok && perguntasRes?.ok) {
      setSuccess("Formulário salvo com sucesso!");
      const result = await Swal.fire({
        title: "Salvo com Sucesso! 🎉",
        text: "As alterações foram aplicadas. O que deseja fazer agora?",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3B82F6",
        cancelButtonColor: "#6B7280",
        confirmButtonText: "👁️ Visualizar Formulário",
        cancelButtonText: "Voltar para Lista",
        reverseButtons: true
      });

      if (result.isConfirmed) {
        navigate(`/forms-terapeuta/visualizar-formulario/${id_form}`);
      } else {
        navigate('/forms-terapeuta/editar-formulario');
      }

    } else if (!detailsRes?.ok && !perguntasRes?.ok) {
        Swal.fire({ title: "Erro", text: "Falha ao salvar tudo.", icon: "error" });
        setError("Falha ao salvar detalhes e perguntas.");
    } else if (!detailsRes?.ok) {
        Swal.fire({ title: "Erro Parcial", text: "Perguntas salvas, erro nos detalhes.", icon: "warning" });
        setError("Perguntas salvas, mas falhou ao salvar detalhes.");
    } else {
        Swal.fire({ title: "Erro Parcial", text: "Detalhes salvos, erro nas perguntas.", icon: "warning" });
        setError("Detalhes salvos, mas falhou ao salvar perguntas.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
      <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
        <div ref={scrollRef} className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4 gap-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-4 mb-6">
            
            {/* Lado Esquerdo: Título */}
            <div className="flex flex-col">
                <h1 className="font-extrabold text-3xl md:text-4xl text-gray-800">✍️ Editar Formulário</h1>
                <p className="text-apollo-200/80 text-sm mt-1">
                  ID: <span className="font-semibold">{id_form}</span>
                </p>
            </div>

            {/* Lado Direito: Botões (Estilo igual ao Painel e Lista) */}
            <div className="flex gap-2 w-full md:w-auto">
                
                {/* Botão Visualizar */}
                <button
                    type="button"
                    onClick={() => navigate(`/forms-terapeuta/visualizar-formulario/${id_form}`)}
                    className="flex-1 md:flex-none bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    title="Visualizar modo leitura"
                >
                    👁️ Ver Formulário
                </button>

                {/* Botão Voltar */}
                <button
                    type="button"
                    onClick={() => navigate('/forms-terapeuta/editar-formulario')}
                    className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer flex items-center justify-center"
                >
                    Voltar
                </button>
            </div>
          </div>

          {loading && <div className="text-gray-600">⏳ Carregando perguntas...</div>}
          {!!error && <ErroGen mensagem={error} />}
          {!!success && <SucessGen mensagem={success} />}

          {!loading && (
            <div className="flex flex-col gap-4">
              {/* Detalhes do formulário */}
              {infoEntries.length > 0 && (
                <div className="border rounded-xl p-4 bg-apollo-200/10">
                  <h2 className="font-bold mb-2 text-xl">📄 Detalhes do formulário</h2>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {infoEntries.map(([k, v]) => (
                      <div key={k} className="flex flex-col gap-1">
                        <span className="text-xs uppercase tracking-wide text-gray-500">{k}</span>
                        {renderInfoField(k, v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações de perguntas: adicionar nova */}
              <div className="grid md:grid-cols-2 grid-cols-1 items-center justify-between mb-2 gap-2">
                    <h1 className="text-xl font-bold">📝 Perguntas</h1>
                    <button
                        className="self-start py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200"
                        onClick={addQuestion}
                    >
                        + Adicionar pergunta
                    </button>
              </div>
              {/* Barra de inserção ANTES da primeira pergunta */}
              <div
                className="relative my-2 h-6 group hover:bg-gray-50 rounded-md transition cursor-pointer"
                onClick={() => insertQuestionAt(0)}
              >
                <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                  <div className="w-full h-px bg-gray-200"></div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); insertQuestionAt(0); }}
                  className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full bg-white border border-gray-200 shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-gray-50"
                >
                  + Adicionar pergunta aqui
                </button>
              </div>

              {questions.map((q, i) => (
                <React.Fragment key={q?.id ?? i}>
                  {/* Indicador de inserção ANTES do card */}
                  {dragOverIndex === i && dragOverEdge === "top" && (
                    <div className="h-2 -my-1">
                      <div className="h-1 rounded bg-apollo-200 animate-pulse"></div>
                    </div>
                  )}
                  <div
                    className={`draggable-card border rounded-xl p-4 shadow-sm transition-all duration-200 ${q?.inativa === true ? "opacity-50" : ""} ${dragIndex === i ? "ring-2 ring-apollo-200 shadow-lg scale-[0.99] bg-gray-50" : ""} ${dragOverIndex === i ? "" : ""}`}
                    data-q-index={i}
                    onDragOver={(e) => onDragOver(i, e)}
                    onDrop={(e) => onDrop(i, e)}
                  >
                    {/* Cabeçalho do card: arraste, índice e inativação */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          aria-label="Arrastar para reordenar"
                          className="px-2 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-500 cursor-grab active:cursor-grabbing select-none"
                          draggable
                          onDragStart={(e) => onDragStart(i, e)}
                          onDragEnd={onDragEnd}
                        >
                          ⋮⋮
                        </button>
                        <span className="text-sm text-gray-500">Pergunta #{i + 1}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                      {q?.tipo !== "TEXTO_TOPICO" && q?.tipo !== "TEXTO_SUBTOPICO" && (
                          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer hover:text-apollo-200 transition-colors">
                            <input
                              type="checkbox"
                              className="w-4 h-4 accent-apollo-200 cursor-pointer"
                              checked={q?.obrigatoria === true}
                              onChange={(e) => updateField(i, "obrigatoria", e.target.checked)}
                              disabled={q?.inativa === true}
                            />
                            Obrigatória
                          </label>
                        )}
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={q?.inativa === true}
                            onChange={(e) => updateField(i, "inativa", e.target.checked)}
                          />
                          Inativar pergunta
                        </label>
                      </div>
                    </div>

                  {/* Conteúdo do card: texto e tipo */}
                  <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold">Texto da pergunta</label>
                      <AdaptiveInput
                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                        value={q?.texto ?? ""}
                        onChange={(val) => updateField(i, "texto", val)}
                        disabled={q?.inativa === true}
                        ariaLabel="Texto da pergunta"
                        maxChars={60}
                        ref={(el) => { inputRefs.current[i] = el; }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-semibold">Tipo</label>
                      <SingleSelect
                        options={tipoOptions}
                        value={tipoOptions.find((o) => o.value === q?.tipo) ?? null}
                        onChange={(opt) => {
                          const newTipo = opt?.value ?? "TEXTO_LIVRE";
                          updateField(i, "tipo", newTipo);
                          if (newTipo === "TEXTO_TOPICO" || newTipo === "TEXTO_SUBTOPICO") {
                              updateField(i, "obrigatoria", false);
                          }
                          
                          // Template inicial caso Matriz seja selecionado
                          if (newTipo === "MATRIZ" && (!q?.metadados_pergunta || !q.metadados_pergunta.tipo)) {
                              updateField(i, "metadados_pergunta", normalizeMatrizMetadata(q?.metadados_pergunta));
                          }

                          if (!requiresOptions(newTipo)) {
                            updateField(i, "opcoes", []);
                          } else if (requiresOptions(newTipo) && (!q?.opcoes || q.opcoes.length === 0)) {
                            updateField(i, "opcoes", [{ valor: "opcao_1", label: "Opção 1" }]);
                          }
                        }}
                        placeholder="Selecione o tipo"
                        isClearable={false}
                        closeMenuOnSelect
                        isDisabled={q?.inativa === true}
                      />
                    </div>
                  </div>

                  {/* MAtriZ/Tabela */}
                  {q?.tipo === "MATRIZ" && (
                    <div className="mt-6 border border-zinc-200 rounded-xl p-5 bg-gray-50/50 shadow-sm">
                       <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-5">⚙️ Configuração da Matriz</h3>
                       
                       {/* Configurações básicas (Linhas, Colunas, Rodapé) */}
                       <div className="flex flex-col gap-4 mb-6">
                          <div className="flex gap-4 items-end flex-wrap">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Qtd. Linhas</label>
                              <input 
                                type="number" min="1" max="20"
                                className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                                value={q?.metadados_pergunta?.linhas || 1}
                                onChange={(e) => updateMatrizMeta(i, "linhas", e.target.value)}
                                disabled={q?.inativa === true}
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">Qtd. Colunas</label>
                              <input 
                                type="number" min="1" max="20"
                                className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
                                value={q?.metadados_pergunta?.colunas || 1}
                                onChange={(e) => updateMatrizMeta(i, "colunas", e.target.value)}
                                disabled={q?.inativa === true}
                              />
                            </div>
                          </div>
                       </div>
                          
                       {/* Configuração Visual das Células (Tabela) */}
                       <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner mt-4">
                          <table className="w-full text-left bg-white border-collapse min-w-max">
                            <thead>
                              {/* 1ª Linha do Cabeçalho: Títulos Gerais */}
                              <tr>
                                <th className="p-3 bg-gray-50 border-b border-r border-gray-200 min-w-[150px] align-bottom">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Título das Linhas</label>
                                    <input 
                                      type="text"
                                      className="w-full text-center bg-white border border-gray-300 rounded px-2 py-1 focus:border-apollo-200 focus:outline-none text-sm font-bold text-apollo-800 placeholder-gray-300"
                                      placeholder="Ex: Linhas"
                                      value={q?.metadados_pergunta?.titulo_geral_linhas || ""}
                                      onChange={(e) => updateMatrizMeta(i, "titulo_geral_linhas", e.target.value)}
                                      disabled={q?.inativa === true}
                                    />
                                  </div>
                                </th>
                                <th 
                                  colSpan={q?.metadados_pergunta?.colunas || 1} 
                                  className="p-3 bg-gray-50 border-b border-r border-gray-200 min-w-[150px] align-bottom"
                                >
                                  <div className="flex flex-col gap-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Título das Colunas</label>
                                    <input 
                                      type="text"
                                      className="w-full text-center bg-white border border-gray-300 rounded px-2 py-1 focus:border-apollo-200 focus:outline-none text-sm font-bold text-apollo-800 placeholder-gray-300"
                                      placeholder="Ex: Colunas"
                                      value={q?.metadados_pergunta?.titulo_geral_colunas || ""}
                                      onChange={(e) => updateMatrizMeta(i, "titulo_geral_colunas", e.target.value)}
                                      disabled={q?.inativa === true}
                                    />
                                  </div>
                                </th>
                              </tr>

                              {/* 2ª Linha do Cabeçalho: Títulos Individuais das Colunas */}
                              <tr>
                                <th className="p-3 bg-gray-100 border-b border-r border-gray-200 text-xs font-medium text-gray-400 italic text-center">
                                  (Nomes das Linhas abaixo)
                                </th>
                                {/* Títulos das Colunas */}
                                {Array.from({ length: q?.metadados_pergunta?.colunas || 1 }).map((_, c) => (
                                  <th key={c} className="p-2 bg-gray-50 border-b border-gray-200 text-center min-w-[180px]">
                                    <input 
                                      type="text"
                                      className="w-full text-center bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-apollo-200 focus:outline-none text-sm font-semibold text-gray-600 focus:text-apollo-600 transition-colors"
                                      placeholder={`Coluna ${c + 1}`}
                                      value={q?.metadados_pergunta?.titulo_colunas?.[c] || ""}
                                      onChange={(e) => updateMatrizTitle(i, "coluna", c, e.target.value)}
                                      disabled={q?.inativa === true}
                                    />
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: q?.metadados_pergunta?.linhas || 1 }).map((_, r) => {
                                const rowConfig = q?.metadados_pergunta?.config_linhas?.[r] ?? { tipo: "texto" };
                                const typeLabel = MATRIZ_CELL_TYPES.find(t => t.id === rowConfig.tipo)?.label || "Texto";

                                return (
                                <tr key={r} className="hover:bg-gray-50/50">
                                  {/* Título da Linha */}
                                  <td className="p-2 border-b border-r border-gray-200 bg-gray-50 min-w-[150px]">
                                    <input 
                                      type="text"
                                      className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-apollo-200 focus:outline-none text-sm font-bold text-gray-700"
                                      value={q?.metadados_pergunta?.titulo_linhas?.[r] || `Linha ${r + 1}`}
                                      onChange={(e) => updateMatrizTitle(i, "linha", r, e.target.value)}
                                      disabled={q?.inativa === true}
                                    />
                                  </td>
                                  
                                  {/* Células: Nome do Tipo Selecionado */}
                                  {Array.from({ length: q?.metadados_pergunta?.colunas || 1 }).map((_, c) => (
                                      <td key={c} className="p-3 border-b border-gray-200 align-top min-w-[200px]">
                                        <div className="flex items-center justify-center p-2 rounded bg-gray-50 border border-gray-200">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                {typeLabel}
                                            </span>
                                        </div>
                                      </td>
                                  ))}
                                </tr>
                              )})}
                            </tbody>
                          </table>
                       </div>
                       
                       {/* Configuração detalhada das Linhas (Pós Tabela) */}
                       <div className="mt-8 flex flex-col gap-6">
                           <h4 className="font-bold text-gray-800 text-lg border-b pb-2">⚙️ Configuração das Linhas</h4>
                           {Array.from({ length: q?.metadados_pergunta?.linhas || 1 }).map((_, r) => {
                               const rowConfig = q?.metadados_pergunta?.config_linhas?.[r] ?? { tipo: "texto", opcoes: [] };
                               const currentTypeOption = MATRIZ_CELL_TYPES.map(t => ({ value: t.id, label: t.label })).find(o => o.value === rowConfig.tipo) ?? { value: "texto", label: "Texto" };
                               const needsOptions = rowConfig.tipo === "selecao_unica" || rowConfig.tipo === "selecao_multipla";

                               return (
                                   <div key={r} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col gap-4">
                                       <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
                                            <div className="flex flex-col gap-1 mt-1">
                                                <span className="font-bold text-gray-700 text-sm">
                                                    {q?.metadados_pergunta?.titulo_linhas?.[r] || `Linha ${r + 1}`}
                                                </span>
                                                <span className="text-xs text-gray-400">Configuração individual</span>
                                            </div>
                                            <div className="w-full md:w-64">
                                                <label className="text-sm font-semibold mb-1 block">Tipo da Linha</label>
                                                <SingleSelect
                                                    options={MATRIZ_CELL_TYPES.map(t => ({ value: t.id, label: t.label }))}
                                                    value={currentTypeOption}
                                                    onChange={(opt) => updateMatrizRowType(i, r, opt?.value)}
                                                    placeholder="Selecione o tipo..."
                                                    isClearable={false}
                                                    isDisabled={q?.inativa === true}
                                                />
                                            </div>
                                       </div>

                                       {/* Se for seleção, mostra opções */}
                                       {needsOptions && (
                                           <div className="pt-2 border-t border-gray-100 flex flex-col gap-3">
                                               <div className="flex items-center justify-between">
                                                   <label className="text-sm font-semibold">Opções de Resposta</label>
                                                   <button
                                                      className="py-1 px-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-xs font-medium"
                                                      onClick={() => addMatrizRowOption(i, r)}
                                                      disabled={q?.inativa === true}
                                                   >
                                                      + Adicionar opção
                                                   </button>
                                               </div>
                                               <div className="flex flex-col gap-2">
                                                   {rowConfig.opcoes?.map((opt, optIndex) => (
                                                       <div key={optIndex} className="flex items-center gap-2">
                                                            <button
                                                              type="button"
                                                              className="h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shrink-0"
                                                              onClick={() => removeMatrizRowOption(i, r, optIndex)}
                                                              disabled={q?.inativa === true}
                                                            >
                                                              ×
                                                            </button>
                                                            <AdaptiveInput
                                                                className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                                                                placeholder={`Opção ${optIndex + 1}`}
                                                                value={opt.label || ""}
                                                                onChange={(val) => updateMatrizRowOption(i, r, optIndex, val)}
                                                                disabled={q?.inativa === true}
                                                                ariaLabel={`Opção ${optIndex + 1}`}
                                                                maxChars={60}
                                                            />
                                                       </div>
                                                   ))}
                                               </div>
                                           </div>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                    </div>
                  )}

                  {/* Opções Convencionais (quando o tipo não é matriz mas exige opções) */}
                  {requiresOptions(q?.tipo) && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold">Opções de resposta</label>
                        <button
                          className="py-1 px-2 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                          onClick={() => addOption(i)}
                          disabled={q?.inativa === true}
                        >
                          + Adicionar opção
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {(q?.opcoes ?? []).map((o, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <button
                              type="button"
                              className="h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                              onClick={() => removeOption(i, j)}
                              disabled={q?.inativa === true}
                            >
                              ×
                            </button>
                            <AdaptiveInput
                              className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                              placeholder="Label"
                              value={o?.label ?? ""}
                              onChange={(val) => updateOption(i, j, "label", val)}
                              disabled={q?.inativa === true}
                              ariaLabel="Label da opção"
                              maxChars={40}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                  {/* Indicador de inserção DEPOIS do card */}
                  {dragOverIndex === i && dragOverEdge === "bottom" && (
                    <div className="h-2 -my-1">
                      <div className="h-1 rounded bg-apollo-200 animate-pulse"></div>
                    </div>
                  )}

                  {/* Barra de inserção ENTRE os cards (após o atual) */}
                  <div
                    className="relative my-2 h-6 group hover:bg-gray-50 rounded-md transition cursor-pointer"
                    onClick={() => insertQuestionAt(i + 1)}
                  >
                    <div className="absolute inset-y-0 left-0 right-0 flex items-center">
                      <div className="w-full h-px bg-gray-200"></div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); insertQuestionAt(i + 1); }}
                      className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 rounded-full bg-white border border-gray-200 shadow-sm opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto hover:bg-gray-50"
                    >
                      + Adicionar pergunta aqui
                    </button>
                  </div>
                </React.Fragment>
              ))}

              {/* Barra de inserção APÓS a última pergunta (fallback extra) */}
              {questions.length === 0 && (
                <div className="text-sm text-gray-500">Nenhuma pergunta ainda. Use os botões para adicionar.</div>
              )}

              {/* Footer Action*/}
              <div className="flex flex-col sm:flex-row gap-3 justify-end mt-8 pt-6 border-t border-gray-100">
                
                {/* Botão Cancelar */}
                <button
                  className="px-6 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  onClick={() => navigate(-1)}
                >
                  Cancelar
                </button>

                {/* Botão Salvar */}
                <button
                  className="px-6 py-2 rounded-lg bg-apollo-200 text-white font-bold hover:bg-apollo-300 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  onClick={save}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      Salvando...
                    </>
                  ) : (
                    "💾 Salvar Alterações"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditTela;