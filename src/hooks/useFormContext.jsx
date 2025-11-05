import { useContext } from "react";
import { FormContext } from "../context/form/FormContext";

/** Hook de acesso rápido ao contexto */
export const useFormContext = () => useContext(FormContext);