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

export const calcularTotaisRobotica = (agendamentos = [], prontuario = []) => {
    const totais = {
        "ARMEO": 0,
        "C-MILL": 0,
        "LOKOMAT": 0,
        "KRATOS": 0,
        "TMS": 0,
    };

    if (Array.isArray(agendamentos)) {
        agendamentos.forEach(ag => {
            const nomeSlot = ag.slot?.nome?.toUpperCase() || "";
            const siglaSlot = ag.slot?.sigla?.toUpperCase() || "";
            const presenca = (ag.presenca || "").toLowerCase();

            if (presenca === "presente") {
                if (siglaSlot.includes("ARM") || nomeSlot.includes("ARMEO")) {
                    totais["ARMEO"] = (totais["ARMEO"] || 0) + 1;
                }
                if (siglaSlot.includes("CML") || nomeSlot.includes("C-MILL")) {
                    totais["C-MILL"] = (totais["C-MILL"] || 0) + 1;
                }
                if (siglaSlot.includes("LKM") || nomeSlot.includes("LOKOMAT")) {
                    totais["LOKOMAT"] = (totais["LOKOMAT"] || 0) + 1;
                }
                if (siglaSlot.includes("KTS") || nomeSlot.includes("KRATOS")) {
                    totais["KRATOS"] = (totais["KRATOS"] || 0) + 1;
                }
                if (siglaSlot.includes("TMS") || nomeSlot.includes("TMS")) {
                    totais["TMS"] = (totais["TMS"] || 0) + 1;
                }
            }
        });
    }

    // Contabilizar Prontuário / Formulários
    if (Array.isArray(prontuario)) {
        prontuario.forEach(item => {
            const respostas = item.respostas || [];
            
            const perguntaAlvo = respostas.find(r => r.pergunta === "Terapia Robótica e/ou Eletroterapia");

            if (perguntaAlvo && perguntaAlvo.resposta) {
                const tecnologiasSelecionadas = perguntaAlvo.resposta.split(',').map(t => t.trim());

                tecnologiasSelecionadas.forEach(tech => {
                    const techUpper = tech.toUpperCase();
                    totais[techUpper] = (totais[techUpper] || 0) + 1;
                });
            }

            const nomeForm = (item.nome_formulario || "").toUpperCase();
            if (nomeForm.includes("ARMEO")) totais["ARMEO"] = (totais["ARMEO"] || 0) + 1;
            if (nomeForm.includes("C-MILL") || nomeForm.includes("CMILL")) totais["C-MILL"] = (totais["C-MILL"] || 0) + 1;
            if (nomeForm.includes("LOKOMAT")) totais["LOKOMAT"] = (totais["LOKOMAT"] || 0) + 1;
            if (nomeForm.includes("TMS")) totais["TMS"] = (totais["TMS"] || 0) + 1;
        });
    }

    return totais;
};
