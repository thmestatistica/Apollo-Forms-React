import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Modal } from "../modal/Modal";

import { listar_agendamentos } from "../../api/agenda/agenda_utils";
import { carregar_pendencias_filtro } from "../../api/pendencias/pendencias_utils";

import { useAuth } from "../../hooks/useAuth";

import SkeletonGen from "../info/SkeletonGen";
import VazioGen from "../info/VazioGen";
import ErroGen from "../info/ErroGen";
import { abreviarNome } from "../../utils/format/formatar_utils";

// Formatação separada para blocos visuais de data
const formatDayMonth = (iso) => {
  try {
    if (!iso) return { day: "-", month: "-" };
    const d = new Date(iso);
    return {
      day: new Intl.DateTimeFormat('pt-BR', { day: '2-digit' }).format(d),
      month: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(d).replace('.', '').toUpperCase()
    };
  } catch {
    return { day: "-", month: "-" };
  }
};

const formatTime = (iso) => {
  try {
    if (!iso) return "-";
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
  } catch {
    return "-";
  }
};

const formatDateFull = (iso) => {
  try {
    if (!iso) return "-";
    const d = new Date(iso);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  } catch {
    return iso || "-";
  }
};

// Mapa de configurações de design refinado (Cards com borda lateral)
const statusConfigMap = {
  CONCLUIDA: {
    borderLeft: "border-l-4 border-l-green-500",
    badge: "bg-green-100 text-green-700 border-green-200",
    label: "Concluída",
  },
  NAO_APLICA: {
    borderLeft: "border-l-4 border-l-red-500",
    badge: "bg-red-100 text-red-700 border-red-200",
    label: "Não se aplica",
  },
  APLICADO_NAO_LANCADO: {
    borderLeft: "border-l-4 border-l-yellow-500",
    badge: "bg-yellow-100 text-yellow-700 border-yellow-200",
    label: "Aplicada / Não lançada",
  },
  DEFAULT: {
    borderLeft: "border-l-4 border-l-slate-400",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    label: "Desconhecido",
  }
};

const presencaMap = {
  presente: { label: "Presente", color: "bg-green-100 text-green-700 border-green-200" },
  'ausência sem aviso': { label: "Ausente", color: "bg-red-100 text-red-700 border-red-200" },
  ausente: { label: "Ausente", color: "bg-red-100 text-red-700 border-red-200" },
  cancelado: { label: "Cancelado", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  desconhecido: { label: "Desconhecido", color: "bg-slate-100 text-slate-700 border-slate-200" },
};

const PendenciasInfoModal = ({ isOpen, onClose, pacienteId, especialidade: espFromProp, pacienteNome }) => {
  const { user } = useAuth();
  const [pendencias, setPendencias] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState("agendamentos"); // "agendamentos" ou "pendencias"

  const pacientAbreviado = abreviarNome(pacienteNome || "", 2);
  const especialidade =
    espFromProp ||
    (Array.isArray(user?.especialidade) ? user.especialidade[0] : user?.especialidade) ||
    (Array.isArray(user?.profissional?.especialidade) ? user.profissional.especialidade[0] : user?.profissional?.especialidade) ||
    "";

  useEffect(() => {
    let ativo = true;
    const carregar_pendencias = async () => {
      if (!isOpen || !pacienteId) return;
      setLoading(true);
      setError(null);
      try {
        const filtros = {
          pacienteId,
          especialidade,
          status: ["APLICADO_NAO_LANCADO", "CONCLUIDA", "NAO_APLICA"],
        };

        const list = await carregar_pendencias_filtro(filtros);

        if (!ativo) return;
        setPendencias(list.slice(0, 10));
      } catch (err) {
        if (!ativo) return;
        setError(err?.message || "Erro ao carregar pendências");
      } finally {
        if (ativo) setLoading(false);
      }
    };

    carregar_pendencias();
    return () => { ativo = false; };
  }, [isOpen, pacienteId, especialidade]);

  useEffect(() => {
    let ativo = true;
    const carregar_agendamentos = async () => {
      if (!isOpen || !pacienteId) return;
      try {
        const list = await listar_agendamentos({ pacienteId: Number(pacienteId), order: "desc", pageSize: 2000 });
        if (!ativo) return;
        setAgendamentos(list['agendamentos'] || []);
      } catch (err) {
        if (!ativo) return;
        setError(err?.message || "Erro ao carregar agendamentos");
      }
    };

    carregar_agendamentos();
    return () => { ativo = false; };
  }, [isOpen, pacienteId]);

  const agendamentosOrdenados = [...agendamentos]
    .sort((a, b) => new Date(b.data) - new Date(a.data))
    .filter((a) => a.presenca !== null)
    .slice(0, 5);


  return (
    <Modal isOpen={isOpen} onClose={onClose} isBig={false}>
      <div className="flex flex-col h-full max-h-[85vh] bg-white rounded-xl">
        
        {/* Header do Modal */}
        <div className="pb-5 border-b border-gray-100 mb-4 px-2 mt-2">
          <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Informações do {pacientAbreviado}</h3>
          <p className="text-sm text-gray-500 mt-1">Acompanhe o histórico de agendamentos e pendências.</p>
        </div>

        {/* Área de Tab Melhorada */}
        <div className="flex space-x-1 border-b border-gray-200 px-2">
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-px ${
              abaAtiva === "agendamentos"
                ? "text-apollo-600 border-b-2 border-apollo-600"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg border-b-2 border-transparent"
            }`}
            onClick={() => setAbaAtiva("agendamentos")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Histórico
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors -mb-px ${
              abaAtiva === "pendencias"
                ? "text-apollo-600 border-b-2 border-apollo-600"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-t-lg border-b-2 border-transparent"
            }`}
            onClick={() => setAbaAtiva("pendencias")}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Pendências
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar mt-5 px-2 pb-4">
          
          {error && (
            <ErroGen error={error} />
          )}

          {loading && !error && (
            <SkeletonGen range={4} />
          )}

          {/* === ABA: AGENDAMENTOS === */}
          {abaAtiva === "agendamentos" && !loading && !error && (
            <>
              {agendamentosOrdenados.length === 0 ? (
                <VazioGen message="Nenhum agendamento" subMessage="Este paciente não possui histórico de agendamentos." />
              ) : (
                <ul className="space-y-4">
                  {agendamentosOrdenados.map((a) => {
                    const start = a.inicio || a.data || a.criadaEm;
                    const end = a.fim || a.dataFim || null;
                    const dateBlock = formatDayMonth(start);
                    
                    const tipoMap = {
                      SESSAO: "Sessão",
                      AVALIACAO_INICIAL: "Avaliação Inicial",
                      REAVALIACAO: "Reavaliação",
                    }

                    const tipoLabel = a.tipo ? (tipoMap[a.tipo] || a.tipo) : null;
                    const profissionalNome = a.profissional?.usuario?.nome || "Profissional não identificado";
                    const especialidade = a.profissional?.especialidade[0] || "Especialidade não identificada";
                    const slotLabel = a.slot?.sigla || a.slot?.nome || null;
                    const presencaKey = (a.presenca || '').toString().toLowerCase();
                    const presencaInfo = presencaMap[presencaKey] || presencaMap.desconhecido;

                    return (
                      <li key={a.id} className={`group flex items-center border-2 ${presencaInfo?.color || "bg-white"} rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow`}>
                        {/* Bloco de Data Visual */}
                        <div className="flex flex-col items-center justify-center bg-apollo-50 text-apollo-800 w-16 h-16 rounded-lg shrink-0 mr-4 border border-apollo-800">
                          <span className="text-xl font-bold leading-none">{dateBlock.day}</span>
                          <span className="text-xs font-medium uppercase mt-1 tracking-wider">{dateBlock.month}</span>
                        </div>

                        {/* Detalhes */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold truncate">
                            {tipoLabel} - {especialidade}
                          </h4>
                          
                          <div className="flex flex-col md:flex-wrap items-start text-xs text-gray-500 mt-1 gap-1">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {formatTime(start)}{end ? ` às ${formatTime(end)}` : ""}
                            </span>
                            <span className="flex items-center gap-1 truncate">
                              Prof. {profissionalNome}
                            </span>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="shrink-0 ml-3">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-apollo-200 text-apollo-100 border border-gray-200 uppercase tracking-wide">
                            {slotLabel || "—"}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {/* === ABA: PENDÊNCIAS === */}
          {abaAtiva === "pendencias" && !loading && !error && (
            <>
              {pendencias.length === 0 ? (
                <VazioGen message="Tudo certo por aqui!" subMessage="Este paciente não possui pendências registradas." />
              ) : (
                <ul className="space-y-4">
                  {pendencias.slice(0, 5).map((p) => {
                    const config = statusConfigMap[p.status] || statusConfigMap.DEFAULT;
                    const profissionalNome = p.agendamento?.profissional?.usuario?.nome || "Profissional não identificado";

                    return (
                      <li 
                        key={p.id} 
                        className={`bg-white rounded-r-xl border-y border-r border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow ${config.borderLeft}`}
                      >
                        <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3">
                          
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-semibold text-gray-800 truncate">
                              {p.formulario?.nomeEscala || "Escala Pendente"}
                            </h4>
                            
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              Feito por: <span className="font-medium text-gray-700">{profissionalNome}</span>
                            </p>

                            <div className="flex items-center gap-1 mt-2.5 text-xs text-gray-400">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>Atualizado em {formatDateFull(p?.resolvidaEm || p?.criadaEm)}</span>
                            </div>
                          </div>

                          <div className="shrink-0 mt-1 sm:mt-0">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${config.badge}`}>
                              {config.label}
                            </span>
                          </div>
                          
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>

      </div>
    </Modal>
  );
};

PendenciasInfoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pacienteId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  especialidade: PropTypes.string,
  pacienteNome: PropTypes.string,
};

export default PendenciasInfoModal;