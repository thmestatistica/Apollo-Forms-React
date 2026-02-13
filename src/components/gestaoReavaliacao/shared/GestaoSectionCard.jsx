import React from 'react';

const GestaoSectionCard = ({ title, count, countLabel, action, children }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 flex flex-col min-h-[400px] overflow-hidden w-full">
    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
      <div>
        <h2 className="text-xl font-bold text-gray-800 cursor-default">{title}</h2>
        {countLabel ? (
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}
            >
              {count}
            </span>
            <span className="text-sm text-gray-500">{countLabel}</span>
          </div>
        ) : null}
      </div>
      {action}
    </div>
    {children}
  </div>
);

export default GestaoSectionCard;
