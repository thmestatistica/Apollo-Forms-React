import React, { useState, useEffect } from 'react';
import { useAdminPacientes } from '../../hooks/useAdminPacientes';
import { useAdminPendencias } from '../../hooks/useAdminPendencias';
import { FaCheckSquare, FaRegSquare, FaMinusSquare, FaTrashAlt } from 'react-icons/fa';
import { FaPencil } from 'react-icons/fa6';
import GestaoSectionCard from '../gestaoReavaliacao/shared/GestaoSectionCard';
import AdminPesquisaCard from '../gestaoReavaliacao/tabPesquisa/AdminPesquisaCard';
import AdminPesquisaMetrics from '../gestaoReavaliacao/tabPesquisa/AdminPesquisaMetrics';
import { twMerge } from 'tailwind-merge';
import HeaderSelect from './tabela/HeaderSelect';
import StatusBadge from './tabela/StatusBadge';
import Paginacao from './tabela/Paginacao';
import AtualizarSelecionados from './modals/AtualizarSelecionados';
import { getData, getEscala, useFiltrosColuna } from '../../hooks/gestao/useFiltrosColuna';
import { useSelecaoLinhas } from '../../hooks/gestao/useSelecaoLinhas';
import { usePaginacao } from '../../hooks/gestao/usePaginacao';
import useForms from '../../hooks/useForms';
import { atualizar_pendencia_admin } from '../../api/pendencias/pendencias_utils';

const ListagemPendencias = ({ accessMode, allowedPatientIds }) => {
    const [selectedPacienteId, setSelectedPacienteId] = useState('');
    const [diagnosticoPacienteEdicao, setDiagnosticoPacienteEdicao] = useState(null);
    const [protocoloPacienteEdicao, setProtocoloPacienteEdicao] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { pacientesDisponiveis, loadingPacientes } = useAdminPacientes({
        accessMode,
        allowedPatientIds,
        selectedPacienteId,
        setSelectedPacienteId,
    });

    const {
        dadosFiltrados,
        loadingAdmin,
        editados,
        setEditados,
        filtros,
        setFiltros,
        carregarDadosAdmin,
    } = useAdminPendencias({
        selectedPacienteId,
        accessMode,
        allowedPatientIds,
    });

    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro: temFiltroColuna,
        opcoes,
        dadosFiltrados: dadosColuna,
    } = useFiltrosColuna(dadosFiltrados);

    const { page, setPage, pageSize, setPageSize, dadosPaginados } = usePaginacao(
        dadosColuna,
        [selectedPacienteId, filtros, colunaFiltros]
    );

    const {
        selectedRows,
        isSelected,
        toggleRow,
        toggleTodos,
        limpar: limparSelecao,
        todosSelecionados,
        algunsSelecionados,
    } = useSelecaoLinhas(dadosColuna);

    const {
        listaFormularios,
        formulariosOptions,
        loadingLista,
        fetchFormularios,
        reload
    } = useForms();

    useEffect(() => { fetchFormularios(); }, [fetchFormularios]);

    useEffect(() => {
        setDiagnosticoPacienteEdicao(null);
        setProtocoloPacienteEdicao('');
        limparFiltrosColuna();
        limparSelecao();
    }, [selectedPacienteId, limparFiltrosColuna, limparSelecao]);

    const handleSubmit = async (rows, payload) => {
        try {
            await Promise.all(
                rows.map((row) => atualizar_pendencia_admin(row, payload))
            );
            await carregarDadosAdmin();
            limparSelecao();
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            carregarDadosAdmin(true, selectedPacienteId);
        }
    };

    return (
        <div className="flex flex-col">
            <AdminPesquisaCard
                selectedPacienteId={selectedPacienteId}
                setSelectedPacienteId={setSelectedPacienteId}
                editados={editados}
                setEditados={setEditados}
                carregarDadosAdmin={carregarDadosAdmin}
                loadingAdmin={loadingAdmin}
                loadingPacientes={loadingPacientes}
                pacientesDisponiveis={pacientesDisponiveis}
                filtros={filtros}
                setFiltros={setFiltros}
            />

            {!selectedPacienteId ? (
                <div className="w-full mt-6 bg-linear-to-r from-teal-500/20 to-orange-300/20 border border-blue-400/50 border-dashed rounded-md text-center py-3 font-semibold text-teal-900/50">
                    <p>Selecione um paciente primeiro</p>
                </div>
            ) : (
                <div>
                    <AdminPesquisaMetrics dadosFiltrados={dadosFiltrados} />
                    <GestaoSectionCard>
                        <div className="mx-4 mt-4 flex items-center justify-between text-sm text-slate-600">
                            <div className="flex gap-6 items-center">
                                <span>
                                    {temFiltroColuna &&
                                        `${dadosColuna.length} de ${dadosFiltrados.length} pendências com os filtros`}{' '}
                                    {selectedRows.length > 0 && `(${selectedRows.length} selecionadas)`}
                                </span>
                                {selectedRows.length > 0 && (
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(true)}
                                            className="bg-linear-to-r from-blue-700 to-purple-300 px-3 py-1 text-white rounded-md hover:bg-blue-900 flex gap-3 items-center"
                                        >
                                            <FaPencil />
                                            Atualizar selecionados
                                        </button>
                                        <button
                                            type="button"
                                            className="bg-linear-to-r from-purple-300 to-rose-300 px-3 py-1 text-white rounded-md hover:bg-blue-900 flex gap-3 items-center"
                                        >
                                            <FaTrashAlt />
                                            Remover selecionados
                                        </button>
                                    </div>
                                )}
                            </div>
                            {temFiltroColuna && (
                                <button
                                    type="button"
                                    onClick={limparFiltrosColuna}
                                    className="font-medium bg-blue-700 text-white py-3 px-6 rounded-xl"
                                >
                                    Limpar filtros das colunas
                                </button>
                            )}
                        </div>

                        <table className="m-4 overflow-hidden rounded-xl">
                            <thead>
                                <tr className="bg-linear-to-r from-blue-700 to-purple-300 text-white text-left">
                                    <th className="py-3">
                                        <span className="flex items-center justify-center px-3">
                                            <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={todosSelecionados ? true : algunsSelecionados ? 'mixed' : false}
                                                aria-label="Selecionar todas as pendências"
                                                onClick={toggleTodos}
                                                className="cursor-pointer text-lg rounded focus-visible:outline-2 focus-visible:outline-white"
                                            >
                                                {todosSelecionados ? (
                                                    <FaCheckSquare />
                                                ) : algunsSelecionados ? (
                                                    <FaMinusSquare />
                                                ) : (
                                                    <FaRegSquare />
                                                )}
                                            </button>
                                        </span>
                                    </th>
                                    <th className="py-3 pr-3">
                                        <HeaderSelect
                                            label="Escala"
                                            value={colunaFiltros.escala}
                                            onChange={setFiltroColuna('escala')}
                                            options={opcoes.escala}
                                        />
                                    </th>
                                    <th className="py-3 pr-3">
                                        <HeaderSelect
                                            label="Criada em"
                                            value={colunaFiltros.criadaEm}
                                            onChange={setFiltroColuna('criadaEm')}
                                            options={opcoes.criadaEm}
                                        />
                                    </th>
                                    <th className="py-3 pr-3">
                                        <HeaderSelect
                                            label="Especialidade"
                                            value={colunaFiltros.especialidade}
                                            onChange={setFiltroColuna('especialidade')}
                                            options={opcoes.especialidade}
                                        />
                                    </th>
                                    <th className="py-3 pr-3">
                                        <HeaderSelect
                                            label="Status"
                                            value={colunaFiltros.status}
                                            onChange={setFiltroColuna('status')}
                                            options={opcoes.status}
                                        />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {dadosPaginados.map((row, index) => (
                                    <tr
                                        key={row.id ?? `${page}-${index}`}
                                        className={twMerge(
                                            'border-b border-slate-200 even:bg-indigo-50/60',
                                            isSelected(row.id) &&
                                            'bg-linear-to-r from-teal-300/50 border-white text-teal-800 to-blue-300/50 even:bg-blue-100'
                                        )}
                                    >
                                        <td className="py-3 flex items-center justify-center mt-1">
                                            <button
                                                type="button"
                                                role="checkbox"
                                                aria-checked={isSelected(row.id)}
                                                aria-label="Selecionar pendência"
                                                onClick={() => toggleRow(row.id)}
                                                className="cursor-pointer text-lg text-blue-700 rounded focus-visible:outline-2 focus-visible:outline-blue-700"
                                            >
                                                {isSelected(row.id) ? <FaCheckSquare /> : <FaRegSquare />}
                                            </button>
                                        </td>
                                        <td className="capitalize py-3">{getEscala(row)}</td>
                                        <td className="py-3">{getData(row)}</td>
                                        <td className="py-3">{row.especialidade}</td>
                                        <td className="py-3">
                                            <StatusBadge status={row.status} />
                                        </td>
                                    </tr>
                                ))}
                                {dadosPaginados.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-slate-500">
                                            Nenhuma pendência encontrada
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        <Paginacao
                            page={page}
                            pageSize={pageSize}
                            totalItems={dadosColuna.length}
                            onPageChange={setPage}
                            onPageSizeChange={setPageSize}
                        />
                    </GestaoSectionCard>
                </div>
            )}
            <AtualizarSelecionados
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                selected={selectedRows}
                onSubmit={handleSubmit}
                formulariosOptions={formulariosOptions}
            />
        </div>
    );
};

export default ListagemPendencias;