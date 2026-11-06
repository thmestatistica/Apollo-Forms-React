import { FaCalendarAlt } from 'react-icons/fa'

export default function CampoData({ value, onChange }) {
	return (
		<div className="relative">
			<FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
			<input
				type="date"
				value={value}
				onChange={e => onChange(e.target.value)}
				className="w-full min-w-0 pl-9 pr-2 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
			/>
		</div>
	)
}