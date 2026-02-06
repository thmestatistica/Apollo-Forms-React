import React from 'react';

const JornadaEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-32 opacity-60 animate-fade-in text-center">
    <div className="text-8xl mb-6 bg-gray-50 p-8 rounded-full shadow-inner">🔍</div>
    <h3 className="text-3xl font-extrabold text-gray-300 mb-2">Aguardando Seleção</h3>
    <p className="text-gray-400">Utilize a barra de busca acima para encontrar um paciente.</p>
  </div>
);

export default JornadaEmptyState;
