import { FaClipboardList } from 'react-icons/fa'
import { getValue } from '../../../../utils/_geral/commonUtils'
import Select from '../../Select'
import BotaoRemover from './BotaoRemover'
import CampoData from './CampoData'
import { especialidadesOptions } from '../../../../utils/gestao/gestaoPendenciasUtils'

export default function LinhaPendencia({ pendencia: p, nomeEscala, onChange, onRemover }) {
	return (
		<tr className="grid grid-cols-1 gap-3 px-4 py-4 md:table-row md:p-0 hover:bg-slate-50/80 transition-colors">
			<td className="block md:table-cell md:px-5 md:py-3 md:align-middle min-w-0">
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 flex items-center justify-center">
						<FaClipboardList className="text-indigo-500" />
					</div>
					<div className="min-w-0 flex-1">
						<p className="font-semibold text-sm text-slate-700 truncate">{nomeEscala}</p>
						<p className="text-xs bg-slate-100 w-fit py-1 px-2 rounded-md text-slate-400">
							ID #{p.escalaId}
						</p>
					</div>
					<BotaoRemover className="md:hidden" onClick={() => onRemover(p.escalaId)} />
				</div>
			</td>

			<td className="block md:table-cell md:px-3 md:py-3 md:align-middle">
				<label className="md:hidden block text-xs font-semibold text-slate-400 mb-1">
					Especialidade
				</label>
				<Select
					value={p.especialidade}
					onChange={e => onChange(p.escalaId, 'especialidade', getValue(e))}
					options={especialidadesOptions}
				/>
			</td>

			<td className="block md:table-cell md:px-3 md:py-3 md:align-middle">
				<label className="md:hidden block text-xs font-semibold text-slate-400 mb-1">
					Data de lançamento
				</label>
				<CampoData
					value={p.dataLancamento}
					onChange={valor => onChange(p.escalaId, 'dataLancamento', valor)}
				/>
			</td>

			<td className="hidden md:table-cell md:px-3 md:py-3 md:align-middle">
				<div className="flex justify-end">
					<BotaoRemover onClick={() => onRemover(p.escalaId)} />
				</div>
			</td>
		</tr>
	)
}