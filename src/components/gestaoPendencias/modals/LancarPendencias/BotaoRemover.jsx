import { FaTrash } from 'react-icons/fa'

export default function BotaoRemover({ onClick, className = '' }) {
	return (
		<button
			type="button"
			onClick={onClick}
			title="Remover escala"
			className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition ${className}`}
		>
			<FaTrash />
		</button>
	)
}