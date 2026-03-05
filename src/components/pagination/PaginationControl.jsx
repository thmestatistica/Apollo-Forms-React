import React from 'react';

/**
 * Componente: PaginationControl
 * -----------------------------
 * Controle de paginação compacto e estilizado.
 * (Para uso no geral, como em tabelas ou listas menores)
 * 
 * @param {Object} props
 * @param {number} props.currentPage - Página atual
 * @param {number} props.totalPages - Total de páginas
 * @param {Function} props.onPrev - Função para ir para anterior
 * @param {Function} props.onNext - Função para ir para próxima
 */
const PaginationControl = ({ currentPage, totalPages, onPrev, onNext }) => {
  return (
    <div className="flex items-center gap-2 justify-center">
        <button
            type="button"
            onClick={onPrev}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded border border-gray-300 text-apollo-200 text-xs font-bold bg-white hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
            Anterior
        </button>
        <div className="flex items-center gap-1 mx-1">
            <span className="text-xs font-bold text-gray-800">{currentPage}</span>
            <span className="text-xs text-gray-500">/ {totalPages}</span>
        </div>
        <button
            type="button"
            onClick={onNext}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded border border-gray-300 text-apollo-200 text-xs font-bold bg-white hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all cursor-pointer"
        >
            Próxima
        </button>
    </div>
  );
};

export default PaginationControl;
