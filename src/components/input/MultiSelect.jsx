import Select from "react-select";
import PropTypes from "prop-types";
import { defaultSelectStyles } from "./selectStyles";

/**
 * MultiSelect - Wrapper para react-select (multi)
 * Props principais:
 * - options: Array<{ value, label, ... }>
 * - value: Array<option>
 * - onChange: (selectedOptions: Array<option>) => void
 * - placeholder?: string
 * - className?: string
 * - styles?: custom styles override
 */
const MultiSelect = ({
  options = [],
  value = [],
  onChange,
  placeholder = "Selecione...",
  className = "text-sm",
  styles,
  menuPortalTarget = document.body,
  menuPosition = "fixed",
  closeMenuOnSelect = false,
  ...rest
}) => {
  return (
    <Select
      isMulti
      closeMenuOnSelect={closeMenuOnSelect}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      menuPortalTarget={menuPortalTarget}
      menuPosition={menuPosition}
      styles={{ ...defaultSelectStyles, ...styles }}
      {...rest}
    />
  );
};

MultiSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  styles: PropTypes.object,
  menuPortalTarget: PropTypes.any,
  menuPosition: PropTypes.string,
  closeMenuOnSelect: PropTypes.bool,
};

export default MultiSelect;
