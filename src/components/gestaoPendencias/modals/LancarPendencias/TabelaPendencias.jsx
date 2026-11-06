import { COLUNAS } from '../../../../utils/gestao/gestaoPendenciasUtils'
import LinhaPendencia from './LinhaPendencia'

export default function TabelaPendencias({ pendencias, formulariosOptions, onChange, onRemover }) {
	return (
		<div className="flex-1 min-h-0 border border-slate-200 rounded-2xl overflow-auto">
			<table className="w-full text-left border-collapse md:table-fixed">
				<thead className="hidden md:table-header-group">
					<tr>
						{COLUNAS.map((coluna, i) => (
							<th
								key={i}
								scope="col"
								className={`sticky top-0 z-10 ${coluna.largura} bg-indigo-600 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white`}
							>
								{coluna.titulo}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="block md:table-row-group divide-y divide-slate-100">
					{pendencias.map(p => (
						<LinhaPendencia
							key={p.escalaId}
							pendencia={p}
							nomeEscala={
								formulariosOptions.find(f => f.value === p.escalaId)?.label
								?? `Escala #${p.escalaId}`
							}
							onChange={onChange}
							onRemover={onRemover}
						/>
					))}
				</tbody>
			</table>
		</div>
	)
}