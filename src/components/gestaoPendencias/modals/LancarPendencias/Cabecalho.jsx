import { FaClipboardList, FaTimes } from 'react-icons/fa'

export default function Cabecalho({ onClose }) {
	return (
		<div className="shrink-0 bg-linear-to-r from-blue-700 via-indigo-600 to-purple-500 px-4 sm:px-6 py-5 text-white">
			<div className="flex items-center justify-between gap-3">
				<div className="flex items-center gap-4 min-w-0">
					<div className="p-3 bg-white/15 rounded-xl shrink-0">
						<FaClipboardList className="text-2xl" />
					</div>
					<div className="min-w-0">
						<h1 className="text-lg sm:text-xl font-bold">Lançamento de pendências</h1>
						<p className="text-sm text-white/80 mt-1">
							Gerencie as escalas e suas datas de lançamento.
						</p>
					</div>
				</div>
				<button onClick={onClose} className="p-2 rounded-lg hover:bg-white/20 transition shrink-0">
					<FaTimes />
				</button>
			</div>
		</div>
	)
}