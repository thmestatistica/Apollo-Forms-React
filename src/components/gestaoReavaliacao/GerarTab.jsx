import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Swal from 'sweetalert2';
import { useReavaliacao } from '../../hooks/useReavaliacao';
import { buscar_todas_pendencias } from '../../api/pendencias/pendencias_utils';
import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from './gestaoReavaliacaoUtils';

const GerarTab = ({ accessMode, allowedPatientIds, dataManual, setDataManual }) => {
  const {
    pacientes,
    rascunhos,
    setRascunhos,
    loading: loadingGen,
    gerarSugestoes,
    avaliarPossiveisSugestoesPaciente,
    atualizarRascunho,
    removerRascunho,
    salvarNoBanco
  } = useReavaliacao();

  const [selectedPac, setSelectedPac] = useState('');
  const [ultimoPacienteAnalisado, setUltimoPacienteAnalisado] = useState(null);
  const [somenteSemPendencias, setSomenteSemPendencias] = useState(false);
  const [pacientesComPendencias, setPacientesComPendencias] = useState(new Set());
  const [loadingPendenciasPac, setLoadingPendenciasPac] = useState(false);
  const [loadingSugestoes, setLoadingSugestoes] = useState(false);
  const statusSugestoesRef = useRef({});
  const [statusSugestoesPorPaciente, setStatusSugestoesPorPaciente] = useState({});

  const handleTrocaPaciente = (e) => {
    setSelectedPac(e.target.value);
    setRascunhos([]);
    setUltimoPacienteAnalisado(null);
  };

  const carregarPacientesComPendencias = useCallback(async () => {
    try {
      setLoadingPendenciasPac(true);
      const resposta = await buscar_todas_pendencias({});
      const ids = new Set();
      (resposta || []).forEach((item) => {
        const pid = item?.paciente?.id ?? item?.pacienteId;
        if (pid != null) ids.add(Number(pid));
      });
      setPacientesComPendencias(ids);
    } catch (err) {
      console.error('Falha ao carregar pendências para filtro de pacientes:', err);
    } finally {
      setLoadingPendenciasPac(false);
    }
  }, []);

  useEffect(() => {
    if (somenteSemPendencias && pacientesComPendencias.size === 0) {
      carregarPacientesComPendencias();
    }
  }, [somenteSemPendencias, pacientesComPendencias.size, carregarPacientesComPendencias]);

  useEffect(() => {
    statusSugestoesRef.current = {};
    setStatusSugestoesPorPaciente({});
  }, [dataManual]);

  const pacientesBase = useMemo(() => {
    let lista = pacientes;
    if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
      lista = lista.filter((p) => allowedPatientIds.has(Number(p.id)));
    }
    return lista.filter((p) => !isNomeIgnorado(p?.nome, INCLUIR_TESTES_GESTAO));
  }, [pacientes, accessMode, allowedPatientIds]);

  useEffect(() => {
    if (!somenteSemPendencias) return;
    if (pacientesBase.length === 0) return;

    let cancelado = false;

    const carregarSugestoes = async () => {
      setLoadingSugestoes(true);
      const faltando = pacientesBase.filter((p) => statusSugestoesRef.current[p.id] == null);
      if (faltando.length === 0) {
        setLoadingSugestoes(false);
        return;
      }

      const resultados = await Promise.all(
        faltando.map(async (p) => {
          const resultado = await avaliarPossiveisSugestoesPaciente(Number(p.id));
          return [Number(p.id), resultado];
        })
      );

      if (cancelado) return;

      const atualizado = { ...statusSugestoesRef.current };
      resultados.forEach(([id, resultado]) => {
        atualizado[id] = resultado;
      });
      statusSugestoesRef.current = atualizado;
      setStatusSugestoesPorPaciente(atualizado);
      setLoadingSugestoes(false);
    };

    carregarSugestoes();

    return () => {
      cancelado = true;
    };
  }, [somenteSemPendencias, pacientesBase, avaliarPossiveisSugestoesPaciente, dataManual]);

  const pacientesFiltrados = useMemo(() => {
    let lista = pacientesBase;

    if (somenteSemPendencias) {
      if (pacientesComPendencias.size > 0) {
        lista = lista.filter((p) => !pacientesComPendencias.has(Number(p.id)));
      }
      lista = lista.filter((p) => statusSugestoesPorPaciente[p.id]?.status === 'com_sugestoes');
    }

    return lista;
  }, [pacientesBase, somenteSemPendencias, pacientesComPendencias, statusSugestoesPorPaciente]);

  useEffect(() => {
    if (!somenteSemPendencias) return;
    if (!selectedPac) return;
    const aindaNoFiltro = pacientesFiltrados.some((p) => String(p.id) === String(selectedPac));
    if (!aindaNoFiltro) {
      setSelectedPac('');
      setRascunhos([]);
      setUltimoPacienteAnalisado(null);
    }
  }, [somenteSemPendencias, selectedPac, pacientesFiltrados, setRascunhos]);

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
        setSelectedPac('');
        setDataManual('');
        setUltimoPacienteAnalisado(null);
      }
    }
  };

  const botaoBloqueado = loadingGen || !selectedPac || selectedPac === ultimoPacienteAnalisado;

  return (
    <div className="flex flex-col gap-8 animate-fade-in w-full">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full">
        <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
          <h2 className="text-indigo-900 font-bold flex items-center gap-2 cursor-default text-xl">
            <MagnifyingGlassIcon className="w-6 h-6" /> Configurar Análise
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="text-xs font-bold text-indigo-900 tracking-wide uppercase flex items-center gap-2">
              <input
                type="checkbox"
                className="accent-indigo-600 h-4 w-4"
                checked={somenteSemPendencias}
                onChange={(e) => setSomenteSemPendencias(e.target.checked)}
              />
              {somenteSemPendencias && (loadingPendenciasPac || loadingSugestoes) ? (
                <span className="text-indigo-600">Carregando filtro...</span>
              ) : (
                <span>Somente sem pendências</span>
              )}
            </label>
          </div>
        </div>
        <div className="p-8">
          <div className="grid md:grid-cols-3 gap-6 items-end">
            <div className="w-full">
              <label className="text-sm font-bold text-gray-500 tracking-wide uppercase mb-2 flex items-center gap-2 ml-1">
                <UserIcon className="w-4 h-4 text-slate-400" /> Paciente
              </label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl py-3 pl-4 pr-10 cursor-pointer outline-none focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm"
                  value={selectedPac}
                  onChange={handleTrocaPaciente}
                >
                  <option value="">Selecione...</option>
                  {pacientesFiltrados.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">▼</div>
              </div>
            </div>
            <div className="w-full">
              <label className="text-sm font-bold text-gray-500 tracking-wide uppercase mb-2 flex items-center gap-2 ml-1">
                <CalendarDaysIcon className="w-4 h-4 text-slate-400" /> Data Ref.
              </label>
              <input
                type="date"
                className="w-full bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl py-2.5 pl-4 pr-4 cursor-pointer outline-none focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm"
                value={dataManual}
                onChange={(e) => {
                  setDataManual(e.target.value);
                  setUltimoPacienteAnalisado(null);
                  setRascunhos([]);
                }}
              />
            </div>
            <div className="w-full">
              <button
                onClick={handleAnalyze}
                disabled={botaoBloqueado}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-3 text-sm uppercase tracking-wider
                ${botaoBloqueado ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 active:scale-95'}`}
              >
                {loadingGen ? 'Processando...' : selectedPac && selectedPac === ultimoPacienteAnalisado ? 'Análise Concluída' : 'Buscar Pendências'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md border border-gray-100 flex flex-col min-h-[400px] overflow-hidden w-full">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-800 cursor-default">Área de Preparação</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${rascunhos.length > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>
                {rascunhos.length}
              </span>
              <span className="text-sm text-gray-500">itens encontrados</span>
            </div>
          </div>
          {rascunhos.length > 0 && (
            <button
              onClick={handleSalvarTudo}
              className="cursor-pointer flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <CheckBadgeIcon className="w-5 h-5" /> Confirmar Tudo
            </button>
          )}
        </div>
        <div className="flex-1 overflow-x-auto custom-scrollbar p-1">
          {rascunhos.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 p-10 min-h-[300px]">
              <MagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium text-gray-400">Nenhuma sugestão no momento</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 rounded-tl-lg">Detalhes</th>
                  <th className="px-6 py-4">Especialidade</th>
                  <th className="px-6 py-4">Data Ref.</th>
                  <th className="px-6 py-4 text-center rounded-tr-lg">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rascunhos.map((item) => (
                  <tr key={item.tempId} className="hover:bg-indigo-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{item.nomePaciente}</div>
                      <div className="text-xs text-indigo-500 font-semibold mt-0.5">{item.nomeEscala}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
                        <PencilSquareIcon className="w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={item.especialidade}
                          onChange={(e) => atualizarRascunho(item.tempId, 'especialidade', e.target.value)}
                          className="outline-none w-full text-gray-700 bg-transparent font-medium"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="date"
                        value={item.dataReferencia}
                        onChange={(e) => atualizarRascunho(item.tempId, 'dataReferencia', e.target.value)}
                        className="border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 w-full focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 outline-none transition-all shadow-sm bg-white"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removerRascunho(item.tempId)}
                        className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default GerarTab;
