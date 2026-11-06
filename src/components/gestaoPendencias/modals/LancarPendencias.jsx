import { useEffect, useState } from 'react'
import useForms from '../../../hooks/useForms'
import useModelos from '../../../hooks/useModelos'
import { Modal } from '../../modal/Modal'
import Cabecalho from './LancarPendencias/Cabecalho'
import EstadoVazio from './LancarPendencias/EstadoVazio'
import PainelAdicionarEscalas from './LancarPendencias/PainelAdicionarEscalas'
import Rodape from './LancarPendencias/Rodape'
import SeletorEscalaManual from './LancarPendencias/SeletorEscalaManual'
import TabelaPendencias from './LancarPendencias/TabelaPendencias'
import SalvarModelo from './SalvarModelo'
import BarraProgresso from './LancarPendencias/BarraProgresso'
import usePendencias from '../../../hooks/gestao/usePendencias'
import usePopup from '../../../hooks/usePopup'
import Popup from '../../common/Popup'

function LancarPendencias({ open, onClose, pacienteId, carregarDadosAdmin }) {
	const [modelosModalOpen, setModelosModalOpen] = useState(false)

	const { modelosOptions, reload: recarregarModelos } = useModelos({ ativo: true })
	const { formulariosOptions, fetchFormularios } = useForms()
	const popup = usePopup()

	useEffect(() => {
		fetchFormularios()
	}, [fetchFormularios])

	const p = usePendencias({ formulariosOptions, pacienteId })

	const handleClose = () => {
		p.descartarAlteracoes()
		recarregarModelos()
		onClose()
	}

	const handleAplicar = async () => {
		try {
			const resultado = await p.aplicarPendencias()

			if (!resultado) return

			if (resultado.ok === false) {
				if (resultado.motivo === 'datas_faltando') {
					await popup.warning({
						title: 'Falha ao lançar pendências',
						text: 'Existem escalas sem data preenchida.',
						confirmLabel: 'Voltar',
					})
				} else {
					await popup.error({
						title: 'Erro ao lançar',
						text: 'Não foi possível lançar as pendências.',
						confirmLabel: 'Fechar',
					})
				}
				return
			}

			await popup.success({
				title: 'Pendências lançadas',
				text: 'As pendências foram lançadas com sucesso.',
				confirmLabel: 'Concluir',
			})

			handleClose()
		} catch (err) {
			popup.error({
				title: 'Erro ao lançar',
				text: 'Não foi possível lançar as pendências. Tente novamente.',
			})
		} finally {
			carregarDadosAdmin(true, pacienteId)
		}
	}

	return (
		<>
		<Modal isOpen={open} onClose={handleClose} bare>
			<div className="w-full max-w-360 h-[85dvh] max-h-[850px] min-h-[600px] mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
				<Cabecalho onClose={handleClose} />

				<div className="flex-1 min-h-0 overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-3 md:grid-rows-[minmax(0,1fr)] gap-4 sm:gap-6 p-4 sm:p-6">
					<PainelAdicionarEscalas
						modelosOptions={modelosOptions}
						modeloSelecionado={p.modeloSelecionado}
						onChangeModelo={p.handleChangeModelo}
						especialidadeTodas={p.especialidadeTodas}
						onChangeEspecialidadeTodas={p.handleChangeEspecialidadeTodas}
						dataTodas={p.dataTodas}
						onChangeDataTodas={p.setDataTodas}
						onAplicarTodas={p.aplicarParaTodas}
						onLimpar={p.limparEscalas}
						onSalvarModelo={() => setModelosModalOpen(true)}
						totalEscalas={p.pendencias.length}
					/>

					<section className="md:col-span-2 min-w-0 min-h-0 flex flex-col">
						<SeletorEscalaManual
							options={p.escalasDisponiveis}
							value={p.escalaSelecionada}
							onChange={p.setEscalaSelecionada}
							onAdicionar={p.adicionarEscalaManual}
						/>

						{p.pendencias.length > 0 && (
							<BarraProgresso
								preenchidas={p.datasPreenchidas}
								total={p.pendencias.length}
								percentual={p.percentual}
							/>
						)}

						{p.pendencias.length === 0 ? (
							<EstadoVazio />
						) : (
							<TabelaPendencias
								pendencias={p.pendencias}
								formulariosOptions={formulariosOptions}
								onChange={p.handleChangePendencia}
								onRemover={p.removerPendencia}
							/>
						)}
					</section>
				</div>

				<Rodape
					onDescartar={p.descartarAlteracoes}
					onAplicar={handleAplicar}
					aplicarDisabled={p.pendencias.length === 0 || p.aplicando}
					aplicando={p.aplicando}
				/>
			</div>

			<SalvarModelo
				open={modelosModalOpen}
				onClose={() => setModelosModalOpen(false)}
				escalas={p.escalasParaModelo}
				onSuccess={recarregarModelos}
			/>
		</Modal>
		<Popup {...popup.props} />
		</>
	)
}

export default LancarPendencias