import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { ArchiveBoxArrowDownIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline';
import {
  atualizar_pendencia_admin,
  buscar_todas_pendencias,
  deletar_pendencia_admin
} from '../../../api/pendencias/pendencias_utils';
import { atualizar_diagnostico_paciente } from '../../../api/pacientes/pacientes_utils';
import { listar_pacientes } from '../../../api/jornada/jornada_utils';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../../../utils/gestao/gestaoReavaliacaoUtils';
import GestaoSectionCard from '../GestaoSectionCard';
import AdminPesquisaCard from './AdminPesquisaCard';

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

const formatDateValue = (date) => {
  if (!date) return '';
  return String(date).slice(0, 10);
};

const AdminRow = React.memo(
  ({ row, estaEditado, onSave, onDelete, onChange }) => {
    const getStatusColorClass = (status) => {
      switch (status) {
        case 'ABERTA':
          return 'text-green-700 bg-green-50 border-green-200';
        case 'CONCLUIDA':
          return 'text-blue-700 bg-blue-50 border-blue-200';
        case 'NAO_APLICA':
          return 'text-red-700 bg-red-50 border-red-200';
        case 'APLICADO_NAO_LANCADO':
          return 'text-amber-700 bg-amber-50 border-amber-200';
        default:
          return 'text-slate-700 bg-white border-slate-200';
      }
    };

    return (
      <tr className={`group hover:bg-apollo-50/30 transition-colors border-b border-gray-100 last:border-0 ${estaEditado ? 'bg-yellow-50/40' : ''}`}>
        <td className="p-3 border-r border-gray-100 text-center text-slate-400 text-xs font-mono align-middle">{row.id}</td>
        <td className="p-3 border-r border-gray-100 align-middle">
          <div className="text-sm font-semibold text-slate-700 whitespace-normal wrap-break-word leading-tight max-w-[260px]">
            {row.formulario?.nomeEscala || 'Sem escala'}
          </div>
        </td>
        <td className="p-3 border-r border-gray-100 align-middle">
          <div className="text-xs font-semibold text-slate-600 whitespace-normal wrap-break-word leading-tight max-w-[220px]">
            {row.especialidade || 'Sem especialidade'}
          </div>
        </td>
        <td className="p-2 border-r border-gray-100 align-middle w-48">
          <div className="h-full w-full flex items-center">
            <select
              className={`w-full p-2 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all appearance-none text-center ${getStatusColorClass(row.status)}`}
              value={row.status || 'ABERTA'}
              onChange={(e) => onChange(row.id, 'status', e.target.value)}
            >
              <option value="ABERTA">ABERTA</option>
              <option value="CONCLUIDA">CONCLUIDA</option>
              <option value="NAO_APLICA">NAO APLICA</option>
              <option value="APLICADO_NAO_LANCADO">APLICADO NAO LANCADO</option>
            </select>
          </div>
        </td>
        <td className="p-2 text-center align-middle">
          <div className="flex justify-center items-center gap-2 h-full opacity-70 group-hover:opacity-100 transition-opacity">
            {estaEditado && (
              <button
                onClick={() => onSave(row)}
                className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-sm transition-all hover:scale-105"
                title="Salvar status"
              >
                <CheckCircleIcon className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => onDelete(row)}
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all hover:scale-105"
              title="Excluir registro"
            >
              <TrashIcon className="w-5 h-5" />
            </button>
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
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [pacientesAdmin, setPacientesAdmin] = useState([]);
  const [editados, setEditados] = useState(new Set());
  const adminDataCache = useRef(null);
  const dataLoaded = useRef(false);
  const [filtros, setFiltros] = useState({ busca: '', status: 'TODOS' });
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [grupoEdicoes, setGrupoEdicoes] = useState({});
  const [diagnosticoPacienteEdicao, setDiagnosticoPacienteEdicao] = useState(null);

  const carregarDadosAdmin = useCallback(async (forceRefresh = false, pacienteId = '') => {
    if (!pacienteId) {
      setDadosAdmin([]);
      adminDataCache.current = null;
      dataLoaded.current = false;
      return;
    }
    if (!forceRefresh && adminDataCache.current?.pacienteId === pacienteId && dataLoaded.current) {
      setDadosAdmin(adminDataCache.current?.data || []);
      return;
    }
    setLoadingAdmin(true);
    try {
      const resposta = await buscar_todas_pendencias({ pacienteId: pacienteId });
      const data = resposta || [];
      setDadosAdmin(data);
      adminDataCache.current = { pacienteId, data };
      dataLoaded.current = true;
      setEditados(new Set());
      setGrupoEdicoes({});
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar tabela.', 'error');
      console.error('Erro ao carregar pendências admin:', error);
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  const carregarPacientesAdmin = useCallback(async () => {
    setLoadingPacientes(true);
    try {
      const resposta = await listar_pacientes();
      const lista = Array.isArray(resposta) ? resposta : [];
      const filtrados = lista.filter((pac) => {
        if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
          if (!allowedPatientIds.has(Number(pac?.id))) return false;
        }
        if (isNomeIgnorado(pac?.nome, INCLUIR_TESTES_GESTAO)) return false;
        if (pac?.ativo == null) return true;
        return Boolean(pac?.ativo);
      });
      setPacientesAdmin(filtrados);
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar pacientes.', 'error');
      console.error('Erro ao carregar pacientes admin:', error);
      setPacientesAdmin([]);
    } finally {
      setLoadingPacientes(false);
    }
  }, [accessMode, allowedPatientIds]);

  useEffect(() => {
    carregarPacientesAdmin();
  }, [carregarPacientesAdmin]);

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
          <div class="font-bold text-slate-800 text-lg mb-1 whitespace-normal wrap-break-word">${item.formulario?.nomeEscala || 'Sem escala'}</div>
                <div class="text-xs text-slate-500 mb-2 font-mono">ID: ${item.id}</div>
                <ul class="text-xs bg-white p-2 rounded border border-slate-100 space-y-1">
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

  const pacientesDisponiveis = useMemo(() => {
    return (pacientesAdmin || [])
      .map((pac) => ({
        id: pac?.id,
        nome: pac?.nome || 'Sem paciente'
      }))
      .filter((pac) => pac.id != null)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pacientesAdmin]);

  const pacienteSelecionado = useMemo(
    () => pacientesDisponiveis.find((p) => String(p.id) === String(selectedPacienteId)),
    [pacientesDisponiveis, selectedPacienteId]
  );

  useEffect(() => {
    if (!selectedPacienteId) return;
    if (!pacienteSelecionado) setSelectedPacienteId('');
  }, [selectedPacienteId, pacienteSelecionado]);

  useEffect(() => {
    setDiagnosticoPacienteEdicao(null);
  }, [selectedPacienteId]);

  const dadosPaciente = useMemo(() => {
    if (!selectedPacienteId) return [];
    return dadosAdmin.filter((item) => {
      if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
        const pid = item?.paciente?.id ?? item?.pacienteId;
        if (pid == null || !allowedPatientIds.has(Number(pid))) return false;
      }
      if (isNomeIgnorado(item?.paciente?.nome, INCLUIR_TESTES_GESTAO)) return false;
      const pid = item?.paciente?.id ?? item?.pacienteId;
      return String(pid) === String(selectedPacienteId);
    });
  }, [dadosAdmin, accessMode, allowedPatientIds, selectedPacienteId]);

  const diagnosticoPacienteInfo = useMemo(() => {
    const diagValues = new Set(dadosPaciente.map((item) => item.diagnosticoMacro).filter(Boolean));
    let label = 'Sem diagnostico';
    if (diagValues.size === 1) label = Array.from(diagValues)[0];
    if (diagValues.size > 1) label = 'Misto';
    const selectValue = diagValues.size === 1 ? Array.from(diagValues)[0] : '';
    return { label, selectValue };
  }, [dadosPaciente]);

  const dadosFiltrados = useMemo(() => {
    if (!selectedPacienteId) return [];
    const termo = filtros.busca.toLowerCase();
    const statusFiltro = filtros.status;
    return dadosAdmin.filter((item) => {
      if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
        const pid = item?.paciente?.id ?? item?.pacienteId;
        if (pid == null || !allowedPatientIds.has(Number(pid))) return false;
      }
      if (isNomeIgnorado(item?.paciente?.nome, INCLUIR_TESTES_GESTAO)) return false;
      const pid = item?.paciente?.id ?? item?.pacienteId;
      if (String(pid) !== String(selectedPacienteId)) return false;
      const matchStatus = statusFiltro === 'TODOS' || item.status === statusFiltro;
      if (!matchStatus) return false;
      if (!termo) return true;
      const nomeEsc = item.formulario?.nomeEscala?.toLowerCase() || '';
      const idStr = String(item.id);
      return nomeEsc.includes(termo) || idStr.includes(termo);
    });
  }, [dadosAdmin, filtros, accessMode, allowedPatientIds, selectedPacienteId]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    dadosFiltrados.forEach((item) => {
      const dataRef = formatDateValue(item.data_referencia) || 'Sem data';
      if (!mapa.has(dataRef)) {
        mapa.set(dataRef, {
          dataRef,
          itens: []
        });
      }
      mapa.get(dataRef).itens.push(item);
    });

    return Array.from(mapa.values())
      .map((grupo) => {
        const itensOrdenados = [...grupo.itens].sort((a, b) => {
          const espA = (a.especialidade || '').toLowerCase();
          const espB = (b.especialidade || '').toLowerCase();
          if (espA !== espB) return espA.localeCompare(espB);
          const nomeA = (a.formulario?.nomeEscala || '').toLowerCase();
          const nomeB = (b.formulario?.nomeEscala || '').toLowerCase();
          return nomeA.localeCompare(nomeB);
        });

        return {
          ...grupo,
          itens: itensOrdenados
        };
      })
      .sort((a, b) => String(b.dataRef).localeCompare(String(a.dataRef)));
  }, [dadosFiltrados]);

  const handleGroupEditChange = useCallback((groupKey, campo, valor) => {
    setGrupoEdicoes((prev) => ({
      ...prev,
      [groupKey]: {
        ...prev[groupKey],
        [campo]: valor
      }
    }));
  }, []);

  const aplicarEdicaoGrupo = useCallback(
    (grupo) => {
      const edits = grupoEdicoes[grupo.dataRef] || {};
      const hasDataEdit = Object.prototype.hasOwnProperty.call(edits, 'data_referencia');

      if (!hasDataEdit) {
        Swal.fire({
          icon: 'info',
          title: 'Sem ajustes',
          text: 'Altere a data para aplicar no grupo.',
          timer: 1800,
          showConfirmButton: false
        });
        return;
      }

      const ids = new Set(grupo.itens.map((item) => item.id));
      setDadosAdmin((prev) => {
        const atualizados = prev.map((item) => {
          if (!ids.has(item.id)) return item;
          const atualizado = { ...item };
          if (hasDataEdit) atualizado.data_referencia = edits.data_referencia;
          return atualizado;
        });
        adminDataCache.current = atualizados;
        return atualizados;
      });

      setEditados((prev) => {
        const novo = new Set(prev);
        grupo.itens.forEach((item) => novo.add(item.id));
        return novo;
      });
    },
    [grupoEdicoes]
  );

  const aplicarDiagnosticoPaciente = useCallback(async () => {
    if (!selectedPacienteId) return;
    if (diagnosticoPacienteEdicao == null) {
      Swal.fire({
        icon: 'info',
        title: 'Sem ajustes',
        text: 'Selecione o diagnostico macro para aplicar ao paciente.',
        timer: 1800,
        showConfirmButton: false
      });
      return;
    }

    if (!diagnosticoPacienteEdicao) {
      Swal.fire({
        icon: 'warning',
        title: 'Selecao invalida',
        text: 'Escolha um diagnostico macro valido.',
        timer: 1800,
        showConfirmButton: false
      });
      return;
    }

    try {
      setLoadingAdmin(true);
      await atualizar_diagnostico_paciente(selectedPacienteId, diagnosticoPacienteEdicao);

      const ids = new Set(dadosPaciente.map((item) => item.id));
      setDadosAdmin((prev) => {
        const atualizados = prev.map((item) => {
          if (!ids.has(item.id)) return item;
          return { ...item, diagnosticoMacro: diagnosticoPacienteEdicao };
        });
        adminDataCache.current = atualizados;
        return atualizados;
      });

      setEditados((prev) => {
        const novo = new Set(prev);
        dadosPaciente.forEach((item) => novo.add(item.id));
        return novo;
      });

      setDiagnosticoPacienteEdicao(null);
    } catch (error) {
      Swal.fire('Erro', 'Nao foi possivel atualizar o diagnostico do paciente.', 'error');
      console.error('Erro ao atualizar diagnostico do paciente:', error);
    } finally {
      setLoadingAdmin(false);
    }
  }, [selectedPacienteId, diagnosticoPacienteEdicao, dadosPaciente]);

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
            <span class="font-bold text-slate-700 text-sm whitespace-normal wrap-break-word pr-2">ID ${item.id} - ${item.formulario?.nomeEscala || 'Sem escala'}</span>
                </div>
                <div class="flex justify-between items-end">
            <span class="text-[11px] text-slate-500 italic whitespace-normal wrap-break-word w-4/5 leading-tight">Status atualizado</span>
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
                <div class="bg-slate-50 rounded-lg border border-slate-200 shadow-inner max-h-64 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(90,39,121,0.55)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-2xl [&::-webkit-scrollbar-thumb]:bg-[rgba(90,39,121,0.45)] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(90,39,121,0.65)]">
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
    <div className="flex flex-col gap-8 animate-fade-in w-full">
      <AdminPesquisaCard
        selectedPacienteId={selectedPacienteId}
        setSelectedPacienteId={setSelectedPacienteId}
        editados={editados}
        setEditados={setEditados}
        setGrupoEdicoes={setGrupoEdicoes}
        setDiagnosticoPacienteEdicao={setDiagnosticoPacienteEdicao}
        carregarDadosAdmin={carregarDadosAdmin}
        loadingAdmin={loadingAdmin}
        loadingPacientes={loadingPacientes}
        pacientesDisponiveis={pacientesDisponiveis}
        filtros={filtros}
        setFiltros={setFiltros}
      />

      <GestaoSectionCard
        title="Pendências"
        count={dadosFiltrados.length}
        countLabel="itens encontrados"
      >
        <div className="flex-1 overflow-auto h-[600px] relative bg-white [scrollbar-width:thin] [scrollbar-color:rgba(90,39,121,0.55)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-2xl [&::-webkit-scrollbar-thumb]:bg-[rgba(90,39,121,0.45)] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(90,39,121,0.65)]">
        {loadingAdmin && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-amber-500"></div>
              <span className="text-amber-600 font-bold text-sm uppercase tracking-wide">Carregando dados...</span>
            </div>
          </div>
        )}
        {!selectedPacienteId ? (
          <div className="p-16 text-center text-gray-400 italic">Selecione um paciente para iniciar a pesquisa.</div>
        ) : (
          <div className="p-4 flex flex-col gap-5">
            <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-linear-to-br from-indigo-50 via-white to-white shadow-sm">
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100/60 blur-2xl"></div>
              <div className="absolute -left-8 -bottom-10 h-24 w-24 rounded-full bg-indigo-200/40 blur-2xl"></div>
              <div className="relative p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-600 shadow-sm">
                      Dados do paciente
                    </div>
                    <div className="mt-3 text-lg font-semibold text-slate-900">{pacienteSelecionado?.nome || 'Paciente'}</div>
                    <div className="mt-1 text-xs text-slate-500">Diagnostico atual</div>
                    <div className="mt-1 inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-700">
                      {diagnosticoPacienteInfo.label}
                    </div>
                  </div>
                  <div className="grid w-full gap-3 sm:grid-cols-[1.4fr_1fr] lg:w-auto">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Diagnostico macro</label>
                      <select
                        value={diagnosticoPacienteEdicao ?? diagnosticoPacienteInfo.selectValue}
                        onChange={(e) => setDiagnosticoPacienteEdicao(e.target.value)}
                        className="mt-2 h-10 w-full rounded-xl border border-indigo-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                      >
                        <option value="">Selecione...</option>
                        {DIAGNOSTICO_OPCOES.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={aplicarDiagnosticoPaciente}
                        className="h-10 w-full rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0"
                      >
                        Aplicar no paciente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {grupos.length === 0 ? (
              <div className="p-16 text-center text-gray-400 italic">Nenhuma pendência encontrada para este paciente.</div>
            ) : (
              grupos.map((grupo) => (
                <div key={grupo.dataRef} className="border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="bg-linear-to-r from-slate-50 via-white to-slate-50 p-4 border-b border-slate-100">
                    {(() => {
                      const dataRefBase = grupo.dataRef === 'Sem data' ? '' : grupo.dataRef;
                      const dataRefValue = grupoEdicoes[grupo.dataRef]?.data_referencia ?? dataRefBase;

                      return (
                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                            <div>
                              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                                Pendencias por data
                              </div>
                              <div className="text-xs text-slate-500 mt-2">{grupo.itens.length} escalas neste grupo</div>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-3 w-full lg:w-auto">
                              <div>
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Data referencia</label>
                                <input
                                  type="date"
                                  value={dataRefValue || ''}
                                  onChange={(e) => handleGroupEditChange(grupo.dataRef, 'data_referencia', e.target.value)}
                                  className="mt-2 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  onClick={() => aplicarEdicaoGrupo(grupo)}
                                  className="h-10 w-full rounded-xl bg-indigo-600 text-white text-xs font-bold uppercase tracking-wide shadow-md transition-all hover:-translate-y-0.5 hover:bg-indigo-700 active:translate-y-0"
                                >
                                  Aplicar no grupo
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-500 font-bold tracking-wider border-b border-gray-100">
                        <tr>
                          <th className="p-4 w-20 text-center">ID</th>
                          <th className="p-4">Escala</th>
                          <th className="p-4">Especialidade</th>
                          <th className="p-4 w-48">Status</th>
                          <th className="p-4 w-28 text-center">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm font-sans bg-white">
                        {grupo.itens.map((row) => (
                          <AdminRow
                            key={row.id}
                            row={row}
                            estaEditado={editados.has(row.id)}
                            onSave={handleSalvarLinhaAdmin}
                            onDelete={handleExcluirAdmin}
                            onChange={handleCellChangeAdmin}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        </div>
      </GestaoSectionCard>

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
      </div>
    </div>
  );
};

export default AdminTab;
