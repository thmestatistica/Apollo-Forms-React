import { useState } from "react";
import { formatDataVisual } from "../../utils/pendencias/escala_utils";


// Classe da tag especial quando o status é APLICADO_NAO_LANCADO
const getEscalaTagClass = (status) =>
  status === "APLICADO_NAO_LANCADO"
    ? "text-amber-800 border border-amber-300 bg-amber-100/20 hover:bg-amber-100/35"
    : null;


const EscalaTags = ({ escalas = [], maxVisible = 3, carregando = false, renderTag = null }) => {
  const [mostrarTudo, setMostrarTudo] = useState(false);

  if (!Array.isArray(escalas)) escalas = [];

  const mostrar = mostrarTudo ? escalas : escalas.slice(0, maxVisible);

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {mostrar.map((esc) => {
        if (typeof renderTag === "function") return renderTag(esc);

        const dataFull = formatDataVisual(esc.data_referencia);
        const dataFormatada = dataFull ? dataFull.slice(0, 5) : null;
        const tagClass = getEscalaTagClass(esc.status);

        return (
          <span
            key={`${esc.id}-${esc.nome}-${esc.data_referencia}`}
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-all
                          ${tagClass || "text-purple-700 border border-purple-400 hover:bg-purple-100 hover:border-purple-500"}
                          hover:scale-105`}
            title={esc.data_referencia ? `Aplicar a partir de: ${dataFull}` : "Pendente"}
          >
            {esc.nome}

            {dataFormatada && (
              <strong
                className={`opacity-70 font-normal text-[10px] px-1 rounded-sm ${
                  esc.status === "APLICADO_NAO_LANCADO"
                    ? "bg-amber-100/30 text-amber-800"
                    : "bg-black/5 text-purple-700"
                }`}
              >
                ({dataFormatada})
              </strong>
            )}
          </span>
        );
      })}

      {carregando && <span className="text-xs text-apollo-200/70">Carregando escalas…</span>}

      {escalas.length > maxVisible && (
        <button
          type="button"
          onClick={() => setMostrarTudo((v) => !v)}
          className="ml-1 text-xs font-semibold text-apollo-600 bg-apollo-500/20 border border-apollo-600/30 px-3 py-1 rounded-2xl hover:scale-102 cursor-pointer transition"
        >
          {mostrarTudo ? `Mostrar menos` : `Mostrar mais (${escalas.length - maxVisible})`}
        </button>
      )}
    </div>
  );
};

export default EscalaTags;
