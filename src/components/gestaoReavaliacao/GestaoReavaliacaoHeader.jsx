import React from 'react';
import {
  CheckBadgeIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PlusCircleIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline';

const GestaoReavaliacaoHeader = ({ activeTab, onTabChange, canSeeTab, accessMode, onBack }) => {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full border-b border-gray-100 pb-6 mb-8 gap-4">
      <div className="flex flex-col items-center lg:items-start gap-1 w-full lg:w-auto">
        <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Gestão de Reavaliações</span>
        </h1>
        <p className="text-gray-400 text-sm hidden md:block">Gestão automatizada e administrativa.</p>
      </div>

      <div className="flex flex-col gap-3 w-full lg:w-auto">
        <button
          onClick={onBack}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-5 sm:px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-2 text-sm w-full sm:w-auto self-stretch lg:self-end"
        >
          <ChevronLeftIcon className="w-5 h-5" /> Voltar
        </button>
        <div className="bg-gray-100 p-1 rounded-xl shadow-inner w-full lg:w-auto">
          <div className={`grid ${accessMode === 'gestao' ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4'} gap-1`}>
            {canSeeTab('gerar') && (
              <button
                onClick={() => onTabChange('gerar')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer w-full ${activeTab === 'gerar' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <PlusCircleIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Emissão
              </button>
            )}
            {canSeeTab('admin') && (
              <button
                onClick={() => onTabChange('admin')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer w-full ${activeTab === 'admin' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <TableCellsIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Admin
              </button>
            )}
            {canSeeTab('metodo') && (
              <button
                onClick={() => onTabChange('metodo')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer w-full ${activeTab === 'metodo' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <CheckBadgeIcon className="w-5 h-5 sm:w-6 sm:h-6" /> Método Apollo
              </button>
            )}
            {canSeeTab('navegador') && (
              <button
                onClick={() => onTabChange('navegador')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer w-full ${activeTab === 'navegador' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <MagnifyingGlassIcon className="w-5 h-5 sm:w-6 sm:h-6" /> Navegador
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestaoReavaliacaoHeader;
