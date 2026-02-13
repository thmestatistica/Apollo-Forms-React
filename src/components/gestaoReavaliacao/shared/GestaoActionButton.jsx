import React from 'react';

const GestaoActionButton = ({ onClick, disabled, loading, icon: Icon, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all flex justify-center items-center gap-3 text-sm uppercase tracking-wider
    ${disabled ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:-translate-y-0.5 active:scale-95'}`}
  >
    {Icon ? <Icon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /> : null}
    {children}
  </button>
);

export default GestaoActionButton;
