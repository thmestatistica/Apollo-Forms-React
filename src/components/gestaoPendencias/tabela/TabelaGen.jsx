import React from 'react';
import { FaCheckSquare, FaRegSquare, FaMinusSquare } from 'react-icons/fa';
import { twMerge } from 'tailwind-merge';
import HeaderSelect from './HeaderSelect';

/**
 * Tabela genérica com filtro por coluna e seleção de linhas opcionais.
 *
 * columns: [{
 *   key: string,                          // identificador único da coluna
 *   header: string,                       // texto do cabeçalho
 *   filter?: { value, onChange, options },// se presente, renderiza HeaderSelect
 *   render?: (row, index) => ReactNode,   // se ausente, usa row[key]
 *   cellClassName?: string,
 * }]
 */
const TabelaGen = ({
    columns,
    data,
    getRowKey = (row, index) => row.id ?? index,
    emptyMessage = 'Nenhum registro encontrado',
    selectable = false,
    getRowId = (row) => row.id,
    isSelected = () => false,
    onToggleRow,
    onToggleAll,
    allSelected = false,
    someSelected = false,
    selectAllLabel = 'Selecionar todos',
    selectRowLabel = 'Selecionar linha',
    className,
}) => {
    const totalColumns = columns.length + (selectable ? 1 : 0);

    return (
        <table className={twMerge('m-4 overflow-hidden rounded-xl', className)}>
            <thead>
                <tr className="bg-linear-to-r from-blue-700 to-purple-300 text-white text-left">
                    {selectable && (
                        <th className="py-3">
                            <span className="flex items-center justify-center px-3">
                                <button
                                    type="button"
                                    role="checkbox"
                                    aria-checked={allSelected ? true : someSelected ? 'mixed' : false}
                                    aria-label={selectAllLabel}
                                    onClick={onToggleAll}
                                    className="cursor-pointer text-lg rounded focus-visible:outline-2 focus-visible:outline-white"
                                >
                                    {allSelected ? (
                                        <FaCheckSquare />
                                    ) : someSelected ? (
                                        <FaMinusSquare />
                                    ) : (
                                        <FaRegSquare />
                                    )}
                                </button>
                            </span>
                        </th>
                    )}
                    {columns.map((col) => (
                        <th key={col.key} className="py-3 pr-3">
                            {col.filter ? (
                                <HeaderSelect
                                    label={col.header}
                                    value={col.filter.value}
                                    onChange={col.filter.onChange}
                                    options={col.filter.options}
                                />
                            ) : (
                                col.header
                            )}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => {
                    const selected = selectable && isSelected(getRowId(row));

                    return (
                        <tr
                            key={getRowKey(row, index)}
                            className={twMerge(
                                'border-b border-slate-200 even:bg-indigo-50/60',
                                selected &&
                                    'bg-linear-to-r from-teal-300/50 border-white text-teal-800 to-blue-300/50 even:bg-blue-100'
                            )}
                        >
                            {selectable && (
                                <td className="py-3 flex items-center justify-center mt-1">
                                    <button
                                        type="button"
                                        role="checkbox"
                                        aria-checked={selected}
                                        aria-label={selectRowLabel}
                                        onClick={() => onToggleRow(getRowId(row))}
                                        className="cursor-pointer text-lg text-blue-700 rounded focus-visible:outline-2 focus-visible:outline-blue-700"
                                    >
                                        {selected ? <FaCheckSquare /> : <FaRegSquare />}
                                    </button>
                                </td>
                            )}
                            {columns.map((col) => (
                                <td key={col.key} className={twMerge('py-3', col.cellClassName)}>
                                    {col.render ? col.render(row, index) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    );
                })}
                {data.length === 0 && (
                    <tr>
                        <td colSpan={totalColumns} className="py-6 text-center text-slate-500">
                            {emptyMessage}
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
};

export default TabelaGen;