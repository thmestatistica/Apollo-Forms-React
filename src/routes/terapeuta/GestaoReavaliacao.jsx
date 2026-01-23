import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom'; // <--- Importado
import { useReavaliacao } from '../../hooks/useReavaliacao';
import { 
  TrashIcon, PencilSquareIcon, CheckBadgeIcon, MagnifyingGlassIcon, 
  UserIcon, CalendarDaysIcon, TableCellsIcon, PlusCircleIcon, 
  ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, 
  ChevronLeftIcon, ChevronRightIcon, ChevronDoubleLeftIcon, ChevronDoubleRightIcon,
  ArchiveBoxArrowDownIcon
} from '@heroicons/react/24/outline';

import { 
    buscar_todas_pendencias, 
    atualizar_pendencia_admin, 
    deletar_pendencia_admin 
} from '../../api/pendencias/pendencias_utils';

const DIAGNOSTICO_OPCOES = [
  "AVC", "Doença de Parkinson", "TCE", "Dor Crônica", 
  "Doenças Degenerativas", "Lesão Medular", "Doença Oncológica", 
  "Paralisia Cerebral", "Neuropatia", "Distonia", "Ortopedia", "Outros"
];

const ITENS_POR_PAGINA = 50; 

// === SUB-COMPONENTE DE LINHA ===
const AdminRow = React.memo(({ row, estaEditado, onSave, onDelete, onChange }) => {
    const dataInputValue = row.data_referencia ? String(row.data_referencia).slice(0, 10) : '';

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'ABERTA': return 'text-green-700 bg-green-100 border-green-200';
            case 'CONCLUIDA': return 'text-blue-700 bg-blue-100 border-blue-200';
            case 'NAO_APLICA': return 'text-red-700 bg-red-100 border-red-200';
            default: return 'text-slate-700 bg-white border-slate-200';
        }
    };

    return (
        <tr className={`hover:bg-amber-50 transition-colors border-b border-slate-50 last:border-0 ${estaEditado ? 'bg-yellow-50' : ''}`}>
            {/* ID */}
            <td className="p-2 border-r border-slate-100 text-center text-slate-400 text-xs font-mono align-middle">
                {row.id}
            </td>
            
            {/* Paciente */}
            <td className="p-2 border-r border-slate-100 align-middle">
                <div className="text-sm font-medium text-slate-700 whitespace-normal wrap-break-word leading-tight max-w-[200px]">
                    {row.paciente?.nome || <span className="text-red-300 italic">Sem Paciente</span>}
                </div>
            </td>
            
            {/* Escala */}
            <td className="p-2 border-r border-slate-100 align-middle">
                 <div className="text-sm text-slate-600 whitespace-normal wrap-break-word leading-tight max-w-[200px]">
                    {row.formulario?.nomeEscala}
                 </div>
            </td>

            {/* Data (Editável) */}
            <td className="p-0 border-r border-slate-100 align-middle h-full">
                <input type="date" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 text-sm text-slate-600"
                    value={dataInputValue}
                    onChange={(e) => onChange(row.id, 'data_referencia', e.target.value)}
                />
            </td>

            {/* Especialidade (Editável) */}
            <td className="p-0 border-r border-slate-100 align-middle">
                <input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 text-sm text-slate-600"
                    value={row.especialidade || ''}
                    onChange={(e) => onChange(row.id, 'especialidade', e.target.value)}
                />
            </td>

            {/* Diagnóstico (Select) */}
            <td className="p-0 border-r border-slate-100 align-middle">
                <select 
                    className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-amber-400 text-xs text-slate-600 cursor-pointer"
                    value={row.diagnosticoMacro || ''}
                    onChange={(e) => onChange(row.id, 'diagnosticoMacro', e.target.value)}
                >
                    <option value="">Selecione...</option>
                    {DIAGNOSTICO_OPCOES.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </td>

            {/* Status (Select Colorido) */}
            <td className="p-1 border-r border-slate-100 align-middle">
                <div className="h-full w-full flex items-center">
                    <select 
                        className={`w-full p-1.5 rounded text-xs font-bold border cursor-pointer outline-none transition-all appearance-none text-center ${getStatusColorClass(row.status)}`}
                        value={row.status || 'ABERTA'}
                        onChange={(e) => onChange(row.id, 'status', e.target.value)}
                    >
                        <option value="ABERTA">ABERTA</option>
                        <option value="CONCLUIDA">CONCLUIDA</option>
                        <option value="NAO_APLICA">NAO APLICA</option>
                    </select>
                </div>
            </td>

            {/* Ações */}
            <td className="p-2 text-center align-middle">
                <div className="flex justify-center items-center gap-2 h-full">
                    {estaEditado ? (
                        <button 
                            onClick={() => onSave(row)} 
                            className="text-white bg-green-600 hover:bg-green-700 p-1.5 rounded shadow-sm animate-pulse transition-all" 
                            title="Salvar alterações desta linha"
                        >
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button 
                            onClick={() => onDelete(row)} 
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded transition-all" 
                            title="Excluir registro"
                        >
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}, (prev, next) => prev.row === next.row && prev.estaEditado === next.estaEditado);

const GestaoReavaliacao = () => {
  const navigate = useNavigate(); // <--- Hook de navegação
  const [activeTab, setActiveTab] = useState('gerar'); 

  // ================= ABA 1: GERADOR =================
  const { 
    pacientes, rascunhos, setRascunhos, loading: loadingGen, 
    gerarSugestoes, atualizarRascunho, removerRascunho, salvarNoBanco 
  } = useReavaliacao();

  const [selectedPac, setSelectedPac] = useState('');
  const [dataManual, setDataManual] = useState('');
  const [ultimoPacienteAnalisado, setUltimoPacienteAnalisado] = useState(null);

  const handleTrocaPaciente = (e) => {
    setSelectedPac(e.target.value);
    setRascunhos([]); 
    setUltimoPacienteAnalisado(null);
  };

  const handleAnalyze = () => {
    if (!selectedPac) return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione um paciente.' });
    gerarSugestoes(Number(selectedPac), dataManual);
    setUltimoPacienteAnalisado(selectedPac); 
  };

  const handleSalvarTudo = async () => {
    const result = await Swal.fire({
      title: 'Confirmar envio?',
      text: `Deseja criar ${rascunhos.length} novas pendências?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f766e',
      confirmButtonText: 'Sim, criar'
    });
    if (result.isConfirmed) {
      if (await salvarNoBanco()) {
          setSelectedPac(''); setDataManual(''); setUltimoPacienteAnalisado(null); 
      }
    }
  };
  
  const botaoBloqueado = loadingGen || !selectedPac || (selectedPac === ultimoPacienteAnalisado);

  // ================= ABA 2: ADMIN =================
  const [dadosAdmin, setDadosAdmin] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [editados, setEditados] = useState(new Set());
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  const adminDataCache = useRef(null); 
  const dataLoaded = useRef(false);

  const [filtros, setFiltros] = useState({ busca: '', status: 'TODOS' });

  const carregarDadosAdmin = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && adminDataCache.current && dataLoaded.current) {
        setDadosAdmin(adminDataCache.current);
        return;
    }
    setLoadingAdmin(true);
    try {
      const resposta = await buscar_todas_pendencias({}); 
      setDadosAdmin(resposta || []);
      adminDataCache.current = resposta || [];
      dataLoaded.current = true;
      setEditados(new Set());
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar tabela.', 'error');
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') carregarDadosAdmin();
  }, [activeTab, carregarDadosAdmin]);

  const handleCellChangeAdmin = useCallback((id, campo, valor) => {
    setDadosAdmin(prev => {
        const novosDados = prev.map(item => item.id === id ? { ...item, [campo]: valor } : item);
        adminDataCache.current = novosDados;
        return novosDados;
    });
    setEditados(prev => new Set(prev).add(id));
  }, []);

  // --- 💾 SALVAR LINHA INDIVIDUAL ---
  const handleSalvarLinhaAdmin = useCallback(async (item) => {
    const result = await Swal.fire({
        title: 'Salvar alterações?',
        html: `
            <div class="text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p class="text-sm text-slate-600 mb-2">Você está atualizando:</p>
                <div class="font-bold text-slate-800 text-lg mb-1 whitespace-normal wrap-break-word">${item.paciente?.nome}</div>
                <div class="text-xs text-slate-500 mb-2 font-mono">ID: ${item.id}</div>
                
                <ul class="text-xs bg-white p-2 rounded border border-slate-100 space-y-1">
                    <li class="flex gap-2">
                        <span class="font-bold w-20 shrink-0">Escala:</span>
                        <span class="whitespace-normal wrap-break-word">${item.formulario?.nomeEscala || 'N/A'}</span>
                    </li>
                    <li class="flex gap-2">
                        <span class="font-bold w-20 shrink-0">Especialidade:</span>
                        <span class="whitespace-normal wrap-break-word">${item.especialidade || 'N/A'}</span>
                    </li>
                    <li class="flex gap-2">
                        <span class="font-bold w-20 shrink-0">Status:</span>
                        <span class="uppercase font-bold text-indigo-600">${item.status}</span>
                    </li>
                </ul>
            </div>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#16a34a', // Verde
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, salvar',
        cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {
      setLoadingAdmin(true);
      await atualizar_pendencia_admin(item.id, {
        status: item.status,
        data_referencia: item.data_referencia,
        especialidade: item.especialidade,
        diagnosticoMacro: item.diagnosticoMacro
      });
      setEditados(prev => { const novo = new Set(prev); novo.delete(item.id); return novo; });
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: 'Salvo!' });
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível salvar.', 'error');
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  // --- 📦 SALVAR TUDO ---
  const handleSalvarTudoAdmin = async () => {
    if (editados.size === 0) return Swal.fire({ icon: 'info', title: 'Sem alterações', timer: 2000, showConfirmButton: false });

    const itensAlterados = dadosAdmin.filter(item => editados.has(item.id));

    const listaHtml = itensAlterados.map(item => {
        let corStatus = "bg-slate-100 text-slate-600 border-slate-200";
        if(item.status === 'NAO_APLICA') corStatus = "bg-red-50 text-red-600 border-red-200";
        else if(item.status === 'CONCLUIDA') corStatus = "bg-blue-50 text-blue-600 border-blue-200";
        else if(item.status === 'ABERTA') corStatus = "bg-green-50 text-green-600 border-green-200";

        return `
        <div class="flex justify-between items-start p-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors gap-2">
            <div class="flex flex-col text-left w-full">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-slate-700 text-sm whitespace-normal wrap-break-word pr-2">ID ${item.id} - ${item.paciente?.nome}</span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">${item.especialidade || '-'}</span>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-[11px] text-slate-500 italic whitespace-normal wrap-break-word w-4/5 leading-tight">${item.formulario?.nomeEscala}</span>
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase shrink-0 ${corStatus}">
                        ${item.status}
                    </span>
                </div>
            </div>
        </div>`;
    }).join('');

    const result = await Swal.fire({
        title: 'Salvar em Massa',
        html: `
            <div class="text-left w-full">
                <p class="mb-3 text-sm text-slate-600">Você vai aplicar alterações em <b>${editados.size}</b> registros:</p>
                <div class="bg-slate-50 rounded-lg border border-slate-200 shadow-inner max-h-64 overflow-y-auto custom-scrollbar">
                    ${listaHtml}
                </div>
            </div>
        `,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d97706', // Amber
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, salvar tudo!',
        cancelButtonText: 'Cancelar',
        width: '550px'
    });

    if (!result.isConfirmed) return;

    setLoadingAdmin(true);
    let erros = 0;
    
    await Promise.all(itensAlterados.map(async (item) => {
        try {
            await atualizar_pendencia_admin(item.id, {
                status: item.status,
                data_referencia: item.data_referencia,
                especialidade: item.especialidade,
                diagnosticoMacro: item.diagnosticoMacro
            });
        } catch (err) {
            console.error(err);
            erros++;
        }
    }));

    setLoadingAdmin(false);

    if (erros === 0) {
        setEditados(new Set());
        Swal.fire('Sucesso!', 'Todas as alterações foram salvas.', 'success');
    } else {
        Swal.fire('Atenção', `Salvo com ${erros} erros. Verifique a conexão.`, 'warning');
        carregarDadosAdmin(true);
    }
  };

  // --- 🗑️ EXCLUIR ---
  const handleExcluirAdmin = useCallback(async (row) => {
    const result = await Swal.fire({ 
        title: 'Exclusão Permanente', 
        html: `
            <div class="text-left mt-2">
                <div class="bg-red-50 border border-red-100 rounded-lg p-4 mb-3">
                    <h3 class="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">
                        ⚠️ Atenção: Ação Irreversível
                    </h3>
                    <p class="text-red-700 text-xs mb-3">
                        Você está prestes a apagar este registro do banco de dados permanentemente.
                    </p>
                    <div class="bg-white p-3 rounded border border-red-100 shadow-sm text-sm space-y-2">
                        <div class="flex justify-between border-b border-gray-100 pb-1">
                            <span class="text-gray-500">ID:</span> <span class="font-bold text-black">${row.id}</span>
                        </div>
                        <div class="flex flex-col border-b border-gray-100 pb-1">
                            <span class="text-gray-500 text-xs">Paciente:</span> 
                            <span class="font-bold text-black whitespace-normal wrap-break-word">${row.paciente?.nome}</span>
                        </div>
                        <div class="flex flex-col border-b border-gray-100 pb-1">
                            <span class="text-gray-500 text-xs">Escala:</span> 
                            <span class="font-bold text-black whitespace-normal wrap-break-word">${row.formulario?.nomeEscala}</span>
                        </div>
                        <div class="flex justify-between pt-1">
                            <span class="text-gray-500">Especialidade:</span> 
                            <span class="font-bold text-indigo-600 whitespace-normal wrap-break-word text-right">${row.especialidade || '-'}</span>
                        </div>
                    </div>
                </div>
                <p class="text-center text-xs text-slate-500">Tem certeza absoluta?</p>
            </div>
        `, 
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#dc2626', // Red 600 
        cancelButtonColor: '#64748b',
        confirmButtonText: 'Sim, apagar agora',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deletar_pendencia_admin(row.id);
        setDadosAdmin(prev => { 
            const novos = prev.filter(item => item.id !== row.id); 
            adminDataCache.current = novos; 
            return novos; 
        });
        Swal.fire('Deletado!', 'O registro foi removido.', 'success');
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        Swal.fire('Erro', 'Falha ao deletar.', 'error');
      }
    }
  }, []);

  const dadosFiltrados = useMemo(() => {
    const termo = filtros.busca.toLowerCase();
    const statusFiltro = filtros.status;
    return dadosAdmin.filter(item => {
        const matchStatus = statusFiltro === 'TODOS' || item.status === statusFiltro;
        if (!matchStatus) return false;
        const nomePac = item.paciente?.nome?.toLowerCase() || '';
        const nomeEsc = item.formulario?.nomeEscala?.toLowerCase() || '';
        const idStr = String(item.id);
        const diag = item.diagnosticoMacro?.toLowerCase() || '';
        return nomePac.includes(termo) || nomeEsc.includes(termo) || idStr.includes(termo) || diag.includes(termo);
    });
  }, [dadosAdmin, filtros]);

  const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA);
  const dadosPaginados = useMemo(() => {
      const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
      return dadosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [dadosFiltrados, paginaAtual]);

  useEffect(() => { setPaginaAtual(1); }, [filtros]);

  const handlePageInput = (e) => {
      let val = Number(e.target.value);
      if (val < 1) val = 1;
      if (val > totalPaginas) val = totalPaginas;
      setPaginaAtual(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      <div className="max-w-7xl mx-auto mb-8">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
      <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 cursor-default">
          Gerenciador de Reavaliações
          </h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base cursor-default">
          Gestão automatizada e administrativa.
          </p>
      </div>
      
      {/* BARRA DE FERRAMENTAS UNIFICADA */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
          {/* Botão Voltar */}
          <button 
              onClick={() => navigate('/forms-terapeuta/tela-inicial')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all text-slate-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
              title="Voltar para o início"
          >
              <ChevronLeftIcon className="w-5 h-5" />
              Voltar
          </button>

          {/* Separador Visual (Opcional) */}
          <div className="w-px bg-slate-200 my-1 mx-1"></div>

          {/* Abas */}
          <button 
              onClick={() => setActiveTab('gerar')} 
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'gerar' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
              <PlusCircleIcon className="w-5 h-5" /> 
              Gerador
          </button>
          
          <button 
              onClick={() => setActiveTab('admin')} 
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'admin' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
          >
              <TableCellsIcon className="w-5 h-5" /> 
              Admin
          </button>
      </div>
  </div>

        {/* ... (CONTEÚDO DAS ABAS) ... */}
        {activeTab === 'gerar' && (
            <div className="flex flex-col gap-8 animate-fade-in">
                {/* 1. CONTROLES */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden w-full">
                    <div className="bg-indigo-50/50 p-4 border-b border-indigo-100">
                        <h2 className="text-indigo-900 font-bold flex items-center gap-2 cursor-default">
                        <MagnifyingGlassIcon className="w-5 h-5" /> Configurar Análise
                        </h2>
                    </div>
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row gap-6 items-end">
                            <div className="w-full md:flex-1">
                                <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <UserIcon className="w-4 h-4 text-slate-400" /> Paciente
                                </label>
                                <div className="relative">
                                    <select 
                                        className="w-full border border-slate-300 rounded-xl p-3 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all appearance-none text-slate-700 font-medium cursor-pointer hover:border-indigo-400"
                                        value={selectedPac} onChange={handleTrocaPaciente}
                                    >
                                        <option value="">Selecione...</option>
                                        {pacientes.map(p => (<option key={p.id} value={p.id}>{p.nome}</option>))}
                                    </select>
                                </div>
                            </div>
                            <div className="w-full md:w-64">
                                <label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                <CalendarDaysIcon className="w-4 h-4 text-slate-400" /> Data Ref.
                                </label>
                                <input type="date" className="w-full border border-slate-300 rounded-xl p-3 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                    value={dataManual} onChange={(e) => { setDataManual(e.target.value); setUltimoPacienteAnalisado(null); setRascunhos([]); }} />
                            </div>
                            <div className="w-full md:w-auto">
                                <button onClick={handleAnalyze} disabled={botaoBloqueado}
                                    className={`w-full md:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-3
                                    ${botaoBloqueado ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 active:scale-95'}`}
                                >
                                    {loadingGen ? '...' : (selectedPac && selectedPac === ultimoPacienteAnalisado ? 'Feito' : 'Buscar')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TABELA RASCUNHO */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col min-h-[500px] overflow-hidden w-full">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 cursor-default">Área de Preparação</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rascunhos.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                                {rascunhos.length}
                                </span><span className="text-sm text-slate-500">itens encontrados</span>
                            </div>
                        </div>
                        {rascunhos.length > 0 && (
                            <button onClick={handleSalvarTudo} className="cursor-pointer flex items-center gap-2 bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-teal-700 shadow-md transition-all active:scale-95">
                                <CheckBadgeIcon className="w-5 h-5" /> Confirmar Tudo
                            </button>
                        )}
                    </div>
                    <div className="flex-1 overflow-x-auto custom-scrollbar">
                        {rascunhos.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-10 min-h-[300px]">
                                <MagnifyingGlassIcon className="w-12 h-12 text-slate-300 mb-4" />
                                <p className="text-lg font-medium text-slate-500">Nenhuma sugestão no momento</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                                    <tr><th className="px-6 py-4">Detalhes</th><th className="px-6 py-4">Especialidade</th><th className="px-6 py-4">Data Ref.</th><th className="px-6 py-4 text-center">Ação</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {rascunhos.map((item) => (
                                        <tr key={item.tempId} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="px-6 py-4"><div className="font-bold text-slate-800">{item.nomePaciente}</div><div className="text-xs text-indigo-600">{item.nomeEscala}</div></td>
                                            <td className="px-6 py-4"><div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-2 py-1"><PencilSquareIcon className="w-4 h-4 text-slate-400" /><input type="text" value={item.especialidade} onChange={(e)=>atualizarRascunho(item.tempId, 'especialidade', e.target.value)} className="outline-none w-full text-slate-700"/></div></td>
                                            <td className="px-6 py-4"><input type="date" value={item.dataReferencia} onChange={(e)=>atualizarRascunho(item.tempId, 'dataReferencia', e.target.value)} className="border rounded px-2 py-1 text-slate-700 w-full"/></td>
                                            <td className="px-6 py-4 text-center"><button onClick={()=>removerRascunho(item.tempId)} className="text-red-500 hover:bg-red-50 p-2 rounded"><TrashIcon className="w-5 h-5"/></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ================= ABA 2: ADMIN (MELHORADO) ================= */}
        {activeTab === 'admin' && (
            <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden w-full animate-fade-in flex flex-col">
                
                {/* TOOLBAR ADMIN */}
                <div className="bg-amber-50 p-4 border-b border-amber-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-amber-900 font-bold flex items-center gap-2 text-lg">
                        <ExclamationTriangleIcon className="w-6 h-6" /> Administração Global
                    </h2>
                    <div className="flex flex-wrap gap-3 items-center">
                        <div className="relative group">
                            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-amber-400" />
                            <input type="text" placeholder="Buscar ID, Paciente..." className="pl-9 pr-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none w-64 text-sm text-amber-900 placeholder-amber-400"
                                value={filtros.busca} onChange={e => setFiltros({...filtros, busca: e.target.value})} />
                        </div>
                        <select className="p-2 border border-amber-200 rounded-lg text-sm outline-none bg-white text-amber-900 cursor-pointer hover:border-amber-400"
                            value={filtros.status} onChange={e => setFiltros({...filtros, status: e.target.value})}>
                            <option value="TODOS">Todos Status</option>
                            <option value="ABERTA">ABERTA</option>
                            <option value="CONCLUIDA">CONCLUIDA</option>
                            <option value="NAO_APLICA">NAO_APLICA</option>
                        </select>
                        <button onClick={() => carregarDadosAdmin(true)} className="p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 active:scale-95 transition-all shadow-sm">
                            <ArrowPathIcon className={`w-5 h-5 ${loadingAdmin ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* TABELA */}
                <div className="flex-1 overflow-auto h-[600px] custom-scrollbar relative bg-slate-50">
                    {loadingAdmin && (
                        <div className="absolute inset-0 bg-white/60 z-20 flex items-center justify-center backdrop-blur-sm">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
                                <span className="text-amber-700 font-bold text-sm">Carregando dados...</span>
                            </div>
                        </div>
                    )}
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100 sticky top-0 z-10 shadow-sm text-xs uppercase text-slate-500 font-bold tracking-wider">
                            <tr>
                                <th className="p-3 w-16 text-center">ID</th>
                                <th className="p-3">Paciente</th>
                                <th className="p-3">Escala</th>
                                <th className="p-3 w-32">Data Ref.</th>
                                <th className="p-3 w-40">Especialidade</th>
                                <th className="p-3 w-40">Diagnóstico</th>
                                <th className="p-3 w-32">Status</th>
                                <th className="p-3 w-24 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-sans bg-white">
                            {dadosPaginados.length === 0 ? (
                                <tr><td colSpan="8" className="p-12 text-center text-slate-400 italic">Nenhum registro encontrado.</td></tr>
                            ) : (
                                dadosPaginados.map(row => (
                                    <AdminRow 
                                        key={row.id} row={row} 
                                        estaEditado={editados.has(row.id)}
                                        onSave={handleSalvarLinhaAdmin}
                                        onDelete={handleExcluirAdmin}
                                        onChange={handleCellChangeAdmin}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* RODAPÉ */}
                <div className="bg-white p-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        {editados.size > 0 ? (
                            <button 
                                onClick={handleSalvarTudoAdmin}
                                className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 active:scale-95 transition-all shadow-md animate-bounce-subtle"
                            >
                                <ArchiveBoxArrowDownIcon className="w-5 h-5" />
                                Salvar {editados.size} Alterações
                            </button>
                        ) : (
                            <span className="text-xs text-slate-400 font-medium">Nenhuma alteração pendente</span>
                        )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600">
                        <span className="hidden sm:inline">Pág. {paginaAtual} de {totalPaginas}</span>
                        <div className="flex gap-1">
                            <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(1)} className="p-1.5 rounded hover:bg-amber-100 text-amber-700 disabled:opacity-30"><ChevronDoubleLeftIcon className="w-4 h-4" /></button>
                            <button disabled={paginaAtual === 1} onClick={() => setPaginaAtual(p => Math.max(1, p - 1))} className="p-1.5 rounded hover:bg-amber-100 text-amber-700 disabled:opacity-30"><ChevronLeftIcon className="w-4 h-4" /></button>
                            <input type="number" min="1" max={totalPaginas} value={paginaAtual} onChange={handlePageInput} className="w-10 text-center border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 outline-none" />
                            <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))} className="p-1.5 rounded hover:bg-amber-100 text-amber-700 disabled:opacity-30"><ChevronRightIcon className="w-4 h-4" /></button>
                            <button disabled={paginaAtual === totalPaginas} onClick={() => setPaginaAtual(totalPaginas)} className="p-1.5 rounded hover:bg-amber-100 text-amber-700 disabled:opacity-30"><ChevronDoubleRightIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default GestaoReavaliacao;