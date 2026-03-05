import React, { useState, useEffect } from "react";
import { formatarNome, formatarDataHoraBR } from "../../utils/jornada/format.js";
import { formatarData, formatarHora } from "../../utils/format/formatar_utils.js";
import { PDFDownloadLink } from "@react-pdf/renderer";
import RelatorioPacientePDF from "./RelatorioPdfJornada.jsx";

const DownloadButton = ({ item, data, paciente }) => {
    return (
        <PDFDownloadLink
            className="
                        bg-apollo-50 text-apollo-600 border border-apollo-200 hover:bg-apollo-100
                        hover:border-apollo-300 font-bold py-2 px-4 rounded-xl flex items-center gap-2
                        transition-all active:scale-95 cursor-pointer text-sm shadow-sm z-100"
            document={<RelatorioPacientePDF item={item} formName={item.nome_formulario} paciente={paciente} data={data}/>}
            fileName={`${paciente.nome}-${item.nome_formulario}-${data}_respostas.pdf`}
        >
            {({ loading }) =>
                loading ? "Gerando PDF..." : "📥 Baixar PDF"
            }
        </PDFDownloadLink>
    );
};

const ProntuarioItem = React.memo(({ item, agendamentos, pacienteDetalhes, profissionais }) => {
    const [expanded, setExpanded] = useState(false);

    const agDetalhe = agendamentos.find((a) => a.id == item.agendamento_id);
    const { data: dataStr, hora: horaStr } = formatarDataHoraBR(item.data_registro);

    const profNomeCru =
        agDetalhe?.profissional?.usuario?.nome ||
        agDetalhe?.profissional?.nome ||
        item?.profissional_nome ||
        "Profissional";
    const profNome = formatarNome(profNomeCru);
    const slotStr = agDetalhe?.slot?.nome || "—";
    const siglaStr = agDetalhe?.slot?.sigla || "";
    const inicio = formatarHora(agDetalhe?.inicio);
    const fim = formatarHora(agDetalhe?.fim);
    const dataAg = formatarData(agDetalhe?.inicio);
    const horarioStr = inicio !== "—" && fim !== "—" ? `${inicio} - ${fim}` : "—";
    /*console.log("Agendamento para item de prontuário: ", agDetalhe);*/

    const slotExtra = agendamentos.find(a => a.id == item.sessao_raw?.agendamento_id)?.slot?.nome;

    return (
        <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-gray-50" onClick={() => setExpanded(!expanded)}>
                <div className="flex flex-col gap-1">
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                        Registrado em {dataStr} às {horaStr}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {dataAg !== "—" && horarioStr !== "—" ? (
                            <span className="text-sm text-gray-700">🗓️ {dataAg} : {horarioStr} |</span>
                        ) : (
                            <>
                                <span className="text-sm text-gray-700">🗓️ {dataStr} : {horaStr} |</span>
                            </>
                        )}
                        <h4 className="font-bold text-base text-gray-800">{item.nome_formulario}</h4>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-700">{profNome == "—" ? `🧑‍⚕️ ${profissionais[item.sessao_raw.profissional_id]}` : `🧑‍⚕️ ${profNome}`}</span>

                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-700">🧩 {slotStr === "—" ? (slotExtra === undefined ? "Não encontrado" : slotExtra) : slotStr} {siglaStr !== "" ? `(${siglaStr})` : null}</span>

                    </div>
                </div>
                <div className="flex flex-row gap-2 items-center">
                    <DownloadButton item={item} data={dataAg !== "—" ? dataAg : dataStr} paciente={pacienteDetalhes} />
                    <span
                        className="text-gray-400 text-xl transition-transform"
                        style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                    >
                        ▼
                    </span>
                </div>
            </div>
            {dataAg !== "—" && horarioStr !== "—" ? (
                null
            ) : ( 
                <div className="py-2 bg-red-50">
                    <span className="ml-3 text-[15px] text-black">⚠️ Atenção: preenchimento feito no Forms Antigo. Data acima é referente ao preenchimento do formulário. Não há informação do agendamento da sessão.</span>
                </div>
            )}

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
