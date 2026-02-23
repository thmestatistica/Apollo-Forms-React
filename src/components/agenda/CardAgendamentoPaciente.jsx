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

// Recebe agendamentos agrupados do mesmo horário
const CardAgendamentoPaciente = ({ agendamentos, isMobile }) => {
    // Agrupa especialidades e terapeutas
    const especialidades = [];
    const terapeutas = [];
    let horario_inicio = null;
    let horario_fim = null;
    let agPadrao = agendamentos[0];

    // Regras de horário e especialidade só para paciente
    if (agPadrao) {
        [horario_inicio, horario_fim] = ajustar_horario(agPadrao.inicio);
    }

    agendamentos.forEach(ag => {
        const slot = ag.slot || {};
        const nome = formatar_slot(slot.sigla, ag.profissional?.id);
        if (!especialidades.includes(nome)) especialidades.push(nome);
        
        const prof = ag.profissional || {};
        const nome_prof = prof.usuario?.nome || prof.nome;
        if (nome_prof && !terapeutas.includes(nome_prof)) terapeutas.push(nome_prof);
    });

    // Reduz especialidades para nomes curtos se mais de uma
    let especialidades_str = especialidades.length === 1 && !isMobile
        ? especialidades[0]
        : especialidades.map(e => nomesResumidos[e] || e).join(" + ");

    return (
        <div className="mb-2 p-3 rounded-md text-sm border border-transparent border-l-4 border-l-apollo-200 hover:border-apollo-3 hover:shadow-sm transition-all flex flex-col gap-2 bg-apollo-200/10">
            {/* Header: Horário e Especialidade */}
            <div className="flex items-start justify-between gap-2">
                <span className="font-bold text-gray-800 tracking-tight whitespace-nowrap">
                    ⏱️ {horario_inicio} - {horario_fim}
                </span>
                <span className="text-xs font-semibold text-apollo-100 bg-apollo-500/70 px-2 py-0.5 rounded text-right leading-tight word-break">
                    {especialidades_str}
                </span>
            </div>

            {/* Body: Lista de Terapeutas */}
            {terapeutas.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                    {terapeutas.map(t => (
                        <div key={t} className="text-xs text-gray-600 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-apollo-200 opacity-70"></div>
                            <span className="truncate">{t}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CardAgendamentoPaciente;