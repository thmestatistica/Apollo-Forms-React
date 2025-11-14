/**
 * TelaInicialTerapeuta
 * ------------------------
 * Exibe o painel do terapeuta com os agendamentos do dia atual.
 * Cada agendamento mostra data, horário, paciente e equipamento.
 */
// Componentes
import { useAuth } from "../../hooks/useAuth.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useFormContext } from "../../hooks/useFormContext";
import AgenPag from "../../components/agenda/AgenPag.jsx";
import InfoGen from "../../components/info/InfoGen";
import EvoPag from "../../components/pendencias/EvoPag.jsx";
import { listar_agendamentos } from "../../api/agenda/agenda_utils.js";

// Utilitários de formatação e verificação
import { isHoje } from "../../utils/verify/verify_utils.js";

// Componente principal
const TelaInicialTerapeuta = () => {

  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal, pendenciaSelecionada } = useFormContext();

  // Estado para armazenar agendamentos carregados da API
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false);
  const [erroAgendamentos, setErroAgendamentos] = useState(null);

  // Carrega agendamentos ao montar o componente
  useEffect(() => {
    const fetchAgendamentos = async () => {
      setCarregandoAgendamentos(true);
      setErroAgendamentos(null);
      try {
        // Usa id do usuário se disponível para filtrar; ajuste conforme estrutura real do objeto user
        const usuarioId = user?.id ?? user?.usuarioId ?? user?.idUsuario;
        const startDate = new Date().toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
        console.log("Buscando agendamentos para usuárioId:", usuarioId, "e startDate:", startDate);
        const dados = await listar_agendamentos({ usuarioId, startDate });
        setAgendamentos(dados['agendamentos'] || []);
      } catch (err) {
        console.error("Erro ao carregar agendamentos", err);
        setErroAgendamentos("Falha ao carregar agendamentos.");
      } finally {
        setCarregandoAgendamentos(false);
      }
    };
    fetchAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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


  /** Opções disponíveis de escalas (mock, poderia vir de API futuramente) */
  const escalasDisponiveis = [
    { id: 1, value: "TUG", label: "TUG - Timed Up and Go", tipo_form: "Escala" },
    { id: 2, value: "Fois", label: "Fois", tipo_form: "Escala" },
    { id: 3, value: "Fugl-Meyer", label: "Fugl-Meyer Assessment", tipo_form: "Escala" },
  ];


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

            {carregandoAgendamentos && <InfoGen message="⏳ Carregando agendamentos..." />}
            {erroAgendamentos && <InfoGen message={erroAgendamentos} />}
            {!carregandoAgendamentos && !erroAgendamentos && (
              agendamentos.length === 0 ? (
                <InfoGen message="📑 Nenhum agendamento para hoje." />
              ) : (
                <AgenPag agendamentos={agendamentos} />
              )
            )}
          </div>

          {/* Área de evoluções pendentes
          <div className="flex flex-col gap-4 col-span-1 md:row-span-3 h-full">
            <h2 className="font-bold text-2xl">📝 Evoluções/Avaliações Pendentes</h2>
            {carregandoAgendamentos && <InfoGen message="⏳ Carregando pendências..." />}
            {erroAgendamentos && <InfoGen message={erroAgendamentos} />}
            {!carregandoAgendamentos && !erroAgendamentos && (
              agendamentosPendentes.length === 0 ? (
                <InfoGen message="🗒️ Nenhuma evolução ou avaliação pendente." />
              ) : (
                <EvoPag pendenciasLista={agendamentosPendentes} escalasDisponiveis={escalasDisponiveis} />
              )
            )}
          </div> */}

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
