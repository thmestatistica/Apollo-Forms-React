import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { 
  PencilSquareIcon, 
  PlusCircleIcon, 
  DocumentPlusIcon, 
  TrashIcon, 
  ListBulletIcon, 
  ChevronLeftIcon, 
  CheckCircleIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

// Importando as funções da API
import { 
  criar_formulario_completo, 
  listar_formularios, 
  deletar_formulario 
} from '../../api/forms/forms_utils';

const GerenciadorFormularios = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('editar'); // 'editar' | 'criar'

  // =========================================================================
  // 🧠 LÓGICA DA ABA 1: EDITAR / LISTAR
  // =========================================================================
  const [listaFormularios, setListaFormularios] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [busca, setBusca] = useState('');

  // Carregar lista ao entrar na aba 'editar'
  useEffect(() => {
    if (activeTab === 'editar') {
      fetchFormularios();
    }
  }, [activeTab]);

  const fetchFormularios = async () => {
    setLoadingLista(true);
    try {
      const dados = await listar_formularios();
      setListaFormularios(dados || []);
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível carregar os formulários.', 'error');
    } finally {
      setLoadingLista(false);
    }
  };

  const handleExcluirFormulario = async (id, titulo) => {
    const result = await Swal.fire({
      title: 'Excluir Formulário?',
      text: `Você tem certeza que deseja apagar "${titulo}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir'
    });

    if (result.isConfirmed) {
      try {
        await deletar_formulario(id);
        setListaFormularios(prev => prev.filter(f => f.id !== id));
        Swal.fire('Deletado!', 'Formulário removido.', 'success');
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        Swal.fire('Erro', 'Falha ao excluir.', 'error');
      }
    }
  };

  const handleEditarFormulario = (id) => {
    // Redireciona para uma rota específica de edição se existir,
    // ou abre um modal. Aqui vou supor navegação:
    navigate(`/forms-terapeuta/editar-formulario/${id}`);
  };

  // Filtro de busca local
  const formulariosFiltrados = listaFormularios.filter(f => 
    f.titulo?.toLowerCase().includes(busca.toLowerCase())
  );

  // =========================================================================
  // 🧠 LÓGICA DA ABA 2: CRIAR NOVO
  // =========================================================================
  const [novoForm, setNovoForm] = useState({ titulo: '', descricao: '' });
  const [perguntas, setPerguntas] = useState([
    { id: Date.now(), enunciado: '', tipo: 'ESCALA_NUMERICA' }
  ]);
  const [loadingSalvar, setLoadingSalvar] = useState(false);

  const addPergunta = () => {
    setPerguntas([...perguntas, { id: Date.now(), enunciado: '', tipo: 'ESCALA_NUMERICA' }]);
  };

  const removePergunta = (id) => {
    if (perguntas.length === 1) return Swal.fire('Aviso', 'Mínimo de 1 pergunta.', 'warning');
    setPerguntas(perguntas.filter(p => p.id !== id));
  };

  const updatePergunta = (id, campo, valor) => {
    setPerguntas(perguntas.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  const handleSalvarNovo = async () => {
    if (!novoForm.titulo.trim()) return Swal.fire('Erro', 'Digite um título.', 'error');
    if (perguntas.some(p => !p.enunciado.trim())) return Swal.fire('Erro', 'Preencha todas as perguntas.', 'error');

    // Monta o payload exato que sua função espera
    const payload = {
        titulo: novoForm.titulo,
        descricao: novoForm.descricao,
        perguntas: perguntas.map((p, index) => ({
            enunciado: p.enunciado,
            tipo: p.tipo,
            ordem: index + 1
        }))
    };

    const result = await Swal.fire({
        title: 'Criar Formulário?',
        text: `Confirma a criação de "${novoForm.titulo}" com ${perguntas.length} perguntas?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Sim, criar'
    });

    if (result.isConfirmed) {
        setLoadingSalvar(true);
        try {
            await criar_formulario_completo(payload);
            
            await Swal.fire('Sucesso', 'Formulário criado!', 'success');
            
            // Resetar e voltar para aba de edição
            setNovoForm({ titulo: '', descricao: '' });
            setPerguntas([{ id: Date.now(), enunciado: '', tipo: 'ESCALA_NUMERICA' }]);
            setActiveTab('editar'); // Volta para a lista para ver o novo form
            fetchFormularios(); // Recarrega a lista

        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            Swal.fire('Erro', 'Falha ao salvar no banco.', 'error');
        } finally {
            setLoadingSalvar(false);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto mb-8">
        
        {/* CABEÇALHO */}
        <div className="mb-6 flex flex-col md:flex-row justify-between items-end gap-4">
            <div className="w-full">
                <button 
                    onClick={() => navigate('/forms-terapeuta/tela-inicial')}
                    className="mb-4 text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm font-bold transition-colors"
                >
                    <ChevronLeftIcon className="w-4 h-4" /> Voltar ao Início
                </button>
                <h1 className="text-3xl font-extrabold text-slate-800">
                    Gerenciador de Formulários
                </h1>
                <p className="text-slate-500 mt-1">Crie novos protocolos ou gerencie os existentes.</p>
            </div>

            {/* ABAS */}
            <div className="bg-white p-1.5 rounded-xl shadow-sm border border-slate-200 flex gap-2 w-full md:w-auto">
                <button 
                    onClick={() => setActiveTab('editar')} 
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'editar' 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <PencilSquareIcon className="w-5 h-5" /> 
                    Editar Existentes
                </button>
                
                <button 
                    onClick={() => setActiveTab('criar')} 
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'criar' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    <DocumentPlusIcon className="w-5 h-5" /> 
                    Criar Novo
                </button>
            </div>
        </div>

        {/* ============================================================ */}
        {/* ABA 1: LISTAR E EDITAR */}
        {/* ============================================================ */}
        {activeTab === 'editar' && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 animate-fade-in flex flex-col gap-4">
                
                {/* Busca */}
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                        <ListBulletIcon className="w-5 h-5" /> Seus Formulários
                    </h2>
                    <div className="relative group">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar formulário..." 
                            className="pl-9 pr-4 py-2 border border-indigo-100 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-64 bg-indigo-50/30 transition-all"
                            value={busca}
                            onChange={e => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                {/* Lista */}
                <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar">
                    {loadingLista ? (
                        <div className="text-center py-10 text-indigo-400 font-medium">Carregando lista...</div>
                    ) : formulariosFiltrados.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <DocumentTextIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <p className="text-slate-500">Nenhum formulário encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {formulariosFiltrados.map((form) => (
                                <div key={form.id} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl hover:shadow-md hover:border-indigo-100 transition-all group">
                                    <div>
                                        <h3 className="font-bold text-slate-700 text-base">{form.titulo}</h3>
                                        <p className="text-xs text-slate-400 mt-1">{form.descricao || "Sem descrição"}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleEditarFormulario(form.id)}
                                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors"
                                            title="Editar perguntas"
                                        >
                                            <PencilSquareIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={() => handleExcluirFormulario(form.id, form.titulo)}
                                            className="p-2 text-red-400 bg-red-50 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                                            title="Excluir formulário"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* ============================================================ */}
        {/* ABA 2: CRIAR NOVO */}
        {/* ============================================================ */}
        {activeTab === 'criar' && (
            <div className="flex flex-col gap-6 animate-fade-in">
                
                {/* 1. DADOS BÁSICOS */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                    <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-4 border-b border-emerald-100 pb-2">
                        <PlusCircleIcon className="w-5 h-5" /> Dados do Novo Formulário
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Título</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Escala de Berg"
                                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                                value={novoForm.titulo}
                                onChange={e => setNovoForm({...novoForm, titulo: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Descrição</label>
                            <textarea 
                                placeholder="Finalidade deste formulário..."
                                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none h-20 resize-none"
                                value={novoForm.descricao}
                                onChange={e => setNovoForm({...novoForm, descricao: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* 2. PERGUNTAS */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-6">
                    <div className="flex justify-between items-center mb-4 border-b border-emerald-100 pb-2">
                        <h2 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                            <ListBulletIcon className="w-5 h-5" /> Perguntas ({perguntas.length})
                        </h2>
                        <button onClick={addPergunta} className="text-emerald-600 hover:text-white hover:bg-emerald-600 border border-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1">
                            <PlusCircleIcon className="w-4 h-4" /> Adicionar
                        </button>
                    </div>

                    <div className="space-y-4">
                        {perguntas.map((perg, index) => (
                            <div key={perg.id} className="bg-slate-50 border border-slate-200 p-4 rounded-xl relative group hover:border-emerald-300 transition-colors">
                                <div className="absolute -left-3 top-4 bg-emerald-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shadow-sm">
                                    {index + 1}
                                </div>
                                
                                <div className="flex flex-col md:flex-row gap-4 items-start pl-4">
                                    <div className="flex-1 w-full">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Enunciado da Pergunta</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            value={perg.enunciado}
                                            onChange={(e) => updatePergunta(perg.id, 'enunciado', e.target.value)}
                                        />
                                    </div>
                                    <div className="w-full md:w-48">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo</label>
                                        <select 
                                            className="w-full bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
                                            value={perg.tipo}
                                            onChange={(e) => updatePergunta(perg.id, 'tipo', e.target.value)}
                                        >
                                            <option value="ESCALA_NUMERICA">0 a 4 (Padrão)</option>
                                            <option value="TEXTO_LIVRE">Texto Livre</option>
                                            <option value="SIM_NAO">Sim / Não</option>
                                        </select>
                                    </div>
                                    <div className="pt-5">
                                        <button onClick={() => removePergunta(perg.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. SALVAR */}
                <div className="flex justify-end pt-4 pb-10">
                    <button 
                        onClick={handleSalvarNovo}
                        disabled={loadingSalvar}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loadingSalvar ? <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span> : <CheckCircleIcon className="w-6 h-6" />}
                        Salvar Novo Formulário
                    </button>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};

export default GerenciadorFormularios;