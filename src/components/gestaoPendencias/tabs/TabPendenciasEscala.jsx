import { useEffect, useMemo, useState } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import { FaPencil } from 'react-icons/fa6';
import { atualizar_pendencia_admin } from '../../../api/pendencias/pendencias_utils';
import { getData, getEscala, useFiltrosColuna } from '../../../hooks/gestao/useFiltrosColuna';
import { usePaginacao } from '../../../hooks/gestao/usePaginacao';
import { useSelecaoLinhas } from '../../../hooks/gestao/useSelecaoLinhas';
import AtualizarSelecionados from '../modals/AtualizarSelecionados';
import Paginacao from '../tabela/Paginacao';
import StatusBadge from '../tabela/StatusBadge';
import TabelaGen from '../tabela/TabelaGen';

const TabPendenciasEscala = ({
    dadosFiltrados,
    selectedPacienteId,
    filtros,
    carregarDadosAdmin,
    formulariosOptions,
}) => {
    const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);

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

    useEffect(() => {
        limparFiltrosColuna();
        limparSelecao();
    }, [selectedPacienteId, limparFiltrosColuna, limparSelecao]);

    const handleSubmit = async (rows, payload) => {
        try {
            await Promise.all(rows.map((row) => atualizar_pendencia_admin(row, payload)));
            await carregarDadosAdmin();
            limparSelecao();
            setIsEditarModalOpen(false);
        } catch (err) {
            console.error(err);
        } finally {
            carregarDadosAdmin(true, selectedPacienteId);
        }
    };

    const columns = useMemo(
        () => [
            {
                key: 'escala',
                header: 'Escala',
                filter: {
                    value: colunaFiltros.escala,
                    onChange: setFiltroColuna('escala'),
                    options: opcoes.escala,
                },
                render: (row) => getEscala(row),
                cellClassName: 'capitalize',
            },
            {
                key: 'criadaEm',
                header: 'Criada em',
                filter: {
                    value: colunaFiltros.criadaEm,
                    onChange: setFiltroColuna('criadaEm'),
                    options: opcoes.criadaEm,
                },
                render: (row) => getData(row),
            },
            {
                key: 'especialidade',
                header: 'Especialidade',
                filter: {
                    value: colunaFiltros.especialidade,
                    onChange: setFiltroColuna('especialidade'),
                    options: opcoes.especialidade,
                },
            },
            {
                key: 'status',
                header: 'Status',
                filter: {
                    value: colunaFiltros.status,
                    onChange: setFiltroColuna('status'),
                    options: opcoes.status,
                },
                render: (row) => <StatusBadge status={row.status} />,
            },
            {
                key: 'criacao',
                header: 'Criação',
                render: (row) => (row.status === "APLICADO_NAO_LANCADO" ? "Retroativa" : "Automática")
            }
        ],
        [colunaFiltros, setFiltroColuna, opcoes]
    );

    return (
        <>
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
                                onClick={() => setIsEditarModalOpen(true)}
                                className="bg-linear-to-r from-blue-700 via-purple-300 to-blue-700 bg-size-[200%_auto] bg-left px-3 py-1 text-white rounded-md transition-all duration-500 hover:bg-right flex gap-3 items-center"
                            >
                                <FaPencil />
                                Atualizar selecionados
                            </button>
                            <button
                                type="button"
                                className="bg-linear-to-r from-purple-300 via-rose-300 to-purple-300 bg-size-[200%_auto] bg-left px-3 py-1 text-white rounded-md transition-all duration-500 hover:bg-right flex gap-3 items-center"
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

            <TabelaGen
                columns={columns}
                data={dadosPaginados}
                getRowKey={(row, index) => row.id ?? `${page}-${index}`}
                emptyMessage="Nenhuma pendência encontrada"
                selectable
                isSelected={isSelected}
                onToggleRow={toggleRow}
                onToggleAll={toggleTodos}
                allSelected={todosSelecionados}
                someSelected={algunsSelecionados}
                selectAllLabel="Selecionar todas as pendências"
                selectRowLabel="Selecionar pendência"
            />

            <Paginacao
                page={page}
                pageSize={pageSize}
                totalItems={dadosColuna.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />

            <AtualizarSelecionados
                open={isEditarModalOpen}
                onClose={() => setIsEditarModalOpen(false)}
                selected={selectedRows}
                onSubmit={handleSubmit}
                formulariosOptions={formulariosOptions}
            />
        </>
    );
};

export default TabPendenciasEscala;