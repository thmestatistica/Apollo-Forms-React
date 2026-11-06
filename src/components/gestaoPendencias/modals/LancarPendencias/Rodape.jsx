import { FaPlus } from 'react-icons/fa'

export default function Rodape({ onDescartar, onAplicar, aplicarDisabled, aplicando }) {
	return (
		<div className="shrink-0 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-4">
			<div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
				<p className="text-xs text-slate-400 text-center sm:text-left">
					As alterações ainda não foram aplicadas.
				</p>
				<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
					<button
						type="button"
						onClick={onDescartar}
						className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 font-semibold text-sm transition"
					>
						Descartar alterações
					</button>
					<button
						type="button"
						onClick={onAplicar}
						disabled={aplicarDisabled}
						className="px-6 py-2.5 rounded-xl bg-linear-to-r from-blue-700 to-indigo-600 text-white font-semibold text-sm shadow-md hover:shadow-lg hover:-translate-y-0.5 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
					>
						<span className="flex items-center justify-center gap-2">
							<FaPlus />
							{aplicando ? "Aplicando" : "Aplicar pendências"}
						</span>
					</button>
				</div>
			</div>
		</div>
	)
}