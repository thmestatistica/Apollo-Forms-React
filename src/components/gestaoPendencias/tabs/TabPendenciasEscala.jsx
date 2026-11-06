import { useEffect, useMemo, useState } from 'react';
import { FaPen, FaRegPaperPlane, FaTrashAlt } from 'react-icons/fa';
import { FaPencil, FaRotateLeft } from 'react-icons/fa6';
import { atualizar_pendencia_admin, deletar_pendencia_admin } from '../../../api/pendencias/pendencias_utils';
import { COLUNAS_PENDENCIAS, getData, useFiltrosColuna } from '../../../hooks/gestao/useFiltrosColuna';
import { usePaginacao } from '../../../hooks/gestao/usePaginacao';
import { useSelecaoLinhas } from '../../../hooks/gestao/useSelecaoLinhas';
import AtualizarSelecionados from '../modals/AtualizarSelecionados';
import Paginacao from '../tabela/Paginacao';
import StatusBadge from '../tabela/StatusBadge';
import TabelaGen from '../tabela/TabelaGen';
import usePopup from '../../../hooks/usePopup';
import Popup from '../../common/Popup';

export const MAP_CRIACAO = {
    RETROATIVA: 'Retroativa',
    MANUAL: 'Manual',
    AUTOMATICA: 'Automática',
    DESCONHECIDA: 'Desconhecida',
};

const COLUNAS_FILTRO = {
    ...COLUNAS_PENDENCIAS,
    criacao: {
        get: (row) => row.tipoCriacao || 'DESCONHECIDA',
        ordem: 'asc',
        label: (v) => MAP_CRIACAO[v] ?? v,
    },
};

const TabPendenciasEscala = ({
    dadosFiltrados,
    selectedPacienteId,
    filtros,
    carregarDadosAdmin,
    formulariosOptions,
}) => {
    const [isEditarModalOpen, setIsEditarModalOpen] = useState(false);
    const popup = usePopup()

    const formulariosPorId = useMemo(
        () => new Map((formulariosOptions ?? []).map((f) => [f.value, f.label])),
        [formulariosOptions]
    );

    const dadosComEscala = useMemo(
        () => dadosFiltrados.map((row) => ({
            ...row,
            escala: formulariosPorId.get(row.formularioId) ?? '-',
        })),
        [dadosFiltrados, formulariosPorId]
    );

    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro: temFiltroColuna,
        opcoes,
        dadosFiltrados: dadosColuna,
    } = useFiltrosColuna(dadosComEscala, COLUNAS_FILTRO);

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
                render: (row) => (formulariosPorId.get(row.formularioId) ?? 'Formulário Desconhecido').toLowerCase(),
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
                filter: {
                    value: colunaFiltros.criacao,
                    onChange: setFiltroColuna('criacao'),
                    options: opcoes.criacao
                },
                render: (row) => (row.tipoCriacao === "RETROATIVA" ? (
                    <div className='flex flex-row items-center gap-2 px-2 py-0.5 rounded-full shadow-md bg-rose-100 border border-rose-300 max-w-fit text-sm text-rose-700'><FaRotateLeft className='w-3' />Retroativa</div>
                ) : row.tipoCriacao === "MANUAL" ? (
                    <div className='flex flex-row items-center gap-2 px-2 py-0.5 rounded-full shadow-md bg-green-100 border border-green-300 max-w-fit text-sm text-green-700'><FaPen className='w-3' />Manual</div>
                ) : row.tipoCriacao === "AUTOMATICA" ? (
                    <div className='flex flex-row items-center gap-2 px-2 py-0.5 rounded-full shadow-md bg-purple-100 border border-purple-300 max-w-fit text-sm text-purple-700'><FaRegPaperPlane className='w-3' />Automática</div>
                ) : (
                    <div className='flex flex-row items-center gap-2 px-2 py-0.5 rounded-full shadow-md bg-slate-100 border border-slate-300 max-w-fit text-sm text-slate-700'><FaRegPaperPlane className='w-3' />Desconhecida</div>
                ))
            }
        ],
        [colunaFiltros, setFiltroColuna, opcoes]
    );

    const handleRemoverSelecionados = async (rows) => {
        const confirmado = await popup.danger({
            title: "Remover pendências",
            text: (
                <div className='flex flex-col gap-2 text-sm leading-relaxed text-slate-600'>
                    <span>Tem certeza que deseja <span className='bg-red-500 rounded px-2 text-white font-bold'>REMOVER</span> todas as <br /><span className='bg-rose-200/70 rounded px-2 text-slate-700 font-bold'>{rows.length} pendências</span> selecionadas?</span>
                    <span className='bg-red-500/20 text-slate-700 rounded px-2 font-bold w-fit'>Essa ação é irreversível, prossiga com cuidado!</span>
                </div>
            ),
            confirmLabel: "Remover",
            canCancel: true,
            cancelLabel: "Cancelar",
            onConfirm: async () => {
                const resultados = await Promise.allSettled(
                    rows.map((row) => deletar_pendencia_admin(row?.id ?? row))
                );

                const falhas = resultados.filter((r) => r.status === 'rejected').length;

                await carregarDadosAdmin(true, selectedPacienteId);
                limparSelecao();

                if (falhas > 0) {
                    throw new Error(`${falhas} de ${rows.length} pendências não puderam ser removidas`);
                }
            },
        });

        return confirmado;
    };

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
                                onClick={() => handleRemoverSelecionados(selectedRows)}
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

            <Popup {...popup.props} />
        </>
    );
};

export default TabPendenciasEscala;