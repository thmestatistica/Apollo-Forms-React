import React, { useState, useEffect } from "react";
import { formatarNome, formatarDataHoraBR } from "../../utils/jornada/format.js";
import { formatarData, formatarHora } from "../../utils/format/formatar_utils.js";
import TabelaMatriz from "./TabelaMatriz.jsx";

import { PDFDownloadLink } from "@react-pdf/renderer";
import RelatorioPacientePDF from "./RelatorioPdfJornada.jsx";
import { FaBan, FaRotateLeft, FaTrash } from "react-icons/fa6";
import { Modal } from "../modal/Modal.jsx";
import { twMerge } from "tailwind-merge";
import { atualizar_status_resposta, STATUS_RESPOSTA } from "../../api/gestao/gestao_utils.js";

import { useAuth } from "../../hooks/useAuth.jsx";

const USUARIOS_MASTER = [17]

export const STATUS_CONFIG = {
    ATIVO: {
        label: "Ativo",
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
    },
    PENDENTE: {
        label: "Inativação Pendente",
        badge: "bg-orange-50 text-orange-700 border-orange-200",
        dot: "bg-orange-400",
    },
    INATIVO: {
        label: "Inativo",
        badge: "bg-rose-100 text-rose-600 border-rose-200",
        dot: "bg-rose-400",
    },
};

const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status];
    if (!cfg) return null;
    return (
        <span
            className={twMerge(
                "inline-flex items-center gap-1.5 border rounded-full px-2.5 py-0.5 text-xs font-bold",
                cfg.badge
            )}
        >
            <span className={twMerge("w-2 h-2 rounded-full", cfg.dot)} />
            {cfg.label}
        </span>
    );
};

const DownloadButton = ({ item, data, paciente }) => {
    return (
        <PDFDownloadLink
            className="
                        bg-apollo-50 text-apollo-600 border border-apollo-200 hover:bg-apollo-100
                        hover:border-apollo-300 font-bold py-2 px-4 rounded-xl flex items-center gap-2
                        transition-all active:scale-95 cursor-pointer text-sm shadow-sm z-10"
            document={<RelatorioPacientePDF item={item} formName={item.nome_formulario} paciente={paciente} data={data} />}
            fileName={`${paciente.nome}-${item.nome_formulario}-${data}_respostas.pdf`}
        >
            {({ loading }) =>
                loading ? "Gerando PDF..." : "📥 Baixar PDF"
            }
        </PDFDownloadLink>
    );
};

const ObservacaoInativacaoModal = ({ isOpen, onClose, onConfirm, loading }) => {
    const [observacao, setObservacao] = useState("");

    useEffect(() => {
        if (!isOpen) setObservacao("");
    }, [isOpen]);

    const observacaoValida = observacao.trim().length > 0;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col gap-3 p-2" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-bold text-gray-800 text-base">Solicitar inativação</h3>
                <p className="text-sm text-gray-600">
                    Informe o motivo pelo qual esta resposta deve ser inativada.
                </p>
                <textarea
                    value={observacao}
                    onChange={(e) => setObservacao(e.target.value)}
                    rows={4}
                    placeholder="Ex.: Registro duplicado, preenchido no paciente errado..."
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(observacao.trim())}
                        disabled={!observacaoValida || loading}
                        className="px-4 py-2 rounded-xl text-sm font-bold bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 disabled:opacity-60"
                    >
                        {loading ? "Enviando..." : "Confirmar"}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

const ProntuarioItem = React.memo(({ item, agendamentos, pacienteDetalhes, profissionais, disablePDF }) => {
    const [expanded, setExpanded] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [isObservacaoModalOpen, setIsObservacaoModalOpen] = useState(false);

    const { user } = useAuth()

    const [status, setStatus] = useState(item?.sessao_raw?.status_registro);

    useEffect(() => {
        setStatus(item?.sessao_raw?.status_registro);
    }, [item?.sessao_raw?.status_registro]);

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

    const slotExtra = agendamentos.find(a => a.id == item.sessao_raw?.agendamento_id)?.slot?.nome;
    const sessaoRespostaId = item.sessao_raw?.sessao_resposta_id;

    const alterarStatus = async (novoStatus, observacao = null) => {
        if (!sessaoRespostaId) return false;
        try {
            setUpdating(true);
            const response = await atualizar_status_resposta(sessaoRespostaId, novoStatus, observacao);
            if (response) {
                setStatus(novoStatus);
                return true;
            }
            return false;
        } catch (err) {
            console.error("Erro ao atualizar status do registro:", err);
            return false;
        } finally {
            setUpdating(false);
        }
    };

    const confirmarSolicitacaoInativacao = async (observacao) => {
        const ok = await alterarStatus(STATUS_RESPOSTA.PENDENTE, observacao);
        if (ok) setIsObservacaoModalOpen(false);
    };

    return (
        <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-gray-50" onClick={() => setExpanded(!expanded)}>
                <div className="flex flex-col gap-1">
                    <div>
                        <div className="text-xs flex gap-2 text-gray-500 font-bold uppercase tracking-wide items-center">
                            <p>Registrado em {dataStr} às {horaStr} | </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400 bg-gray-100 border border-gray-200 rounded-md px-2 py-0.5">
                                    id: {sessaoRespostaId || "não encontrado"}
                                </span>
                                <StatusBadge status={status} />
                            </div>
                        </div>
                        <p className="text-xs text-slate-400">{pacienteDetalhes.nome}</p>
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
                        <span className="text-sm text-gray-700">
                            {profNome === "—"
                                ? `🧑‍⚕️ ${profissionais?.[item.sessao_raw?.profissional_id]?.nome ||
                                profissionais?.[item.sessao_raw?.profissional_id]?.usuario?.nome ||
                                (typeof profissionais?.[item.sessao_raw?.profissional_id] === 'string' ? profissionais[item.sessao_raw.profissional_id] : 'Profissional')
                                }`
                                : `🧑‍⚕️ ${profNome}`
                            }
                        </span>

                        {!disablePDF && (
                            <div>
                                <span className="text-gray-400">•</span>
                                <span className="text-sm text-gray-700">🧩 {slotStr === "—" ? (slotExtra === undefined ? "Não encontrado" : slotExtra) : slotStr} {siglaStr !== "" ? `(${siglaStr})` : null}</span>
                            </div>
                        )}

                    </div>
                </div>

                <div className="flex flex-row flex-wrap gap-2 items-center lg:justify-end">
                    {(Number(item?.sessao_raw?.profissional_id) === Number(user?.profissionalId) || USUARIOS_MASTER.includes(user?.profissionalId)) && (
                        <div>
                            {status === "ATIVO" && (
                                <button
                                    type="button"
                                    disabled={updating}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        /*alterarStatus(STATUS_RESPOSTA.PENDENTE);*/
                                        setIsObservacaoModalOpen(true)
                                    }}
                                    title="Pedir para inativar resposta"
                                    className="bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 hover:border-orange-300 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-sm disabled:opacity-60"
                                >
                                    <FaBan />
                                    {updating ? "Enviando..." : "Solicitar inativação"}
                                </button>
                            )}
                            {status === "PENDENTE" && (
                                <button
                                    type="button"
                                    disabled={updating}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        alterarStatus(STATUS_RESPOSTA.ATIVO);
                                    }}
                                    title="Voltar a ser ativo"
                                    className="bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-sm disabled:opacity-60"
                                >
                                    <FaRotateLeft />
                                    {updating ? "Desfazendo..." : "Desfazer solicitação"}
                                </button>
                            )}
                        </div>
                    )}
                    {disablePDF ? null : <DownloadButton item={item} data={dataAg !== "—" ? dataAg : dataStr} paciente={pacienteDetalhes} />}
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
                        item.respostas.map((r, i) => {
                            const tipo = r.tipo_resposta_esperada || "—";

                            if (tipo === "MATRIZ") {
                                return (
                                    <div key={i} className="mb-3 border-b border-gray-100 pb-2 last:border-0">
                                        <p className="font-bold text-gray-700 text-sm mb-1">{r.pergunta}</p>
                                        <TabelaMatriz resposta={r.resposta} />
                                    </div>
                                );
                            }

                            return (
                                <div key={i} className="mb-3 border-b border-gray-100 pb-2 last:border-0">
                                    <p className="font-bold text-gray-700 text-sm mb-1">{r.pergunta}</p>
                                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{r.resposta}</p>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            <ObservacaoInativacaoModal
                isOpen={isObservacaoModalOpen}
                onClose={() => setIsObservacaoModalOpen(false)}
                onConfirm={confirmarSolicitacaoInativacao}
                loading={updating}
            />
        </div>
    );
});

export default ProntuarioItem;