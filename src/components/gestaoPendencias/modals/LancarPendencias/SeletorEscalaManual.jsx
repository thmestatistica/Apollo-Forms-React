import { FaPlus } from 'react-icons/fa'
import Select from '../../Select'

export default function SeletorEscalaManual({ options, value, onChange, onAdicionar }) {
	return (
		<div className="grid grid-cols-3 items-end w-full gap-3 mb-4">
			<Select
				className="col-span-2"
				label="Escala"
				options={options}
				value={value}
				onChange={onChange}
				placeholder="Selecione uma escala individualmente..."
			/>
			<button
				type="button"
				onClick={onAdicionar}
				disabled={!value}
				className="col-span-1 w-full h-fit px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
			>
				<FaPlus className="w-3 h-3" />
				Adicionar escala manualmente
			</button>
		</div>
	)
}