import { FaChevronDown } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

const HeaderSelect = ({ label, value, onChange, options }) => {
    const ativo = value !== '';
    return (
        <div className="relative w-fit">
            <select
                aria-label={`Filtrar por ${label.toLowerCase()}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={twMerge(
                    'appearance-none cursor-pointer rounded-md py-1 pl-3 pr-8 text-sm font-semibold outline-none',
                    'border border-white/30 bg-white/10 text-white transition-colors',
                    'hover:bg-white/20',
                    ativo && 'bg-white text-blue-800 border-white'
                )}
            >
                <option value="" className="text-slate-800">{label}</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value} className="text-slate-800">
                        {opt.label}
                    </option>
                ))}
            </select>
            <FaChevronDown
                aria-hidden="true"
                className={twMerge(
                    'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]',
                    ativo ? 'text-blue-800' : 'text-white'
                )}
            />
        </div>
    );
};

export default HeaderSelect