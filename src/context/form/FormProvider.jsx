/**
 * @file FormProvider.jsx
 * @description Contexto global para controle do modal e persistência das escalas por agendamento.
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FormContext } from "./FormContext";

/**
 * @component FormProvider
 * Fornece estados globais para modais e escalas associadas a cada agendamento.
 */
export const FormProvider = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);

  /**
   * Estrutura:
   * {
   *   [agendamentoId]: {
   *     [formularioId]: { status: "PENDENTE", updatedAt: "2026-02-10T12:00:00.000Z" }
   *   }
   * }
   */
  const [escalasPorAgendamento, setEscalasPorAgendamento] = useState(() => {
    // Hidrata o estado imediatamente do localStorage (evita sobrescrever com {} em StrictMode)
    try {
      const stored = localStorage.getItem("escalasPorAgendamento");
      const parsed = stored ? JSON.parse(stored) : {};
      if (!parsed || typeof parsed !== "object") return {};

      const normalizado = {};
      Object.entries(parsed).forEach(([agendamentoId, value]) => {
        if (Array.isArray(value)) {
          const mapa = {};
          value.forEach((formId) => {
            const key = String(formId);
            mapa[key] = { status: "PENDENTE", updatedAt: new Date().toISOString() };
          });
          normalizado[agendamentoId] = mapa;
          return;
        }

        if (value && typeof value === "object") {
          normalizado[agendamentoId] = value;
        }
      });

      return normalizado;
    } catch {
      return {};
    }
  });

  /** Persiste no localStorage sempre que mudar */
  useEffect(() => {
    try {
      localStorage.setItem(
        "escalasPorAgendamento",
        JSON.stringify(escalasPorAgendamento)
      );
    } catch {
      // noop
    }
  }, [escalasPorAgendamento]);

  /** Define as escalas de um agendamento específico (array ou mapa) */
  const atualizarEscalas = (agendamentoId, novasEscalas) => {
    setEscalasPorAgendamento((prev) => {
      if (Array.isArray(novasEscalas)) {
        const mapa = {};
        novasEscalas.forEach((formId) => {
          const key = String(formId);
          mapa[key] = { status: "PENDENTE", updatedAt: new Date().toISOString() };
        });
        return { ...prev, [agendamentoId]: mapa };
      }

      if (novasEscalas && typeof novasEscalas === "object") {
        return { ...prev, [agendamentoId]: novasEscalas };
      }

      return prev;
    });
  };

  /** Atualiza status de uma escala específica */
  const setEscalaStatus = (agendamentoId, formularioId, status, meta = {}) => {
    const agId = String(agendamentoId);
    const formId = String(formularioId);
    if (!agId || !formId) return;

    setEscalasPorAgendamento((prev) => {
      const atual = prev?.[agId] && typeof prev[agId] === "object" ? prev[agId] : {};
      return {
        ...prev,
        [agId]: {
          ...atual,
          [formId]: {
            status,
            updatedAt: new Date().toISOString(),
            ...meta,
          },
        },
      };
    });
  };

  /** Remove o registro de uma escala específica */
  const removerEscalaStatus = (agendamentoId, formularioId) => {
    const agId = String(agendamentoId);
    const formId = String(formularioId);
    if (!agId || !formId) return;

    setEscalasPorAgendamento((prev) => {
      const atual = prev?.[agId] && typeof prev[agId] === "object" ? { ...prev[agId] } : {};
      delete atual[formId];
      if (Object.keys(atual).length === 0) {
        const next = { ...prev };
        delete next[agId];
        return next;
      }
      return { ...prev, [agId]: atual };
    });
  };

  /** Remove completamente registro de um agendamento (quando não há mais escalas) */
  const removerAgendamentoEscalas = (agendamentoId) => {
    setEscalasPorAgendamento((prev) => {
      const next = { ...prev };
      delete next[agendamentoId];
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
        escalasPorAgendamento,
        atualizarEscalas,
        setEscalaStatus,
        removerEscalaStatus,
        removerAgendamentoEscalas,
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
