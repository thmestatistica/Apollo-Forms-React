import React, { useState } from 'react';
import { MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline';
import AdminTab from './AdminTab';
import GerarTab from './GerarTab';

const GerenciarTab = ({ accessMode, allowedPatientIds, dataManual, setDataManual }) => {
  const [abaAtiva, setAbaAtiva] = useState('emissao');

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-indigo-50/50 p-6 border-b border-indigo-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-indigo-900 font-bold flex items-center gap-2 text-xl">
              <SparklesIcon className="w-6 h-6" /> Gestão de Reavaliações
            </h2>
            <p className="text-sm text-indigo-700/70 mt-1">Escolha Emissão ou Pesquisa e siga o fluxo.</p>
          </div>
          <div className="bg-white/80 p-1 rounded-xl shadow-inner w-full lg:w-auto border border-indigo-100">
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setAbaAtiva('emissao')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer w-full ${abaAtiva === 'emissao' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-indigo-50'}`}
              >
                <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Emissão
              </button>
              <button
                onClick={() => setAbaAtiva('pesquisa')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer w-full ${abaAtiva === 'pesquisa' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:bg-amber-50'}`}
              >
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Pesquisa
              </button>
            </div>
          </div>
        </div>
        <div className="p-4 md:p-6">
          {abaAtiva === 'emissao' ? (
            <GerarTab
              accessMode={accessMode}
              allowedPatientIds={allowedPatientIds}
              dataManual={dataManual}
              setDataManual={setDataManual}
            />
          ) : (
            <AdminTab accessMode={accessMode} allowedPatientIds={allowedPatientIds} />
          )}
        </div>
      </div>
    </div>
  );
};

export default GerenciarTab;
