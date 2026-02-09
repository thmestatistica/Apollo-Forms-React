import React from "react";

const Pagination = React.memo(({ page, total, setPage, count, labelItem = "itens" }) => (
    <div className="flex justify-between items-center mt-4 px-1 w-full bg-white p-2 rounded-lg border border-gray-100">
        <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-sm font-bold text-gray-600 shadow-sm disabled:cursor-not-allowed"
        >
            ◀ Anterior
        </button>
        <span className="text-sm text-gray-500 font-medium">Página {page} de {total} ({count} {labelItem})</span>
        <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page === total}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-sm font-bold text-gray-600 shadow-sm disabled:cursor-not-allowed"
        >
            Próxima ▶
        </button>
    </div>
));

export default Pagination;
