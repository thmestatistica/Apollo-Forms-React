import Select from "react-select";
import PropTypes from "prop-types";
import { defaultSelectStyles } from "./selectStyles";

/**
 * SingleSelect - Wrapper para react-select (seleção única)
 * Props principais:
 * - options: Array<{ value, label, ... }>
 * - value: option | null
 * - onChange: (selectedOption: option | null) => void
 * - placeholder?: string
 * - className?: string
 * - styles?: custom styles override
 */
const SingleSelect = ({
  options = [],
  value = null,
  onChange,
  placeholder = "Selecione...",
  className = "text-sm",
  styles,
  menuPortalTarget = document.body,
  menuPosition = "fixed",
  isClearable = true,
  closeMenuOnSelect = true,
  ...rest
}) => {
  return (
    <Select
      isMulti={false}
      closeMenuOnSelect={closeMenuOnSelect}
      isClearable={isClearable}
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

SingleSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.oneOf([null])]),
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  styles: PropTypes.object,
  menuPortalTarget: PropTypes.any,
  menuPosition: PropTypes.string,
  isClearable: PropTypes.bool,
  closeMenuOnSelect: PropTypes.bool,
};

export default SingleSelect;
