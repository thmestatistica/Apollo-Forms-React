import React, { useState } from "react";
import { formatarNome, formatarDataHoraBR } from "../../utils/jornada/format.js";

const ProntuarioItem = React.memo(({ item, agendamentos }) => {
    const [expanded, setExpanded] = useState(false);

    const agDetalhe = agendamentos.find((a) => a.id == item.agendamento_id);
    const { data: dataStr, hora: horaStr } = formatarDataHoraBR(item.data_registro);

    const profNomeCru =
        agDetalhe?.profissional?.usuario?.nome ||
        agDetalhe?.profissional?.nome ||
        item.profissional_nome ||
        "Profissional";
    const profNome = formatarNome(profNomeCru);
    const slotStr = agDetalhe?.slot?.nome || "—";
    const siglaStr = agDetalhe?.slot?.sigla || "";

    console.log("Item: ", item)

    return (
        <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-gray-50" onClick={() => setExpanded(!expanded)}>
                <div className="flex flex-col gap-1">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                        Registrado em {dataStr} às {horaStr}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                <span
                    className="text-gray-400 text-xl transition-transform"
                    style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                    ▼
                </span>
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

export default ProntuarioItem;
