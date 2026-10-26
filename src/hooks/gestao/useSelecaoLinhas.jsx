import { useState, useEffect, useMemo, useCallback } from 'react';

const getIdPadrao = (row) => row.id;

export function useSelecaoLinhas(dados, getId = getIdPadrao) {
    const [selectedSet, setSelectedSet] = useState(() => new Set());

    const idsTodos = useMemo(
        () => dados.map(getId).filter((id) => id != null),
        [dados, getId]
    );

    const todosSelecionados =
        idsTodos.length > 0 && idsTodos.every((id) => selectedSet.has(id));
    const algunsSelecionados = idsTodos.some((id) => selectedSet.has(id));

    const toggleRow = useCallback((id) => {
        setSelectedSet((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const toggleTodos = useCallback(() => {
        setSelectedSet(todosSelecionados ? new Set() : new Set(idsTodos));
    }, [todosSelecionados, idsTodos]);

    const limpar = useCallback(() => setSelectedSet(new Set()), []);

    const isSelected = useCallback((id) => selectedSet.has(id), [selectedSet]);

    // Remove da seleção o que deixou de estar visível
    useEffect(() => {
        const visiveis = new Set(idsTodos);
        setSelectedSet((prev) => {
            const next = new Set([...prev].filter((id) => visiveis.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [idsTodos]);

    // Array para quem precisa
    const selectedRows = useMemo(() => [...selectedSet], [selectedSet]);

    return {
        selectedRows,
        selectedSet,
        selectedCount: selectedSet.size,
        isSelected,
        toggleRow,
        toggleTodos,
        limpar,
        todosSelecionados,
        algunsSelecionados,
    };
}