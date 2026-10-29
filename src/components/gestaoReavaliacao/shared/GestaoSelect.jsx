import React, { Children, Fragment, isValidElement, useMemo } from 'react';
import ReactSelect from 'react-select';
import { defaultSelectStyles } from '../../input/selectStyles';

// Converte as <option> recebidas como children em { value, label, isDisabled }
const extractOptions = (children) => {
  const result = [];
  const walk = (nodes) => {
    Children.toArray(nodes).forEach((child) => {
      if (!isValidElement(child)) return;
      if (child.type === Fragment) return walk(child.props.children);
      if (child.type === 'option') {
        const label = Children.toArray(child.props.children).join('');
        result.push({
          value: String(child.props.value ?? label),
          label,
          isDisabled: !!child.props.disabled,
        });
      }
    });
  };
  walk(children);
  return result;
};

const GestaoSelect = ({ value, onChange, disabled, placeholder, children }) => {
  const options = useMemo(() => extractOptions(children), [children]);

  const selectedOption =
    options.find((opt) => opt.value === String(value ?? '')) || null;

  return (
    <ReactSelect
      isMulti={false}
      isClearable={placeholder != null}
      closeMenuOnSelect
      isDisabled={disabled}
      options={options}
      value={selectedOption}
      onChange={(opt) => onChange?.({ target: { value: opt ? opt.value : '' } })}
      placeholder={placeholder ?? 'Selecione...'}
      noOptionsMessage={() => 'Nenhum resultado'}
      className="w-full text-sm"
      menuPortalTarget={document.body}
      menuPosition="fixed"
      styles={defaultSelectStyles}
    />
  );
};

export default GestaoSelect;