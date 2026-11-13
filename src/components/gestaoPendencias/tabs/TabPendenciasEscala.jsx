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
import { toISODate } from '../../../utils/_geral/commonUtils';

export const MAP_CRIACAO = {
    RETROATIVA: 'Retroativa',
    MANUAL: 'Manual',
    AUTOMATICA: 'Automática',
    DESCONHECIDA: 'Desconhecida',
};

const COLUNAS_FILTRO = {
    ...COLUNAS_PENDENCIAS,
    data_referencia: { get: (row) => (row.data_referencia ? toISODate(row.data_referencia) : ''), ordem: 'desc' },
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
            escala: formulariosPorId.get(row.formularioId) ?? 'FORMULARIO DESCONHECIDO',
        })).filter((row) => row.escala !== 'FORMULARIO DESCONHECIDO'),
        [dadosFiltrados, formulariosPorId]
    );

    const dadosDesconhecidos = useMemo(
        () => dadosComEscala.filter((row) => row.escala === 'FORMULARIO DESCONHECIDO'),
        [dadosComEscala]
    );

    console.log(dadosDesconhecidos)

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

    /*const gruposPendencias = useMemo(() => {
        const MARGEM_MS = 60 * 1000;
        const parse = (v) => (v ? new Date(String(v).replace(/(\.\d{3})\d+/, '$1')).getTime() : NaN);

        const itens = dadosColuna
            .map((row) => ({ row, t: parse(row.criadaEm ?? row.createdAt) }))
            .filter((i) => !Number.isNaN(i.t))
            .sort((a, b) => a.t - b.t);

        const grupos = [];
        itens.forEach((item) => {
            const ultimo = grupos[grupos.length - 1];
            if (ultimo && item.t - ultimo.fim <= MARGEM_MS) {
                ultimo.fim = item.t;
                ultimo.total += 1;
            } else {
                grupos.push({ inicio: item.t, fim: item.t, total: 1 });
            }
        });
        return grupos;
    }, [dadosColuna]);*/

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
                key: 'data_referencia',
                header: 'Data de referência',
                filter: {
                    value: colunaFiltros.data_referencia,
                    onChange: setFiltroColuna('data_referencia'),
                    options: opcoes.data_referencia,
                },
                render: (row) => COLUNAS_FILTRO.data_referencia.get(row),
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

            {/*<details className={`mx-4 mt-4 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-md px-3 py-2 w-fix max-h-100 overflow-y-scroll`}>
                <summary className="cursor-pointer font-medium">
                    {gruposPendencias.length} grupos de pendências
                </summary>
                <TabelaGen
                    className="mx-0 mb-0 mt-2 w-full"
                    columns={[
                        {
                            key: 'data',
                            header: 'Data',
                            render: (g) => `${toISODate(g.inicio)}`,
                        },
                        {
                            key: 'hora',
                            header: 'Hora',
                            render: (g) => `${new Date(g.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                        },
                        {
                            key: 'total',
                            header: 'Pendências',
                            render: (g) => g.total,
                        },
                    ]}
                    data={gruposPendencias}
                    getRowKey={(g) => g.inicio}
                    emptyMessage="Nenhum grupo encontrado"
                />
            </details>*/}

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