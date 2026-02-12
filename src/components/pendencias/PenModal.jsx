/**
 * @file PenModal.jsx
 * @description Modal que exibe pendências de um agendamento e permite selecionar e preencher escalas associadas.
 */
// useState e useEffect para controle de estado local e efeitos colaterais
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
// useNavigate para navegação programática
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Hook customizado para acessar o contexto de formulários
import { useFormContext } from "../../hooks/useFormContext";
// Mapeamento de formulários por Slot/Tipo
import { tipoForms, tipoPorEspecialidade } from "../../config/tipoSlot";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";
import {
  nao_aplicar_pendencia_escala,
  atualizar_status_pendencia_escala,
} from "../../api/pendencias/pendencias_utils.js";
import { formatarData } from "../../utils/format/formatar_utils.js";
import { formatDataVisual } from "../../utils/pendencias/escala_utils";

/**
 * Componente responsável por exibir as pendências de um agendamento específico,
 * permitindo ao terapeuta indicar se alguma escala foi aplicada, selecionar quais,
 * e navegar para o formulário correspondente.
 *
 * @component
 * @param {Object} props - Propriedades do componente.
 * @param {Object} props.penData - Dados da pendência/agendamento.
 * @param {string} props.penData.Paciente - Nome do paciente.
 * @param {string} props.penData.Data - Data da sessão.
 * @param {string} props.penData.Início - Horário inicial da sessão.
 * @param {string} props.penData.Fim - Horário final da sessão.
 * @param {number} props.penData.AgendamentoID - ID único do agendamento.
 * @returns {JSX.Element} O modal de pendência renderizado.
 */
const PenModal = ({ penData }) => {
  const navigate = useNavigate();

  // Contexto global com informações sobre formulários e escalas
  const { closeModal, setPendenciaStatus, pendenciasEscalaStatus } = useFormContext();

  /** ID do agendamento atual (chave de referência no contexto) */
  const agendamentoId = penData["AgendamentoID"];

  // Estado local para escalas disponíveis + carregamento
  const [escalasDisponiveis, setEscalasDisponiveis] = useState([]);
  const [loadingEscalas, setLoadingEscalas] = useState(false);
  const [erroEscalas, setErroEscalas] = useState(null);

  // Carrega escalas com base no paciente e especialidade da pendência
  useEffect(() => {
    const pacienteId = penData?.["PacienteID"] ?? null;
    const profissionalEspecialidade = penData?.["ProfissionalEspecialidade"] ?? null;

    if (!pacienteId || !profissionalEspecialidade) {
      setEscalasDisponiveis([]);
      return;
    }

    let ativo = true;
    setLoadingEscalas(true);
    setErroEscalas(null);
    carregar_escalas_pendentes(pacienteId, profissionalEspecialidade)
      .then((lista) => {
        if (ativo) setEscalasDisponiveis(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (ativo) setErroEscalas("Não foi possível carregar as escalas.");
      })
      .finally(() => {
        if (ativo) setLoadingEscalas(false);
      });

    return () => {
      ativo = false;
    };
  }, [penData]);

  /**
   * Normaliza as opções para o formato esperado pelo react-select
   * mantendo os campos originais para uso posterior na UI.
   */
  const rawOptions = Array.isArray(escalasDisponiveis) ? [...escalasDisponiveis] : [];
  const options = rawOptions
    .map((item) => {
      const value = String(item?.formularioId ?? "");
      const label =
        item?.label ??
        item?.formulario?.nomeEscala ??
        item?.especialidade ??
        `Escala ${value}`;
      return { ...item, value, label };
    })
    .sort((a, b) => {
      const da = a?.data_referencia ? new Date(a.data_referencia).getTime() : Number.POSITIVE_INFINITY;
      const db = b?.data_referencia ? new Date(b.data_referencia).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });

  console.log("Escalas disponíveis no PenModal (normalizadas):", options);

  const getPendenciaKey = (escala) =>
    String(
      escala?.id ??
        escala?.pendenciaId ??
        escala?.pendenciaEscalaId ??
        ""
    );

  const statusPorPendencia =
    pendenciasEscalaStatus && typeof pendenciasEscalaStatus === "object"
      ? pendenciasEscalaStatus
      : {};

  const getStatusLabel = (status) => {
    switch (status) {
      case "PREENCHIDA":
        return "Preenchida";
      case "NAO_APLICA":
        return "Não aplicável";
      case "NAO_FEITO":
        return "Não feito";
      case "APLICADO_NAO_LANCADO":
        return "Aplicado, não lançado";
      case "ABERTA":
        return "Em aberto";
      default:
        return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "PREENCHIDA":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "NAO_APLICA":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "NAO_FEITO":
        return "bg-gray-100 text-gray-800 border-gray-400";
      case "APLICADO_NAO_LANCADO":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "ABERTA":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default:
        return "";
    }
  };


  const getEffectiveStatus = (escala) => {
    const key = getPendenciaKey(escala);
    const fromContext = key ? statusPorPendencia?.[key]?.status : null;
    return fromContext || escala?.status || null;
  };

  const hasPendenciasEmAberto = options.some((escala) => {
    const status = getEffectiveStatus(escala);
    return !status || status === "PENDENTE" || status === "ABERTA";
  });

  const getActionButtonClass = (currentStatus, targetStatus, baseClass, activeClass) => {
    const isActive = currentStatus === targetStatus;
    return `${baseClass} ${isActive ? activeClass : "opacity-60 hover:opacity-100"}`;
  };

  /**
   * Navega até o formulário de uma escala específica.
   * Fecha o modal e envia o estado da pendência via `navigate`.
   *
   * @param {number} id - ID da escala a ser preenchida.
   * @param {string} tipo_form - Tipo do formulário (ex: "Escala", "Evolução").
   */
  const handleNavForm = (id, tipo_form, titulo, pendenciaEscala, isEvolucao = false) => {
    closeModal();
    navigate(`/forms-terapeuta/formulario/${tipo_form.toLowerCase()}/${id}`, {
      state: { pendencia: penData, formTitulo: titulo, pendenciaEscala, isEvolucao },
    });
  };

  /**
   * Faz a marcação de uma pendência de escala como "Não Aplicável".
   *
   * @param {Object} escala - Dados da escala a ser marcada como não aplicável.
   */
  const handleNaoAplicar = async (escala) => {
    const result = await Swal.fire({
      title: "Marcar como não aplicável?",
      text: `A escala "${escala.formulario?.nomeEscala || escala.label}" será marcada como não aplicável para este paciente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#bd2121",
      cancelButtonColor: "#817c7c",
      confirmButtonText: "Não se aplica",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      // Lógica para marcar a pendência como "Não Aplicável"
      console.log("Marcar pendência como Não Aplicável para escala:", escala);

      const resposta = await nao_aplicar_pendencia_escala(escala);
      if (!resposta?.ok) {
        await Swal.fire({
          title: "Erro",
          text: "Não foi possível marcar a escala como não aplicável.",
          icon: "error",
          timer: 1800,
          showConfirmButton: false,
        });

        console.error("Erro ao marcar pendência como não aplicável:", resposta?.error);
      } else {
        await Swal.fire({
          title: "Sucesso",
          text: "A escala foi marcada como não aplicável.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        const key = getPendenciaKey(escala);
        if (key) {
          setPendenciaStatus(key, "NAO_APLICA");
        }

        // Recarregar dados mantendo o modal aberto (soft refresh)
        try {
          setLoadingEscalas(true);
          const pacienteId = penData?.["PacienteID"] ?? null;
          const profissionalEspecialidade = penData?.["ProfissionalEspecialidade"] ?? null;
          const lista = await carregar_escalas_pendentes(pacienteId, profissionalEspecialidade);
          setEscalasDisponiveis(Array.isArray(lista) ? lista : []);
        } catch (err) {
          console.error("Erro ao recarregar escalas após marcação:", err);
        } finally {
          setLoadingEscalas(false);
        }
      }
    }
  };

  const handleNaoFeito = (escala) => {
    const key = getPendenciaKey(escala);
    if (!key) return;
    setPendenciaStatus(key, "NAO_FEITO");
  };

  const handleAplicadoNaoLancado = async (escala) => {
    const result = await Swal.fire({
      title: "Tem certeza? Aplicou a escala e lançará depois?",
      text: `A escala "${escala.formulario?.nomeEscala || escala.label}" será marcada como aplicada e não lançada.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#5A2779",
      cancelButtonColor: "#E0AC00",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const resposta = await atualizar_status_pendencia_escala(
      escala,
      "APLICADO_NAO_LANCADO"
    );

    if (!resposta?.ok) {
      await Swal.fire({
        title: "Erro",
        text: "Não foi possível atualizar a pendência.",
        icon: "error",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    await Swal.fire({
      title: "Sucesso",
      text: "A pendência foi atualizada.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    const key = getPendenciaKey(escala);
    if (key) {
      setPendenciaStatus(key, "APLICADO_NAO_LANCADO");
    }

  };

  /**
   * Determina automaticamente o formulário a preencher com base no tipo de atendimento
   * e no Slot/Sigla do agendamento, usando o mapeamento de `tipoSlot`.
   */
  const handlePreencherAuto = () => {
    const tipoRaw = String(penData?.["TipoAtendimento"] || "").toUpperCase();
    const isAvaliacao = tipoRaw.includes("AVALIACAO") || tipoRaw.includes("REAVALIACAO");
    const grupo = isAvaliacao ? "Avaliações" : "Evoluções";

    const sigla = penData?.["Sigla"] || penData?.["Slot"] || penData?.["ProfissionalEspecialidade"] || "";
    const mapa = tipoForms?.[grupo] || {};

    const especialidade = penData?.["ProfissionalEspecialidade"] || "";
    const lista_slots_equipamentos = ['LKM', 'CML', 'ARM', 'KTS', 'ORT', 'TMS']

    // alvoId precisa existir fora dos blocos para ser usado depois
    let alvoId = null;
    const siglaNorm = String(sigla || "").toUpperCase();

    // Se é um equipamento, procurar o formulário cujo array contém a sigla
    if (lista_slots_equipamentos.includes(siglaNorm)) {
      for (const [fid, slots] of Object.entries(mapa)) {
        if (!Array.isArray(slots)) continue;
        const slotsUpper = slots.map(s => String(s).toUpperCase());
        if (slotsUpper.includes(siglaNorm)) {
          const parsed = Number(fid);
          if (Number.isFinite(parsed)) alvoId = parsed;
          break;
        }
      }
    } else {
      // Por especialidade: mapeamento direto para o ID conforme grupo
      const idPorEsp = tipoPorEspecialidade?.[especialidade]?.[grupo] ?? null;
      if (idPorEsp != null) {
        const parsed = Number(idPorEsp);
        if (Number.isFinite(parsed)) {
          alvoId = parsed;
        }
      }
    }

    if (alvoId === null) {
      alert("Nenhum formulário configurado para este atendimento/slot.");
      return;
    }

    const titulo = `${isAvaliacao ? "Avaliação" : "Evolução"} ${sigla}`.trim();
    const tipoParam = isAvaliacao ? "Avaliacao" : "Evolucao"; // sem acento para URL
    handleNavForm(alvoId, tipoParam, titulo, { id: null, agendamentoId, pacienteId: null }, !isAvaliacao);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Título do modal */}
      <h2 className="font-bold text-xl text-apollo-200">Pendências do Agendamento</h2>

      {/* Informações principais do agendamento */}
      <div className="grid md:grid-cols-2 gap-2 text-apollo-200">
        <p><strong>Paciente:</strong> {penData["Paciente"]}</p>
        <p><strong>Data:</strong> {penData["Data"]}</p>
        <p><strong>Horário:</strong> {penData["Início"]} até {penData["Fim"]}</p>
        <p><strong>ID:</strong> {penData["AgendamentoID"]}</p>
        <p><strong>Slot:</strong> {penData['Sigla']}</p>
      </div>

      {/* Listagem das escalas pendentes */}
      <div className="mt-3">
        {loadingEscalas ? (
          <p className="text-sm text-apollo-200">Carregando escalas…</p>
        ) : erroEscalas ? (
          <p className="text-sm text-red-600">{erroEscalas}</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-apollo-200">Nenhuma escala pendente para este agendamento.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {options.map((escala) => {
              const status = getEffectiveStatus(escala);
              const statusLabel = getStatusLabel(status);
              const isLocked =
                Boolean(status) && !["PENDENTE", "NAO_FEITO", "ABERTA"].includes(status);
              return (
              <li
                key={getPendenciaKey(escala) || escala.formularioId}
                className="relative flex flex-col gap-3 p-3 border border-gray-200 rounded-lg shadow-sm bg-white"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-apollo-200">{escala.formulario?.nomeEscala || escala.label}</span>
                  {statusLabel && (
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusClass(status)}`}
                    >
                      {statusLabel}
                    </span>
                  )}
                  {escala.data_referencia && (
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-apollo-200/15 text-apollo-200 border-apollo-200"
                    >
                      Ref.: {formatDataVisual(escala.data_referencia) || formatarData(escala.data_referencia)}
                    </span>
                  )

                  }
                </div>

                <div className="relative z-10 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleNaoFeito(escala)}
                    className={getActionButtonClass(
                      status,
                      "NAO_FEITO",
                      "bg-gray-500 hover:bg-gray-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                      "ring-2 ring-gray-400 "
                    )}
                    disabled={isLocked}
                  >
                    Não feito
                  </button>
                  <button
                    type="button"
                    className={getActionButtonClass(
                      status,
                      "NAO_APLICA",
                      "bg-red-800 hover:bg-red-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                      "ring-2 ring-red-300"
                    )}
                    onClick={() => handleNaoAplicar(escala)}
                    disabled={isLocked}
                  >
                    Não se aplica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAplicadoNaoLancado(escala)}
                    className={getActionButtonClass(
                      status,
                      "APLICADO_NAO_LANCADO",
                      "bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                      "ring-2 ring-yellow-300 opacity-100!"
                    )}
                    disabled={isLocked}
                  >
                    Aplicado, não lançado
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleNavForm(
                        escala.formularioId,
                        "Escala",
                        escala.formulario?.nomeEscala || escala.label,
                        escala
                      )
                    }
                    className={getActionButtonClass(
                      status,
                      "PREENCHIDA",
                      "bg-apollo-200 hover:bg-apollo-300 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                      "ring-2 ring-apollo-300"
                    )}
                    disabled={isLocked}
                  >
                    Preencher
                  </button>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </div>

      {/* Botão inteligente para preencher o formulário do agendamento */}
      <button
        onClick={handlePreencherAuto}
        disabled={hasPendenciasEmAberto}
        className={`mt-6 font-semibold py-2 px-4 rounded-xl transition  ${
          hasPendenciasEmAberto
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-apollo-500 hover:bg-apollo-600 cursor-pointer"
        } text-white`}
      >
        Preencher{" "}
        {penData["TipoAtendimento"] === "AVALIACAO INICIAL" ||
        penData["TipoAtendimento"] === "REAVALIACAO"
          ? "Avaliação"
          : "Evolução"}
      </button>
    </div>
  );
};

export default PenModal;

PenModal.propTypes = {
  penData: PropTypes.object.isRequired,
};
