import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { 
  PencilSquareIcon, 
  PlusCircleIcon, 
  TrashIcon, 
  ListBulletIcon, 
  CheckCircleIcon,
  BriefcaseIcon,
  TagIcon,
  ClipboardDocumentListIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  Bars3Icon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Hooks e Componentes
import { useAuth } from "../../hooks/useAuth";
import MultiSelect from "../../components/input/MultiSelect.jsx";
import SingleSelect from "../../components/input/SingleSelect.jsx"; 
import AdaptiveInput from "../../components/input/AdaptiveInput.jsx"; 
import ErroGen from "../../components/info/ErroGen.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import PaginationControl from "../../components/pagination/PaginationControl.jsx";

// API Utils
import { listar_formularios, criar_formulario_completo } from "../../api/forms/forms_utils";

// --- CONSTANTES (Mantidas iguais) ---
const OPCOES_ESPECIALIDADES = [
    { value: 'Fisioterapia', label: 'Fisioterapia' },
    { value: 'Terapia Ocupacional', label: 'Terapia Ocupacional' },
    { value: 'Fonoaudiologia', label: 'Fonoaudiologia' },
    { value: 'Psicologia', label: 'Psicologia' },
    { value: 'Enfermagem', label: 'Enfermagem' },
    { value: 'Nutrição', label: 'Nutrição' },
    { value: 'Condicionamento Físico', label: 'Condicionamento Físico' }
];

const OPCOES_DIAGNOSTICOS = [
    { value: 'AVC', label: 'AVC' },
    { value: 'Doença de Parkinson', label: 'Doença de Parkinson' },
    { value: 'TCE', label: 'TCE' },
    { value: 'Lesão Medular', label: 'Lesão Medular' },
    { value: 'Dor Crônica', label: 'Dor Crônica' },
    { value: 'Doenças Degenerativas', label: 'Doenças Degenerativas' },
    { value: 'Doença Oncológica', label: 'Doença Oncológica' },
    { value: 'Paralisia Cerebral', label: 'Paralisia Cerebral' },
    { value: 'Neuropatia', label: 'Neuropatia' },
    { value: 'Ortopedia', label: 'Ortopedia' },
    { value: 'Distonia', label: 'Distonia' },
    { value: 'Outros', label: 'Geral / Outros' }
];

const OPCOES_TIPO_FORMULARIO = [
    { value: 'Evoluções', label: 'Evoluções' },
    { value: 'Escalas/testes', label: 'Escalas/testes' },
    { value: 'Online Survey', label: 'Online Survey' },
    { value: 'Cadastros', label: 'Cadastros' },
    { value: 'Avaliações', label: 'Avaliações' }
];

const TIPO_PERGUNTA_OPTIONS = [
    { value: "TEXTO_LIVRE", label: "Texto livre" },
    { value: "DATA", label: "Data" },
    { value: "NUMERO_INT", label: "Número inteiro" },
    { value: "NUMERO_FLOAT", label: "Número decimal" },
    { value: "SELECAO_UNICA", label: "Seleção única" },
    { value: "SELECAO_MULTIPLA", label: "Seleção múltipla" },
    { value: "TEXTO_TOPICO", label: "Tópico de texto" },
    { value: "TEXTO_SUBTOPICO", label: "Subtópico de texto" },
    { value: "MATRIZ", label: "Matriz (Tabela)" }
];

const MATRIZ_CELL_TYPES = [
  { id: "texto", label: "Texto Livre" },
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

function EditarFormulario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lista'); 

  // ================= ABA 1: LISTAR =================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [selectedTipos, setSelectedTipos] = useState([]); 
  const [busca, setBusca] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  useEffect(() => {
    if (activeTab !== 'lista') return;
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listar_formularios();
        if (isMounted) setForms(Array.isArray(data) ? data : []);
      // eslint-disable-next-line no-unused-vars
      } catch (e) {
        if (isMounted) setError("Falha ao carregar formulários.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [activeTab]);

  const getId = (f) => f?.formulario_id ?? f?.id ?? f?.formId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getTitulo = useCallback((f) => f?.nome_formulario ?? f?.titulo ?? f?.nomeEscala ?? `Formulário ${getId(f)}`);
  const getTipo = (f) => f?.tipo_formulario ?? f?.tipo ?? "Geral";

  const filteredForms = useMemo(() => {
    let resultado = forms;
    if (user?.especialidade) {
        const userSpec = user.especialidade; 
        resultado = resultado.filter(f => {
            const areasForm = f.especialidades || f.especialidade || []; 
            if (!areasForm || areasForm.length === 0 || areasForm.includes('Multidisciplinar')) return true;
            if (Array.isArray(areasForm)) return areasForm.includes(userSpec);
            return areasForm === userSpec;
        });
    }
    if (selectedTipos?.length) {
      const allowed = new Set(selectedTipos.map((o) => o.value));
      resultado = resultado.filter((f) => allowed.has(f?.tipo_formulario ?? f?.tipo));
    }
    if (busca) {
        resultado = resultado.filter(f => {
            const titulo = getTitulo(f);
            return titulo.toLowerCase().includes(busca.toLowerCase());
        });
    }
    return resultado;
  }, [forms, user.especialidade, selectedTipos, busca, getTitulo]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredForms?.length || 0) / itemsPerPage)), [filteredForms, itemsPerPage]);
  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredForms.slice(pageStart, pageStart + itemsPerPage);

  const handleEdit = (f) => {
      const id = getId(f);
      if (!id) {
          Swal.fire("Erro", "ID do formulário inválido.", "error");
          return;
      }
      navigate(`/forms-terapeuta/editar-formulario/${id}`);
  };

  const tipoOptionsFilter = useMemo(() => {
    const set = new Map();
    for (const f of forms) {
      const t = getTipo(f);
      if (t && !set.has(t)) set.set(t, { value: t, label: String(t) });
    }
    return Array.from(set.values());
  }, [forms]);


  // ================= ABA 2: CRIAR NOVO =================
  const [novoForm, setNovoForm] = useState({ titulo: '', descricao: '', tipo: null });
  const [novasEspecialidades, setNovasEspecialidades] = useState([]);
  const [novosDiagnosticos, setNovosDiagnosticos] = useState([]);
  
  const [questions, setQuestions] = useState([{ 
      id: undefined, 
      texto: "Pergunta 1", 
      tipo: "TEXTO_LIVRE", 
      ordem: 1, 
      opcoes: [], 
      obrigatoria: false 
  }]);
  
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dragOverEdge, setDragOverEdge] = useState(null);
  const [loadingSalvar, setLoadingSalvar] = useState(false);
  const scrollRef = useRef(null);

  const requiresOptions = (tipo) => tipo === "SELECAO_UNICA" || tipo === "SELECAO_MULTIPLA";

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
        return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
      });
  };

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
        return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));;
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

  const updateField = (index, field, value) => {
    setQuestions((prev) => {
      let arr = [...prev];
      const current = { ...arr[index], [field]: value };
      
      if (field === 'tipo') {
          if (requiresOptions(value) && (!current.opcoes || current.opcoes.length === 0)) {
             current.opcoes = [{ label: 'Opção 1', valor: 'opcao_1' }];
          }
          if (value === 'TEXTO_TOPICO' || value === 'TEXTO_SUBTOPICO') {
             current.obrigatoria = false;
          }
             if (value === 'MATRIZ') {
                 current.metadados_pergunta = normalizeMatrizMetadata(current.metadados_pergunta);
          }
      }
        if (current.tipo === "MATRIZ" || field === "metadados_pergunta") {
             current.metadados_pergunta = normalizeMatrizMetadata(current.metadados_pergunta);
        }
      arr[index] = current;
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
  };

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
      
      if (field === 'label' && !ops[optIndex].valor) {
          ops[optIndex].valor = value.toLowerCase().replace(/\s+/g, '_');
      }
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

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { id: undefined, texto: "Nova pergunta", tipo: "TEXTO_LIVRE", ordem: prev.length + 1, opcoes: [], obrigatoria: false },
    ]);
    setTimeout(() => { if(scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
  };

  const removeQuestion = (index) => {
    if (questions.length === 1) return Swal.fire('Aviso', 'O formulário deve ter pelo menos uma pergunta.', 'warning');
    setQuestions(prev => {
        const arr = [...prev];
        arr.splice(index, 1);
        return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
  };

  const insertQuestionAt = (index) => {
    setQuestions((prev) => {
      const arr = [...prev];
      const newQ = { id: undefined, texto: "Nova pergunta", tipo: "TEXTO_LIVRE", ordem: index + 1, opcoes: [], obrigatoria: false };
      arr.splice(index, 0, newQ);
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
  };

  const onDragStart = (index, e) => { try { e.dataTransfer.setData("text/plain", String(index)); } catch { /* empty */ } setDragIndex(index); };
  const onDragOver = (index, e) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const y = e.clientY;
    const edge = y - rect.top < rect.height / 2 ? "top" : "bottom";
    if (dragOverEdge !== edge) setDragOverEdge(edge);
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
      arr.splice(to, 0, moved);
      return arr.map((q, idx) => ({ ...q, ordem: idx + 1 }));
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSalvarNovo = async () => {
    // 🔒 VALIDAÇÃO RIGOROSA 🔒
    if (!novoForm.titulo.trim()) return Swal.fire('Atenção', 'O <b>Nome do Formulário</b> é obrigatório.', 'warning');
    if (!novoForm.tipo) return Swal.fire('Atenção', 'Selecione o <b>Tipo</b> do formulário.', 'warning');
    if (!novoForm.descricao.trim()) return Swal.fire('Atenção', 'A <b>Descrição</b> do formulário é obrigatória.', 'warning');
    if (novasEspecialidades.length === 0) return Swal.fire('Atenção', 'Selecione ao menos uma <b>Especialidade</b>.', 'warning');
    if (novosDiagnosticos.length === 0) return Swal.fire('Atenção', 'Selecione ao menos um <b>Diagnóstico</b>.', 'warning');
    
    const errors = [];
    questions.forEach((q, idx) => {
        if (!q.texto.trim()) errors.push(`Pergunta ${idx+1}: Texto obrigatório.`);
        if (requiresOptions(q.tipo) && (!q.opcoes || q.opcoes.length === 0)) errors.push(`Pergunta ${idx+1}: Requer opções.`);
        
        if (q.tipo === "MATRIZ") {
            const m = normalizeMatrizMetadata(q.metadados_pergunta);
            if ((m.linhas || 0) < 1) errors.push(`Pergunta ${idx+1}: Matriz deve ter linhas.`);
            if ((m.colunas || 0) < 1) errors.push(`Pergunta ${idx+1}: Matriz deve ter colunas.`);
            if (!Array.isArray(m.config_linhas) || m.config_linhas.length !== m.linhas) {
                errors.push(`Pergunta ${idx+1}: config_linhas deve ter exatamente ${m.linhas} itens.`);
            }

            for(let r=0; r < (m.linhas||0); r++) {
                if (!m.titulo_linhas?.[r]?.trim()) {
                     errors.push(`Pergunta ${idx+1}: Título da Linha ${r+1} é obrigatório.`);
                }
            }
            for(let c=0; c < (m.colunas||0); c++) {
                if (!m.titulo_colunas?.[c]?.trim()) {
                     errors.push(`Pergunta ${idx+1}: Título da Coluna ${c+1} é obrigatório.`);
                }
            }

            m.config_linhas.forEach((configLinha, rowIndex) => {
                if (!configLinha?.tipo) {
                    errors.push(`Pergunta ${idx+1}: A linha ${rowIndex + 1} precisa ter um tipo.`);
                }

                if (
                    (configLinha?.tipo === "selecao_unica" || configLinha?.tipo === "selecao_multipla") &&
                    (!Array.isArray(configLinha?.opcoes) || configLinha.opcoes.length === 0)
                ) {
                    errors.push(`Pergunta ${idx+1}: A linha ${rowIndex + 1} precisa ter ao menos uma opção.`);
                }
            });
        }
    });
    if (errors.length > 0) return Swal.fire('Erro nas Perguntas', errors.join('<br>'), 'error');

    const payload = {
        nome_formulario: novoForm.titulo, 
        descricao_formulario: novoForm.descricao,
        tipo_formulario: novoForm.tipo?.value, 
        especialidades: novasEspecialidades.map(e => e.value), 
        diagnosticos: novosDiagnosticos.map(d => d.value),
        perguntas: questions.map((q, index) => ({
            texto_pergunta: q.texto, 
            tipo_resposta_esperada: q.tipo,
            ordem_pergunta: index + 1,
            obrigatoria: q.obrigatoria,
            opcoes_resposta: q.opcoes.map(o => ({ label: o.label, valor: o.valor })),
            metadados_pergunta: q.tipo === "MATRIZ"
                ? normalizeMatrizMetadata(q.metadados_pergunta)
                : q.metadados_pergunta
        }))
    };

    const result = await Swal.fire({
        title: 'Criar Formulário?',
        html: `Confirma a criação de "<b>${novoForm.titulo}</b>"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, criar',
        confirmButtonColor: '#5A2779', // Apollo 200
        cancelButtonColor: '#6B7280'
    });

    if (result.isConfirmed) {
        setLoadingSalvar(true);
        try {
            const response = await criar_formulario_completo(payload);
            const novoId = response?.id || response?.formularioId;

            await Swal.fire({
                title: 'Sucesso! 🎉',
                text: 'Formulário criado. O que deseja fazer?',
                icon: 'success',
                showCancelButton: true,
                confirmButtonColor: '#5A2779', 
                cancelButtonColor: '#6B7280', 
                confirmButtonText: '👁️ Visualizar Agora',
                cancelButtonText: 'Voltar para Lista',
                reverseButtons: true
            }).then((res) => {
                if (res.isConfirmed && novoId) {
                    navigate(`/forms-terapeuta/visualizar-formulario/${novoId}`);
                } else {
                    setNovoForm({ titulo: '', descricao: '', tipo: null });
                    setNovasEspecialidades([]);
                    setNovosDiagnosticos([]);
                    setQuestions([{ id: undefined, texto: "Pergunta 1", tipo: "TEXTO_LIVRE", ordem: 1, opcoes: [], obrigatoria: false }]);
                    setActiveTab('lista'); 
                }
            });
            
        } catch (error) {
            console.error(error);
            Swal.fire('Erro', 'Falha ao salvar no banco.', 'error');
        } finally {
            setLoadingSalvar(false);
        }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
      
      {/* CONTAINER PRINCIPAL */}
      <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
        
        {/* CARD BASE BRANCO */}
        <div className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
          
          {/* --- CABEÇALHO --- */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-100 pb-6 gap-6 shrink-0">
              <div className="flex flex-col items-center md:items-start">
                  <h1 className="font-extrabold text-3xl md:text-4xl text-gray-800 line-clamp-1 flex items-center gap-3 animate-fade-in-down">
                    <span>✍️</span> 
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Gestão de Formulários</span>
                  </h1>
                  <p className="text-gray-400 mt-2 text-sm md:text-base hidden md:block">
                    {activeTab === 'lista' ? 'Gerencie os formulários do sistema.' : 'Crie um novo formulário no sistema.'}
                  </p>
              </div>

              <div className="flex flex-wrap gap-3 items-center justify-center w-full md:w-auto">
                 
                 {/* BOTÃO VISUALIZAR */}
                 <button 
                    onClick={() => navigate('/forms-terapeuta/visualizar-formularios')} 
                    className="hidden md:flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm hover:shadow-lg hover:bg-apollo-200 hover:text-white hover:border-apollo-200 hover:-translate-y-1 active:scale-95 text-sm cursor-pointer"
                    title="Modo Visualização"
                 >
                    <EyeIcon className="w-5 h-5" /> Visualizar
                 </button>

                 {/* ABAS */}
                 <div className="bg-gray-100 p-1.5 rounded-xl flex gap-1 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('lista')} 
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${activeTab === 'lista' ? 'bg-white text-apollo-200 shadow-md transform' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
                    >
                        <ListBulletIcon className="w-5 h-5" /> Lista
                    </button>
                    <button 
                        onClick={() => setActiveTab('criar')} 
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 cursor-pointer ${activeTab === 'criar' ? 'bg-apollo-200 text-white shadow-md transform' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200'}`}
                    >
                        <PlusCircleIcon className="w-5 h-5" /> Novo
                    </button>
                 </div>
                 
                 {/* BOTÃO VOLTAR */}
                 <button 
                    onClick={() => navigate('/forms-terapeuta/tela-inicial')} 
                    className="bg-white border border-red-100 text-red-500 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm hover:bg-red-50 hover:border-red-200 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                 >
                    <ChevronLeftIcon className="w-5 h-5" /> Voltar
                 </button>
              </div>
          </div>

          {/* ======================= CONTEÚDO: LISTA ======================= */}
          {activeTab === 'lista' && (
             <div className="animate-fade-in flex flex-col flex-1 overflow-hidden mt-6">
                
                {/* BARRA DE FILTROS */}
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-2 bg-gray-50/30 p-6 rounded-2xl border border-gray-100 mb-6 shrink-0">
                    <div className="flex flex-col gap-2 w-full md:w-1/2">
                        <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1">Filtrar por Tipo</label>
                        <MultiSelect
                            options={tipoOptionsFilter}
                            value={selectedTipos}
                            onChange={setSelectedTipos}
                            placeholder="Selecione os tipos..."
                            className="text-sm cursor-pointer shadow-sm hover:shadow transition-shadow"
                        />
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-1/2">
                        <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1">Buscar Formulário</label>
                        <div className="relative group">
                            <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3 text-gray-400 group-hover:text-apollo-400 transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Digite o nome..." 
                                className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full outline-none focus:border-apollo-300 focus:bg-white bg-white text-sm transition-all font-medium text-gray-700 placeholder-gray-400 shadow-sm" 
                                value={busca} 
                                onChange={e => setBusca(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                {loading && <LoadingGen mensagem="Carregando formulários..." />}
                
                {!!error && !loading && <ErroGen mensagem={error} />}

                {/* AREA DE GRID COM SCROLL INTERNO */}
                {!loading && !error && (
                    <div className="flex-1 overflow-y-auto pr-2 p-1 pb-20 [scrollbar-width:thin] [scrollbar-color:rgba(90,39,121,0.55)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-2xl [&::-webkit-scrollbar-thumb]:bg-[rgba(90,39,121,0.45)] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(90,39,121,0.65)]"> 
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 content-start">
                            {pageItems.map((f) => (
                                // CARD DO FORMULÁRIO - DESIGN APOLLO (Roxo e Clean)
                                <div 
                                    key={getId(f) || Math.random()} 
                                    onClick={() => handleEdit(f)} 
                                    className="group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-apollo-300 hover:ring-1 hover:ring-apollo-300 transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 overflow-hidden transform hover:-translate-y-1"
                                >
                                    <div className="z-10 relative">
                                        <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-wide group-hover:bg-apollo-50 group-hover:text-apollo-600 group-hover:border-apollo-100 transition-colors">
                                            {getTipo(f)}
                                        </span>
                                        <h3 className="font-bold text-lg text-gray-800 leading-snug line-clamp-2 mt-4 group-hover:text-apollo-600 transition-colors">
                                            {getTitulo(f)}
                                        </h3>
                                    </div>
                                    
                                    <div className="mt-auto w-full py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-center text-xs border border-gray-100 group-hover:bg-apollo-200 group-hover:text-white group-hover:border-transparent transition-all flex items-center justify-center gap-2 z-10">
                                        <span>Editar Formulário</span> <PencilSquareIcon className="w-4 h-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* PAGINAÇÃO FIXA EMBAIXO DENTRO DO CARD */}
                {!loading && !error && (
                    <div className="mt-8 flex justify-center w-full">
                        <PaginationControl currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage(p => Math.max(1, p-1))} onNext={() => setCurrentPage(p => Math.min(totalPages, p+1))} />
                    </div>
                )}
             </div>
          )}

          {/* ======================= CONTEÚDO: CRIAR NOVO ======================= */}
          {activeTab === 'criar' && (
            <div className="flex flex-col gap-6 md:gap-8 max-w-full mx-auto w-full mt-6 animate-fade-in overflow-y-auto pb-20 [scrollbar-width:thin] [scrollbar-color:rgba(90,39,121,0.55)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-2xl [&::-webkit-scrollbar-thumb]:bg-[rgba(90,39,121,0.45)] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(90,39,121,0.65)]" ref={scrollRef}>
                
                {/* DADOS GERAIS */}
                <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 md:gap-8">
                    <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm w-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="p-2 bg-apollo-200/5 rounded-lg"><ClipboardDocumentListIcon className="w-6 h-6 text-apollo-200" /></div>
                            Informações Básicas
                        </h2>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Nome do Formulário <span className="text-red-500">*</span></label>
                                <AdaptiveInput className="w-full border-2 border-gray-100 rounded-xl p-3.5 text-sm focus:border-apollo-300 focus:ring-4 focus:ring-apollo-50 outline-none transition-all font-medium text-gray-700 placeholder-gray-300"
                                    value={novoForm.titulo} onChange={val => setNovoForm({...novoForm, titulo: val})} placeholder="Ex: Escala de Berg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Tipo <span className="text-red-500">*</span></label>
                                <SingleSelect 
                                    options={OPCOES_TIPO_FORMULARIO}
                                    value={novoForm.tipo}
                                    onChange={opt => setNovoForm({...novoForm, tipo: opt})}
                                    placeholder="Selecione o tipo..."
                                    className="text-sm cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider">Descrição <span className="text-red-500">*</span></label>
                                <textarea className="w-full border-2 border-gray-100 rounded-xl p-3.5 text-sm focus:border-apollo-300 focus:ring-4 focus:ring-apollo-50 outline-none h-[120px] resize-none bg-gray-50/30 transition-all placeholder-gray-300"
                                    value={novoForm.descricao} onChange={e => setNovoForm({...novoForm, descricao: e.target.value})} placeholder="Para que serve este formulário..." />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm w-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="p-2 bg-emerald-50 rounded-lg"><TagIcon className="w-6 h-6 text-emerald-500" /></div>
                            Classificação
                        </h2>
                        <div className="grid grid-cols-1 gap-6 h-full content-start">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider flex items-center gap-2"><BriefcaseIcon className="w-4 h-4" /> Especialidades <span className="text-red-500">*</span></label>
                                <MultiSelect options={OPCOES_ESPECIALIDADES} value={novasEspecialidades} onChange={setNovasEspecialidades} placeholder="Selecione as áreas..." className="text-sm cursor-pointer" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 ml-1 tracking-wider flex items-center gap-2"><span className="text-emerald-500 font-black text-xs bg-emerald-50 px-1.5 py-0.5 rounded">Dx</span> Diagnósticos <span className="text-red-500">*</span></label>
                                <MultiSelect options={OPCOES_DIAGNOSTICOS} value={novosDiagnosticos} onChange={setNovosDiagnosticos} placeholder="Selecione os diagnósticos..." className="text-sm cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ENGINE DE PERGUNTAS */}
                <div className="bg-white p-4 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8 border-b border-gray-100 pb-4 gap-4">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg"><ListBulletIcon className="w-6 h-6 text-indigo-500" /></div>
                            Perguntas ({questions.length})
                        </h2>
                        <button onClick={addQuestion} className="w-full sm:w-auto justify-center bg-white text-apollo-200 border-2 border-apollo-200 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-apollo-200 hover:text-white transition-all flex items-center gap-2 active:scale-95 shadow-sm cursor-pointer">
                            <PlusCircleIcon className="w-5 h-5" /> Nova Pergunta
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Dropzone Inicial */}
                        <div className="relative h-2 group hover:h-10 transition-all duration-200 flex items-center justify-center cursor-pointer mb-4" onClick={() => insertQuestionAt(0)}>
                            <div className="w-full h-0.5 bg-gray-100 group-hover:bg-apollo-300 transition-colors rounded-full"></div>
                            <span className="absolute bg-white px-4 py-1.5 text-xs text-apollo-500 opacity-0 group-hover:opacity-100 transition-all border border-apollo-200 rounded-full shadow-md font-bold scale-90 group-hover:scale-100">+ Inserir no início</span>
                        </div>

                        {questions.map((q, i) => {
                            const isTopic = q.tipo === "TEXTO_TOPICO" || q.tipo === "TEXTO_SUBTOPICO";

                            return (
                                <div 
                                    key={i}
                                    className={`relative border-2 rounded-2xl p-6 transition-all duration-300 group/card 
                                    ${dragIndex === i ? "opacity-40 border-dashed border-apollo-400 bg-gray-50 scale-95" : "bg-white border-gray-100 hover:border-apollo-300 hover:shadow-xl shadow-sm"}
                                    ${isTopic ? "bg-slate-50 border-slate-200" : ""}
                                    `}
                                    draggable
                                    onDragStart={(e) => onDragStart(i, e)}
                                    onDragOver={(e) => onDragOver(i, e)}
                                    onDrop={(e) => onDrop(i, e)}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-3 cursor-grab active:cursor-grabbing text-gray-300 hover:text-apollo-500 p-2 -ml-2 rounded-xl hover:bg-apollo-50 transition-colors">
                                            <Bars3Icon className="w-6 h-6" />
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide group-hover/card:text-apollo-500">Questão {i + 1}</span>
                                        </div>
                                        <div className="flex gap-3 items-center">
                                            <label className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg transition-all border-2 ${isTopic ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400 border-transparent' : q.obrigatoria ? 'bg-apollo-50 text-apollo-600 border-apollo-100 cursor-pointer' : 'bg-white text-gray-400 border-gray-100 hover:border-gray-200 cursor-pointer'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isTopic ? false : q.obrigatoria} 
                                                    disabled={isTopic}
                                                    onChange={(e) => updateField(i, 'obrigatoria', e.target.checked)} 
                                                    className={`accent-apollo-600 w-4 h-4 rounded-sm ${isTopic ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                                                /> 
                                                Obrigatória
                                            </label>
                                            <button onClick={() => removeQuestion(i)} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer" title="Excluir"><TrashIcon className="w-5 h-5" /></button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 ml-1 tracking-widest">Enunciado / Título</label>
                                            <AdaptiveInput 
                                                className={`w-full border-2 rounded-xl p-3.5 text-sm outline-none transition-all placeholder-gray-300 ${isTopic ? 'border-slate-200 bg-slate-100 font-bold text-slate-700' : 'border-gray-100 focus:border-apollo-300 focus:ring-4 focus:ring-apollo-50 font-medium text-gray-700'}`}
                                                value={q.texto} 
                                                onChange={(val) => updateField(i, 'texto', val)} 
                                                placeholder="Ex: Como o paciente está se sentindo?" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-extrabold text-gray-400 uppercase mb-2 ml-1 tracking-widest">Tipo de Resposta</label>
                                            <SingleSelect 
                                                options={TIPO_PERGUNTA_OPTIONS}
                                                value={TIPO_PERGUNTA_OPTIONS.find(o => o.value === q.tipo)}
                                                onChange={(opt) => updateField(i, 'tipo', opt.value)}
                                                placeholder="Selecione..."
                                                className="text-sm cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {q.tipo === "MATRIZ" && (
                                        <div className="mt-6 border border-zinc-200 rounded-xl p-5 bg-gray-50/50 shadow-sm animate-fade-in">
                                            <h3 className="font-bold text-gray-800 text-lg border-b pb-2 mb-5">
                                                <span>⚙️</span> Configuração da Matriz
                                            </h3>
                                            
                                            <div className="flex gap-4 items-end flex-wrap mb-6">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-semibold text-gray-600">Qtd. Linhas</label>
                                                    <input 
                                                    type="number" min="1" max="20"
                                                    className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-apollo-100 outline-none"
                                                    value={q?.metadados_pergunta?.linhas || 1}
                                                    onChange={(e) => updateMatrizMeta(i, "linhas", e.target.value)}
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-semibold text-gray-600">Qtd. Colunas</label>
                                                    <input 
                                                    type="number" min="1" max="20"
                                                    className="w-24 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-apollo-100 outline-none"
                                                    value={q?.metadados_pergunta?.colunas || 1}
                                                    onChange={(e) => updateMatrizMeta(i, "colunas", e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner mt-4">
                                                <table className="w-full text-left bg-white border-collapse min-w-max">
                                                    <thead>
                                                        {/* Títulos Gerais */}
                                                        <tr>
                                                            <th className="p-3 bg-gray-50 border-b border-r border-gray-200 min-w-[150px] align-bottom">
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">Título das Linhas</label>
                                                                    <input 
                                                                        type="text"
                                                                        className="w-full text-center bg-white border border-gray-300 rounded px-2 py-1 focus:border-apollo-200 focus:outline-none text-sm font-bold text-apollo-800 placeholder-gray-300 transition-all"
                                                                        placeholder="Ex:Linhas"
                                                                        value={q?.metadados_pergunta?.titulo_geral_linhas || ""}
                                                                        onChange={(e) => updateMatrizMeta(i, "titulo_geral_linhas", e.target.value)}
                                                                    />
                                                                </div>
                                                            </th>
                                                            <th 
                                                                colSpan={q?.metadados_pergunta?.colunas || 1} 
                                                                className="p-3 bg-gray-50 border-b border-gray-200 text-center align-bottom"
                                                            >
                                                                <div className="flex flex-col gap-1">
                                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Título das Colunas</label>
                                                                    <input 
                                                                        type="text"
                                                                        className="w-full text-center bg-white border border-gray-300 rounded px-2 py-1 focus:border-apollo-200 focus:outline-none text-sm font-bold text-apollo-800 placeholder-gray-300 transition-all"
                                                                        placeholder="Ex:Colunas"
                                                                        value={q?.metadados_pergunta?.titulo_geral_colunas || ""}
                                                                        onChange={(e) => updateMatrizMeta(i, "titulo_geral_colunas", e.target.value)}
                                                                    />
                                                                </div>
                                                            </th>
                                                        </tr>
                                                        {/* Títulos Individuais */}
                                                        <tr>
                                                            <th className="p-3 bg-gray-100 border-b border-r border-gray-200 text-xs font-medium text-gray-400 italic text-center">
                                                                (Nomes das Linhas abaixo)
                                                            </th>
                                                            {Array.from({ length: q?.metadados_pergunta?.colunas || 1 }).map((_, c) => (
                                                                <th key={c} className="p-2 bg-gray-50 border-b border-gray-200 text-center min-w-[180px]">
                                                                    <input 
                                                                        type="text"
                                                                        className="w-full text-center bg-transparent border-b-2 border-transparent hover:border-gray-200 focus:border-apollo-200 focus:outline-none text-sm font-semibold text-gray-600 focus:text-apollo-600 transition-colors"
                                                                        value={q?.metadados_pergunta?.titulo_colunas?.[c] || `Coluna ${c + 1}`}
                                                                        onChange={(e) => updateMatrizTitle(i, "coluna", c, e.target.value)}
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
                                                                <td className="p-2 border-b border-r border-gray-200 bg-gray-50 min-w-[150px]">
                                                                    <input 
                                                                        type="text"
                                                                        className="w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-apollo-200 focus:outline-none text-sm font-bold text-gray-700"
                                                                        value={q?.metadados_pergunta?.titulo_linhas?.[r] || `Linha ${r + 1}`}
                                                                        onChange={(e) => updateMatrizTitle(i, "linha", r, e.target.value)}
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
                                                <h3 className="font-bold text-gray-800 text-lg border-b pb-2">⚙️ Configuração das Linhas</h3>
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
                                                                                    >
                                                                                        ×
                                                                                    </button>
                                                                                    <AdaptiveInput
                                                                                        className="flex-1 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                                                                                        placeholder={`Opção ${optIndex + 1}`}
                                                                                        value={opt.label || ""}
                                                                                        onChange={(val) => updateMatrizRowOption(i, r, optIndex, val)}
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

                                    {requiresOptions(q.tipo) && (
                                        <div className="mt-6 ml-2 pl-6 border-l-4 border-apollo-100 bg-gray-50/50 p-5 rounded-r-2xl">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Lista de Opções</span>
                                                <button onClick={() => addOption(i)} className="text-[10px] bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg shadow-sm hover:bg-apollo-50 hover:text-apollo-600 hover:border-apollo-200 transition-all font-bold cursor-pointer">+ Opção</button>
                                            </div>
                                            <div className="space-y-3">
                                                {q.opcoes?.map((opt, j) => (
                                                    <div key={j} className="flex gap-3 items-center group/opt">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 group-hover/opt:bg-apollo-300 transition-colors"></div>
                                                        <AdaptiveInput className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-apollo-100 focus:border-apollo-300 outline-none transition-all font-medium text-gray-600" 
                                                            value={opt.label} onChange={(val) => updateOption(i, j, 'label', val)} placeholder={`Opção ${j+1}`} />
                                                        <button onClick={() => removeOption(i, j)} className="text-gray-300 hover:text-red-500 px-2 opacity-0 group-hover/opt:opacity-100 transition-all font-bold text-lg cursor-pointer">×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Dropzone Inferior */}
                                    <div className="absolute -bottom-5 left-0 w-full h-10 group/insert hover:z-20 flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity" onClick={() => insertQuestionAt(i+1)}>
                                        <div className="w-full h-0.5 bg-apollo-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                        <div className="absolute bg-apollo-500 text-white text-[10px] font-bold px-4 py-1 rounded-full shadow-lg border-2 border-white hover:scale-110 transition-transform">+ Inserir Abaixo</div>
                                    </div>
                                    
                                    {dragOverIndex === i && dragOverEdge === "bottom" && <div className="absolute -bottom-2 left-0 w-full h-1.5 bg-apollo-400 rounded-full animate-pulse z-30"></div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* BOTÃO FLUTUANTE DE SALVAR */}
                <div className="flex flex-col gap-4 justify-between mt-8 pt-6 sticky bottom-6 z-40 pointer-events-none">
                    <button 
                        onClick={handleSalvarNovo}
                        disabled={loadingSalvar}
                        className="pointer-events-auto bg-apollo-200 text-white font-bold rounded-2xl px-8 py-4 transition-all hover:bg-apollo-800 shadow-xl hover:shadow-apollo-200/50 cursor-pointer w-full md:w-auto md:self-end flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 active:scale-95 text-base border-4 border-white/50 backdrop-blur-sm"
                    >
                        {loadingSalvar ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <CheckCircleIcon className="w-6 h-6" />}
                        <span>Salvar Formulário Completo</span>
                    </button>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default EditarFormulario;