/**
 * Componente: PaginationButtons
 * -----------------------------
 * Exibe um conjunto de botões de paginação ("Anterior" e "Próxima"),
 * com suporte à desativação automática e customização de estilo.
 *
 * @component
 * @example
 * <PaginationButtons
 *   currentPage={1}
 *   totalPages={5}
 *   onPrev={() => setCurrentPage((prev) => prev - 1)}
 *   onNext={() => setCurrentPage((prev) => prev + 1)}
 * />
 *
 * @param {{
 *   currentPage: number,
 *   totalPages: number,
 *   onPrev: () => void,
 *   onNext: () => void
 * }} props
 */

const PaginationButtons = ({ currentPage, totalPages, onPrev, onNext }) => {
  return (
    <div className="absolute bottom-0 left-0 w-full h-14 flex justify-center items-center border-t border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        {/* Botão para página anterior */}
        <button
          className="px-3 py-1 bg-apollo-200 text-white rounded-md transition-all hover:bg-apollo-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          disabled={currentPage === 1}
          onClick={onPrev}
        >
          Anterior
        </button>

        {/* Indicador de página atual */}
        <span className="font-medium text-gray-700 text-sm sm:text-base">
          Página {currentPage} de {totalPages}
        </span>

        {/* Botão para próxima página */}
        <button
          className="px-3 py-1 bg-apollo-200 text-white rounded-md transition-all hover:bg-apollo-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          disabled={currentPage === totalPages}
          onClick={onNext}
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default PaginationButtons;
