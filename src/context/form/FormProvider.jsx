/**
 * @file FormProvider.jsx
 * @description Contexto global para controle do modal e persistência do status por pendência de escala.
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FormContext } from "./FormContext";

/**
 * @component FormProvider
 * Fornece estados globais para modais e status por pendência de escala.
 */
const LS_PENDENCIAS_STATUS_KEY = "pendenciasEscalaStatus";
const STATUS_NAO_PERSISTIR = new Set(["PREENCHIDA", "NAO_APLICA", "CONCLUIDA"]);

export const FormProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);

  /**
   * Estrutura:
   * {
   *   [pendenciaId]: { status: "APLICADO_NAO_LANCADO", updatedAt: "2026-02-10T12:00:00.000Z" }
   * }
   */
  const [pendenciasEscalaStatus, setPendenciasEscalaStatus] = useState(() => {
    // Hidrata o estado imediatamente do localStorage (evita sobrescrever com {} em StrictMode)
    try {
      const stored = localStorage.getItem(LS_PENDENCIAS_STATUS_KEY);
      const parsed = stored ? JSON.parse(stored) : {};
      if (!parsed || typeof parsed !== "object") return {};
      return parsed;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.removeItem("escalasPorAgendamento");
    } catch {
      // noop
    }
  }, []);

  /** Persiste no localStorage sempre que mudar */
  useEffect(() => {
    try {
      localStorage.setItem(
        LS_PENDENCIAS_STATUS_KEY,
        JSON.stringify(pendenciasEscalaStatus)
      );
    } catch {
      // noop
    }
  }, [pendenciasEscalaStatus]);

  /** Define as escalas de um agendamento específico (array ou mapa) */
  /** Atualiza status de uma pendência específica (por ID único da pendência) */
  const setPendenciaStatus = (pendenciaId, status, meta = {}) => {
    const penId = String(pendenciaId);
    if (!penId) return;

    if (STATUS_NAO_PERSISTIR.has(status)) {
      setPendenciasEscalaStatus((prev) => {
        const next = { ...prev };
        delete next[penId];
        return next;
      });
      return;
    }

    setPendenciasEscalaStatus((prev) => ({
      ...prev,
      [penId]: {
        status,
        updatedAt: new Date().toISOString(),
        ...meta,
      },
    }));
  };

  /** Remove o registro de uma pendência específica */
  const removerPendenciaStatus = (pendenciaId) => {
    const penId = String(pendenciaId);
    if (!penId) return;

    setPendenciasEscalaStatus((prev) => {
      const next = { ...prev };
      delete next[penId];
      return next;
    });
  };

  /** Abre modal e define pendência */
  const openModal = (pendencia) => {
    setPendenciaSelecionada(pendencia);
    setIsModalOpen(true);
  };

  /** Fecha modal */
  const closeModal = () => setIsModalOpen(false);

  return (
    <FormContext.Provider
      value={{
        isModalOpen,
        pendenciaSelecionada,
        pendenciasEscalaStatus,
        setPendenciaStatus,
        removerPendenciaStatus,
        openModal,
        closeModal,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

FormProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
