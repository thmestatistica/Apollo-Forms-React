import { FaChevronDown } from "react-icons/fa";
import { twMerge } from "tailwind-merge";

const Select = ({ key = '', label, value, onChange, options, placeholder = "Selecione..." }) => {
    return (
        <div className="flex flex-col gap-1 w-full">
            <span className="font-semibold text-lg text-apollo-600/60">{label}</span>
            <div className="relative w-full">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={twMerge(
                        'w-full appearance-none cursor-pointer rounded-md py-2 pl-3 pr-8 text-md font-semibold outline-none',
                        'border border-slate-500/30 bg-white/10 text-slate-500 transition-colors',
                        'hover:bg-white/20'
                    )}
                >
                    <option value="" className="text-slate-800">{placeholder}</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value} className="text-slate-800">
                            {opt.label}
                        </option>
                    ))}
                </select>
                <FaChevronDown
                    aria-hidden="true"
                    className={twMerge(
                        'pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]'
                    )}
                />
            </div>
        </div>
    );
};

export default Select