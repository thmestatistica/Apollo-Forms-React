import React, { useState } from 'react';
import { FolderOpenIcon } from "@heroicons/react/24/outline";
import Swal from "sweetalert2";
import { obter_link_pasta_paciente } from "../../api/forms/upload_utils";

/**
 * Componente que busca e abre o link da pasta do Google Drive do paciente.
 * 
 * @param {Object} props
 * @param {string|number} props.pacienteId - ID do paciente para buscar a pasta.
 * @param {string} [props.className] - Classes adicionais para o botão.
 */
const BotaoVerAnexo = ({ pacienteId, className = "" }) => {
  const [loading, setLoading] = useState(false);

  const handleVerAnexo = async () => {
    if (!pacienteId) return;
    
    setLoading(true);
    try {
      const res = await obter_link_pasta_paciente(pacienteId);
      if (res.ok && res.data.folder_url) {
        window.open(res.data.folder_url, "_blank");
      } else {
        // console.log("Erro ao obter pasta do paciente:", res.data)
        Swal.fire("Atenção", "Pasta do Google Drive não encontrada para este paciente.", "info");
      }
    } catch (err) {
      console.error("Erro ao obter pasta do paciente:", err);
      Swal.fire("Erro", "Não foi possível recuperar o link da pasta.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleVerAnexo}
      disabled={loading || !pacienteId}
      className={`flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold py-2.5 px-4 rounded-xl transition-all shadow-sm hover:bg-indigo-100 active:scale-95 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <FolderOpenIcon className="w-5 h-5" />}
      {loading ? "Buscando..." : "Ver Anexo"}
    </button>
  );
};

export default BotaoVerAnexo;