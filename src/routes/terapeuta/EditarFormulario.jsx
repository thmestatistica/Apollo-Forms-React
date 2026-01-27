import React, { useEffect, useMemo, useState, useRef } from "react";
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
import PaginationButtons from "../../components/pagination/PaginationButtons.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";

// API Utils
import { listar_formularios, criar_formulario_completo } from "../../api/forms/forms_utils";

// --- 1. OPÇÕES DE CLASSIFICAÇÃO ---
const OPCOES_ESPECIALIDADES = [
    { value: 'Fisioterapia', label: 'Fisioterapia' },
    { value: 'Terapia Ocupacional', label: 'Terapia Ocupacional' },
    { value: 'Fonoaudiologia', label: 'Fonoaudiologia' },
    { value: 'Psicologia', label: 'Psicologia' },
    { value: 'Medicina', label: 'Medicina' },
    { value: 'Enfermagem', label: 'Enfermagem' },
    { value: 'Nutrição', label: 'Nutrição' },
    { value: 'Multidisciplinar', label: 'Multidisciplinar' }
];

const OPCOES_DIAGNOSTICOS = [
    { value: 'AVC', label: 'AVC' },
    { value: 'Parkinson', label: 'Doença de Parkinson' },
    { value: 'TCE', label: 'TCE' },
    { value: 'Lesão Medular', label: 'Lesão Medular' },
    { value: 'Paralisia Cerebral', label: 'Paralisia Cerebral' },
    { value: 'Neuropatia', label: 'Neuropatia' },
    { value: 'Ortopedia', label: 'Ortopedia' },
    { value: 'Geral', label: 'Geral / Outros' }
];

// --- 2. OPÇÕES DE TIPO DE FORMULÁRIO ---
const OPCOES_TIPO_FORMULARIO = [
    { value: 'Evoluções', label: 'Evoluções' },
    { value: 'Escalas/testes', label: 'Escalas/testes' },
    { value: 'Online Survey', label: 'Online Survey' },
    { value: 'Cadastros', label: 'Cadastros' },
    { value: 'Avaliações', label: 'Avaliações' }
];

// --- 3. OPÇÕES DE PERGUNTAS ---
const TIPO_PERGUNTA_OPTIONS = [
    { value: "TEXTO_LIVRE", label: "Texto livre" },
    { value: "DATA", label: "Data" },
    { value: "NUMERO_INT", label: "Número inteiro" },
    { value: "NUMERO_FLOAT", label: "Número decimal" },
    { value: "SELECAO_UNICA", label: "Seleção única" },
    { value: "SELECAO_MULTIPLA", label: "Seleção múltipla" },
    { value: "TEXTO_TOPICO", label: "Tópico de texto" },
    { value: "TEXTO_SUBTOPICO", label: "Subtópico de texto" }
];

function EditarFormulario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('lista'); 

  // =========================================================================
  // ABA 1: LISTAR (Lógica)
  // =========================================================================
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [selectedTipos, setSelectedTipos] = useState([]); 
  const [busca, setBusca] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  useEffect(() => {
    if (activeTab !== 'lista') return;
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listar_formularios();
        if (isMounted) setForms(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) setError("Falha ao carregar formulários.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [activeTab]);

  const getId = (f) => f?.formulario_id ?? f?.id ?? f?.formId;
  const getTitulo = (f) => f?.nome_formulario ?? f?.titulo ?? f?.nomeEscala ?? `Formulário ${getId(f)}`;
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
  }, [forms, selectedTipos, user?.especialidade, busca]);

  const tipoOptionsFilter = useMemo(() => {
    const set = new Map();
    for (const f of forms) {
      const t = getTipo(f);
      if (t && !set.has(t)) set.set(t, { value: t, label: String(t) });
    }
    return Array.from(set.values());
  }, [forms]);

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


  // =========================================================================
  // 🧠 ABA 2: CRIAR NOVO
  // =========================================================================
  
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

  // Drag & Drop
  const onDragStart = (index, e) => { try { e.dataTransfer.setData("text/plain", String(index)); } catch {} setDragIndex(index); };
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
    if (!novoForm.titulo.trim()) return Swal.fire('Erro', 'Nome do formulário é obrigatório.', 'error');
    if (!novoForm.tipo) return Swal.fire('Erro', 'Selecione o Tipo do formulário.', 'error');
    if (novasEspecialidades.length === 0) return Swal.fire('Aviso', 'Selecione ao menos uma especialidade.', 'warning');
    
    const errors = [];
    questions.forEach((q, idx) => {
        if (!q.texto.trim()) errors.push(`Pergunta ${idx+1}: Texto obrigatório.`);
        if (requiresOptions(q.tipo) && (!q.opcoes || q.opcoes.length === 0)) errors.push(`Pergunta ${idx+1}: Requer opções.`);
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
            opcoes_resposta: q.opcoes.map(o => ({ label: o.label, valor: o.valor }))
        }))
    };

    const result = await Swal.fire({
        title: 'Criar Formulário?',
        html: `Confirma a criação de "<b>${novoForm.titulo}</b>" (${novoForm.tipo.label})?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim, criar',
        confirmButtonColor: '#10b981'
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
                confirmButtonColor: '#3B82F6', 
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
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      {/* Container com Gradiente Apollo */}
      <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* Card Branco Principal */}
        <div className="bg-white h-full rounded-xl flex flex-col gap-6 xl:shadow-md w-[98%] md:p-8 p-4 overflow-y-auto relative pb-16">
          
          {/* CABEÇALHO */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
              <div className="flex flex-col">
                  <h1 className="font-extrabold text-2xl md:text-3xl text-gray-800 line-clamp-1">
                    ✍️ Gestão de Formulários
                  </h1>
                  <p className="text-gray-400 mt-1 text-sm md:text-base hidden md:block">
                    {activeTab === 'lista' ? 'Gerencie os formulários existentes.' : 'Preencha os dados do novo instrumento.'}
                  </p>
              </div>

              <div className="flex gap-2 items-center w-full md:w-auto justify-end">
                 
                 {/* ABAS */}
                 <div className="bg-gray-100 p-1 rounded-xl flex gap-1 shadow-inner mr-2">
                    <button onClick={() => setActiveTab('lista')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'lista' ? 'bg-white text-apollo-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        <ListBulletIcon className="w-4 h-4" /> Lista
                    </button>
                    <button onClick={() => setActiveTab('criar')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'criar' ? 'bg-emerald-500 text-white shadow-md' : 'text-gray-500 hover:text-emerald-600'}`}>
                        <PlusCircleIcon className="w-4 h-4" /> Novo
                    </button>
                 </div>
                 {/* BOTÃO VISUALIZAR */}
                 <button 
                    onClick={() => navigate('/forms-terapeuta/visualizar-formularios')} 
                    className="flex-1 md:flex-none bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center gap-2 border border-indigo-100 mr-2"
                    title="Ir para Modo Visualização"
                 >
                    <EyeIcon className="w-4 h-4" /> <span className="hidden sm:inline">Visualizar</span>
                 </button>
                 
                 {/* BOTÃO VOLTAR */}
                 <button onClick={() => navigate('/forms-terapeuta/tela-inicial')} className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer flex items-center gap-2">
                    <ChevronLeftIcon className="w-4 h-4" /> Voltar
                 </button>
              </div>
          </div>

          {/* ======================= ABA 1: LISTA ======================= */}
          {activeTab === 'lista' && (
             <div className="animate-fade-in flex flex-col h-full">
                <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-2">
                    <div className="flex flex-col gap-2 w-full md:w-1/2">
                        <label className="text-sm font-bold text-gray-600">FILTRAR POR TIPO</label>
                        <MultiSelect
                            options={tipoOptionsFilter}
                            value={selectedTipos}
                            onChange={setSelectedTipos}
                            placeholder="Selecione..."
                            className="text-sm cursor-pointer shadow-sm hover:shadow transition-shadow"
                        />
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-1/2">
                        <label className="text-sm font-bold text-gray-600">BUSCAR</label>
                        <div className="relative">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input type="text" placeholder="Nome..." className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full outline-none focus:ring-2 focus:ring-apollo-200 bg-gray-50/50" value={busca} onChange={e => setBusca(e.target.value)} />
                        </div>
                    </div>
                </div>

                {loading && <LoadingGen mensagem="Carregando..." />}
                
                {!!error && !loading && <ErroGen mensagem={error} />}

                {!loading && !error && (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 flex-1 content-start overflow-y-auto pr-2 custom-scrollbar mt-6">
                        {pageItems.map((f) => (
                            <div key={getId(f) || Math.random()} onClick={() => handleEdit(f)} className="group cursor-pointer bg-white border-2 border-gray-200 rounded-2xl p-6 flex flex-col justify-between shadow-md hover:shadow-2xl hover:border-apollo-200 transition-all transform hover:-translate-y-1">
                                <div>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md border border-gray-200 font-bold uppercase">{getTipo(f)}</span>
                                    <h2 className="font-bold text-lg text-gray-800 mt-2 line-clamp-2">{getTitulo(f)}</h2>
                                </div>
                                <div className="mt-4 w-full py-2 rounded-xl bg-apollo-200 text-white font-bold text-center text-sm shadow-sm group-hover:bg-apollo-300 transition-colors flex items-center justify-center gap-2">
                                    <span>Editar</span> <PencilSquareIcon className="w-4 h-4" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {!loading && !error && (
                    <div className="mt-auto pt-4 border-t border-gray-100">
                        <PaginationButtons currentPage={currentPage} totalPages={totalPages} onPrev={() => setCurrentPage(p => Math.max(1, p-1))} onNext={() => setCurrentPage(p => Math.min(totalPages, p+1))} />
                    </div>
                )}
             </div>
          )}

          {/* ======================= ABA 2: CRIAR NOVO ======================= */}
          {activeTab === 'criar' && (
            <div className="flex flex-col gap-6 animate-fade-in pb-10 w-full" ref={scrollRef}>
                
                {/* DADOS GERAIS */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-apollo-300" /> Informações Básicas
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Formulário</label>
                                <AdaptiveInput className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-apollo-200 outline-none"
                                    value={novoForm.titulo} onChange={val => setNovoForm({...novoForm, titulo: val})} placeholder="Ex: Escala de Berg" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                                <SingleSelect 
                                    options={OPCOES_TIPO_FORMULARIO}
                                    value={novoForm.tipo}
                                    onChange={opt => setNovoForm({...novoForm, tipo: opt})}
                                    placeholder="Selecione..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição</label>
                                <AdaptiveInput className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-apollo-200 outline-none"
                                    value={novoForm.descricao} onChange={val => setNovoForm({...novoForm, descricao: val})} placeholder="Descrição breve..." />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b pb-2">
                            <TagIcon className="w-5 h-5 text-apollo-300" /> Classificação
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><BriefcaseIcon className="w-4 h-4" /> Especialidades</label>
                                <MultiSelect options={OPCOES_ESPECIALIDADES} value={novasEspecialidades} onChange={setNovasEspecialidades} placeholder="Selecione..." className="text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-2"><span className="text-apollo-300 font-black">Dx</span> Diagnósticos</label>
                                <MultiSelect options={OPCOES_DIAGNOSTICOS} value={novosDiagnosticos} onChange={setNovosDiagnosticos} placeholder="Selecione..." className="text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ENGINE DE PERGUNTAS */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <ListBulletIcon className="w-5 h-5 text-apollo-300" /> Perguntas ({questions.length})
                        </h2>
                        <button onClick={addQuestion} className="text-apollo-500 border border-apollo-500 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-apollo-50 transition-colors flex items-center gap-1">
                            <PlusCircleIcon className="w-4 h-4" /> Adicionar Pergunta
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="relative h-4 group hover:bg-gray-50 rounded cursor-pointer transition-colors" onClick={() => insertQuestionAt(0)}>
                            <div className="absolute inset-x-0 top-1/2 h-px bg-gray-200 group-hover:bg-apollo-300"></div>
                            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-apollo-500 opacity-0 group-hover:opacity-100 transition-opacity border border-apollo-200 rounded-full">+ Inserir no início</span>
                        </div>

                        {questions.map((q, i) => {
                            // --- LÓGICA DE TÓPICO (Adicionada aqui) ---
                            const isTopic = q.tipo === "TEXTO_TOPICO" || q.tipo === "TEXTO_SUBTOPICO";
                            // ------------------------------------------

                            return (
                                <div 
                                    key={i}
                                    className={`relative border rounded-xl p-4 transition-all duration-200 ${dragIndex === i ? "opacity-50 ring-2 ring-apollo-300 bg-gray-50" : "bg-white border-gray-200 hover:border-apollo-300 hover:shadow-md"}`}
                                    draggable
                                    onDragStart={(e) => onDragStart(i, e)}
                                    onDragOver={(e) => onDragOver(i, e)}
                                    onDrop={(e) => onDrop(i, e)}
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                            <Bars3Icon className="w-5 h-5" />
                                            <span className="text-xs font-bold text-gray-500 uppercase">Pergunta #{i + 1}</span>
                                        </div>
                                        <div className="flex gap-3">
                                            {/* CHECKBOX COM LOGICA APLICADA */}
                                            <label className={`flex items-center gap-1 text-xs font-semibold transition-colors cursor-pointer ${isTopic ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isTopic ? false : q.obrigatoria} 
                                                    disabled={isTopic}
                                                    onChange={(e) => updateField(i, 'obrigatoria', e.target.checked)} 
                                                    className={`accent-apollo-500 ${isTopic ? 'cursor-not-allowed' : ''}`} 
                                                /> 
                                                Obrigatória
                                            </label>
                                            {/* --------------------------- */}
                                            <button onClick={() => removeQuestion(i)} className="text-red-400 hover:text-red-600"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-3 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Enunciado</label>
                                            <AdaptiveInput 
                                                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-apollo-200 outline-none"
                                                value={q.texto} 
                                                onChange={(val) => updateField(i, 'texto', val)} 
                                                placeholder="Ex: Como o paciente está se sentindo?" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Tipo de Resposta</label>
                                            <SingleSelect 
                                                options={TIPO_PERGUNTA_OPTIONS}
                                                value={TIPO_PERGUNTA_OPTIONS.find(o => o.value === q.tipo)}
                                                onChange={(opt) => updateField(i, 'tipo', opt.value)}
                                                placeholder="Selecione..."
                                            />
                                        </div>
                                    </div>

                                    {requiresOptions(q.tipo) && (
                                        <div className="mt-3 pl-4 border-l-2 border-apollo-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-gray-500">Opções</span>
                                                <button onClick={() => addOption(i)} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200 hover:bg-gray-200">+ Add</button>
                                            </div>
                                            <div className="space-y-2">
                                                {q.opcoes?.map((opt, j) => (
                                                    <div key={j} className="flex gap-2 items-center">
                                                        <AdaptiveInput className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs" 
                                                            value={opt.label} onChange={(val) => updateOption(i, j, 'label', val)} placeholder="Texto da opção" />
                                                        <button onClick={() => removeOption(i, j)} className="text-gray-400 hover:text-red-500">×</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="relative h-4 group hover:bg-gray-50 rounded cursor-pointer transition-colors mt-2" onClick={() => insertQuestionAt(i+1)}>
                                        <div className="absolute inset-x-0 top-1/2 h-px bg-gray-100 group-hover:bg-apollo-300"></div>
                                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-apollo-500 opacity-0 group-hover:opacity-100 transition-opacity border border-apollo-200 rounded-full">+ Inserir</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4 justify-between mt-8 pt-6 border-t border-gray-100">
                    <button 
                        onClick={handleSalvarNovo}
                        disabled={loadingSalvar}
                        className="bg-green-600 text-white font-bold rounded-lg px-6 py-3 transition-colors hover:bg-green-700 shadow-sm cursor-pointer w-full md:w-auto md:self-end flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loadingSalvar ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <CheckCircleIcon className="w-6 h-6" />}
                        <span>Salvar Formulário</span>
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