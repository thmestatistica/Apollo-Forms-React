export default function BarraProgresso({ preenchidas, total, percentual }) {
	return (
		<div className="mb-4 shrink-0">
			<div className="flex justify-between text-xs text-slate-500 mb-2">
				<span>Datas configuradas ({preenchidas}/{total})</span>
				<span>{Math.round(percentual)}%</span>
			</div>
			<div className="h-2 bg-slate-100 rounded-full overflow-hidden">
				<div
					className="h-full bg-linear-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
					style={{ width: `${percentual}%` }}
				/>
			</div>
		</div>
	)
}