import React, { useMemo, useState } from 'react'
import { Modal } from '../../modal/Modal'
import TabelaGen from '../tabela/TabelaGen'
import { FaPen, FaRegPaperPlane } from 'react-icons/fa'
import { FaRotateLeft } from 'react-icons/fa6'
import { useFiltrosColuna, useOrdenacaoColuna } from '../../../hooks/gestao/useFiltrosColuna'
import StatusBadge from '../tabela/StatusBadge'
import { formatarData } from '../../../utils/format/formatar_utils'
import CampoData from './LancarPendencias/CampoData'

function agruparPorDataReferencia(pendencias = []) {
  const mapa = new Map()

  pendencias.forEach((p) => {
    const chave = p.data_referencia
      ? p.data_referencia.split('T')[0]
      : 'sem-data'

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        dataReferencia: chave,
        pendencias: [],
        especialidades: new Set(),
      })
    }

    const bloco = mapa.get(chave)
    bloco.pendencias.push(p)

    if (p.especialidade) {
      bloco.especialidades.add(p.especialidade)
    }
  })

  return Array.from(mapa.values())
    .map((b) => ({
      dataReferencia: b.dataReferencia,
      totalPendencias: b.pendencias.length,
      totalEspecialidades: b.especialidades.size,
      pendencias: b.pendencias,
    }))
    .sort((a, b) => b.dataReferencia.localeCompare(a.dataReferencia))
}

function CardBloco({ bloco, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-2 group rounded-lg border border-gray-200 bg-gray-50 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
    >
      <div className='p-3 flex flex-col gap-2'>
        <span className="text-xs text-gray-500">
          Data de referência
        </span>

        <strong className="text-lg text-gray-900">
          {formatarData(bloco.dataReferencia)}
        </strong>

        <div className="flex items-center justify-between text-sm text-gray-700">
          <span>Pendências</span>
          <span className="rounded-full bg-red-100 px-2 py-0.5 font-semibold text-red-700">
            {bloco.totalPendencias}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-700">
          <span>Especialidades</span>
          <span className="rounded-full bg-blue-100 px-2 py-0.5 font-semibold text-blue-700">
            {bloco.totalEspecialidades}
          </span>
        </div>
      </div>

      <span className="text-xs rounded-b-md text-blue-700 font-medium w-full py-2 flex justify-center bg-slate-200 group-hover:bg-linear-to-r group-hover:from-blue-500 group-hover:to-emerald-200 group-hover:text-white transition-all duration-300">
        Ver pendências →
      </span>
    </button>
  )
}

const COLUNAS_FILTRO = {
  id: {
    get: (row) => String(row.id ?? ''),
    ordem: 'asc',
  },
  especialidade: {
    get: (row) => row.especialidade || '',
    ordem: 'asc',
  },
  profissionalNome: {
    get: (row) => row.profissionalNome || '',
    ordem: 'asc',
  },
  diagnosticoMacro: {
    get: (row) => row.diagnosticoMacro || '',
    ordem: 'asc',
  },
  status: {
    get: (row) => row.status || '',
    ordem: 'asc',
  },
  criacao: {
    get: (row) => row.tipoCriacao || 'DESCONHECIDA',
    ordem: 'asc',
    label: (v) => ({
      RETROATIVA: 'Retroativa',
      MANUAL: 'Manual',
      AUTOMATICA: 'Automática',
      DESCONHECIDA: 'Desconhecida',
    })[v] ?? v,
  },
  criadaEm: {
    get: (row) => formatarData(row.criadaEm) || '',
    ordem: 'desc',
  },
}

function TabelaPendencias({ bloco, onVoltar, onAtualizarData, formulariosPorId }) {
  const dataInicial =
    bloco.dataReferencia === 'sem-data' ? '' : bloco.dataReferencia

  const [novaData, setNovaData] = useState(dataInicial)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const podeSalvar =
    !!novaData && novaData !== bloco.dataReferencia && !salvando

  async function handleSalvarData() {
    setSalvando(true)
    setErro('')
    try {
      await onAtualizarData(bloco.pendencias, { data_referencia: novaData })
    } catch (err) {
      console.error(err)
      setErro(err.message || 'Não foi possível atualizar a data de referência.')
    } finally {
      setSalvando(false)
    }
  }

  const {
    colunaFiltros,
    setFiltroColuna,
    opcoes,
    dadosFiltrados,
  } = useFiltrosColuna(bloco.pendencias, COLUNAS_FILTRO)

  const {
    ordenacao,
    alternarOrdenacao,
    dadosOrdenados,
  } = useOrdenacaoColuna(dadosFiltrados, COLUNAS_FILTRO)

  const columns = useMemo(() => [
    {
      key: 'formularioId',
      header: 'Formulário',
      sortable: true,
      render: (row) => formulariosPorId.get(row.formularioId).toLowerCase() || row.formularioId || '',
      cellClassName: 'capitalize'
    },
    {
      key: 'especialidade',
      header: 'Especialidade',
      sortable: true,
      filter: {
        value: colunaFiltros.especialidade,
        onChange: setFiltroColuna('especialidade'),
        options: opcoes.especialidade,
      },
      render: (row) => row.especialidade || '-',
    },
    {
      key: 'profissionalNome',
      header: 'Profissional',
      sortable: true,
      filter: {
        value: colunaFiltros.profissionalNome,
        onChange: setFiltroColuna('profissionalNome'),
        options: opcoes.profissionalNome,
      },
      render: (row) => row.profissionalNome || '-',
    },
    {
      key: 'diagnosticoMacro',
      header: 'Diagnóstico',
      sortable: true,
      filter: {
        value: colunaFiltros.diagnosticoMacro,
        onChange: setFiltroColuna('diagnosticoMacro'),
        options: opcoes.diagnosticoMacro,
      },
      render: (row) => row.diagnosticoMacro || '-',
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
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'criacao',
      header: 'Criação',
      sortable: true,
      filter: {
        value: colunaFiltros.criacao,
        onChange: setFiltroColuna('criacao'),
        options: opcoes.criacao,
      },
      render: (row) => (
        row.tipoCriacao === 'RETROATIVA' ? (
          <div className="flex max-w-fit items-center gap-2 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-sm text-rose-700 shadow-md">
            <FaRotateLeft className="w-3" />
            Retroativa
          </div>
        ) : row.tipoCriacao === 'MANUAL' ? (
          <div className="flex max-w-fit items-center gap-2 rounded-full border border-green-300 bg-green-100 px-2 py-0.5 text-sm text-green-700 shadow-md">
            <FaPen className="w-3" />
            Manual
          </div>
        ) : row.tipoCriacao === 'AUTOMATICA' ? (
          <div className="flex max-w-fit items-center gap-2 rounded-full border border-purple-300 bg-purple-100 px-2 py-0.5 text-sm text-purple-700 shadow-md">
            <FaRegPaperPlane className="w-3" />
            Automática
          </div>
        ) : (
          <div className="flex max-w-fit items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-sm text-slate-700 shadow-md">
            <FaRegPaperPlane className="w-3" />
            Desconhecida
          </div>
        )
      ),
    },
    {
      key: 'criadaEm',
      header: 'Criada em',
      sortable: true,
      filter: {
        value: colunaFiltros.criadaEm,
        onChange: setFiltroColuna('criadaEm'),
        options: opcoes.criadaEm,
      },
      render: (row) => formatarData(row.criadaEm) || '-',
    },
  ], [colunaFiltros, setFiltroColuna, opcoes])

  return (
    <>
      <div className="relative z-10 shrink-0 p-10 pb-2 pr-14">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-gray-800">
              Pendências de {formatarData(bloco.dataReferencia)}
            </h4>

            <p className="text-sm text-gray-500">
              {dadosFiltrados.length} de {bloco.totalPendencias} pendência(s)
              {Object.values(colunaFiltros).some(Boolean) && ' com os filtros'}
            </p>
          </div>

          <button
            type="button"
            onClick={onVoltar}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            ← Voltar
          </button>
        </div>

        <div className="mt-3">
          <span className="text-apollo-600">Atualizar data referência do bloco</span>

          <div className="flex items-end gap-3">
            <CampoData value={novaData} onChange={setNovaData} />

            <button
              type="button"
              onClick={handleSalvarData}
              disabled={!podeSalvar}
              className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : `Aplicar para ${bloco.totalPendencias} ${bloco.totalPendencias === 1 ? 'pendência' : 'pendências'}`}
            </button>
          </div>

          {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto py-4 px-6 [scrollbar-width:thin] [scrollbar-color:rgba(90,39,121,0.55)_transparent]">
        <TabelaGen
          columns={columns}
          data={dadosOrdenados}
          getRowKey={(row) => row.id}
          emptyMessage="Nenhuma pendência encontrada"
          sort={{
            ...ordenacao,
            onToggle: alternarOrdenacao,
          }}
          className="min-w-[900px] m-0 text-sm"
        />
      </div>
    </>
  )
}

function BlocosPendencias({ open, onClose, dados, onSubmitBloco, formulariosPorId }) {
  const [chaveSelecionada, setChaveSelecionada] = useState(null)

  const blocos = useMemo(
    () => agruparPorDataReferencia(Array.isArray(dados) ? dados : []),
    [dados]
  )

  const blocoSelecionado = useMemo(
    () => blocos.find((b) => b.dataReferencia === chaveSelecionada) ?? null,
    [blocos, chaveSelecionada]
  )

  async function handleAtualizarData(rows, payload) {
    await onSubmitBloco(rows, payload)
    setChaveSelecionada(payload.data_referencia)
  }

  function handleClose() {
    setChaveSelecionada(null)
    onClose()
  }

  return (
    <Modal isOpen={open} onClose={handleClose} bare>
      <div className="relative flex max-h-[95vh] w-full max-w-[85vw] flex-col rounded-2xl bg-white shadow-xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar modal"
          className="absolute right-3 top-3 z-20 text-2xl font-bold text-gray-700 transition hover:text-red-500"
        >
          ✕
        </button>

        {blocoSelecionado ? (
          <TabelaPendencias
            key={blocoSelecionado.dataReferencia}
            bloco={blocoSelecionado}
            onVoltar={() => setChaveSelecionada(null)}
            onAtualizarData={handleAtualizarData}
            formulariosPorId={formulariosPorId}
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto p-6">
            <h3 className="mb-4 text-xl font-semibold text-gray-800">
              Blocos de pendências
            </h3>

            {blocos.length === 0 ? (
              <p className="text-sm text-gray-500">
                Nenhuma pendência encontrada.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {blocos.map((bloco) => (
                  <CardBloco
                    key={bloco.dataReferencia}
                    bloco={bloco}
                    onClick={() => setChaveSelecionada(bloco.dataReferencia)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default BlocosPendencias