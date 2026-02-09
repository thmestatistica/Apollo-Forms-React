import React, { useEffect, useMemo, useRef, useState } from "react";

const SearchableSelect = ({ options, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [deferredSearch, setDeferredSearch] = useState("");
    const [selectedName, setSelectedName] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => {
        const timer = setTimeout(() => setDeferredSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const filtered = useMemo(
        () => options.filter((o) => o.nomeFormatado.toLowerCase().includes(deferredSearch.toLowerCase())),
        [options, deferredSearch]
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        setSelectedName(opt.nomeFormatado);
        setSearch("");
        onSelect(opt.id);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full md:w-1/2">
            <div
                className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg flex justify-between items-center p-3 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedName || placeholder}</span>
                <span className="text-gray-500">▼</span>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    <input
                        type="text"
                        className="w-full p-3 border-b border-gray-200 focus:outline-none bg-white sticky top-0 z-10"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {filtered.length > 0 ? (
                        filtered.map((opt) => (
                            <div
                                key={opt.id}
                                className="p-3 hover:bg-apollo-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-0 transition-colors"
                                onClick={() => handleSelect(opt)}
                            >
                                {opt.nomeFormatado}
                            </div>
                        ))
                    ) : (
                        <div className="p-3 text-gray-500 text-center">Nenhum resultado</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
