import { useEffect, useMemo } from 'react';
import { useFiltrosColuna } from '../../../hooks/gestao/useFiltrosColuna';
import { usePaginacao } from '../../../hooks/gestao/usePaginacao';
import { toISODate } from '../../../utils/_geral/commonUtils';
import Paginacao from '../tabela/Paginacao';
import TabelaGen from '../tabela/TabelaGen';

function TabRegistrosRecentes({ selectedPacienteId, dadosSessoes, profissionaisOptions }) {
    const nomeProfissional = useMemo(() => {
        const mapa = new Map(profissionaisOptions.map((p) => [p.value, p.label]));
        return (id) => mapa.get(id) ?? '-';
    }, [profissionaisOptions]);

    const colunasFiltro = useMemo(
        () => ({
            dataAplicacao: {
                get: (row) => (row.data_aplicacao_sessao ? toISODate(row.data_aplicacao_sessao) : ''),
                ordem: 'desc',
            },
            formulario: {
                get: (row) => row.formulario?.nome_formulario?.toLowerCase() ?? '',
                ordem: 'asc',
            },
            profissional: {
                get: (row) => row.profissional_id,
                label: nomeProfissional,
            },
            status: { get: (row) => row.status_registro?.toLowerCase() ?? '' },
        }),
        [nomeProfissional]
    );

    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro,
        opcoes,
        dadosFiltrados,
    } = useFiltrosColuna(dadosSessoes, colunasFiltro);

    const { page, setPage, pageSize, setPageSize, dadosPaginados } = usePaginacao(
        dadosFiltrados,
        [selectedPacienteId, colunaFiltros]
    );

    useEffect(() => {
        limparFiltrosColuna();
    }, [selectedPacienteId, limparFiltrosColuna]);

    const columns = useMemo(
        () => [
            {
                key: 'dataAplicacao',
                header: 'Data de Aplicação',
                filter: {
                    value: colunaFiltros.dataAplicacao,
                    onChange: setFiltroColuna('dataAplicacao'),
                    options: opcoes.dataAplicacao,
                },
                render: (row) => toISODate(row.data_aplicacao_sessao),
            },
            {
                key: 'formulario',
                header: 'Formulário',
                filter: {
                    value: colunaFiltros.formulario,
                    onChange: setFiltroColuna('formulario'),
                    options: opcoes.formulario,
                },
                render: (row) => row.formulario?.nome_formulario?.toLowerCase(),
                cellClassName: 'capitalize',
            },
            {
                key: 'profissional',
                header: 'Profissional',
                filter: {
                    value: colunaFiltros.profissional,
                    onChange: setFiltroColuna('profissional'),
                    options: opcoes.profissional,
                },
                render: (row) => nomeProfissional(row.profissional_id),
            },
            {
                key: 'status',
                header: 'Status',
                filter: {
                    value: colunaFiltros.status,
                    onChange: setFiltroColuna('status'),
                    options: opcoes.status,
                },
                render: (row) => row.status_registro?.toLowerCase(),
                cellClassName: 'capitalize',
            },
        ],
        [colunaFiltros, setFiltroColuna, opcoes, nomeProfissional]
    );

    return (
        <>
            <div className="mx-4 mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                    {temFiltro &&
                        `${dadosFiltrados.length} de ${dadosSessoes.length} registros com os filtros`}
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
                emptyMessage="Nenhuma sessão encontrada"
                selectable
                selectAllLabel="Selecionar todas as sessões"
                selectRowLabel="Selecionar sessão"
            />

            <Paginacao
                page={page}
                pageSize={pageSize}
                totalItems={dadosFiltrados.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
            />
        </>
    );
}

export default TabRegistrosRecentes;