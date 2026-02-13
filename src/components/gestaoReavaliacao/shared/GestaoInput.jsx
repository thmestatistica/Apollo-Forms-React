import React from 'react';

const GestaoInput = ({ className = '', ...props }) => (
  <input
    className={`w-full bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-lg py-2.5 pl-4 pr-4 cursor-text outline-none focus:border-indigo-400 hover:border-indigo-200 transition-all shadow-sm disabled:opacity-50 ${className}`}
    {...props}
  />
);

export default GestaoInput;
