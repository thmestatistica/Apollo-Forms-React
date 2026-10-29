import ReactSelect from "react-select";
import { defaultSelectStyles } from "../input/selectStyles";
import { twMerge } from "tailwind-merge";

const Select = ({ key = '', label, value, onChange, options = [], placeholder = "Selecione...", className = "" }) => {
    const selectedOption = options.find((opt) => opt.value === value) || null;

    return (
        <div className={twMerge("flex flex-col gap-1 w-full", className)}>
            <span className="font-semibold text-lg text-apollo-600/60">{label}</span>
            <ReactSelect
                isMulti={false}
                isClearable
                closeMenuOnSelect
                options={options}
                value={selectedOption}
                onChange={(opt) => onChange(opt ? opt.value : '')}
                placeholder={placeholder}
                className="w-full text-sm"
                menuPortalTarget={document.body}
                menuPosition="fixed"
                styles={defaultSelectStyles}
            />
        </div>
    );
};

export default Select;