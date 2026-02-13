import React, { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import { useReavaliacao } from '../../hooks/useReavaliacao';
import {
  CheckBadgeIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../../utils/gestao/gestaoReavaliacaoUtils';
import GestaoSectionCard from './shared/GestaoSectionCard';
import EmissaoCard from './tabEmissao/EmissaoCard';

const GerarTab = ({ accessMode, allowedPatientIds, dataManual, setDataManual }) => {
  const {
    pacientes,
    rascunhos,
    setRascunhos,
    loading: loadingGen,
    loadingPacientes,
    gerarSugestoes,
    atualizarRascunho,
    removerRascunho,
    salvarNoBanco
  } = useReavaliacao();

  const [selectedPac, setSelectedPac] = useState('');
  const [ultimoPacienteAnalisado, setUltimoPacienteAnalisado] = useState(null);

  useEffect(() => {
    setRascunhos([]);
    setUltimoPacienteAnalisado(null);
  }, [dataManual, setRascunhos]);

  const pacientesBase = useMemo(() => {
    let lista = pacientes;
    if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
      lista = lista.filter((p) => allowedPatientIds.has(Number(p.id)));
    }
    return lista.filter((p) => !isNomeIgnorado(p?.nome, INCLUIR_TESTES_GESTAO));
  }, [pacientes, accessMode, allowedPatientIds]);

  const pacientesFiltrados = useMemo(() => pacientesBase, [pacientesBase]);

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
      <EmissaoCard
        selectedPac={selectedPac}
        setSelectedPac={setSelectedPac}
        setRascunhos={setRascunhos}
        setUltimoPacienteAnalisado={setUltimoPacienteAnalisado}
        ultimoPacienteAnalisado={ultimoPacienteAnalisado}
        dataManual={dataManual}
        setDataManual={setDataManual}
        pacientesFiltrados={pacientesFiltrados}
        loadingPacientes={loadingPacientes}
        loadingGen={loadingGen}
        botaoBloqueado={botaoBloqueado}
        gerarSugestoes={gerarSugestoes}
      />

      <GestaoSectionCard
        title="Área de Preparação"
        count={rascunhos.length}
        countLabel="itens encontrados"
        action={
          rascunhos.length > 0 ? (
            <button
              onClick={handleSalvarTudo}
              className="cursor-pointer flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 hover:-translate-y-0.5"
            >
              <CheckBadgeIcon className="w-5 h-5" /> Confirmar Tudo
            </button>
          ) : null
        }
      >
        <div className="flex-1 overflow-x-auto p-1 [scrollbar-width:thin] [scrollbar-color:rgba(90,39,121,0.55)_transparent] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-2xl [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-2xl [&::-webkit-scrollbar-thumb]:bg-[rgba(90,39,121,0.45)] [&::-webkit-scrollbar-thumb]:border-2 [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-content [&::-webkit-scrollbar-thumb:hover]:bg-[rgba(90,39,121,0.65)]">
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
      </GestaoSectionCard>
    </div>
  );
};

export default GerarTab;
