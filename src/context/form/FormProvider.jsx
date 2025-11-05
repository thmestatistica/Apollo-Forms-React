/**
 * @file FormContext.jsx
 * @description Contexto global para controle do modal e persistência dos dados de formulário.
 */

import {  useState, useEffect } from "react";
import PropTypes from "prop-types";
import { FormContext } from "./FormContext";

/**
 * Provedor de contexto global.
 * Gerencia o estado do modal, pendência e os dados selecionados.
 */
export const FormProvider = ({ children }) => {
  // Estado: controle de abertura do modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado: pendência atual
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);

  // Estado: escalas selecionadas pelo terapeuta
  const [escalasSelecionadas, setEscalasSelecionadas] = useState([]);

  /** Carrega seleções persistidas no localStorage ao iniciar */
  useEffect(() => {
    const stored = localStorage.getItem("escalasSelecionadas");
    if (stored) setEscalasSelecionadas(JSON.parse(stored));
  }, []);

  /** Atualiza localStorage sempre que as seleções mudarem */
  useEffect(() => {
    localStorage.setItem("escalasSelecionadas", JSON.stringify(escalasSelecionadas));
  }, [escalasSelecionadas]);

  /** Abre o modal */
  const openModal = (pendencia) => {
    setPendenciaSelecionada(pendencia);
    setIsModalOpen(true);
  };

  /** Fecha o modal */
  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <FormContext.Provider
      value={{
        isModalOpen,
        pendenciaSelecionada,
        escalasSelecionadas,
        setEscalasSelecionadas,
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
