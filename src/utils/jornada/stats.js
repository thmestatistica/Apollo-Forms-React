// src/utils/jornada/stats.js

export const calcularIdade = (dataNascimento) => {
    if (!dataNascimento) return "—";
    const hoje = new Date();
    const nasc = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
        idade--;
    }
    return idade;
};

export const calcularTotaisRobotica = (agendamentos = []) => {
    const totais = {
        "ARM": 0, // Armeo
        "CML": 0, // C-Mill
        "LKM": 0, // Lokomat
        "KTS": 0, // Kratos
        "TMS": 0, // TMS
    };

    if (!agendamentos || agendamentos.length === 0) return totais;

    agendamentos.forEach(ag => {
        // O backend retorna slot dentro do objeto. 
        // Verificamos nome e sigla para garantir.
        const nomeSlot = ag.slot?.nome?.toUpperCase() || "";
        const siglaSlot = ag.slot?.sigla?.toUpperCase() || "";
        const presenca = (ag.presenca || "").toLowerCase();

        // Apenas conta se foi 'presente'
        if (presenca === "presente") {
            if (siglaSlot.includes("ARM") || nomeSlot.includes("ARMEO")) totais["ARM"]++;
            if (siglaSlot.includes("CML") || nomeSlot.includes("C-MILL")) totais["CML"]++;
            if (siglaSlot.includes("LKM") || nomeSlot.includes("LOKOMAT")) totais["LKM"]++;
            if (siglaSlot.includes("KTS") || nomeSlot.includes("KRATOS")) totais["KTS"]++;
            if (siglaSlot.includes("TMS") || nomeSlot.includes("TMS")) totais["TMS"]++;
        }
    });

    return totais;
};