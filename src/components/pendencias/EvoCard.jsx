import CreateIcon from "@mui/icons-material/Create";
import { Modal } from "../modal/Modal";
import PenModal from "./PenModal";
import { useFormContext } from "../../hooks/useFormContext";
import { abreviarNome } from "../../utils/format/formatar_utils";
import { useEffect, useState } from "react";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";

/**
 * Retorna classes de cor de fundo e borda para o nível da pendência.
 */
const getCorPendencia = (nivel) => {
  const cores = {
    Normal: "bg-pendencia-normal/20 border border-pendencia-normal",
    Atenção: "bg-pendencia-atencao/20 border border-pendencia-atencao",
    Alerta: "bg-pendencia-alerta/20 border border-pendencia-alerta",
    Urgente: "bg-pendencia-urgente/20 border border-pendencia-urgente",
    Crítico: "bg-pendencia-critico/20 border border-pendencia-critico",
  };
  return cores[nivel] || "bg-gray-100 border border-gray-300";
};

/**
 * Retorna classes de cor para o botão do card.
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
 * Exibe os cards de evoluções pendentes e abre um modal para preenchimento.
 */
const EvoCard = ({ paginaAtual = [] }) => {
  const { openModal, isModalOpen, pendenciaSelecionada, closeModal } = useFormContext();
  const [escalasDisponiveis, setEscalasDisponiveis] = useState([]);

  useEffect(() => {
    
    const fetchPendenciasEscalas = async () => {
      const pacienteId = paginaAtual.length > 0 ? paginaAtual[0]["PacienteID"] : null;
      const profissionalEspecialidade = paginaAtual.length > 0 ? paginaAtual[0]["ProfissionalEspecialidade"] : null;

      const escalas = await carregar_escalas_pendentes(pacienteId, profissionalEspecialidade);
      setEscalasDisponiveis(escalas);
    };

    fetchPendenciasEscalas();
  }, [paginaAtual]);


  return (
    <>
      {/* Container dos cards */}
      <div className="grid gap-3 pb-20 sm:pb-24">
        {paginaAtual.map((pen, index) => {
          const nivel = pen["Nível de Pendência"];
          const id = pen["AgendamentoID"] ?? index;

          return (
            <div
              key={id}
              className={`${getCorPendencia(
                nivel
              )} grid grid-cols-12 rounded-xl overflow-hidden shadow-sm transition-transform duration-200 hover:scale-[1.01] hover:shadow-md`}
            >
              {/* Coluna com informações do paciente */}
              <div className="col-span-9 p-3 text-black flex flex-col justify-center min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <strong className="truncate text-lg font-semibold">
                    {abreviarNome(pen["Paciente"], 2)}
                  </strong>

                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getCorPendencia(
                      nivel
                    )} text-black/80`}
                  >
                    {nivel}
                  </span>
                </div>

                <div className="text-sm text-black/90 leading-snug">
                  <p>
                    <strong>Data:</strong> {pen["Data"]}
                  </p>
                  <p>
                    <strong>Horário:</strong> {pen["Início"]} - {pen["Fim"]}
                  </p>
                </div>
              </div>

              {/* Botão lateral do modal */}
              <div className="col-span-3 border-l border-black/10">
                <button
                  type="button"
                  className={`w-full h-full grid place-items-center text-white font-medium transition-all ${getCorBotao(
                    nivel
                  )} hover:brightness-110 active:scale-95`}
                  onClick={() => openModal(pen)}
                >
                  <CreateIcon fontSize="medium" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal global controlado via contexto */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {pendenciaSelecionada ? (
          <PenModal penData={pendenciaSelecionada} escalasDisponiveis={escalasDisponiveis} />
        ) : (
          <p>Carregando pendência...</p>
        )}
      </Modal>
    </>
  );
};

export default EvoCard;
