import React from 'react';
import {
  CheckBadgeIcon,
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline';
import { FaBorderNone } from "react-icons/fa6";

const GestaoPendenciasHeader = ({ activeTab, onTabChange, canSeeTab, onBack }) => {

  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center w-full border-b border-gray-100 pb-6 mb-8 gap-4">
      <div className="flex flex-col items-center lg:items-start gap-1 w-full lg:w-auto">
        <h1 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
          <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Gestão de Pendencias</span>
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
      </div>
    </div>
  );
};

export default GestaoPendenciasHeader;
