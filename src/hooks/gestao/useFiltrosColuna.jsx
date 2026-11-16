import { useState, useMemo, useCallback } from 'react';
import { mapStatus } from '../../utils/gestao/gestaoPendenciasUtils';
import { toISODate } from '../../utils/_geral/commonUtils';

export const getEscala = (row) => (row.escala ?? '').toLowerCase();
export const getData = (row) => (row.criadaEm ? toISODate(row.criadaEm) : '');

export const COLUNAS_PENDENCIAS = {
    escala: { get: getEscala, ordem: 'asc' },
    criadaEm: { get: getData, ordem: 'desc' },
    especialidade: { get: (row) => row.especialidade, ordem: 'asc' },
    status: { get: (row) => row.status, label: (v) => mapStatus[v] ?? v },
};

export function useFiltrosColuna(dados, colunas = COLUNAS_PENDENCIAS) {
    const chaves = Object.keys(colunas).join('|');
    const filtrosVazios = useMemo(
        () => Object.fromEntries(chaves.split('|').map((k) => [k, ''])),
        [chaves]
    );

    const [colunaFiltros, setColunaFiltros] = useState(filtrosVazios);

    const setFiltroColuna = useCallback(
        (chave) => (valor) => setColunaFiltros((prev) => ({ ...prev, [chave]: valor })),
        []
    );

    const limpar = useCallback(() => setColunaFiltros(filtrosVazios), [filtrosVazios]);

    const temFiltro = Object.values(colunaFiltros).some(Boolean);

    const opcoes = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(colunas).map(([chave, { get, ordem, label }]) => {
                    const valores = [...new Set(dados.map(get).filter(Boolean))];
                    if (ordem) valores.sort();
                    if (ordem === 'desc') valores.reverse();
                    return [chave, valores.map((v) => ({ value: v, label: label ? label(v) : v }))];
                })
            ),
        [dados, colunas]
    );

    const dadosFiltrados = useMemo(
        () =>
            dados.filter((row) =>
                Object.entries(colunas).every(
                    ([chave, { get }]) => !colunaFiltros[chave] || get(row) === colunaFiltros[chave]
                )
            ),
        [dados, colunas, colunaFiltros]
    );

    return { colunaFiltros, setFiltroColuna, limpar, temFiltro, opcoes, dadosFiltrados };
}

export function useOrdenacaoColuna(dados, colunas = COLUNAS_PENDENCIAS) {
    const [ordenacao, setOrdenacao] = useState({ chave: null, direcao: null });

    const alternarOrdenacao = useCallback((chave) => {
        setOrdenacao((prev) => {
            if (prev.chave !== chave) return { chave, direcao: 'asc' };
            if (prev.direcao === 'asc') return { chave, direcao: 'desc' };
            return { chave: null, direcao: null };
        });
    }, []);

    const dadosOrdenados = useMemo(() => {
        const { chave, direcao } = ordenacao;
        const col = colunas[chave];
        if (!col) return dados;

        const valorDe = (row) => {
            const v = col.get(row);
            return col.label && v ? col.label(v) : v;
        };
        const vazio = (v) => v == null || v === '';
        const fator = direcao === 'desc' ? -1 : 1;

        return [...dados].sort((a, b) => {
            const va = valorDe(a);
            const vb = valorDe(b);

            if (vazio(va) && vazio(vb)) return 0;
            if (vazio(va)) return 1;   // vazios sempre no fim
            if (vazio(vb)) return -1;

            const cmp =
                typeof va === 'number' && typeof vb === 'number'
                    ? va - vb
                    : String(va).localeCompare(String(vb), 'pt-BR', {
                          numeric: true,
                          sensitivity: 'base',
                      });

            return cmp * fator;
        });
    }, [dados, colunas, ordenacao]);

    return { ordenacao, alternarOrdenacao, dadosOrdenados };
}