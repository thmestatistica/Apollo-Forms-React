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
   *   [agendamentoId]: ["TUG", "Berg"]
   * }
   */
  const [escalasPorAgendamento, setEscalasPorAgendamento] = useState(() => {
    // Hidrata o estado imediatamente do localStorage (evita sobrescrever com {} em StrictMode)
    try {
      const stored = localStorage.getItem("escalasPorAgendamento");
      return stored ? JSON.parse(stored) : {};
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

  /** Define as escalas de um agendamento específico */
  const atualizarEscalas = (agendamentoId, novasEscalas) => {
    setEscalasPorAgendamento((prev) => ({
      ...prev,
      [agendamentoId]: novasEscalas,
    }));
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
