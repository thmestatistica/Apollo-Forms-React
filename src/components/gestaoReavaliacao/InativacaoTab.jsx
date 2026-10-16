import { ArchiveBoxXMarkIcon, ArrowPathIcon, ClockIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import React, { useEffect, useMemo, useState } from 'react'
import { useInativacao } from '../../hooks/useInativacao'
import { useJornadaController } from '../../hooks/useJornadaController';
import { formatarData } from '../../utils/format/formatar_utils';
import { listar_formularios } from '../../api/forms/forms_utils';
import { FaBan, FaSpinner } from "react-icons/fa";
import { FaAngleRight, FaRotateLeft } from 'react-icons/fa6';
import { atualizar_status_resposta, STATUS_RESPOSTA } from '../../api/gestao/gestao_utils';
import Swal from 'sweetalert2';

function InativacaoTab() {
	const [abaAtiva, setAbaAtiva] = useState('pendentes')
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [forms, setForms] = useState([]);
	const [updating, setUpdating] = useState(false);
	const [pagina, setPagina] = useState(1)
	const [itensPorPagina, setItensPorPagina] = useState(10)

	const [expandedRowId, setExpandedRowId] = useState(null)

	const {
		respostasPendentes,
		respostasInativas,
		loadingRespostasPendentes,
		loadingRespostasInativas,
		recarregar,
	} = useInativacao();

	const {
		pacientes, profissionais
	} = useJornadaController();

	const pacientesPorId = useMemo(
		() => new Map((pacientes ?? []).map((p) => [Number(p.id), p])),
		[pacientes]
	)

	useEffect(() => {
		let isMounted = true;
		(async () => {
			setLoading(true);
			setError("");
			try {
				const data = await listar_formularios();
				if (isMounted) setForms(Array.isArray(data) ? data : []);
			} catch (e) {
				if (isMounted) setError("Falha ao carregar formulários.");
				console.error(e);
			} finally {
				if (isMounted) setLoading(false);
			}
		})();
		return () => { isMounted = false; };
	}, []);

	const abas = [
		{
			id: 'pendentes',
			label: 'Pendentes',
			Icon: ClockIcon,
			ativoClass: 'bg-orange-600 text-white shadow-md',
			spinnerClass: 'border-orange-500',
			textoClass: 'text-orange-600',
			itens: respostasPendentes,
			loading: loadingRespostasPendentes,
		},
		{
			id: 'inativas',
			label: 'Inativas',
			Icon: ArchiveBoxXMarkIcon,
			ativoClass: 'bg-rose-600 text-white shadow-md',
			spinnerClass: 'border-rose-500',
			textoClass: 'text-rose-600',
			itens: respostasInativas,
			loading: loadingRespostasInativas,
		},
	]

	const aba = abas.find((a) => a.id === abaAtiva)

	const totalItens = aba.itens.length
	const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina))

	// garante que a página nunca passe do limite
	const paginaAtual = Math.min(pagina, totalPaginas)

	const inicio = (paginaAtual - 1) * itensPorPagina
	const itensPagina = aba.itens.slice(inicio, inicio + itensPorPagina)

	const numerosPagina = useMemo(() => {
		const paginas = new Set([1, totalPaginas, paginaAtual - 1, paginaAtual, paginaAtual + 1])
		const lista = [...paginas].filter((n) => n >= 1 && n <= totalPaginas).sort((a, b) => a - b)
		const resultado = []
		lista.forEach((n, i) => {
			if (i > 0 && n - lista[i - 1] > 1) resultado.push('...')
			resultado.push(n)
		})
		return resultado
	}, [paginaAtual, totalPaginas])

	const carregandoAlgo = loadingRespostasPendentes || loadingRespostasInativas

	const toggleExpand = (id) => {
        setExpandedRowId((prev) => (prev === id ? null : id))
    }

	const alterarStatus = async (sessaoRespostaId, novoStatus) => {
		if (!sessaoRespostaId) return;
		try {
			setUpdating(true);
			const response = await atualizar_status_resposta(sessaoRespostaId, novoStatus);
			recarregar()
		} catch (err) {
			console.error("Erro ao atualizar status do registro:", err);
		} finally {
			setUpdating(false);
		}
	};

	const alterarStatusEmLote = async (novoStatus) => {
		const ids = aba.itens.map((i) => i.sessao_resposta_id).filter(Boolean)
		if (ids.length === 0) return

		const inativando = novoStatus === STATUS_RESPOSTA.INATIVO
		const acao = inativando ? 'inativar' : 'reativar'

		const { isConfirmed } = await Swal.fire({
			title: `${inativando ? 'Inativar' : 'Reativar'} todos?`,
			text: `Deseja ${acao} todos os ${ids.length} registros da aba "${aba.label}"?`,
			icon: 'warning',
			showCancelButton: true,
			confirmButtonText: `Sim, ${acao} todos`,
			cancelButtonText: 'Cancelar',
			confirmButtonColor: inativando ? '#ea580c' : '#059669',
			cancelButtonColor: '#6b7280',
			reverseButtons: true,
			focusCancel: true,
		})

		if (!isConfirmed) return

		try {
			setUpdating(true)

			// em blocos de 10 para não sobrecarregar o servidor
			const TAMANHO_BLOCO = 10
			let falhas = 0
			for (let i = 0; i < ids.length; i += TAMANHO_BLOCO) {
				const bloco = ids.slice(i, i + TAMANHO_BLOCO)
				const resultados = await Promise.allSettled(
					bloco.map((id) => atualizar_status_resposta(id, novoStatus))
				)
				falhas += resultados.filter((r) => r.status === 'rejected').length
			}

			setPagina(1)
			await recarregar()

			if (falhas > 0) {
				Swal.fire({
					icon: 'warning',
					title: 'Concluído com falhas',
					text: `${falhas} de ${ids.length} registros não puderam ser atualizados. Tente novamente.`,
					confirmButtonColor: '#ea580c',
				})
			} else {
				Swal.fire({
					icon: 'success',
					title: 'Tudo certo!',
					text: `${ids.length} registros foram ${inativando ? 'inativados' : 'reativados'}.`,
					timer: 2000,
					showConfirmButton: false,
				})
			}
		} catch (err) {
			console.error('Erro ao atualizar registros em lote:', err)
			Swal.fire({
				icon: 'error',
				title: 'Erro',
				text: 'Não foi possível atualizar os registros.',
				confirmButtonColor: '#e11d48',
			})
		} finally {
			setUpdating(false)
		}
	}

	return (
		<div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
			<div className="bg-rose-50/50 p-6 border-b border-rose-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
				<div>
					<h2 className="text-rose-800 font-bold flex items-center gap-2 text-xl">
						<MagnifyingGlassIcon className="w-6 h-6" /> Inativação
					</h2>
					<p className="text-rose-600 text-sm mt-1">
						Pendências de inativação de formulários registrados e pendências de formulários.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={() => recarregar()}
						disabled={carregandoAlgo}
						className="p-2.5 bg-rose-500 text-white rounded-xl hover:bg-rose-600 active:scale-95 transition-all shadow-md disabled:opacity-60"
					>
						<ArrowPathIcon className={`w-5 h-5 ${carregandoAlgo ? 'animate-spin' : ''}`} />
					</button>
				</div>
			</div>

			<div className="p-6 flex flex-col gap-6">
				<div className="bg-gray-100 p-1 rounded-xl shadow-inner w-full">
					<div className="grid grid-cols-2 gap-1">
						{abas.map(({ id, label, Icon, ativoClass, itens, loading }) => (
							<button
								key={id}
								onClick={() => { setAbaAtiva(id); setPagina(1); recarregar() }}
								className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all cursor-pointer w-full ${abaAtiva === id ? ativoClass : 'text-slate-500 hover:bg-slate-50'
									}`}
							>
								<Icon className="w-4 h-4 sm:w-5 sm:h-5" /> {label}
								{!loading && (
									<span
										className={`text-[10px] px-2 py-0.5 rounded-full ${abaAtiva === id ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
											}`}
									>
										{itens.length}
									</span>
								)}
							</button>
						))}
					</div>
				</div>

				{aba.itens.length > 0 && abaAtiva === 'pendentes' && (
					<div className="flex flex-wrap justify-end gap-2">
						<button
							type="button"
							disabled={updating || aba.loading}
							onClick={() => alterarStatusEmLote(STATUS_RESPOSTA.ATIVO)}
							className="group bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{updating ? <FaSpinner className="animate-spin" /> : <FaRotateLeft className="group-hover:-rotate-360 transition-transform duration-500"/>}
							Reativar todos
						</button>

						<button
							type="button"
							disabled={updating || aba.loading}
							onClick={() => alterarStatusEmLote(STATUS_RESPOSTA.INATIVO)}
							className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{updating ? <FaSpinner className="animate-spin" /> : <FaBan />}
							Inativar todos
						</button>
					</div>
				)}

				<div className="rounded-2xl border border-gray-100 overflow-hidden min-h-[200px]">
					{aba.loading ? (
						<div className="p-16 flex flex-col items-center justify-center">
							<div className={`animate-spin rounded-full h-9 w-9 border-b-4 ${aba.spinnerClass}`}></div>
							<span className={`mt-3 font-bold text-xs uppercase tracking-wide ${aba.textoClass}`}>Carregando...</span>
						</div>
					) : aba.itens.length === 0 ? (
						<div className="p-10 text-center text-gray-400 italic">
							{abaAtiva === 'pendentes' ? "Nenhuma pendência de inativação encontrada." : "Não foram encontrados registros inativados."}
						</div>
					) : (
						<div className="overflow-x-auto">

							<table className="w-full text-sm text-left table-fixed">
								<thead className="bg-gray-50 text-gray-500 uppercase text-xs">
									<tr>
										<th className="px-4 py-3">ID</th>
										<th className="px-4 py-3">Formulário</th>
										<th className="px-4 py-3">Paciente</th>
										<th className="px-4 py-3">Profissional</th>
										<th className="px-4 py-3">Data de Registro</th>
										<th className="px-4 py-3">Ações</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-gray-100">
									{itensPagina.map((item) => {
										const idSessao = item.sessao_resposta_id
										const isExpanded = expandedRowId === idSessao

										const paciente = pacientesPorId.get(Number(item.paciente_id))

										const profissionalId = Number(item.profissional_id)

										const profissional = Array.isArray(profissionais)
											? profissionais.find(p => Number(p.id) === profissionalId)
											: profissionais?.[profissionalId]

										const nomeProfissional =
											typeof profissional === 'string'
												? profissional
												: profissional?.nomeCompleto ||
												profissional?.usuario?.nome ||
												`Profissional #${item.profissional_id}`

										const formulario = forms?.find(
											(f) => Number(f.formulario_id) === Number(item.formulario_id)
										)

										return (
											<React.Fragment key={idSessao}>
												<tr className="hover:bg-gray-50/80 transition-[background-color]" onClick={() => toggleExpand(idSessao)}>
													<td className="px-4 py-3 text-gray-400 font-mono text-xs">{idSessao}</td>
													<td className="px-4 py-3 font-medium text-gray-900">
														{formulario?.nome_formulario ?? (<FaSpinner className="animate-spin text-gray-400" />)}
													</td>
													<td className="px-4 py-3 font-medium text-gray-800">
														{paciente?.nomeFormatado ?? paciente?.nome ?? `Paciente #${item.paciente_id}`}
													</td>
													<td className="px-4 py-3 text-gray-600">
														{nomeProfissional}
													</td>
													<td className="px-4 py-3 text-gray-600">{formatarData(item.data_aplicacao_sessao)}</td>
													<td className="px-4 py-3">
														<div className="flex gap-2 items-center">
															<button
																type="button"
																title="Voltar a ser ativo"
																disabled={updating}
																onClick={(e) => { e.stopPropagation(); alterarStatus(idSessao, STATUS_RESPOSTA.ATIVO) }}
																className="group bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-bold p-2.5 rounded-xl flex items-center transition-all active:scale-95 cursor-pointer text-sm shadow-sm disabled:opacity-60"
															>
																<FaRotateLeft className="group-hover:-rotate-180 transition-transform duration-500" />
															</button>

															{abaAtiva === "pendentes" && (
																<button
																	type="button"
																	title="Confirmar inativação"
																	disabled={updating}
																	onClick={(e) => { e.stopPropagation(); alterarStatus(idSessao, STATUS_RESPOSTA.INATIVO) }}
																	className="group bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 font-bold p-2.5 rounded-xl flex items-center transition-all active:scale-95 cursor-pointer text-sm shadow-sm disabled:opacity-60"
																>
																	<FaBan />
																</button>
															)}

															<button
																type="button"
																title="Expandir detalhes"
																/*onClick={() => toggleExpand(idSessao)}*/
																className={`p-2.5 rounded-xl text-gray-500 transition-all shadow-sm cursor-pointer border ${isExpanded ? "bg-apollo-500/30 hover:bg-apollo-500/50 border-apollo-500" : "bg-white hover:bg-gray-100 border-slate-300"}`}
															>
																<FaAngleRight className={`transition-all duration-200 ${isExpanded ? "rotate-90 text-teal-800" : "rotate-0"}`} />
															</button>
														</div>
													</td>
												</tr>

												{isExpanded && (
													<tr className="bg-slate-50/80 border-b border-gray-100">
														<td colSpan={6} className="p-4 text-xs text-slate-600">
															<p className='pb-3 font-bold'>Observação:</p>
															<div className={`p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-4 bg-linear-to-r from-red-400 to-orange-400/50 text-white`}>
																<p>{item.observacoes_inativacao || "Nenhuma observação de inativação encontrada para essa pendência"}</p>
															</div>
														</td>
													</tr>
												)}
											</React.Fragment>
										)
									})}
								</tbody>
							</table>
							<div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm text-gray-600">
								<div className="flex items-center gap-2">
									<span>Mostrar</span>
									<select
										value={itensPorPagina}
										onChange={(e) => { setItensPorPagina(Number(e.target.value)); setPagina(1) }}
										className="border border-gray-200 rounded-lg px-2 py-1 bg-white"
									>
										{[5, 10, 20, 50].map((n) => (
											<option key={n} value={n}>{n}</option>
										))}
									</select>
									<span>
										{inicio + 1}–{Math.min(inicio + itensPorPagina, totalItens)} de {totalItens}
									</span>
								</div>

								<div className="flex items-center gap-1">
									<button
										type="button"
										onClick={() => setPagina(paginaAtual - 1)}
										disabled={paginaAtual === 1}
										className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										Anterior
									</button>

									{numerosPagina.map((n, i) =>
										n === '...' ? (
											<span key={`e${i}`} className="px-2 text-gray-400">…</span>
										) : (
											<button
												key={n}
												type="button"
												onClick={() => setPagina(n)}
												className={`min-w-9 px-3 py-1.5 rounded-lg border font-bold ${n === paginaAtual
													? `${aba.ativoClass} border-transparent`
													: 'border-gray-200 bg-white hover:bg-gray-100'
													}`}
											>
												{n}
											</button>
										)
									)}

									<button
										type="button"
										onClick={() => setPagina(paginaAtual + 1)}
										disabled={paginaAtual === totalPaginas}
										className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
									>
										Próxima
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default InativacaoTab