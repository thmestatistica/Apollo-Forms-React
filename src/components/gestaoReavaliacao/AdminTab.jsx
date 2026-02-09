import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import {
  atualizar_pendencia_admin,
  buscar_todas_pendencias,
  deletar_pendencia_admin
} from '../../api/pendencias/pendencias_utils';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from './gestaoReavaliacaoUtils';

const DIAGNOSTICO_OPCOES = [
  'AVC',
  'Doença de Parkinson',
  'TCE',
  'Dor Crônica',
  'Doenças Degenerativas',
  'Lesão Medular',
  'Doença Oncológica',
  'Paralisia Cerebral',
  'Neuropatia',
  'Distonia',
  'Ortopedia',
  'Outros'
];

const ITENS_POR_PAGINA = 50;

const AdminRow = React.memo(
  ({ row, estaEditado, onSave, onDelete, onChange }) => {
    const dataInputValue = row.data_referencia ? String(row.data_referencia).slice(0, 10) : '';

    const getStatusColorClass = (status) => {
      switch (status) {
        case 'ABERTA':
          return 'text-green-700 bg-green-50 border-green-200';
        case 'CONCLUIDA':
          return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'NAO_APLICA':
          return 'text-red-700 bg-red-50 border-red-200';
        default:
          return 'text-slate-700 bg-white border-slate-200';
      }
    };

    return (
      <tr className={`group hover:bg-apollo-50/30 transition-colors border-b border-gray-100 last:border-0 ${estaEditado ? 'bg-yellow-50/50' : ''}`}>
        <td className="p-3 border-r border-gray-100 text-center text-slate-400 text-xs font-mono align-middle">{row.id}</td>
        <td className="p-3 border-r border-gray-100 align-middle">
          <div className="text-sm font-semibold text-slate-700 whitespace-normal wrap-break-word leading-tight max-w-[200px]">
            {row.paciente?.nome || <span className="text-red-300 italic">Sem Paciente</span>}
          </div>
        </td>
        <td className="p-3 border-r border-gray-100 align-middle">
          <div className="text-sm text-slate-600 whitespace-normal wrap-break-word leading-tight max-w-[200px]">
            {row.formulario?.nomeEscala}
          </div>
        </td>
        <td className="p-1 border-r border-gray-100 align-middle h-full">
          <input
            type="date"
            className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-apollo-300 rounded text-sm text-slate-600 transition-all"
            value={dataInputValue}
            onChange={(e) => onChange(row.id, 'data_referencia', e.target.value)}
          />
        </td>
        <td className="p-1 border-r border-gray-100 align-middle">
          <input
            type="text"
            className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-apollo-300 rounded text-sm text-slate-600 transition-all"
            value={row.especialidade || ''}
            onChange={(e) => onChange(row.id, 'especialidade', e.target.value)}
          />
        </td>
        <td className="p-1 border-r border-gray-100 align-middle">
          <select
            className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-apollo-300 rounded text-xs text-slate-600 cursor-pointer transition-all"
            value={row.diagnosticoMacro || ''}
            onChange={(e) => onChange(row.id, 'diagnosticoMacro', e.target.value)}
          >
            <option value="">Selecione...</option>
            {DIAGNOSTICO_OPCOES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </td>
        <td className="p-2 border-r border-gray-100 align-middle">
          <div className="h-full w-full flex items-center">
            <select
              className={`w-full p-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all appearance-none text-center ${getStatusColorClass(row.status)}`}
              value={row.status || 'ABERTA'}
              onChange={(e) => onChange(row.id, 'status', e.target.value)}
            >
              <option value="ABERTA">ABERTA</option>
              <option value="CONCLUIDA">CONCLUIDA</option>
              <option value="NAO_APLICA">NAO APLICA</option>
            </select>
          </div>
        </td>
        <td className="p-2 text-center align-middle">
          <div className="flex justify-center items-center gap-2 h-full opacity-60 group-hover:opacity-100 transition-opacity">
            {estaEditado ? (
              <button
                onClick={() => onSave(row)}
                className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-sm animate-pulse transition-all hover:scale-105"
                title="Salvar alterações desta linha"
              >
                <CheckCircleIcon className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => onDelete(row)}
                className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all hover:scale-105"
                title="Excluir registro"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  },
  (prev, next) => prev.row === next.row && prev.estaEditado === next.estaEditado
);

const AdminTab = ({ accessMode, allowedPatientIds }) => {
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
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar tabela.', 'error');
      console.error('Erro ao carregar pendências admin:', error);
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  useEffect(() => {
    carregarDadosAdmin();
  }, [carregarDadosAdmin]);

  const handleCellChangeAdmin = useCallback((id, campo, valor) => {
    setDadosAdmin((prev) => {
      const novosDados = prev.map((item) => (item.id === id ? { ...item, [campo]: valor } : item));
      adminDataCache.current = novosDados;
      return novosDados;
    });
    setEditados((prev) => new Set(prev).add(id));
  }, []);

  const handleSalvarLinhaAdmin = useCallback(async (item) => {
    const result = await Swal.fire({
      title: 'Salvar alterações?',
      html: `
            <div class="text-left bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p class="text-sm text-slate-600 mb-2">Você está atualizando:</p>
                <div class="font-bold text-slate-800 text-lg mb-1 whitespace-normal wrap-break-word">${item.paciente?.nome}</div>
                <div class="text-xs text-slate-500 mb-2 font-mono">ID: ${item.id}</div>
                <ul class="text-xs bg-white p-2 rounded border border-slate-100 space-y-1">
                    <li class="flex gap-2"><span class="font-bold w-20 shrink-0">Escala:</span><span class="whitespace-normal wrap-break-word">${item.formulario?.nomeEscala || 'N/A'}</span></li>
                    <li class="flex gap-2"><span class="font-bold w-20 shrink-0">Especialidade:</span><span class="whitespace-normal wrap-break-word">${item.especialidade || 'N/A'}</span></li>
                    <li class="flex gap-2"><span class="font-bold w-20 shrink-0">Status:</span><span class="uppercase font-bold text-indigo-600">${item.status}</span></li>
                </ul>
            </div>
        `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
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
      setEditados((prev) => {
        const novo = new Set(prev);
        novo.delete(item.id);
        return novo;
      });
      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
      Toast.fire({ icon: 'success', title: 'Salvo!' });
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível salvar.', 'error');
      console.error('Erro ao salvar pendência:', error);
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  const handleExcluirAdmin = useCallback(async (row) => {
    const result = await Swal.fire({
      title: 'Exclusão Permanente',
      html: `
            <div class="text-left mt-2">
                <div class="bg-red-50 border border-red-100 rounded-lg p-4 mb-3">
                    <h3 class="text-red-800 font-bold text-sm flex items-center gap-2 mb-2">⚠️ Atenção: Ação Irreversível</h3>
                    <p class="text-red-700 text-xs mb-3">Você está prestes a apagar este registro permanentemente.</p>
                    <div class="bg-white p-3 rounded border border-red-100 shadow-sm text-sm space-y-2">
                        <div class="flex justify-between border-b border-gray-100 pb-1"><span class="text-gray-500">ID:</span> <span class="font-bold text-black">${row.id}</span></div>
                        <div class="flex flex-col border-b border-gray-100 pb-1"><span class="text-gray-500 text-xs">Paciente:</span> <span class="font-bold text-black whitespace-normal wrap-break-word">${row.paciente?.nome}</span></div>
                        <div class="flex flex-col border-b border-gray-100 pb-1"><span class="text-gray-500 text-xs">Escala:</span> <span class="font-bold text-black whitespace-normal wrap-break-word">${row.formulario?.nomeEscala}</span></div>
                        <div class="flex justify-between pt-1"><span class="text-gray-500">Especialidade:</span> <span class="font-bold text-indigo-600 whitespace-normal wrap-break-word text-right">${row.especialidade || '-'}</span></div>
                    </div>
                </div>
                <p class="text-center text-xs text-slate-500">Tem certeza absoluta?</p>
            </div>
        `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, apagar agora',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deletar_pendencia_admin(row.id);
        setDadosAdmin((prev) => {
          const novos = prev.filter((item) => item.id !== row.id);
          adminDataCache.current = novos;
          return novos;
        });
        Swal.fire('Deletado!', 'O registro foi removido.', 'success');
      } catch (error) {
        Swal.fire('Erro', 'Falha ao deletar.', 'error');
        console.error('Erro ao deletar pendência:', error);
      }
    }
  }, []);

  const dadosFiltrados = useMemo(() => {
    const termo = filtros.busca.toLowerCase();
    const statusFiltro = filtros.status;
    return dadosAdmin.filter((item) => {
      if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
        const pid = item?.paciente?.id ?? item?.pacienteId;
        if (pid == null || !allowedPatientIds.has(Number(pid))) return false;
      }
      if (isNomeIgnorado(item?.paciente?.nome, INCLUIR_TESTES_GESTAO)) return false;
      const matchStatus = statusFiltro === 'TODOS' || item.status === statusFiltro;
      if (!matchStatus) return false;
      const nomePac = item.paciente?.nome?.toLowerCase() || '';
      const nomeEsc = item.formulario?.nomeEscala?.toLowerCase() || '';
      const idStr = String(item.id);
      const diag = item.diagnosticoMacro?.toLowerCase() || '';
      return nomePac.includes(termo) || nomeEsc.includes(termo) || idStr.includes(termo) || diag.includes(termo);
    });
  }, [dadosAdmin, filtros, accessMode, allowedPatientIds]);

  const totalPaginas = Math.ceil(dadosFiltrados.length / ITENS_POR_PAGINA) || 1;
  const dadosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return dadosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [dadosFiltrados, paginaAtual]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtros]);

  const handlePageInput = (e) => {
    let val = Number(e.target.value);
    if (val < 1) val = 1;
    if (val > totalPaginas) val = totalPaginas;
    setPaginaAtual(val);
  };

  const handleSalvarTudoAdmin = async () => {
    if (editados.size === 0) return Swal.fire({ icon: 'info', title: 'Sem alterações', timer: 2000, showConfirmButton: false });
    const itensAlterados = dadosAdmin.filter((item) => editados.has(item.id));
    const listaHtml = itensAlterados
      .map((item) => {
        let corStatus = 'bg-slate-100 text-slate-600 border-slate-200';
        if (item.status === 'NAO_APLICA') corStatus = 'bg-red-50 text-red-600 border-red-200';
        else if (item.status === 'CONCLUIDA') corStatus = 'bg-blue-50 text-blue-600 border-blue-200';
        else if (item.status === 'ABERTA') corStatus = 'bg-green-50 text-green-600 border-green-200';

        return `
        <div class="flex justify-between items-start p-3 border-b border-slate-100 last:border-0 hover:bg-white transition-colors gap-2">
            <div class="flex flex-col text-left w-full">
                <div class="flex justify-between items-start mb-1">
                    <span class="font-bold text-slate-700 text-sm whitespace-normal wrap-break-word pr-2">ID ${item.id} - ${item.paciente?.nome}</span>
                    <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-0.5">${item.especialidade || '-'}</span>
                </div>
                <div class="flex justify-between items-end">
                    <span class="text-[11px] text-slate-500 italic whitespace-normal wrap-break-word w-4/5 leading-tight">${item.formulario?.nomeEscala}</span>
                    <span class="px-1.5 py-0.5 rounded text-[8px] font-bold border uppercase shrink-0 ${corStatus}">${item.status}</span>
                </div>
            </div>
        </div>`;
      })
      .join('');

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
      confirmButtonColor: '#d97706',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, salvar tudo!',
      cancelButtonText: 'Cancelar',
      width: '550px'
    });

    if (!result.isConfirmed) return;
    setLoadingAdmin(true);
    let erros = 0;
    await Promise.all(
      itensAlterados.map(async (item) => {
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
      })
    );
    setLoadingAdmin(false);
    if (erros === 0) {
      setEditados(new Set());
      Swal.fire('Sucesso!', 'Todas as alterações foram salvas.', 'success');
    } else {
      Swal.fire('Atenção', `Salvo com ${erros} erros. Verifique a conexão.`, 'warning');
      carregarDadosAdmin(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
      <div className="bg-amber-50/50 p-6 border-b border-amber-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-amber-800 font-bold flex items-center gap-2 text-xl">
          <ExclamationTriangleIcon className="w-6 h-6" /> Administração Global
        </h2>
        <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3.5 text-amber-400" />
            <input
              type="text"
              placeholder="Buscar ID, Paciente..."
              className="pl-9 pr-3 py-2.5 border-2 border-amber-100 rounded-xl focus:border-amber-400 outline-none w-full md:w-64 text-sm text-amber-900 placeholder-amber-300 font-medium bg-white transition-all"
              value={filtros.busca}
              onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
            />
          </div>
          <div className="relative group flex-1 md:flex-none">
            <select
              className="appearance-none p-2.5 pl-4 pr-10 border-2 border-amber-100 rounded-xl text-sm outline-none bg-white text-amber-900 cursor-pointer hover:border-amber-300 focus:border-amber-400 font-bold transition-all w-full"
              value={filtros.status}
              onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            >
              <option value="TODOS">Todos Status</option>
              <option value="ABERTA">ABERTA</option>
              <option value="CONCLUIDA">CONCLUIDA</option>
              <option value="NAO_APLICA">NAO_APLICA</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-amber-500">▼</div>
          </div>
          <button
            onClick={() => carregarDadosAdmin(true)}
            className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 active:scale-95 transition-all shadow-md hover:shadow-lg"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loadingAdmin ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto h-[600px] custom-scrollbar relative bg-white">
        {loadingAdmin && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-amber-500"></div>
              <span className="text-amber-600 font-bold text-sm uppercase tracking-wide">Carregando dados...</span>
            </div>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-gray-100">
            <tr>
              <th className="p-4 w-20 text-center">ID</th>
              <th className="p-4">Paciente</th>
              <th className="p-4">Escala</th>
              <th className="p-4 w-36">Data Ref.</th>
              <th className="p-4 w-44">Especialidade</th>
              <th className="p-4 w-44">Diagnóstico</th>
              <th className="p-4 w-36">Status</th>
              <th className="p-4 w-28 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm font-sans bg-white">
            {dadosPaginados.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-16 text-center text-gray-400 italic">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              dadosPaginados.map((row) => (
                <AdminRow
                  key={row.id}
                  row={row}
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

      <div className="bg-white p-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          {editados.size > 0 ? (
            <button
              onClick={handleSalvarTudoAdmin}
              className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-amber-600 active:scale-95 transition-all shadow-md hover:shadow-lg animate-bounce-subtle"
            >
              <ArchiveBoxArrowDownIcon className="w-5 h-5" />
              Salvar {editados.size} Alterações
            </button>
          ) : (
            <span className="text-xs text-gray-400 font-medium italic pl-2">Nenhuma alteração pendente</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
          <span className="hidden sm:inline">Pág. {paginaAtual} de {totalPaginas}</span>
          <div className="flex gap-1">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual(1)}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronDoubleLeftIcon className="w-4 h-4" />
            </button>
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <input
              type="number"
              min="1"
              max={totalPaginas}
              value={paginaAtual}
              onChange={handlePageInput}
              className="w-12 text-center border border-gray-300 rounded-md focus:border-amber-400 outline-none bg-white py-0.5"
            />
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPaginaAtual(totalPaginas)}
              className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
            >
              <ChevronDoubleRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;
