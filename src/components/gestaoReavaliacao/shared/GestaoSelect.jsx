import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const GestaoSelect = ({ value, onChange, disabled, placeholder, children }) => (
  <div className="relative">
    <select
      className="w-full appearance-none bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-lg py-3 pl-4 pr-10 cursor-pointer outline-none focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-60"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      {placeholder != null ? <option value="">{placeholder}</option> : null}
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
      <ChevronDownIcon className="w-4 h-4" />
    </div>
  </div>
);

export default GestaoSelect;
