/**
 * TelaInicialTerapeuta
 * ------------------------
 * Exibe o painel do terapeuta com os agendamentos do dia atual.
 * Cada agendamento mostra data, horário, paciente e equipamento.
 */
// Componentes
import { useAuth } from "../../hooks/useAuth.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useFormContext } from "../../hooks/useFormContext";
import AgenPag from "../../components/agenda/AgenPag.jsx";
import InfoGen from "../../components/info/InfoGen";
import EvoPag from "../../components/pendencias/EvoPag.jsx";

// Utilitários de formatação e verificação
import { isHoje } from "../../utils/verify/verify_utils.js";

// Componente principal
const TelaInicialTerapeuta = () => {

  const { logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal, pendenciaSelecionada } = useFormContext();

  // Reabre o modal ao voltar da tela de formulário, mantendo a pendência selecionada
  useEffect(() => {
    if (location.state?.reopenModal && pendenciaSelecionada) {
      // Reabre usando a última pendência selecionada
      openModal(pendenciaSelecionada);
      // Limpa o state para evitar reabrir em futuras navegações
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state?.reopenModal]);

  // Exemplo de agendamentos recebidos do backend
  const agendamentos = [
    {
      id: 1,
      inicio: "2025-11-04T14:00:00.000Z",
      fim: "2025-11-04T15:00:00.000Z",
      paciente: { id: 1, nome: "João Silva" },
      slot: { id: 1, nome: "Lokomat", sigla: "LKMT" },
    },
    {
      id: 2,
      inicio: "2025-11-05T10:00:00.000Z",
      fim: "2025-11-05T11:00:00.000Z",
      paciente: { id: 2, nome: "Maria Souza" },
      slot: { id: 2, nome: "Esteira", sigla: "ESTR" },
    },
    {
      id: 3,
      inicio: "2025-11-04T16:00:00.000Z",
      fim: "2025-11-04T17:00:00.000Z",
      paciente: { id: 3, nome: "Luiza Fernandes de Almeida Costa Neta Filho Santo" },
      slot: { id: 3, nome: "Balanço", sigla: "BLNC" },
    },
    {
      id: 4,
      inicio: "2025-11-04T09:00:00.000Z",
      fim: "2025-11-04T10:00:00.000Z",
      paciente: { id: 4, nome: "Ana Costa" },
      slot: { id: 4, nome: "C-Mill", sigla: "CMill" },
    },
    {
      id: 5,
      inicio: "2025-11-04T13:00:00.000Z",
      fim: "2025-11-04T14:00:00.000Z",
      paciente: { id: 5, nome: "Pedro Lima" },
      slot: { id: 5, nome: "Armeo", sigla: "ARM" },
    }
  ];

  const agendamentos_pendentes = [
    {
      id: 1,
      inicio: "2025-11-04T14:00:00.000Z",
      fim: "2025-11-04T15:00:00.000Z",
      "paciente": { id: 3, nome: "José Almeida" },
      "slot": { id: 3, nome: "C-Mill", sigla: "CMILL" },
    },
    {
      id: 3,
      inicio: "2025-11-03T16:00:00.000Z",
      fim: "2025-11-03T17:00:00.000Z",
      "paciente": { id: 3, nome: "Carlos Pereira" },
      "slot": { id: 3, nome: "Armeo", sigla: "ARM" },
    },
    {
      id: 4,
      inicio: "2024-11-04T09:00:00.000Z",
      fim: "2024-11-04T10:00:00.000Z",
      "paciente": { id: 4, nome: "Ana Costa" },
      "slot": { id: 4, nome: "Lokomat", sigla: "LKMT" },
    },
    {
      id: 5,
      inicio: "2025-11-02T22:00:00.000Z",
      fim: "2025-11-02T23:00:00.000Z",
      "paciente": { id: 5, nome: "Pedro Lima" },
      "slot": { id: 5, nome: "Balanço", sigla: "BLNC" },
    },
    {
      id: 6,
      inicio: "2025-11-01T11:00:00.000Z",
      fim: "2025-11-01T12:00:00.000Z",
      "paciente": { id: 6, nome: "Luiza Fernandes de Almeida Costa Neta Filho Santo" },
      "slot": { id: 6, nome: "Esteira", sigla: "ESTR" },
    }
  ];


  /**
   * Filtra apenas os agendamentos do dia atual.
   */
  const agendamentosHoje = agendamentos.filter((ag) => isHoje(ag.inicio));

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <div className="w-screen h-full flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        <div className="bg-white h-full rounded-xl grid md:grid-cols-2 grid-cols-1 auto-rows-min gap-6 xl:shadow-md justify-center items-start w-full md:p-8 p-4 overflow-y-auto">
          
          {/* Título */}
          <h1 className="font-extrabold text-4xl md:text-left md:col-span-2 col-span-1 text-center">
            🧑‍⚕️ Painel do Terapeuta
          </h1>

          {/* Área de agendamentos */}
          <div className="flex flex-col gap-4 col-span-1 md:row-span-3">
            <h2 className="font-bold text-2xl">📅 Agendamentos de Hoje</h2>

            {agendamentosHoje.length === 0 ? (
              <InfoGen message="📑 Nenhum agendamento para hoje." />
            ) : (
              <AgenPag agendamentos={agendamentosHoje} />
            )}
          </div>

          {/* Área de evoluções pendentes */}
          <div className="flex flex-col gap-4 col-span-1 md:row-span-3 h-full">
            <h2 className="font-bold text-2xl">📝 Evoluções/Avaliações Pendentes</h2>
            {agendamentos_pendentes.length === 0 ? (
              <InfoGen message="🗒️ Nenhuma evolução ou avaliação pendente." />
            ) : (
              <EvoPag pendenciasLista={agendamentos_pendentes} />
            )}
          </div>

          {/* Área de Navegação */}
          <div className="flex flex-col row-span-1 md:col-span-2 gap-5">
            <h2 className="font-extrabold text-2xl text-left md:col-span-2 col-span-1">
              🔎 Navegação
            </h2>
            <div>
              <button
                onClick={logout}
                className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Sair da Conta
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default TelaInicialTerapeuta;
