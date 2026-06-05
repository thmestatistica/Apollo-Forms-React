import React, { useEffect, useState } from "react";
import { PDFViewer } from "@react-pdf/renderer";
import LoadingGen from "../../components/info/LoadingGen";
import ErroGen from "../../components/info/ErroGen";
import { listar_formularios } from "../../api/forms/forms_utils";
import TabelaScorePDF from "./TabelaScorePDF";

const TabelaScorePreview = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const data = await listar_formularios();
        setForms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao carregar lista de formulários:", err);
        setError("Não foi possível carregar a lista de formulários.");
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  if (loading) return <LoadingGen mensagem="Gerando relatório de escores..." />;
  if (error) return <ErroGen mensagem={error} />;

  return (
    <div className="w-full h-screen">
      <PDFViewer width="100%" height="100%" className="h-full">
        <TabelaScorePDF forms={forms} />
      </PDFViewer>
    </div>
  );
};

export default TabelaScorePreview;