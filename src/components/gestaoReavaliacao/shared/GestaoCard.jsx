import React from 'react';

const GestaoCard = ({ title, description, icon: Icon, children }) => (
  <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden w-full">
    <div className="bg-indigo-50/50 p-6 border-b border-indigo-100">
      <h2 className="text-indigo-900 font-bold flex items-center gap-2 cursor-default text-xl">
        {Icon ? <Icon className="w-6 h-6" /> : null}
        {title}
      </h2>
      {description ? <p className="text-sm text-indigo-700/70 mt-2">{description}</p> : null}
    </div>
    <div className="p-8">{children}</div>
  </div>
);

export default GestaoCard;
