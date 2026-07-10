import React from 'react';
import { Document, Page, PDFDownloadLink, StyleSheet, Text as PdfText, View as PdfView } from '@react-pdf/renderer';
import { formatarHora } from "../../utils/format/formatar_utils.js";
import AgendaTablePDF from './AgendaTablePDF';

const nomesResumidos = {
    "Fisioterapia": "Fisio",
    "Terapia Ocupacional": "T.O.",
    "Fonoaudiologia": "Fono",
    "Armeo": "Armeo",
    "Lokomat": "LKM",
    "C-Mill": "CML",
    "TMS": "TMS",
    "Psicologia": "Psi",
    "Nutrição": "Nutri",
    "Enfermagem": "Enf.",
    "Condicionamento Físico": "Cond"
};

function formatarSlot(sigla, profissionalId) {
    const mapa = {
        ARM: "Armeo",
        TO1: "Terapia Ocupacional",
        TO2: "Terapia Ocupacional",
        LKM: "Lokomat",
        CML: "C-Mill",
        Tab1: "Fisioterapia",
        Tab2: "Fisioterapia",
        Cond1: "Fisioterapia",
        Cond2: "Fisioterapia",
        TMS: "TMS",
        PSI: "Psicologia",
        NUT: "Nutrição",
        FONO1: "Fonoaudiologia",
        FONO2: "Fonoaudiologia",
        ENF: "Enfermagem",
        ON: "Atendimento Online"
    };

    if (
        (profissionalId === 38 || profissionalId === 51) &&
        ["Cond1", "Cond2"].includes(sigla)
    ) {
        return "Condicionamento Físico";
    }

    return mapa[sigla] || sigla;
}


function ajustar_horario(inicioIso) {
    const d = new Date(inicioIso);
    const h = d.getUTCHours();
    const m = d.getUTCMinutes();
    const regras = {
        "8:0": ["08:00", "08:50"],
        "9:0": ["09:00", "09:50"],
        "10:0": ["10:10", "11:00"],
        "11:0": ["11:00", "11:50"],
        "12:0": ["12:10", "13:00"],
        "13:0": ["13:00", "13:50"],
        "14:0": ["14:00", "14:50"],
        "15:0": ["15:10", "16:00"],
        "16:0": ["16:10", "17:00"],
        "17:0": ["17:10", "18:00"],
        "18:0": ["18:00", "18:50"],
        "19:0": ["19:00", "19:50"],
        "20:0": ["20:00", "20:50"]
    };
    const key = `${h}:${m}`;
    if (regras[key]) return regras[key];
    const pad = n => String(n).padStart(2, '0');
    const inicio = `${pad(h)}:${pad(m)}`;
    const fim = `${pad((h + Math.floor((m + 50) / 60)) % 24)}:${pad((m + 50) % 60)}`;
    return [inicio, fim];
}


const AgendaDocumento = ({ pacienteAgenda, displayedDays, timeSlots, agByDateAndHour }) => (
    <Document>
        <Page size="A4" orientation="landscape" style={{ padding: 20, backgroundColor: '#ffffff' }}>          
            <AgendaTablePDF 
                pacienteAgenda={pacienteAgenda}
                displayedDays={displayedDays}
                timeSlots={timeSlots}
                agByDateAndHour={agByDateAndHour}
                getAgendamentoText={(ag) => {
                    const paciente = ag.paciente?.nome ?? "Paciente";
                    let horario = "";

                    if (pacienteAgenda) {
                        const [inicio, fim] = ajustar_horario(ag.inicio);
                        horario = `${inicio} - ${fim}`;
                    } else {
                        horario = `${formatarHora(ag.inicio)} - ${formatarHora(ag.fim)}`;
                    }

                    const especialidade = formatarSlot(
                        ag.slot?.sigla,
                        ag.profissional?.id
                    );

                    const especialidadeCurta =
                        nomesResumidos[especialidade] ?? especialidade;

                    if (pacienteAgenda) {

                        const terapeutas = ag.profissional.usuario.nome;
                        // console.log("Age", ag);

                        return [
                            `${terapeutas}`,
                            `${horario}`,
                            `${especialidadeCurta}`
                        ].join("\n");
                    } else {
                        return [
                            `${paciente}`,
                            `${horario}`,
                            `${especialidadeCurta}`
                        ].join("\n");
                    }
                }}
                            />
        </Page>
    </Document>
);

export function DownloadPDFBotaoAgenda({ pacienteAgenda, displayedDays, timeSlots, agByDateAndHour }) {
    return (
        <PDFDownloadLink
            document={
                <AgendaDocumento
                    pacienteAgenda={pacienteAgenda}
                    displayedDays={displayedDays} 
                    timeSlots={timeSlots} 
                    agByDateAndHour={agByDateAndHour} 
                />
            }
            fileName={`agenda-${new Date().toISOString().split('T')[0]}.pdf`}
            style={{ textDecoration: 'none' }}
        >
            {({ loading }) => (
                <div className={`
                    flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white 
                    transition-all duration-200 rounded-xl shadow-sm select-none cursor-pointer mb-1.5
                    ${loading 
                        ? 'bg-slate-400 opacity-70 cursor-not-allowed pointer-events-none' 
                        : 'bg-apollo-300 hover:bg-apollo-400 hover:shadow-md active:scale-[0.98]'
                    }
                `}>
                    {loading ? (
                        <>
                            {/* Ícone de Spinner Giratório */}
                            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span>Preparando documento...</span>
                        </>
                    ) : (
                        <>
                            {/* Ícone de Download */}
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                            </svg>
                            <span>Baixar Agenda em PDF</span>
                        </>
                    )}
                </div>
            )}
        </PDFDownloadLink>
    );
}
