import React from 'react';

const AgendaHeader = ({ titulo, onBack }) => {
    return (
        <header className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 shrink-0">
            <h1 className="font-extrabold text-3xl md:text-4xl text-gray-800 tracking-tight animate-fade-in-down">{titulo}</h1>
            <button onClick={onBack} className="px-4 py-2 text-sm font-semibold bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2">← Voltar</button>
        </header>
    );
};

export default AgendaHeader;
