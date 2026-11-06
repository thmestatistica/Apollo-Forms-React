import { FaClipboardList } from 'react-icons/fa'

export default function EstadoVazio() {
	return (
		<div className="flex-1 flex flex-col justify-center border-2 border-dashed border-slate-200 rounded-2xl py-14 px-6 text-center">
			<div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
				<FaClipboardList className="text-2xl text-indigo-400" />
			</div>
			<h3 className="font-semibold text-slate-700">Nenhuma escala adicionada</h3>
			<p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">
				Selecione um modelo ao lado para carregar as escalas automaticamente ou adicione uma escala manualmente.
			</p>
		</div>
	)
}