import { useEffect, useMemo } from 'react';
import { FaBan } from 'react-icons/fa';
import { useFiltrosColuna } from '../../../hooks/gestao/useFiltrosColuna';
import { usePaginacao } from '../../../hooks/gestao/usePaginacao';
import { toISODate } from '../../../utils/_geral/commonUtils';
import Paginacao from '../tabela/Paginacao';
import TabelaGen from '../tabela/TabelaGen';

const TIPOS = {
    SESSAO: 'Sessão',
    AVALIACAO_INICIAL: 'Avaliação Inicial',
    REAVALIACAO: 'Reavaliação',
};

const COLUNAS_FILTRO = {
    profissional: { get: (row) => row.profissional?.usuario?.nome ?? '', ordem: 'asc' },
    data: { get: (row) => (row.inicio ? toISODate(row.inicio) : ''), ordem: 'desc' },
    tipo: { get: (row) => row.tipo, label: (v) => TIPOS[v] ?? v },
    presenca: { get: (row) => row.presenca },
};

const TabPendenciasAvReav = ({ selectedPacienteId, dadosAgendamentos }) => {
    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro,
        opcoes,
        dadosFiltrados,
    } = useFiltrosColuna(dadosAgendamentos, COLUNAS_FILTRO);

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
                key: 'profissional',
                header: 'Atribuído a',
                filter: {
                    value: colunaFiltros.profissional,
                    onChange: setFiltroColuna('profissional'),
                    options: opcoes.profissional,
                },
                render: (row) => row.profissional?.usuario?.nome,
                cellClassName: 'capitalize',
            },
            {
                key: 'data',
                header: 'Data',
                filter: {
                    value: colunaFiltros.data,
                    onChange: setFiltroColuna('data'),
                    options: opcoes.data,
                },
                render: (row) => toISODate(row.inicio),
            },
            {
                key: 'tipo',
                header: 'Tipo',
                filter: {
                    value: colunaFiltros.tipo,
                    onChange: setFiltroColuna('tipo'),
                    options: opcoes.tipo,
                },
                render: (row) => TIPOS[row.tipo],
            },
            {
                key: 'presenca',
                header: 'Status',
                filter: {
                    value: colunaFiltros.presenca,
                    onChange: setFiltroColuna('presenca'),
                    options: opcoes.presenca,
                },
                render: (row) => row.presenca || <FaBan />,
            },
            {
                key: 'observacao',
                header: 'Observações',
                render: (row) => row.observacoes || <FaBan />,
            },
        ],
        [colunaFiltros, setFiltroColuna, opcoes]
    );

    return (
        <>
            <div className="mx-4 mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                    {temFiltro &&
                        `${dadosFiltrados.length} de ${dadosAgendamentos.length} agendamentos com os filtros`}
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
                emptyMessage="Nenhuma pendência encontrada"
                selectable
                selectAllLabel="Selecionar todas as pendências"
                selectRowLabel="Selecionar pendência"
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
};

export default TabPendenciasAvReav;