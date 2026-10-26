import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const getPageNumbers = (current, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = new Set([1, total, current - 1, current, current + 1]);
    const sorted = [...pages].filter(p => p >= 1 && p <= total).sort((a, b) => a - b);

    const result = [];
    sorted.forEach((p, i) => {
        if (i > 0 && p - sorted[i - 1] > 1) result.push('...');
        result.push(p);
    });
    return result;
};

const Paginacao = ({ page, pageSize, totalItems, onPageChange, onPageSizeChange }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const inicio = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const fim = Math.min(page * pageSize, totalItems);

    const btnBase = 'min-w-9 h-9 px-2 rounded-md text-sm font-medium flex items-center justify-center transition-colors';

    return (
        <div className='flex flex-wrap items-center justify-between gap-3 px-4 pb-4'>
            <div className='flex items-center gap-2 text-sm text-slate-600'>
                <span>Itens por página:</span>
                <select
                    value={pageSize}
                    onChange={(e) => onPageSizeChange(Number(e.target.value))}
                    className='border border-slate-300 rounded-md px-2 py-1'
                >
                    {PAGE_SIZE_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <span className='ml-2'>{inicio}–{fim} de {totalItems}</span>
            </div>

            <div className='flex items-center gap-1'>
                <button
                    type='button'
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className={`${btnBase} text-slate-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed`}
                    aria-label='Página anterior'
                >
                    <FaChevronLeft />
                </button>

                {getPageNumbers(page, totalPages).map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className='px-2 text-slate-400'>…</span>
                    ) : (
                        <button
                            key={p}
                            type='button'
                            onClick={() => onPageChange(p)}
                            className={`${btnBase} ${p === page
                                ? 'bg-linear-to-r from-indigo-700 to-pink-300 text-white'
                                : 'text-slate-600 hover:bg-indigo-50'}`}
                            aria-current={p === page ? 'page' : undefined}
                        >
                            {p}
                        </button>
                    )
                )}

                <button
                    type='button'
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className={`${btnBase} text-slate-600 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed`}
                    aria-label='Próxima página'
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default Paginacao