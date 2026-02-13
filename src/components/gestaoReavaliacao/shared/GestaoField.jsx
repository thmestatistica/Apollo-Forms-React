import React from 'react';

const GestaoField = ({ label, icon: Icon, children }) => (
  <div className="w-full">
    <label className="text-sm font-bold text-gray-500 tracking-wide uppercase mb-2 flex items-center gap-2 ml-1">
      {Icon ? <Icon className="w-4 h-4 text-slate-400" /> : null}
      {label}
    </label>
    {children}
  </div>
);

export default GestaoField;
