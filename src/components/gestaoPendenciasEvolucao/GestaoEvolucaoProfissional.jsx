import React, { useMemo } from 'react'
import TabelaGen from '../gestaoPendencias/tabela/TabelaGen'
import Paginacao from '../gestaoPendencias/tabela/Paginacao'
import { useFiltrosColuna, useOrdenacaoColuna } from '../../hooks/gestao/useFiltrosColuna'
import { usePaginacao } from '../../hooks/gestao/usePaginacao'

import {
    NIVEIS,
    horasDesde,
    classificarPendencia,
    paraChave,
    paraLabel,
} from '../../utils/pendencias/niveisPendencia'
import { useJornadaController } from '../../hooks/useJornadaController'

const formatarData = (ts) => new Date(ts).toLocaleDateString('pt-BR')

const formatarHora = (ts) =>
    new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

const formatarAtraso = (dias, horas) => {
    const partes = []
    if (dias > 0) partes.push(`${dias} ${dias === 1 ? 'dia' : 'dias'}`)
    if (horas > 0 || dias === 0) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`)
    return partes.join(' e ')
}

const labelNivel = (chave) => NIVEIS.find((n) => n.chave === chave)?.label ?? chave

const normalizarPacientes = (pacientes) => {
    if (!pacientes) return []
    if (Array.isArray(pacientes)) return pacientes
    if (pacientes.id !== undefined) return [pacientes]
    return Object.values(pacientes)
}

const nomeDoPaciente = (p, id) =>
    p?.nome_social_apelido || p?.nomeFormatado || p?.nome || `Paciente #${id}`

const colunasFiltro = {
    paciente: {
        get: (row) => row.pacienteNome ?? '',
        label: (nome) => nome,
        ordem: 'asc',
    },
    diagnostico: {
        get: (row) => row.diagnostico ?? '',
        label: (d) => d,
        ordem: 'asc',
    },
    data: {
        get: (row) => (row.fimTs ? new Date(row.fimTs).toISOString().slice(0, 10) : ''),
        label: (iso) => (iso ? iso.split('-').reverse().join('/') : ''),
        ordem: 'asc',
    },
    horario: {
        get: (row) => {formatarHora(row.inicioTs)},
        label: (row) => `${formatarHora(row.inicioTs)} - ${formatarHora(row.fimTs)}`,
        odem: 'asc'
    },
    diasAtraso: {
        get: (row) => paraChave(row.diasAtraso),
        label: paraLabel,
        ordem: 'desc',
    },
    nivel: {
        get: (row) => row.nivel,
        label: labelNivel,
        ordem: 'desc',
    },
    slot: {
        get: (row) => paraChave(row.slot),
        label: paraLabel,
        ordem: 'desc',
    },
}

function GestaoEvolucaoProfissional({ dados = [], profissionalSelecionado = null }) {
    const { pacientes } = useJornadaController()

    const pacientesPorId = useMemo(
        () => new Map(normalizarPacientes(pacientes).map((p) => [String(p.id), p])),
        [pacientes]
    )

    const profissionalId = useMemo(() => {
        if (profissionalSelecionado === null || profissionalSelecionado === undefined) return null
        if (typeof profissionalSelecionado === 'object') {
            return profissionalSelecionado.value ?? profissionalSelecionado.id ?? null
        }
        return profissionalSelecionado
    }, [profissionalSelecionado])

    const profissional = useMemo(
        () => dados.find((p) => String(p.id) === String(profissionalId)) ?? null,
        [dados, profissionalId]
    )

    const linhas = useMemo(() => {
        if (!profissional) return []

        const agora = Date.now()
        const idsPendentes = new Set(profissional.ag_presenca_ids ?? [])

        return (profissional.agendamentos ?? [])
            .filter((ag) => ag?.fim)
            .filter((ag) => idsPendentes.size === 0 || idsPendentes.has(ag.id))
            .map((ag) => {
                const inicioTs = new Date(ag.inicio).getTime()
                const fimTs = new Date(ag.fim).getTime()
                const horas = horasDesde(agora, fimTs)
                const horasTotais = Math.max(0, Math.floor(horas))
                const paciente = pacientesPorId.get(String(ag.pacienteId))

                return {
                    id: ag.id,
                    pacienteId: ag.pacienteId,
                    pacienteNome: nomeDoPaciente(paciente, ag.pacienteId),
                    inicioTs,
                    fimTs,
                    diasAtraso: Math.floor(horasTotais / 24),
                    horasAtraso: horasTotais % 24,
                    nivel: classificarPendencia(horas),
                    presenca: ag.presenca,
                    slot: ag.slot,
                    formulariosPendentes: (ag.pendencias_escala ?? []).filter(
                        (pe) => pe?.status !== 'CONCLUIDA'
                    ).length,
                }
            })
    }, [profissional, pacientesPorId])

    const {
        colunaFiltros,
        setFiltroColuna,
        limpar: limparFiltrosColuna,
        temFiltro,
        opcoes,
        dadosFiltrados,
    } = useFiltrosColuna(linhas, colunasFiltro)

    const { ordenacao, alternarOrdenacao, dadosOrdenados } = useOrdenacaoColuna(
        dadosFiltrados,
        colunasFiltro,
        { chave: 'diasAtraso', direcao: 'desc' }
    )

    const { page, setPage, pageSize, setPageSize, dadosPaginados } = usePaginacao(
        dadosOrdenados,
        [colunaFiltros, ordenacao, profissionalId]
    )

    const columns = useMemo(
        () => [
            {
                key: 'paciente',
                header: 'Paciente',
                sortable: true,
                filter: {
                    value: colunaFiltros.paciente,
                    onChange: setFiltroColuna('paciente'),
                    options: opcoes.paciente,
                },
                render: (row) => row.pacienteNome,
            },
            {
                key: 'nivel',
                header: 'Nível',
                sortable: true,
                filter: {
                    value: colunaFiltros.nivel,
                    onChange: setFiltroColuna('nivel'),
                    options: opcoes.nivel,
                },
                render: (row) => {
                    const nivel = NIVEIS.find((n) => n.chave === row.nivel)
                    return (
                        <span
                            className={`inline-block text-center px-3 py-1 rounded-full text-xs font-semibold ${nivel?.cor ?? ''}`}
                        >
                            {nivel?.label ?? row.nivel}
                        </span>
                    )
                },
            },
            {
                key: 'data',
                header: 'Data',
                sortable: true,
                filter: {
                    value: colunaFiltros.data,
                    onChange: setFiltroColuna('data'),
                    options: opcoes.data,
                },
                render: (row) => formatarData(row.fimTs),
            },
            {
                key: 'horario',
                header: 'Horário',
                sortable: true,
                filter: {
                    value: colunaFiltros.horario,
                    onChange: setFiltroColuna('horario'),
                    options: opcoes.horario,
                },
                render: (row) => `${formatarHora(row.inicioTs)} - ${formatarHora(row.fimTs)}`,
            },
            {
                key: 'diasAtraso',
                header: 'Tempo em atraso',
                sortable: true,
                filter: {
                    value: colunaFiltros.diasAtraso,
                    onChange: setFiltroColuna('diasAtraso'),
                    options: opcoes.diasAtraso,
                },
                render: (row) => formatarAtraso(row.diasAtraso, row.horasAtraso),
            },
            {
                key: 'slot',
                header: 'Slot',
                sortable: true,
                filter: {
                    value: colunaFiltros.slot,
                    onChange: setFiltroColuna('slot'),
                    options: opcoes.slot,
                },
                render: (row) => row?.slot?.nome || row?.slot?.sigla || '-',
            },
        ],
        [colunaFiltros, setFiltroColuna, opcoes]
    )

    if (!profissional) {
        return (
            <p className="mx-4 mt-6 text-sm text-slate-500">
                Selecione um profissional para ver as pendências.
            </p>
        )
    }

    return (
        <>
            <div className="mx-4 mt-4 flex items-center justify-between text-sm text-slate-600">
                <span>
                    {temFiltro
                        ? `${dadosFiltrados.length} de ${linhas.length} pendências com os filtros`
                        : `${linhas.length} ${linhas.length === 1 ? 'pendência' : 'pendências'} de ${profissional.nomeCompleto}`}
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
                emptyMessage="Nenhuma pendência encontrada para este profissional"
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

export default GestaoEvolucaoProfissional