/**
 * @file EvoCard.jsx
 * @description
 * Exibe uma lista de evoluções pendentes (agendamentos),
 * aplicando cores conforme o nível de pendência.
 */

import CreateIcon from "@mui/icons-material/Create";

/**
 * Retorna as classes de cor de fundo e borda conforme o nível.
 *
 * @param {string} nivel - Nível textual da pendência.
 * @returns {string} Classes Tailwind correspondentes.
 */
const getCorPendencia = (nivel) => {
  const cores = {
    Normal: "bg-pendencia-normal/20 border border-pendencia-normal",
    Atenção: "bg-pendencia-atencao/20 border border-pendencia-atencao",
    Alerta: "bg-pendencia-alerta/20 border border-pendencia-alerta",
    Urgente: "bg-pendencia-urgente/20 border border-pendencia-urgente",
    Crítico: "bg-pendencia-critico/20 border border-pendencia-critico",
  };
  return cores[nivel] || "text-gray-600";
};

/**
 * Retorna a classe de cor do botão conforme o nível.
 *
 * @param {string} nivel - Nível textual da pendência.
 * @returns {string} Classe Tailwind correspondente.
 */
const getCorBotao = (nivel) => {
  const cores = {
    Normal: "bg-pendencia-normal",
    Atenção: "bg-pendencia-atencao",
    Alerta: "bg-pendencia-alerta",
    Urgente: "bg-pendencia-urgente",
    Crítico: "bg-pendencia-critico",
  };
  return cores[nivel] || "bg-gray-600";
};

/**
 * @component EvoCard
 * @description
 * Renderiza uma grade de cartões para cada pendência da página atual.
 *
 * @param {Object} props
 * @param {Array<Object>} props.paginaAtual - Lista de pendências exibidas.
 *
 * @example
 * <EvoCard paginaAtual={pendencias} />
 */
const EvoCard = ({ paginaAtual = [] }) => {
  return (
    <div className="grid gap-3 pb-16">
      {paginaAtual.map((pen, index) => {
        const nivel = pen["Nível de Pendência"];

        return (
          <div
            key={pen["AgendamentoID"] ?? index}
            className={`${getCorPendencia(
              nivel
            )} grid grid-cols-12 rounded-lg overflow-hidden transition-colors duration-200`}
          >
            {/* Bloco esquerdo: informações do paciente */}
            <div className="col-span-9 p-3 text-black min-w-0">
              {/* Cabeçalho: nome + tag de nível */}
              <div className="flex flex-wrap items-center gap-2">
                <strong className="truncate">{pen["Paciente"]}</strong>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full border uppercase border-gray-300 ${getCorPendencia(nivel)} text-black/80`}
                >
                  {nivel}
                </span>
              </div>

              {/* Data e horário */}
              <div className="mt-1 text-sm text-black flex flex-col">
                <p><strong>Data: </strong>{pen["Data"]}</p>
                <p>
                  <strong>Horário: </strong>{pen["Início"]} até {pen["Fim"]}
                </p>
              </div>
            </div>

            {/* Bloco direito: botão de edição */}
            <div className="col-span-3 border-l border-black/10">
              <button
                type="button"
                className={`w-full h-full text-white transition-colors grid place-items-center brightness-90 ${getCorBotao(
                  nivel
                )} hover:brightness-110`}
              >
                <CreateIcon />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EvoCard;
