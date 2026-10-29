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

const formatHora = (iso) =>
    iso
        ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '';

const COLUNAS_FILTRO = {
    profissional: { get: (row) => row.profissional?.usuario?.nome ?? '', ordem: 'asc' },
    data: { get: (row) => (row.inicio ? toISODate(row.inicio) : ''), ordem: 'asc' },
    horario: { get: (row) => formatHora(row.inicio), ordem: 'asc' },
    slot: { get: (row) => row.slot?.nome ?? '', ordem: 'asc' },
    tipo: { get: (row) => row.tipo, label: (v) => TIPOS[v] ?? v },
    recorrencia: { get: (row) => (row.recorrencia ? 'Sim' : 'Não') },
    presenca: { get: (row) => row.presenca },
};

const TabAgendamentosFuturos = ({ selectedPacienteId, dadosAgendamentos = [] }) => {
    // Somente agendamentos de agora (hora exata) em diante, ordenados do mais próximo ao mais distante
    const agendamentosFuturos = useMemo(() => {
        const agora = Date.now();
        return dadosAgendamentos
            .filter((row) => row.inicio && new Date(row.inicio).getTime() >= agora)
            .sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
    }, [dadosAgendamentos]);

    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro,
        opcoes,
        dadosFiltrados,
    } = useFiltrosColuna(agendamentosFuturos, COLUNAS_FILTRO);

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
                key: 'horario',
                header: 'Horário',
                filter: {
                    value: colunaFiltros.horario,
                    onChange: setFiltroColuna('horario'),
                    options: opcoes.horario,
                },
                render: (row) => `${formatHora(row.inicio)} - ${formatHora(row.fim)}`,
            },
            {
                key: 'profissional',
                header: 'Profissional',
                filter: {
                    value: colunaFiltros.profissional,
                    onChange: setFiltroColuna('profissional'),
                    options: opcoes.profissional,
                },
                render: (row) => row.profissional?.usuario?.nome || <FaBan />,
                cellClassName: 'capitalize',
            },
            {
                key: 'slot',
                header: 'Equipamento / Sala',
                filter: {
                    value: colunaFiltros.slot,
                    onChange: setFiltroColuna('slot'),
                    options: opcoes.slot,
                },
                render: (row) => row.slot?.nome || <FaBan />,
            },
            {
                key: 'tipo',
                header: 'Tipo',
                filter: {
                    value: colunaFiltros.tipo,
                    onChange: setFiltroColuna('tipo'),
                    options: opcoes.tipo,
                },
                render: (row) => TIPOS[row.tipo] ?? row.tipo,
            },
            {
                key: 'recorrencia',
                header: 'Recorrente',
                filter: {
                    value: colunaFiltros.recorrencia,
                    onChange: setFiltroColuna('recorrencia'),
                    options: opcoes.recorrencia,
                },
                render: (row) => (row.recorrencia ? 'Sim' : 'Não'),
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
                        `${dadosFiltrados.length} de ${agendamentosFuturos.length} agendamentos com os filtros`}
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
                emptyMessage="Nenhum agendamento futuro encontrado"
                selectable
                selectAllLabel="Selecionar todos os agendamentos"
                selectRowLabel="Selecionar agendamento"
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

export default TabAgendamentosFuturos;