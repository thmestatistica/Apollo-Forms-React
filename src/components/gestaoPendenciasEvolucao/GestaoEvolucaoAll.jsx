import React, { useMemo } from 'react'
import TabelaGen from '../gestaoPendencias/tabela/TabelaGen'
import Paginacao from '../gestaoPendencias/tabela/Paginacao'
import { useFiltrosColuna, useOrdenacaoColuna } from '../../hooks/gestao/useFiltrosColuna'
import { usePaginacao } from '../../hooks/gestao/usePaginacao'

import { NIVEIS, campoNivel, paraChave, paraLabel } from '../../utils/pendencias/niveisPendencia'

const colunasFiltro = {
    profissional: {
        get: (row) => row?.nomeCompleto?.split(' ')[0] + ' ' + row?.nomeCompleto?.split(' ')[1] || '',
        ordem: 'asc',
    },
    totalPendencias: {
        get: (row) => paraChave(row.totalPendencias),
        label: paraLabel,
        ordem: 'desc',
    },
    ...Object.fromEntries(
        NIVEIS.map(({ chave }) => [
            campoNivel(chave),
            {
                get: (row) => paraChave(row[campoNivel(chave)]),
                label: paraLabel,
                ordem: 'desc',
            },
        ])
    ),
    maisAntiga: {
        get: (row) =>
            row.maisAntigaTs
                ? new Date(row.maisAntigaTs).toISOString().slice(0, 10)
                : '',
        label: (iso) => (iso ? iso.split('-').reverse().join('/') : ''),
        ordem: 'asc',
    },
}

function GestaoEvolucaoAll({ dados = [] }) {
    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro,
        opcoes,
        dadosFiltrados,
    } = useFiltrosColuna(dados, colunasFiltro)

    const { ordenacao, alternarOrdenacao, dadosOrdenados } = useOrdenacaoColuna(
        dadosFiltrados,
        colunasFiltro,
        { chave: campoNivel('critica'), direcao: 'desc' }
    )

    const { page, setPage, pageSize, setPageSize, dadosPaginados } = usePaginacao(
        dadosOrdenados,
        [colunaFiltros, ordenacao]
    )

    const columns = useMemo(
        () => [
            {
                key: 'profissional',
                header: 'Profissional',
                sortable: true,
                filter: {
                    value: colunaFiltros.profissional,
                    onChange: setFiltroColuna('profissional'),
                    options: opcoes.profissional,
                },
                render: (row) =>
                    row?.nomeCompleto?.split(' ')[0] + ' ' + row?.nomeCompleto?.split(' ')[1] ||
                    'Profissional Desconhecido',
                cellClassName: 'capitalize text-wrap',
            },
            {
                key: 'totalPendencias',
                header: 'Total',
                sortable: true,
                filter: {
                    value: colunaFiltros.totalPendencias,
                    onChange: setFiltroColuna('totalPendencias'),
                    options: opcoes.totalPendencias,
                },
                render: (row) => row.totalPendencias,
            },
            ...NIVEIS.map(({ chave, label, cor, corVazia }) => {
                const campo = campoNivel(chave)
                return {
                    key: campo,
                    header: label,
                    sortable: true,
                    filter: {
                        value: colunaFiltros[campo],
                        onChange: setFiltroColuna(campo),
                        options: opcoes[campo],
                    },
                    render: (row) => (
                        <span
                            className={`inline-block min-w-8 text-center px-2 py-1 rounded-full text-xs font-semibold ${row[campo] > 0 ? cor : corVazia
                                }`}
                        >
                            {row[campo]}
                        </span>
                    ),
                }
            }),
            {
                key: 'maisAntiga',
                header: 'Mais Antiga',
                sortable: true,
                filter: {
                    value: colunaFiltros.maisAntiga,
                    onChange: setFiltroColuna('maisAntiga'),
                    options: opcoes.maisAntiga,
                },
                render: (row) => row?.maisAntiga || '-',
            },
        ],
        [colunaFiltros, setFiltroColuna, opcoes]
    )

    return (
        <>
            <div className="mx-4 mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                    {temFiltro && `${dadosFiltrados.length} de ${dados.length} profissionais com os filtros`}
                </span>
                {temFiltro && (
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
                emptyMessage="Nenhum profissional encontrado"
                selectable={false}
                sort={{ ...ordenacao, onToggle: alternarOrdenacao }}
            />

            <Paginacao
                page={page}
                pageSize={pageSize}
                totalItems={dadosFiltrados.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />
        </>
    )
}

export default GestaoEvolucaoAll