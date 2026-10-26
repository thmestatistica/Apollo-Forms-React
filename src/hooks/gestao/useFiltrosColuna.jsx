import { useState, useMemo, useCallback } from 'react';
import { mapStatus } from '../../utils/gestao/gestaoPendenciasUtils';
import { toISODate } from '../../utils/_geral/commonUtils';

export const getEscala = (row) => (row.formulario?.nomeEscala ?? '').toLowerCase();
export const getData = (row) => (row.criadaEm ? toISODate(row.criadaEm) : '');

const COLUNAS = {
    escala: { get: getEscala, ordem: 'asc' },
    criadaEm: { get: getData, ordem: 'desc' },
    especialidade: { get: (row) => row.especialidade, ordem: 'asc' },
    status: { get: (row) => row.status, label: (v) => mapStatus[v] ?? v },
};

const FILTROS_VAZIOS = Object.fromEntries(Object.keys(COLUNAS).map((key) => [key, '']));

export function useFiltrosColuna(dados) {
    const [colunaFiltros, setColunaFiltros] = useState(FILTROS_VAZIOS);

    const setFiltroColuna = useCallback(
        (chave) => (valor) =>
            setColunaFiltros((prev) => ({ ...prev, [chave]: valor })),
        []
    );

    const limpar = useCallback(() => setColunaFiltros(FILTROS_VAZIOS), []);

    const temFiltro = Object.values(colunaFiltros).some(Boolean);

    const opcoes = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(COLUNAS).map(([chave, { get, ordem, label }]) => {
                    const valores = [...new Set(dados.map(get).filter(Boolean))];

                    if (ordem) valores.sort();
                    if (ordem === 'desc') valores.reverse();

                    return [
                        chave,
                        valores.map((v) => ({ value: v, label: label ? label(v) : v })),
                    ];
                })
            ),
        [dados]
    );

    const dadosFiltrados = useMemo(
        () =>
            dados.filter((row) =>
                Object.entries(COLUNAS).every(
                    ([chave, { get }]) =>
                        !colunaFiltros[chave] || get(row) === colunaFiltros[chave]
                )
            ),
        [dados, colunaFiltros]
    );

    return {
        colunaFiltros,
        setFiltroColuna,
        limpar,
        temFiltro,
        opcoes,
        dadosFiltrados,
    };
}