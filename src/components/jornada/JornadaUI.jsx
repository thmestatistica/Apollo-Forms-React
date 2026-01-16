import React, { useState, useEffect, useMemo, useRef } from 'react';
import { formatarNome, formatarDataHora, formatarDataHoraBR } from "../../utils/jornada/format.js";

export const DashboardCard = React.memo(({ title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer h-full">
        <div className={`w-full h-1 ${color} rounded-full mb-3 opacity-80`}></div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1 text-center">{title.replace("Sessões de ", "")}</span>
        <span className={`text-4xl font-extrabold ${color.replace('bg-', 'text-')}`}>{value}</span>
    </div>
));

export const BadgeTextStatus = React.memo(({ status }) => {
    const st = (status || "").toLowerCase();
    if (st === 'presente') return <span className="text-green-600 font-bold">✅ Presente</span>;
    if (st.includes('cancelado')) return <span className="text-red-500 font-bold">❌ Cancelado</span>;
    return <span className="text-gray-500 font-bold">⚠️ {status}</span>;
});

export const AppointmentItem = React.memo(({ ag }) => {
    const { hora: horaInicio } = formatarDataHora(ag.inicio);
    const { hora: horaFim } = formatarDataHora(ag.fim);
    
    const profissionalNome = formatarNome(ag.profissional?.usuario?.nome || "Profissional");
    const especialidade = ag.profissional?.especialidade?.[0] || "Geral";
    const slotNome = ag.slot?.nome || "Slot";
    const presenca = ag.presenca || "—";
    const tipoFormatado = (ag.tipo || "SESSAO").replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const corLateral = ag.paciente?.cor || "#333"; 

    return (
        <div className="flex pl-3 border-l-4" style={{ borderColor: corLateral }}>
            <div className="flex flex-col w-full gap-1">
                <span className="font-bold text-gray-900 text-sm">
                    {horaInicio} - {horaFim} • {slotNome}
                </span>
                <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1">
                    <span>🧑‍⚕️ {profissionalNome}</span>
                    <span className="text-blue-500 font-medium">• 🟦 {especialidade}</span>
                </div>
                <div className="text-sm text-gray-600 flex flex-wrap items-center gap-1 mt-1">
                    <span>📄 {tipoFormatado}</span>
                    <span>•</span>
                    <BadgeTextStatus status={presenca} />
                </div>
            </div>
        </div>
    );
});

export const DayCard = React.memo(({ grupo }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 pb-2">
            <h3 className="font-bold text-lg text-gray-800">{grupo.label}</h3>
            <span className="text-xs text-gray-500">{grupo.itens.length} agendamento(s)</span>
        </div>
        <div className="p-4 bg-[#f9fafb] flex-1 flex flex-col gap-3">
            {grupo.itens.map(ag => <AppointmentItem key={ag.id} ag={ag} />)}
        </div>
    </div>
));

export const ProntuarioItem = React.memo(({ item, agendamentos }) => {
    const [expanded, setExpanded] = useState(false);
    
    const agDetalhe = agendamentos.find(a => a.id == item.agendamento_id);
    const { data: dataStr, hora: horaStr } = formatarDataHoraBR(item.data_registro);
    
    const profNomeCru = agDetalhe?.profissional?.usuario?.nome || agDetalhe?.profissional?.nome || item.profissional_nome || "Profissional";
    const profNome = formatarNome(profNomeCru);
    const slotStr = agDetalhe?.slot?.nome || "—";
    const siglaStr = agDetalhe?.slot?.sigla || "";

    return (
        <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-gray-50" onClick={() => setExpanded(!expanded)}>
                <div className='flex flex-col gap-1'>
                    <div className='text-xs text-gray-500 font-bold uppercase tracking-wide'>
                        Registrado em {dataStr} às {horaStr}
                    </div>
                    <div className='flex flex-wrap items-center gap-2'>
                        <h4 className="font-bold text-base text-gray-800">{item.nome_formulario}</h4>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-700">🧑‍⚕️ {profNome}</span>
                        {slotStr !== "—" && (
                            <>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-700">🧩 {slotStr} ({siglaStr})</span>
                            </>
                        )}
                    </div>
                </div>
                <span className="text-gray-400 text-xl transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
            </div>
            
            {expanded && (
                <div className="p-4 bg-white border-t border-gray-100 animate-fade-in">
                    <div className="text-right text-xs text-gray-400 mb-2">Registro: {dataStr} {horaStr}</div>
                    {item.respostas.length === 0 ? (
                        <p className="text-gray-500 italic">Sem detalhes informados.</p>
                    ) : (
                        item.respostas.map((r, i) => (
                            <div key={i} className="mb-3 border-b border-gray-100 pb-2 last:border-0">
                                <p className="font-bold text-gray-700 text-sm mb-1">{r.pergunta}</p>
                                <p className="text-gray-600 text-sm whitespace-pre-wrap">{r.resposta}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
});

// ... (Pagination e SearchableSelect mantenha iguais) ...
export const Pagination = React.memo(({ page, total, setPage, count, labelItem = "itens" }) => (
    <div className="flex justify-between items-center mt-4 px-1 w-full bg-white p-2 rounded-lg border border-gray-100">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-sm font-bold text-gray-600 shadow-sm disabled:cursor-not-allowed">◀ Anterior</button>
        <span className="text-sm text-gray-500 font-medium">Página {page} de {total} ({count} {labelItem})</span>
        <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total} className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-sm font-bold text-gray-600 shadow-sm disabled:cursor-not-allowed">Próxima ▶</button>
    </div>
));

export const SearchableSelect = ({ options, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [deferredSearch, setDeferredSearch] = useState(""); 
    const [selectedName, setSelectedName] = useState("");
    const wrapperRef = useRef(null);

    useEffect(() => { const timer = setTimeout(() => setDeferredSearch(search), 300); return () => clearTimeout(timer); }, [search]);
    const filtered = useMemo(() => options.filter(o => o.nomeFormatado.toLowerCase().includes(deferredSearch.toLowerCase())), [options, deferredSearch]);

    useEffect(() => {
        const handleClickOutside = (event) => { if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => { setSelectedName(opt.nomeFormatado); setSearch(""); onSelect(opt.id); setIsOpen(false); };

    return (
        <div ref={wrapperRef} className="relative w-full md:w-1/2">
            <div className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg flex justify-between items-center p-3 shadow-sm cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => setIsOpen(!isOpen)}>
                <span>{selectedName || placeholder}</span><span className="text-gray-500">▼</span>
            </div>
            {isOpen && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-xl max-h-96 overflow-y-auto">
                    <input type="text" className="w-full p-3 border-b border-gray-200 focus:outline-none bg-white sticky top-0 z-10" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} autoFocus />
                    {filtered.length > 0 ? filtered.map(opt => (
                        <div key={opt.id} className="p-3 hover:bg-apollo-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-0 transition-colors" onClick={() => handleSelect(opt)}>{opt.nomeFormatado}</div>
                    )) : <div className="p-3 text-gray-500 text-center">Nenhum resultado</div>}
                </div>
            )}
        </div>
    );
};