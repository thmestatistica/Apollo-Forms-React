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
  const [selectedIds, setSelectedIds] = useState(new Set()); // Estado para controlar itens selecionados

  // Limpa seleção quando a lista de rascunhos muda (ex: nova geração)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [rascunhos.length]); // Dependência no tamanho para resetar se a lista for recriada

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

  // Função para remover itens selecionados em massa
  const handleRemoveSelected = () => {
    // Filtra mantendo apenas os itens que NÃO estão no set de IDs selecionados
    setRascunhos((prev) => prev.filter((item) => !selectedIds.has(item.tempId)));
    setSelectedIds(new Set()); // Limpa a seleção após remover
  };

  // Alterna seleção de um item individual
  const toggleSelection = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  // Alterna seleção de todos os itens
  const toggleAll = () => {
    if (selectedIds.size === rascunhos.length && rascunhos.length > 0) {
      setSelectedIds(new Set()); // Desmarca tudo se tudo estiver marcado
    } else {
      setSelectedIds(new Set(rascunhos.map((r) => r.tempId))); // Marca tudo
    }
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
      {/* Card de emissão */}
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
            <div className="flex items-center gap-2">
              {/* Botão de exclusão em massa aparece apenas se houver itens selecionados */}
              {selectedIds.size > 0 && (
                <button
                  onClick={handleRemoveSelected}
                  className="cursor-pointer flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 hover:-translate-y-0.5 text-sm"
                  title="Remover selecionados"
                >
                  <TrashIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Remover ({selectedIds.size})</span>
                </button>
              )}
              <button
                onClick={handleSalvarTudo}
                className="cursor-pointer flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all active:scale-95 hover:-translate-y-0.5"
              >
                <CheckBadgeIcon className="w-5 h-5" /> Confirmar Tudo
              </button>
            </div>
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
                  {/* Checkbox para selecionar todos */}
                  <th className="px-4 py-4 rounded-tl-lg w-10 text-center">
                    <input
                      type="checkbox"
                      checked={rascunhos.length > 0 && selectedIds.size === rascunhos.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
                    />
                  </th>
                  <th className="px-6 py-4">Detalhes</th>
                  <th className="px-6 py-4">Especialidade</th>
                  <th className="px-6 py-4">Data Ref.</th>
                  <th className="px-6 py-4 text-center rounded-tr-lg">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {rascunhos.map((item) => {
                  const isSelected = selectedIds.has(item.tempId);
                  return (
                    <tr 
                      key={item.tempId} 
                      className={`transition-colors group ${isSelected ? 'bg-teal-50/60' : 'hover:bg-indigo-50/30'}`}
                    >
                      {/* Checkbox individual da linha */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(item.tempId)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer w-4 h-4"
                        />
                      </td>
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
                          title="Remover item"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </GestaoSectionCard>
    </div>
  );
};

export default GerarTab;
