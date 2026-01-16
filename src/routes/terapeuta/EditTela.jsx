/**
 * EditTela
 * ------------------------
 * Tela de edição de formulários do terapeuta.
 * Permite:
 * - Carregar e editar perguntas (ordem, texto, tipo, opções, inativação)
 * - Atualizar metadados do formulário (campos primitivos permitidos)
 * - Reordenar perguntas via Drag & Drop com pré-visualização e auto-scroll
 * - Validar perguntas antes de salvar
 * - Salvar detalhes do formulário e perguntas (upsert)
 */
// Componentes e hooks
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SingleSelect from "../../components/input/SingleSelect.jsx";
import AdaptiveInput from "../../components/input/AdaptiveInput.jsx";
import { carregar_info_form, carregar_perguntas_form, upsert_perguntas_form, atualizar_info_form } from "../../api/forms/forms_utils";
import ErroGen from "../../components/info/ErroGen.jsx";
import SucessGen from "../../components/info/SucessGen.jsx";
import Swal from "sweetalert2";

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
    ],
    []
  );

  // Helper: tipos que exigem opções
  /**
   * Verifica se o tipo de pergunta exige definição de opções.
   *
   * @param {string} tipo Tipo da pergunta.
   * @returns {boolean} Verdadeiro se requer opções.
   */
  const requiresOptions = (tipo) => tipo === "SELECAO_UNICA" || tipo === "SELECAO_MULTIPLA";

  // Entradas exibíveis/ediáveis do formulário (exclui ids e datas)
  const infoEntries = useMemo(() => {
    const src = formInfoEdit ?? formInfo;
    if (!src || typeof src !== "object") return [];
    const shouldInclude = (key) => {
      const kk = String(key).toLowerCase();
      if (kk === "pagina_streamlit") return false;
      // Excluir IDs
      if (kk === "id") return false;
      if (kk === "formulario_id" || kk === "id_form" || kk === "idformulario" || kk === "formid") return false;
      if (kk.endsWith("_id")) return false;
      // Excluir datas de criação
      if (kk === "data_criacao" || kk === "datacriacao" || kk === "datacriação" || kk === "data_criação") return false;
      if (kk === "datacriacao" || kk === "datacriação") return false;
      if (kk === "createdat" || kk === "created_at") return false;
      if (kk === "dataCriacao".toLowerCase()) return false;
      return true;
    };
    return Object.entries(src).filter(([k, v]) => shouldInclude(k) && v !== null && v !== undefined);
  }, [formInfo, formInfoEdit]);

  // Atualiza cache editável dos metadados do formulário
  /**
   * Atualiza um campo de metadados do formulário em edição.
   *
   * @param {string} key Nome do campo a atualizar.
   * @param {any} value Valor do campo.
   * @returns {void}
   */
  const handleInfoChange = (key, value) => {
    setFormInfoEdit((prev) => ({ ...(prev ?? {}), [key]: value }));
  };

  // Opções para campo específico "tipo_formulario"
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

  // Renderiza dinamicamente um campo do bloco de informações do formulário
  /**
   * Renderiza dinamicamente um campo de metadados do formulário.
   *
   * @param {string} key Nome do campo.
   * @param {any} value Valor atual do campo.
   * @returns {JSX.Element} Campo apropriado ao tipo do valor.
   */
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
    // Objetos/arrays: somente leitura compacta
    try {
      return <span className="text-sm">{JSON.stringify(value)}</span>;
    } catch {
      return <span className="text-sm">{String(value)}</span>;
    }
  };


  // Atualiza um campo da pergunta; ao inativar, envia para o final e reordena
  /**
   * Atualiza um atributo de uma pergunta e reordena quando necessário.
   *
   * @param {number} index Índice da pergunta na lista.
   * @param {"inativa"|"texto"|"tipo"|"opcoes"|"ordem"} field Campo a ser alterado.
   * @param {any} value Novo valor do campo.
   * @returns {void}
   */
  const updateField = (index, field, value) => {
    setQuestions((prev) => {
      let arr = [...prev];
      const current = { ...arr[index], [field]: value };
      if (field === "inativa" && value === true) {
        // move pergunta inativada para o final
        arr.splice(index, 1);
        arr = [...arr, current];
      } else {
        arr[index] = current;
      }
      // atualiza ordem conforme posição
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
  };

  // Drag & Drop de perguntas
  // Início do arraste: configura dataTransfer e preview customizado
  /**
   * Inicia o arraste de uma pergunta, configurando dataTransfer e preview.
   *
   * @param {number} index Índice da pergunta arrastada.
   * @param {DragEvent} e Evento de arraste.
   * @returns {void}
   */
  const onDragStart = (index, e) => {
    try { e.dataTransfer.setData("text/plain", String(index)); } catch {
        // ignore
    }
    setDragIndex(index);
    // Drag preview personalizado
    try {
      const preview = document.createElement("div");
      preview.style.position = "fixed";
      preview.style.top = "-1000px";
      preview.style.left = "-1000px";
      preview.style.zIndex = "9999";
      preview.style.background = "#ffffff";
      preview.style.padding = "6px 10px";
      preview.style.border = "1px solid #e5e7eb"; // gray-200
      preview.style.borderRadius = "10px";
      preview.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
      preview.style.fontSize = "12px";
      preview.style.fontWeight = "600";
      preview.style.color = "#374151"; // gray-700
      preview.textContent = `Pergunta #${index + 1}`;
      document.body.appendChild(preview);
      dragImageRef.current = preview;
      try { e.dataTransfer.setDragImage(preview, 12, 12); } catch {
        // fallback se falhar
      }
    } catch {
        // ignore
    }
  };

  // Ao arrastar sobre outro card: decide inserção top/bottom, faz auto-scroll
  /**
   * Gerencia o arraste sobre outro card, definindo posição de inserção e auto-scroll.
   *
   * @param {number} index Índice do card alvo.
   * @param {DragEvent} e Evento de arraste.
   * @returns {void}
   */
  const onDragOver = (index, e) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
    // Determina se a inserção será antes (top) ou depois (bottom) do card alvo
    const target = e.currentTarget;
    if (target && typeof target.getBoundingClientRect === "function") {
      const rect = target.getBoundingClientRect();
      const y = e.clientY;
      const edge = y - rect.top < rect.height / 2 ? "top" : "bottom";
      if (dragOverEdge !== edge) setDragOverEdge(edge);
    }
    // Auto-scroll quando aproximar das bordas do container
    const el = scrollRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const y = e.clientY;
      const threshold = 80; // px
      const scrollStep = 20; // px por evento
      if (y - rect.top < threshold) {
        el.scrollTop -= scrollStep;
      } else if (rect.bottom - y < threshold) {
        el.scrollTop += scrollStep;
      }
    } else {
      // Fallback: scroll da janela
      const y = e.clientY;
      const viewportH = window.innerHeight || document.documentElement.clientHeight;
      const threshold = 80;
      const scrollStep = 20;
      if (y < threshold) {
        window.scrollBy(0, -scrollStep);
      } else if (viewportH - y < threshold) {
        window.scrollBy(0, scrollStep);
      }
    }
  };

  // Ao soltar: reposiciona o item arrastado e recalcula ordem
  /**
   * Conclui o arraste reposicionando a pergunta e recalculando a ordem.
   *
   * @param {number} targetIndex Índice alvo para inserção.
   * @param {DragEvent} e Evento de drop.
   * @returns {void}
   */
  const onDrop = (targetIndex, e) => {
    e.preventDefault();
    setQuestions((prev) => {
      const from = dragIndex;
      let to = targetIndex + (dragOverEdge === "bottom" ? 1 : 0);
      if (from == null || to == null) return prev;
      if (from === to || from === to - 1) {
        // Sem efeito prático
        return prev;
      }
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      if (from < to) to -= 1; // ajusta índice após remoção
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
        // ignore
      }
      dragImageRef.current = null;
    }
  };

  // Limpa estados e preview ao terminar o arraste
  /**
   * Finaliza o ciclo de arraste limpando estados e preview customizado.
   *
   * @returns {void}
   */
  const onDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    setDragOverEdge(null);
    if (dragImageRef.current) {
      try { dragImageRef.current.remove(); } catch {
        // ignore
      }
      dragImageRef.current = null;
    }
  };

  // Adiciona nova pergunta ao final
  /**
   * Adiciona uma nova pergunta ao final da lista.
   *
   * @returns {void}
   */
  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: undefined,
        texto: "Nova pergunta",
        tipo: "TEXTO_LIVRE",
        ordem: prev.length + 1,
        opcoes: [],
      },
    ]);
    // Após inserir a pergunta, rolar ao final da lista
    try {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollToBottom();
          });
        });
      } else {
        setTimeout(scrollToBottom, 0);
      }
    } catch {
      setTimeout(scrollToBottom, 0);
    }
  };

  // Adiciona nova pergunta em um índice específico (entre perguntas)
  /**
   * Insere uma nova pergunta na posição informada.
   *
   * @param {number} index Posição onde a pergunta será inserida.
   * @returns {void}
   */
  const insertQuestionAt = (index) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const newQ = {
        id: undefined,
        texto: "Nova pergunta",
        tipo: "TEXTO_LIVRE",
        ordem: index + 1,
        opcoes: [],
      };
      if (index < 0) index = 0;
      if (index > arr.length) index = arr.length;
      arr.splice(index, 0, newQ);
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
    setPendingFocusIndex(index);
    // Após inserir, rola até a pergunta inserida (centralizada)
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
        // ignore
      }
      // Fallback: rolar ao final
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

  // Efeito: quando há foco pendente, foca o input correspondente
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
        // ignore
      }
      setPendingFocusIndex(null);
    } else {
      // tenta novamente no próximo frame se ainda não montou
      try {
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => setPendingFocusIndex((i) => i));
        }
      } catch {
        // ignore
      }
    }
  }, [pendingFocusIndex, questions]);

  // Adiciona nova opção à pergunta de índice informado
  /**
   * Adiciona uma nova opção à pergunta indicada.
   *
   * @param {number} index Índice da pergunta.
   * @returns {void}
   */
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

  // Atualiza uma opção específica de uma pergunta
  /**
   * Atualiza uma opção específica de uma pergunta.
   *
   * @param {number} qIndex Índice da pergunta.
   * @param {number} optIndex Índice da opção dentro da pergunta.
   * @param {"label"|"valor"} field Campo da opção a atualizar.
   * @param {string} value Novo valor do campo.
   * @returns {void}
   */
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

  // Remove uma opção de uma pergunta
  /**
   * Remove uma opção de uma pergunta.
   *
   * @param {number} qIndex Índice da pergunta.
   * @param {number} optIndex Índice da opção a remover.
   * @returns {void}
   */
  const removeOption = (qIndex, optIndex) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const q = arr[qIndex];
      const ops = (q?.opcoes ?? []).filter((_, i) => i !== optIndex);
      arr[qIndex] = { ...q, opcoes: ops };
      return arr;
    });
  };

  // Validação das perguntas antes de salvar
  /**
   * Valida todas as perguntas ativas.
   *
   * @returns {string[]} Lista de mensagens de erro (vazia se válido).
   */
  const validate = () => {
    const errors = [];
    questions.forEach((q, idx) => {
      if (q?.inativa === true) return; // pula validação para perguntas inativas
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
    });
    return errors;
  };

  // Salva alterações de metadados (diff) e perguntas (upsert)
  /**
   * Salva metadados (diff) e perguntas (upsert) do formulário.
   *
   * @returns {Promise<void>} Promise resolvida ao concluir o processo de salvamento.
   */
  const save = async () => {
    setSuccess("");
    setError("");
    
    // 1. Validação
    const errs = validate();
    if (errs.length) {
      setError(errs.join("\n"));
      return;
    }
    
    setSaving(true);

    // 2. Preparação do Payload
    const payload = questions.map((q, idx) => ({
      id: q?.id,
      texto_pergunta: q?.texto,
      tipo_resposta_esperada: q?.tipo,
      ordem_pergunta: q?.ordem ?? idx + 1,
      opcoes_resposta: q?.opcoes ?? [],
      inativa: q?.inativa === true,
    }));

    // 3. Diff dos detalhes (Metadados)
    let detailsRes = { ok: true };
    try {
      if (formInfo && formInfoEdit) {
        const diff = {};
        for (const [k, v] of Object.entries(formInfoEdit)) {
          const kk = String(k).toLowerCase();
          if (
            kk === "pagina_streamlit" ||
            kk === "id" ||
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

    // 4. Envio das Perguntas
    const perguntasRes = await upsert_perguntas_form(id_form, payload);
    setSaving(false);

    if (detailsRes?.ok && perguntasRes?.ok) {
      setSuccess("Formulário salvo com sucesso!");
      
      const result = await Swal.fire({
        title: "Salvo com Sucesso! 🎉",
        text: "As alterações foram aplicadas. O que deseja fazer agora?",
        icon: "success",
        showCancelButton: true,
        confirmButtonColor: "#3B82F6", // Azul (Visualizar)
        cancelButtonColor: "#6B7280", // Cinza (Voltar)
        confirmButtonText: "👁️ Visualizar Formulário",
        cancelButtonText: "Voltar para Lista",
        reverseButtons: true
      });

      if (result.isConfirmed) {
        // Vai para a tela de visualização (Sandbox)
        navigate(`/forms-terapeuta/visualizar-formulario/${id_form}`);
      } else {
        // Volta para a lista de edição
        navigate('/forms-terapeuta/editar-formulario');
      }

    } else if (!detailsRes?.ok && !perguntasRes?.ok) {
        // Tratamento de Erros (Mantido igual)
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
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        <div ref={scrollRef} className="bg-white h-full rounded-xl flex flex-col gap-6 xl:shadow-md w-full md:p-8 p-4 overflow-y-auto">
          {/* 👇 CABEÇALHO ATUALIZADO: Layout organizado + Cores padrão do sistema */}
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
                
                {/* Botão Visualizar (Estilo Apollo) */}
                <button
                    type="button"
                    onClick={() => navigate(`/forms-terapeuta/visualizar-formulario/${id_form}`)}
                    className="flex-1 md:flex-none bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                    title="Visualizar modo leitura"
                >
                    👁️ Ver Formulário
                </button>

                {/* Botão Voltar (Estilo Vermelho Padrão) */}
                <button
                    type="button"
                    onClick={() => navigate('/forms-terapeuta/editar-formulario')}
                    className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer flex items-center justify-center"
                >
                    Voltar
                </button>
            </div>
          </div>
          <p className="text-apollo-200/80">Formulário ID: <span className="font-semibold">{id_form}</span></p>

          {/* Estados de carregamento e mensagens globais */}
          {loading && <div className="text-gray-600">⏳ Carregando perguntas...</div>}
          {!!error && <ErroGen mensagem={error} />}
          {!!success && <SucessGen mensagem={success} />}

          {!loading && (
            <div className="flex flex-col gap-4">
              {/* Detalhes do formulário (exclui pagina_streamlit, ids e datas) */}
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

              {/* Lista de perguntas com suporte a DnD */}
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

                  {/* Opções (quando o tipo exigir) */}
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
                              aria-label="Remover opção"
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