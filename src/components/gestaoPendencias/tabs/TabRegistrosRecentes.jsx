import { useEffect, useMemo, useState } from 'react';
import { useFiltrosColuna, useOrdenacaoColuna } from '../../../hooks/gestao/useFiltrosColuna';
import { usePaginacao } from '../../../hooks/gestao/usePaginacao';
import { toISODate, toTimeValue } from '../../../utils/_geral/commonUtils';
import Paginacao from '../tabela/Paginacao';
import TabelaGen from '../tabela/TabelaGen';
import { buscar_todas_pendencias } from '../../../api/pendencias/pendencias_utils';

function TabRegistrosRecentes({ selectedPacienteId, dadosSessoes, profissionaisOptions, agendamentos }) {

    const [pendenciasPaciente, setPendenciasPaciente] = useState([])

    const nomeProfissional = useMemo(() => {
        const mapa = new Map(profissionaisOptions.map((p) => [p.value, p.label]));
        return (id) => mapa.get(id) ?? '-';
    }, [profissionaisOptions]);

    useEffect(() => {

        const buscarPendenciasEscala = async () => {
            try {
                const result = await buscar_todas_pendencias({ id_paciente: selectedPacienteId })
                setPendenciasPaciente(result)
            } catch (error) {
                console.error("Erro ao buscar pendencias para o paciente: ", error)
            }
        }

        buscarPendenciasEscala()

    }, [selectedPacienteId])

    const colunasFiltro = useMemo(
        () => ({
            dataAplicacao: {
                get: (row) => (row.data_aplicacao_sessao ? toISODate(row.data_aplicacao_sessao) : ''),
                ordem: 'desc',
            },
            dataReferencia: {
                get: (row) => (row?.pendencia?.data_referencia ? toISODate(row?.pendencia?.data_referencia) : ''),
                ordem: 'desc',
            },
            dataAgendamento: {
                get: (row) => (row?.agendamento?.inicio ? toISODate(row?.agendamento?.inicio) : ''),
                ordem: 'desc',
            },
            horaInicio: {
                get: (row) => (row?.agendamento?.inicio ? toTimeValue(row?.agendamento?.inicio) : ''),
                ordem: 'desc',
            },
            horaFim: {
                get: (row) => (row?.agendamento?.inicio ? toTimeValue(row?.agendamento?.fim) : ''),
                ordem: 'desc',
            },
            slotNome: {
                get: (row) => row?.agendamento?.slot?.nome.toLowerCase() ?? '',
                ordem: 'asc',
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

    const chave = (agendamentoId, formularioId) => `${agendamentoId}|${formularioId}`;

    const dadosEnriquecidos = useMemo(() => {
        const indicePendencias = new Map();
        for (const p of pendenciasPaciente ?? []) {
            indicePendencias.set(chave(p.agendamentoId, p.formularioId), p);
        }

        const indiceAgendamentos = new Map();
        for (const a of agendamentos ?? []) {
            indiceAgendamentos.set(a.id, a);
        }

        return (dadosSessoes ?? []).map((s) => {
            const pend = indicePendencias.get(chave(s.agendamento_id, s.formulario_id));
            const agend = indiceAgendamentos.get(s.agendamento_id);

            return {
                ...s,
                pendencia: pend ?? null,
                data_referencia: pend?.data_referencia ?? null,
                agendamento: agend ?? null,
                data_agendamento: agend?.inicio ?? null, // atalho opcional
            };
        });
    }, [dadosSessoes, pendenciasPaciente, agendamentos]);

    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro,
        opcoes,
        dadosFiltrados,
    } = useFiltrosColuna(dadosEnriquecidos, colunasFiltro);

    const { ordenacao, alternarOrdenacao, dadosOrdenados } = useOrdenacaoColuna(dadosFiltrados, colunasFiltro);

    const { page, setPage, pageSize, setPageSize, dadosPaginados } = usePaginacao(
        dadosOrdenados,
        [selectedPacienteId, colunaFiltros, ordenacao]
    );

    useEffect(() => {
        limparFiltrosColuna();
    }, [selectedPacienteId, limparFiltrosColuna]);

    const columns = useMemo(
        () => [
            {
                key: 'dataReferencia',
                header: 'Data de Referencia',
                sortable: true,
                filter: {
                    value: colunaFiltros.dataReferencia,
                    onChange: setFiltroColuna('dataReferencia'),
                    options: opcoes.dataReferencia,
                },
                render: (row) => toISODate(row?.pendencia?.data_referencia) || "Sem pendencia associada"
            },
            {
                key: 'dataAgendamento',
                header: 'Data de agendamento',
                sortable: true,
                filter: {
                    value: colunaFiltros.dataAgendamento,
                    onChange: setFiltroColuna('dataAgendamento'),
                    options: opcoes.dataAgendamento,
                },
                render: (row) => toISODate(row?.agendamento?.inicio) || "-"
            },
            {
                key: 'dataAplicacao',
                header: 'Data de Aplicação',
                sortable: true,
                filter: {
                    value: colunaFiltros.dataAplicacao,
                    onChange: setFiltroColuna('dataAplicacao'),
                    options: opcoes.dataAplicacao,
                },
                render: (row) => toISODate(row.data_aplicacao_sessao),
            },
            {
                key: 'horaInicio',
                header: 'Hora inicial',
                sortable: true,
                filter: {
                    value: colunaFiltros.horaInicio,
                    onChange: setFiltroColuna('horaInicio'),
                    options: opcoes.horaInicio,
                },
                render: (row) =>  toTimeValue(row.agendamento?.inicio) || "-"
            },
            {
                key: 'horaFim',
                header: 'Hora final',
                sortable: true,
                filter: {
                    value: colunaFiltros.horaFim,
                    onChange: setFiltroColuna('horaFim'),
                    options: opcoes.horaFim,
                },
                render: (row) =>  toTimeValue(row.agendamento?.fim) || "-"
            },
            {
                key: 'slotNome',
                header: 'Slot',
                sortable: true,
                filter: {
                    value: colunaFiltros.slotNome,
                    onChange: setFiltroColuna('slotNome'),
                    options: opcoes.slotNome
                },
                render: (row) => row?.agendamento?.slot?.nome || '-',
                cellClassName: 'capitalize'
            },
            {
                key: 'formulario',
                header: 'Formulário',
                sortable: true,
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
                sortable: true,
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
                sortable: true,
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
                selectable={false}
                selectAllLabel="Selecionar todas as sessões"
                selectRowLabel="Selecionar sessão"
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
    );
}

export default TabRegistrosRecentes;