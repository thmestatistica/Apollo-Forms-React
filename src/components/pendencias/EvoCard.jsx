import CreateIcon from "@mui/icons-material/Create";
import { Modal } from "../modal/Modal";
import PenModal from "./PenModal"; // conteúdo específico do modal
import { useFormContext } from "../../hooks/use";

/**
 * Funções de cor
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
 * Renderiza os cards de pendências com botão para abrir o modal de edição.
 */
const EvoCard = ({ paginaAtual = [] }) => {
  const { openModal, isModalOpen, pendenciaSelecionada, closeModal } = useFormContext();

  return (
    <>
      <div className="grid gap-3 pb-16">
        {paginaAtual.map((pen, index) => {
          const nivel = pen["Nível de Pendência"];
          const id = pen["AgendamentoID"] ?? index;

          return (
            <div
              key={id}
              className={`${getCorPendencia(
                nivel
              )} grid grid-cols-12 rounded-lg overflow-hidden transition-colors duration-200`}
            >
              {/* Bloco esquerdo */}
              <div className="col-span-9 p-3 text-black min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="truncate">{pen["Paciente"]}</strong>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full border uppercase border-gray-300 ${getCorPendencia(nivel)} text-black/80`}
                  >
                    {nivel}
                  </span>
                </div>

                <div className="mt-1 text-sm text-black flex flex-col">
                  <p>
                    <strong>Data: </strong>
                    {pen["Data"]}
                  </p>
                  <p>
                    <strong>Horário: </strong>
                    {pen["Início"]} até {pen["Fim"]}
                  </p>
                </div>
              </div>

              {/* Botão que abre o modal */}
              <div className="col-span-3 border-l border-black/10">
                <button
                  type="button"
                  className={`w-full h-full text-white transition-colors grid place-items-center brightness-90 ${getCorBotao(
                    nivel
                  )} hover:brightness-110`}
                  onClick={() => openModal(pen)} // Abre apenas este modal
                >
                  <CreateIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal global controlado via contexto */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {pendenciaSelecionada ? (
          <PenModal penData={pendenciaSelecionada} />
        ) : (
          <p>Carregando pendência...</p>
        )}
      </Modal>
    </>
  );
};

export default EvoCard;
