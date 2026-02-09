import React from "react";
import { formatarNome, formatarDataHora } from "../../utils/jornada/format.js";
import BadgeTextStatus from "./BadgeTextStatus.jsx";

const AppointmentItem = React.memo(({ ag }) => {
    const { hora: horaInicio } = formatarDataHora(ag.inicio);
    const { hora: horaFim } = formatarDataHora(ag.fim);

    const profissionalNome = formatarNome(ag.profissional?.usuario?.nome || "Profissional");
    const especialidade = ag.profissional?.especialidade?.[0] || "Geral";
    const slotNome = ag.slot?.nome || "Slot";
    const presenca = ag.presenca || "—";
    const tipoFormatado = (ag.tipo || "SESSAO").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
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

export default AppointmentItem;
