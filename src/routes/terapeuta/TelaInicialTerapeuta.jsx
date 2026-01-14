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
import LoadingGen from "../../components/info/LoadingGen.jsx";
import { listar_agendamentos_filtrados, agendamentos_pendentes } from "../../api/agenda/agenda_utils.js";
import Swal from "sweetalert2";

// Componente principal
const TelaInicialTerapeuta = () => {

  const { logout, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openModal, pendenciaSelecionada } = useFormContext();

  // Estado para armazenar agendamentos carregados da API
  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentosPendentes, setAgendamentosPendentes] = useState([]);

  // Estados de carregamento separados
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false);
  const [carregandoPendencias, setCarregandoPendencias] = useState(false);

  // Erros separados
  const [erroAgendamentos, setErroAgendamentos] = useState(null);
  const [erroPendencias, setErroPendencias] = useState(null);

  // Flags para saber se já houve a primeira resolução de cada fetch
  const [agendamentosCarregados, setAgendamentosCarregados] = useState(false);
  const [pendenciasCarregadas, setPendenciasCarregadas] = useState(false);

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
        const dados = await listar_agendamentos_filtrados({ usuarioId, startDate });
        setAgendamentos(dados || []);
      } catch (err) {
        console.error("Erro ao carregar agendamentos", err);
        setErroAgendamentos("Falha ao carregar agendamentos.");
      } finally {
        setCarregandoAgendamentos(false);
        setAgendamentosCarregados(true);
      }
    };
    fetchAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ao voltar do formulário: mostrar sucesso (se houver) e reabrir modal
  useEffect(() => {
    const { reopenModal, formSuccess, formTitulo } = location.state || {};

    const run = async () => {
      if (formSuccess) {
        await Swal.fire({
          icon: "success",
          title: "Enviado com sucesso!",
          text: formTitulo ? `${formTitulo} foi salvo corretamente.` : "As respostas foram salvas corretamente.",
          confirmButtonColor: "#7C3AED", // apollo-200 vibe
        });
      }

      if (reopenModal && pendenciaSelecionada) {
        openModal(pendenciaSelecionada);
      }

      if (reopenModal || formSuccess) {
        // Limpa o state para não repetir a ação ao navegar
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    run();
  }, [location.state, location.pathname, pendenciaSelecionada, openModal, navigate]);


  useEffect(() => {
    const fetchAgendamentosPendentes = async () => {
      setCarregandoPendencias(true);
      setErroPendencias(null);
      try {
        const profissionalId = user?.profissionalId || user?.id || user?.usuarioId;
        const dados = await agendamentos_pendentes(profissionalId);
        setAgendamentosPendentes(dados || []);
      } catch (err) {
        console.error("Erro ao carregar agendamentos pendentes", err);
        setErroPendencias("Falha ao carregar agendamentos pendentes.");
      } finally {
        setCarregandoPendencias(false);
        setPendenciasCarregadas(true);
      }
    };
    fetchAgendamentosPendentes();
  }, [user?.profissionalId, user?.id, user?.usuarioId]);

  // Enquanto qualquer fetch inicial não resolveu, mostrar loading global
  const carregandoInicial = !agendamentosCarregados || !pendenciasCarregadas;

  if (carregandoInicial) {
    return <LoadingGen mensagem="Carregando painel do terapeuta..." />;
  }

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

          {/* Área de evoluções pendentes */}
          <div className="flex flex-col gap-4 col-span-1 md:row-span-3 h-full">
            <h2 className="font-bold text-2xl">📝 Evoluções/Avaliações Pendentes</h2>
            {carregandoPendencias && <InfoGen message="⏳ Carregando pendências..." />}
            {erroPendencias && <InfoGen message={erroPendencias} />}
            {!carregandoPendencias && !erroPendencias && (
              agendamentosPendentes.length === 0 ? (
                <InfoGen message="🗒️ Nenhuma evolução ou avaliação pendente." />
              ) : (
                <EvoPag pendenciasLista={agendamentosPendentes} />
              )
            )}
          </div>

          {/* Área de Navegação */}
          <div className="flex flex-col row-span-1 md:col-span-2 gap-5">
            <h2 className="font-extrabold text-2xl text-left md:col-span-2 col-span-1">
              🔎 Navegação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {
                // laura, tiago, teste, lou e isadora
                [8, 43, 17, 19, 13].includes(Number(user?.profissionalId)) && (
                  <button
                    onClick={() => navigate("/forms-terapeuta/editar-formulario")}
                    className="w-full bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200 col-auto cursor-pointer"
                  >
                    Editar Formulários
                  </button>
                )
              }
              <button
                onClick={logout}
                className="grid-auto w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
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
