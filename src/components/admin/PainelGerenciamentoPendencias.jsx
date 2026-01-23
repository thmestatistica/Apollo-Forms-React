import React, { useState, useEffect, useCallback } from 'react';
import Swal from 'sweetalert2';
import { 
  MagnifyingGlassIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

// Importando do arquivo que criamos no Passo 1
import { 
    buscar_todas_pendencias, 
    atualizar_pendencia_admin, 
    deletar_pendencia_admin 
} from '../../api/pendencias/pendencias_utils';

const PainelGerenciamentoPendencias = () => {
  const [dados, setDados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editados, setEditados] = useState(new Set()); 
  
  // Filtros
  const [filtros, setFiltros] = useState({
    busca: '',
    status: 'TODOS',
    dataInicio: '',
    dataFim: '',
    especialidade: ''
  });

  // --- 1. CARREGAMENTO ---
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      // Passa os filtros atuais para a API
      const resposta = await buscar_todas_pendencias(filtros); 
      setDados(resposta || []);
      setEditados(new Set()); 
    } catch (error) {
      console.error(error);
      Swal.fire('Erro', 'Falha ao carregar pendências do banco.', 'error');
    } finally {
      setLoading(false);
    }
  }, [filtros]); 

   useEffect(() => {
    carregarDados();
  }, [carregarDados]); 
  
  // --- EDITAR CÉLULA LOCALMENTE ---
  const handleCellChange = (id, campo, valor) => {
    setDados(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [campo]: valor };
      }
      return item;
    }));
    setEditados(prev => new Set(prev).add(id));
  };

  // --- SALVAR NO BANCO ---
  const handleSalvarLinha = async (item) => {
    try {
      setLoading(true);
      await atualizar_pendencia_admin(item.id, {
        status: item.status,
        data_referencia: item.data_referencia, // Manda string ou null, backend converte
        especialidade: item.especialidade,
      });

      setEditados(prev => {
        const novoSet = new Set(prev);
        novoSet.delete(item.id);
        return novoSet;
      });

      const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      Toast.fire({ icon: 'success', title: 'Salvo!' });

    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível salvar.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- DELETAR ---
  const handleExcluir = async (id) => {
    const result = await Swal.fire({
      title: 'Exclusão Permanente',
      text: `Deletar ID ${id}? Isso apaga do banco para sempre.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sim, deletar'
    });

    if (result.isConfirmed) {
      try {
        await deletar_pendencia_admin(id);
        setDados(prev => prev.filter(item => item.id !== id));
        Swal.fire('Deletado', 'Registro removido.', 'success');
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        Swal.fire('Erro', 'Falha ao deletar.', 'error');
      }
    }
  };

  // Filtragem local complementar (para busca texto rápido)
  const dadosVisiveis = dados.filter(item => {
    const termo = filtros.busca.toLowerCase();
    // Proteção com '?' caso venha null do banco
    const nomePac = item.paciente?.nome?.toLowerCase() || '';
    const nomeEsc = item.formulario?.nomeEscala?.toLowerCase() || '';
    const idStr = String(item.id);
    
    return nomePac.includes(termo) || nomeEsc.includes(termo) || idStr.includes(termo);
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-mono text-sm">
      
      {/* HEADER */}
      <div className="bg-white border border-gray-300 shadow-sm p-4 mb-4 rounded-md flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div className="flex flex-col gap-1 w-full md:w-auto">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
            ADMIN: PendenciaEscala
          </h1>
          <p className="text-xs text-gray-500">Total: {dados.length} registros carregados</p>
        </div>

        {/* FILTROS */}
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
            <div className="relative group">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-2 top-2.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Filtrar na tela..." 
                    className="pl-8 pr-2 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none w-48"
                    value={filtros.busca}
                    onChange={e => setFiltros({...filtros, busca: e.target.value})}
                />
            </div>

            {/* Filtros de Backend */}
            <select 
                className="p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                value={filtros.status}
                onChange={e => setFiltros({...filtros, status: e.target.value})}
            >
                <option value="TODOS">Todos Status</option>
                <option value="ABERTA">ABERTA</option>
                <option value="CONCLUIDA">CONCLUIDA</option>
                <option value="NAO_APLICA">NAO_APLICA</option>
            </select>

            <button 
                onClick={carregarDados}
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-1"
                title="Recarregar do Banco"
            >
                <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white border border-gray-300 shadow-sm rounded-md overflow-hidden flex flex-col h-[75vh]">
        <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm text-xs uppercase text-gray-600 font-bold">
                    <tr>
                        <th className="p-2 border-r border-b border-gray-300 w-16 text-center">ID</th>
                        <th className="p-2 border-r border-b border-gray-300">Paciente (Leitura)</th>
                        <th className="p-2 border-r border-b border-gray-300">Escala (Leitura)</th>
                        <th className="p-2 border-r border-b border-gray-300 w-32">Data Ref.</th>
                        <th className="p-2 border-r border-b border-gray-300 w-40">Especialidade</th>
                        <th className="p-2 border-r border-b border-gray-300 w-32">Status</th>
                        <th className="p-2 border-b border-gray-300 w-24 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-sm">
                    {dadosVisiveis.length === 0 ? (
                        <tr><td colSpan="7" className="p-8 text-center text-gray-400">Nada encontrado.</td></tr>
                    ) : (
                        dadosVisiveis.map((row) => {
                            const estaEditado = editados.has(row.id);
                            // Tratamento de data para o input value (yyyy-MM-dd)
                            const dataInput = row.data_referencia ? String(row.data_referencia).slice(0, 10) : '';

                            return (
                                <tr key={row.id} className={`hover:bg-blue-50 transition-colors ${estaEditado ? 'bg-yellow-50' : ''}`}>
                                    
                                    <td className="p-2 border-r border-gray-200 text-center font-mono text-gray-500 select-all">
                                        {row.id}
                                    </td>

                                    <td className="p-2 border-r border-gray-200 truncate max-w-[200px]" title={row.paciente?.nome}>
                                        {row.paciente?.nome || <span className="text-red-300">N/A</span>}
                                    </td>

                                    <td className="p-2 border-r border-gray-200 truncate max-w-[200px]" title={row.formulario?.nomeEscala}>
                                        {row.formulario?.nomeEscala || `Form: ${row.formularioId}`}
                                    </td>

                                    {/* DATA EDITÁVEL */}
                                    <td className="p-0 border-r border-gray-200">
                                        <input 
                                            type="date"
                                            className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 inset-0"
                                            value={dataInput}
                                            onChange={(e) => handleCellChange(row.id, 'data_referencia', e.target.value)}
                                        />
                                    </td>

                                    {/* ESPECIALIDADE EDITÁVEL */}
                                    <td className="p-0 border-r border-gray-200">
                                        <input 
                                            type="text"
                                            className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-400"
                                            value={row.especialidade || ''}
                                            onChange={(e) => handleCellChange(row.id, 'especialidade', e.target.value)}
                                        />
                                    </td>

                                    {/* STATUS EDITÁVEL */}
                                    <td className="p-0 border-r border-gray-200">
                                        <select 
                                            className={`w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-400 text-xs font-bold
                                                ${row.status === 'ABERTA' ? 'text-green-600' : ''}
                                                ${row.status === 'CONCLUIDA' ? 'text-gray-400' : ''}
                                                ${row.status === 'NAO_APLICA' ? 'text-red-500' : ''}
                                            `}
                                            value={row.status || 'ABERTA'}
                                            onChange={(e) => handleCellChange(row.id, 'status', e.target.value)}
                                        >
                                            <option value="ABERTA">ABERTA</option>
                                            <option value="CONCLUIDA">CONCLUIDA</option>
                                            <option value="NAO_APLICA">NAO_APLICA</option>
                                        </select>
                                    </td>

                                    <td className="p-2 flex items-center justify-center gap-2">
                                        {estaEditado ? (
                                            <button 
                                                onClick={() => handleSalvarLinha(row)}
                                                className="text-white bg-green-600 hover:bg-green-700 p-1 rounded shadow animate-pulse"
                                                title="Salvar alterações"
                                            >
                                                <CheckCircleIcon className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleExcluir(row.id)}
                                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                                                title="Deletar registro"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        
        <div className="bg-gray-50 border-t border-gray-300 p-2 text-xs text-gray-500 flex justify-between">
            <span>Mostrando {dadosVisiveis.length} de {dados.length}</span>
            <span>Alterações pendentes: {editados.size}</span>
        </div>
      </div>
    </div>
  );
};

export default PainelGerenciamentoPendencias;