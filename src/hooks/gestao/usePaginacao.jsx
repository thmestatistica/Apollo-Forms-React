import { useState, useEffect, useMemo } from 'react';

export function usePaginacao(dados, resetDeps = [], pageSizeInicial = 10) {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(pageSizeInicial);

    const totalPages = Math.max(1, Math.ceil(dados.length / pageSize));

    // Volta para a primeira página quando filtros/paciente/tamanho mudam
    useEffect(() => {
        setPage(1);
    }, [...resetDeps, pageSize]);

    // Garante que a página atual nunca ultrapasse o total
    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, totalPages]);

    const dadosPaginados = useMemo(() => {
        const start = (page - 1) * pageSize;
        return dados.slice(start, start + pageSize);
    }, [dados, page, pageSize]);

    return {
        page,
        setPage,
        pageSize,
        setPageSize,
        totalPages,
        totalItems: dados.length,
        dadosPaginados,
    };
}