import React from 'react';

function formatar_slot(sigla, profissional_id) {
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

    if ((profissional_id === 38 || profissional_id === 51) && ["Cond1", "Cond2"].includes(sigla)) {
        return "Condicionamento Físico";
    }

    return mapa[sigla] || sigla;
}

function encurtarEspecialidade(especialidade) {
    if (!especialidade) return "";

    const mapaAbreviacoes = {
        "Terapia Ocupacional": "T.O.",
        "Fisioterapia": "Fisio",
        "Fonoaudiologia": "Fono",
        "Psicologia": "Psi",
        "Nutrição": "Nutri",
        "Enfermagem": "Enf.",
        "Condicionamento Físico": "Cond. Físico",
        "Atendimento Online": "Online"
    };

    return mapaAbreviacoes[especialidade] || especialidade;
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

const CardAgendamentoJornada = ({ agendamentos = [] }) => {
    let horario_inicio = null;
    let horario_fim = null;
    const agPadrao = agendamentos[0];

    if (agPadrao) {
        [horario_inicio, horario_fim] = ajustar_horario(agPadrao.inicio);
    }

    const profissionaisUnicos = agendamentos.reduce((acc, ag) => {
        const prof = ag.profissional || {};
        const profId = prof.id || ag.profissional_id;
        const nomeProf = prof.usuario?.nome || prof.nome;

        if (nomeProf && !acc.some(p => p.nome === nomeProf)) {
            const especialidadeBruta = ag.sigla 
                ? formatar_slot(ag.sigla, profId)
                : (prof.usuario?.especialidade || prof.especialidade);

            const especialidadeCurta = encurtarEspecialidade(especialidadeBruta);

            acc.push({
                nome: nomeProf,
                especialidade: especialidadeCurta
            });
        }
        return acc;
    }, []);

    return (
        <div className="mb-2 p-3 rounded-md text-sm border border-transparent border-l-4 border-l-apollo-200 hover:border-apollo-3 hover:shadow-sm transition-all flex flex-col gap-2 bg-apollo-200/10">
            {/* Header: Horário */}
            <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-gray-800 tracking-tight whitespace-nowrap">
                    ⏱️ {horario_inicio} - {horario_fim}
                </span>
            </div>

            {profissionaisUnicos.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                    {profissionaisUnicos.map(({ nome, especialidade }) => (
                        <div key={nome} className="text-xs text-gray-600 flex items-center gap-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-apollo-200 shrink-0"></div>
                                <span className="truncate font-medium text-gray-700">{nome}</span>
                            </div>
                            <span>-</span>
                            {especialidade && (
                                <span className="runcate font-medium text-gray-700">
                                    {especialidade}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CardAgendamentoJornada;