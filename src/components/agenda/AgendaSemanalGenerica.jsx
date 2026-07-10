import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { formatarDataHora } from "../../utils/jornada/format.js";

import LoadingGen from "../info/LoadingGen.jsx";
import InfoGen from "../info/InfoGen.jsx";
import AgendaTable from "./AgendaTable.jsx";
import AgendaHeader from "./AgendaHeader.jsx";
import AgendaControls from "./AgendaControls.jsx";
import { DownloadPDFBotaoAgenda } from "./DownloadPDFBotaoAgenda.jsx";

function AgendaSemanalGenerica({ listarAgendamentos, listarPessoas, listarPacientes, CardComponent, titulo = "Agenda Semanal", FiltroComponent, initialPessoaId = null, tipo="paciente" }) {
    const DAY_COUNT = 6;
    const lastDayIndex = DAY_COUNT - 1;
    const navigate = useNavigate();
    const [agendamentos, setAgendamentos] = useState([]);
    const [loadingAgendamento, setLoadingAgendamento] = useState(false);
    const [pessoas, setPessoas] = useState([]);
    const [loadingPessoas, setLoadingPessoas] = useState(false);
    const [pessoaId, setPessoaId] = useState(null);
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    const [visibleDayIndex, setVisibleDayIndex] = useState(0);
    const [weekStart, setWeekStart] = useState(() => {
        const d = new Date();
        const diffToMonday = (d.getDay() + 6) % 7;
        const monday = new Date(d);
        monday.setHours(0,0,0,0);
        monday.setDate(d.getDate() - diffToMonday);
        return monday;
    });

    // Buscar pessoas
    useEffect(() => {
        setLoadingPessoas(true);
        const fetchPessoas = listarPessoas || listarPacientes;
        fetchPessoas().then(pacs => {
            const ativos = (pacs || []).filter(p => p.ativo !== false);
            ativos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
            setPessoas(ativos);
            if (initialPessoaId && ativos.find(p => p.id === initialPessoaId)) {
                setPessoaId(initialPessoaId);
            } else {
                setPessoaId(ativos[0]?.id ?? null);
            }
        }).finally(() => setLoadingPessoas(false));
    }, [listarPessoas, listarPacientes, initialPessoaId]);

    // Buscar agendamentos
    useEffect(() => {
        if (!pessoaId) return;
        setLoadingAgendamento(true);
        const start = new Date(weekStart);
        const end = new Date(weekStart);
        end.setDate(end.getDate() + lastDayIndex);
        const startDate = start.toISOString().split("T")[0];
        const endDate = end.toISOString().split("T")[0];
        const paramKey = tipo === "paciente" ? "pacienteId" : "usuarioId";
        const params = { startDate, endDate, [paramKey]: pessoaId };
        listarAgendamentos(params)
            .then(resp => setAgendamentos(resp || []))
            .finally(() => setLoadingAgendamento(false));
    }, [listarAgendamentos, weekStart, pessoaId, tipo, lastDayIndex]);

    // Responsividade
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        handleResize();
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    useEffect(() => {
        if (!isMobile) setVisibleDayIndex(0);
        else setVisibleDayIndex(prev => Math.max(0, Math.min(lastDayIndex, prev)));
    }, [isMobile, lastDayIndex]);

    // Navegação de Semanas
    const prevWeek = () => setWeekStart(ws => { const d = new Date(ws); d.setDate(d.getDate() - 7); return d; });
    const nextWeek = () => setWeekStart(ws => { const d = new Date(ws); d.setDate(d.getDate() + 7); return d; });
    const goToToday = () => setWeekStart(() => {
        const d = new Date();
        const monday = new Date(d);
        monday.setHours(0,0,0,0);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return monday;
    });

    // Navegação de Dias (Corrigida sem efeitos colaterais internos)
    const nextDay = () => {
        if (visibleDayIndex < lastDayIndex) {
            setVisibleDayIndex(prev => prev + 1);
        } else {
            nextWeek();
            setVisibleDayIndex(0);
        }
    };

    const prevDay = () => {
        if (visibleDayIndex > 0) {
            setVisibleDayIndex(prev => prev - 1);
        } else {
            prevWeek();
            setVisibleDayIndex(lastDayIndex);
        }
    };

    // Datas da Semana
    const weekDays = useMemo(() => {
        return [...Array(DAY_COUNT)].map((_, i) => { 
            const dt = new Date(weekStart); 
            dt.setDate(dt.getDate() + i); 
            return dt; 
        });
    }, [weekStart]);

    const displayedDays = useMemo(() => {
        return isMobile ? [weekDays[Math.max(0, Math.min(lastDayIndex, visibleDayIndex))]] : weekDays;
    }, [isMobile, weekDays, visibleDayIndex, lastDayIndex]);

    // Inicializa no dia de hoje caso ele pertença à semana atual
    useEffect(() => {
        if (isMobile && weekDays.length > 0) {
            const todayTime = new Date().setHours(0, 0, 0, 0);
            const todayIndex = weekDays.findIndex(day => day.getTime() === todayTime);
            if (todayIndex !== -1) {
                setVisibleDayIndex(todayIndex);
            } else {
                setVisibleDayIndex(0);
            }
        }
    }, [weekStart, isMobile, weekDays]);

    // Agrupamento e horários usando UTC
    const { agByDateAndHour, minHour, maxHour } = useMemo(() => {
        const agrupado = {};
        let minH = 8;
        let maxH = 18;
        const hours = [];
        agendamentos.forEach(ag => {
            if (!ag?.inicio) return;
            const { hora } = formatarDataHora(ag.inicio);
            const key = ag.inicio.slice(0, 10);
            const hour = parseInt(hora.slice(0, 2), 10);
            hours.push(hour);
            if (!agrupado[key]) agrupado[key] = {};
            if (!agrupado[key][hour]) agrupado[key][hour] = [];
            agrupado[key][hour].push(ag);
        });
        if (hours.length > 0) {
            minH = Math.max(0, Math.min(...hours));
            maxH = Math.min(23, Math.max(...hours));
        }
        return { agByDateAndHour: agrupado, minHour: minH, maxHour: maxH };
    }, [agendamentos]);

    const timeSlots = useMemo(() => { 
        const slots = []; 
        for (let h = minHour; h <= maxHour; h++) slots.push(h); 
        return slots; 
    }, [minHour, maxHour]);

    if(loadingPessoas || loadingAgendamento) return <LoadingGen mensagem="Carregando agenda semanal..." primaryColor="#ffffff" secondaryColor="#ffffff" messageColor="text-apollo-100" />;
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
            <div className="w-full h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
                <div className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4 overflow-hidden">
                    <AgendaHeader titulo={titulo} onBack={() => navigate("/forms-terapeuta/tela-inicial")} />
                    <AgendaControls
                        pessoas={pessoas}
                        pessoaId={pessoaId}
                        setPessoaId={setPessoaId}
                        FiltroComponent={FiltroComponent}
                        isMobile={isMobile}
                        weekDays={weekDays}
                        displayedDays={displayedDays}
                        prevDay={prevDay}
                        nextDay={nextDay}
                        prevWeek={prevWeek}
                        nextWeek={nextWeek}
                        goToToday={goToToday}
                    />
                    <DownloadPDFBotaoAgenda 
                        displayedDays={weekDays} 
                        pacienteAgenda={tipo === "paciente" ? true : false}
                        timeSlots={timeSlots} 
                        agByDateAndHour={agByDateAndHour}
                        titulo={titulo}
                    />
                    {agendamentos.length === 0 ? (
                        <div className="flex">
                            <InfoGen message="📄 Nenhum agendamento encontrado para este período." />
                        </div>
                    ) : (
                        <AgendaTable
                            displayedDays={displayedDays}
                            timeSlots={timeSlots}
                            agByDateAndHour={agByDateAndHour}
                            CardComponent={CardComponent}
                            isMobile={isMobile}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default AgendaSemanalGenerica;