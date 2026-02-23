import { abreviarNome, formatarHora } from "../../utils/format/formatar_utils.js";

// Converte cor hex para rgba com alpha
function hexToRgba(hex, alpha = 0.15) {
    if (!hex) return `rgba(99,102,241,${alpha})`;
    const h = hex.replace('#', '');
    let r = 0, g = 0, b = 0;
    if (h.length === 3) {
        r = parseInt(h[0] + h[0], 16);
        g = parseInt(h[1] + h[1], 16);
        b = parseInt(h[2] + h[2], 16);
    } else if (h.length === 6) {
        r = parseInt(h.slice(0, 2), 16);
        g = parseInt(h.slice(2, 4), 16);
        b = parseInt(h.slice(4, 6), 16);
    } else {
        return `rgba(99,102,241,${alpha})`;
    }
    return `rgba(${r},${g},${b},${alpha})`;
}

const CardAgendamentoTerapeuta = ({ agendamento, isMobile }) => {
    const corRaw = agendamento?.paciente?.cor || (agendamento?.Paciente && typeof agendamento.Paciente === 'object' ? agendamento.Paciente.cor : null) || '#6366f1';
    const pres = agendamento?.presenca;
    let presEmoji = null;
    if (pres !== null && pres !== undefined) {
        const present = String(pres).toLowerCase() === 'presente';
        presEmoji = present ? '✅' : '❌';
    }
    let pacienteNome = agendamento?.paciente?.nome || 'Paciente';
    if (isMobile && typeof abreviarNome === 'function') {
        pacienteNome = pacienteNome && typeof pacienteNome === 'string' ? (abreviarNome(pacienteNome, 2) || 'Paciente') : 'Paciente';
    }
    const inicio = agendamento?.inicio;
    const fim = agendamento?.fim;
    const slotNome = agendamento?.slot?.nome;
    return (
        <div 
            className="mb-1 p-2 rounded-md text-sm border border-transparent hover:border-black/10 hover:shadow-sm transition-all flex flex-col gap-1" 
            style={{ backgroundColor: hexToRgba(corRaw, 0.18) }}
        >
            <div className="flex items-start justify-between gap-1">
                <span className="font-semibold text-gray-800 leading-tight truncate" title={pacienteNome}>
                    {pacienteNome}
                </span>
                {presEmoji && <span className="text-xs shrink-0" aria-label="presença">{presEmoji}</span>}
            </div>
            <div className="text-xs font-medium text-gray-600 flex items-center gap-1">
                <span>⏱️ {inicio ? formatarHora(inicio) : '--:--'} - {fim ? formatarHora(fim) : '--:--'}</span>
                <span>🧩 {slotNome || 'Slot não definido'}</span>
            </div>
        </div>
    );
};

export default CardAgendamentoTerapeuta;
