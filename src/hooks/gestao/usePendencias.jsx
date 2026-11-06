import { useState } from 'react'
import { buscar_modelo } from '../../api/forms/modelos_utils'
import { getValue } from '../../utils/_geral/commonUtils'
import { criar_pendencia_manual } from '../../api/pendencias/pendencias_utils'

const criarPendencia = (escalaId, especialidade = '') => ({
	escalaId,
	especialidade,
	dataLancamento: ''
})

export default function usePendencias({ formulariosOptions, pacienteId, onSuccess }) {
	const [pendencias, setPendencias] = useState([])
	const [modeloSelecionado, setModeloSelecionado] = useState('')
	const [escalaSelecionada, setEscalaSelecionada] = useState('')
	const [dataTodas, setDataTodas] = useState('')
	const [especialidadeTodas, setEspecialidadeTodas] = useState('')
	const [aplicando, setAplicando] = useState(false)

	const adicionarEscalaManual = () => {
		const escalaId = Number(escalaSelecionada)
		if (!escalaId || pendencias.some(p => p.escalaId === escalaId)) return

		setPendencias(atual => [...atual, criarPendencia(escalaId)])
		setEscalaSelecionada('')
	}

	const handleChangeModelo = async (e) => {
		const valor = getValue(e)
		setModeloSelecionado(valor)

		if (!String(valor).startsWith('modelo:')) return

		const detalhe = await buscar_modelo(Number(valor.replace('modelo:', '')))
		if (!detalhe) return

		setPendencias(
			detalhe.formularios.map(f =>
				criarPendencia(f.formulario.formulario_id, f.especialidade_associada ?? '')
			)
		)
	}

	const handleChangePendencia = (escalaId, campo, valor) => {
		setPendencias(atual =>
			atual.map(p => (p.escalaId === escalaId ? { ...p, [campo]: valor } : p))
		)
	}

	const removerPendencia = (escalaId) => {
		setPendencias(atual => atual.filter(p => p.escalaId !== escalaId))
	}

	const aplicarParaTodas = () => {
		if (!dataTodas && !especialidadeTodas) return

		setPendencias(atual =>
			atual.map(p => ({
				...p,
				...(dataTodas && { dataLancamento: dataTodas }),
				...(especialidadeTodas && { especialidade: especialidadeTodas })
			}))
		)
	}

	const handleChangeEspecialidadeTodas = (e) =>
		setEspecialidadeTodas(e?.target?.value ?? e?.value ?? e)

	const limparEscalas = () => {
		setPendencias([])
		setModeloSelecionado('')
	}

	const descartarAlteracoes = () => {
		limparEscalas()
		setDataTodas('')
		setEspecialidadeTodas('')
	}

	// Derivados
	const datasPreenchidas = pendencias.filter(p => p.dataLancamento).length
	const percentual = pendencias.length ? (datasPreenchidas / pendencias.length) * 100 : 0

	const escalasDisponiveis = formulariosOptions.filter(
		escala => !pendencias.some(p => p.escalaId === escala.value)
	)

	const escalasParaModelo = pendencias.map(p => ({
		...p,
		nomeFormulario:
			formulariosOptions.find(f => f.value === p.escalaId)?.label ?? `Escala #${p.escalaId}`
	}))

	const aplicarPendencias = async () => {
		if (!pendencias.length || aplicando) return { ok: false }

		// Validação: todas precisam de data
		const incompletas = pendencias.filter(p => !p.dataLancamento)
		if (incompletas.length) {
			return { ok: false, motivo: 'datas_faltando', total: incompletas.length }
		}

		setAplicando(true)
		try {
			const hoje = new Date();
			hoje.setHours(0, 0, 0, 0);

			const resultados = await Promise.allSettled(
				pendencias.map(p => {
					const dataLancamento = new Date(p.dataLancamento);
					dataLancamento.setHours(0, 0, 0, 0);

					const tipo = dataLancamento < hoje ? 'RETROATIVA' : 'MANUAL';

					return criar_pendencia_manual({
						pacienteId: Number(pacienteId),
						formularioId: p.escalaId,
						especialidade: p.especialidade || undefined,
						data_referencia: p.dataLancamento
					}, tipo).then(r => {
						if (!r.ok) throw r.error
						return r
					})
				})
			)

			// Mantém na tela só as que falharam, para permitir nova tentativa
			const falhas = pendencias.filter((_, i) => resultados[i].status === 'rejected')
			setPendencias(falhas)

			if (falhas.length === 0) {
				descartarAlteracoes()
				onSuccess?.()
			}

			return {
				ok: falhas.length === 0,
				sucesso: pendencias.length - falhas.length,
				falhas: falhas.length
			}
		} finally {
			setAplicando(false)
		}
	}

	return {
		pendencias,
		modeloSelecionado,
		escalaSelecionada,
		setEscalaSelecionada: (e) => setEscalaSelecionada(getValue(e)),
		dataTodas,
		setDataTodas,
		especialidadeTodas,
		escalasDisponiveis,
		escalasParaModelo,
		datasPreenchidas,
		percentual,
		aplicando,
		adicionarEscalaManual,
		handleChangeModelo,
		handleChangePendencia,
		handleChangeEspecialidadeTodas,
		removerPendencia,
		aplicarParaTodas,
		limparEscalas,
		descartarAlteracoes,
		aplicarPendencias
	}
}