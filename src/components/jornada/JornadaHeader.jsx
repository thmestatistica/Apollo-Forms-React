import React from 'react';
import { useNavigate } from "react-router-dom";

const JornadaHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col md:flex-row justify-between items-center w-full border-b border-gray-100 pb-6 mb-8 gap-4">
      <div className="flex flex-col items-center md:items-start gap-1">
        <h1 className="font-extrabold text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
          💫 <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Jornada do Paciente</span>
        </h1>
        <p className="text-gray-400 text-sm hidden md:block">Acompanhe a evolução e histórico completo</p>
      </div>
      <button
        onClick={() => navigate('/forms-terapeuta/tela-inicial')}
        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
      >
        <span>↩</span> Voltar ao Painel
      </button>
    </div>
  );
};

export default JornadaHeader;
