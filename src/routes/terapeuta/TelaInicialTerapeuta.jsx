import React, { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { useFormContext } from "../../hooks/useFormContext";
import AgenPag from "../../components/agenda/AgenPag.jsx";
import InfoGen from "../../components/info/InfoGen";
import EvoPag from "../../components/pendencias/EvoPag.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import { listar_agendamentos_filtrados, agendamentos_pendentes } from "../../api/agenda/agenda_utils.js";
import { buscar_pacientes_profissional } from "../../api/pendencias/pendencias_utils";
import Swal from "sweetalert2";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline"; // Adicionei ícone de sair

const TelaInicialTerapeuta = () => {

  const { logout, user } = useAuth();
  
  // Lógica de Permissão Existente (Editores)
  const EDITORES_PERMITIDOS = [8, 43, 17, 13, 15, 40, 38, 5, 12];
  const podeEditar = EDITORES_PERMITIDOS.includes(Number(user?.profissionalId));

  // --- NOVA LÓGICA PARA GESTÃO (LISTA DE IDs) ---
  const GESTAO_PERMITIDOS = [8, 17, 13, 15, 40, 43, 41]; 
  const podeAcessarGestao = GESTAO_PERMITIDOS.includes(Number(user?.profissionalId));
  const [gestaoIdsPermitidos, setGestaoIdsPermitidos] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();
  const { openModal, pendenciaSelecionada } = useFormContext();

  const [agendamentos, setAgendamentos] = useState([]);
  const [agendamentosPendentes, setAgendamentosPendentes] = useState([]);
  
  const [carregandoAgendamentos, setCarregandoAgendamentos] = useState(false);
  const [carregandoPendencias, setCarregandoPendencias] = useState(false);
  
  const [erroAgendamentos, setErroAgendamentos] = useState(null);
  const [erroPendencias, setErroPendencias] = useState(null);
  
  const [agendamentosCarregados, setAgendamentosCarregados] = useState(false);
  const [pendenciasCarregadas, setPendenciasCarregadas] = useState(false);

  useEffect(() => {
    const fetchGestaoPermitidos = async () => {
      try {
        if (!user) {
          setGestaoIdsPermitidos([]);
          return;
        }

        if (podeAcessarGestao) {
          setGestaoIdsPermitidos([]);
          return;
        }

        const profissionalId = user?.profissionalId ?? user?.id ?? user?.usuarioId;
        if (!profissionalId) {
          setGestaoIdsPermitidos([]);
          return;
        }

        const resposta = await buscar_pacientes_profissional(profissionalId);
        const lista = Array.isArray(resposta?.pacientes) ? resposta.pacientes : Array.isArray(resposta) ? resposta : [];
        const ids = lista
          .map((p) => p?.pacienteId ?? p?.paciente_id ?? p?.id)
          .filter((id) => id != null)
          .map((id) => Number(id));
        setGestaoIdsPermitidos(ids);
      } catch (err) {
        console.error("Erro ao buscar pacientes do profissional:", err);
        setGestaoIdsPermitidos([]);
      } finally {
        // sem estado de loading necessário aqui
      }
    };

    fetchGestaoPermitidos();
  }, [user, podeAcessarGestao]);

  // 1. Fetch Agendamentos
  useEffect(() => {
    const fetchAgendamentos = async () => {
      setCarregandoAgendamentos(true);
      setErroAgendamentos(null);
      try {
        const usuarioId = user?.id ?? user?.usuarioId ?? user?.idUsuario;
        const startDate = new Date().toISOString().split('T')[0];
        const dados = await listar_agendamentos_filtrados({ usuarioId, startDate });
        setAgendamentos(dados || []);
      } catch (err) {
        console.error("Erro agenda", err);
        setErroAgendamentos("Falha ao carregar agendamentos.");
      } finally {
        setCarregandoAgendamentos(false);
        setAgendamentosCarregados(true);
      }
    };
    fetchAgendamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Feedback Ações
  useEffect(() => {
    const { reopenModal, formSuccess, formTitulo } = location.state || {};
    const run = async () => {
      if (formSuccess) {
        await Swal.fire({
          icon: "success",
          title: "Enviado com sucesso!",
          text: formTitulo ? `${formTitulo} foi salvo corretamente.` : "As respostas foram salvas corretamente.",
          confirmButtonColor: "#7C3AED",
        });
      }
      if (reopenModal && pendenciaSelecionada) {
        openModal(pendenciaSelecionada);
      }
      if (reopenModal || formSuccess) {
        navigate(location.pathname, { replace: true, state: {} });
      }
    };
    run();
  }, [location.state, location.pathname, pendenciaSelecionada, openModal, navigate]);

  // 3. Fetch Pendências
  useEffect(() => {
    const fetchAgendamentosPendentes = async () => {
      setCarregandoPendencias(true);
      setErroPendencias(null);
      try {
        const profissionalId = user?.profissionalId || user?.id || user?.usuarioId;
        const dados = await agendamentos_pendentes(profissionalId);
        setAgendamentosPendentes(dados || []);
      } catch (err) {
        console.error("Erro pendências", err);
        setErroPendencias("Falha ao carregar pendências.");
      } finally {
        setCarregandoPendencias(false);
        setPendenciasCarregadas(true);
      }
    };
    fetchAgendamentosPendentes();
  }, [user?.profissionalId, user?.id, user?.usuarioId]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Tem certeza que quer sair?',
      text: "Você precisará fazer login novamente para acessar.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sim, sair',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) logout();
    });
  };

  const carregandoInicial = !agendamentosCarregados || !pendenciasCarregadas;

  if (carregandoInicial) return <LoadingGen mensagem="Carregando painel do terapeuta..." />;

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <div className="w-screen h-full flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        <div className="bg-white h-full rounded-xl grid md:grid-cols-2 grid-cols-1 auto-rows-min gap-6 xl:shadow-md justify-center items-start w-full md:p-8 p-4 overflow-y-auto">
          
          {/* --- CABEÇALHO UNIFICADO (TÍTULO + LOGOUT) --- */}
          <div className="md:col-span-2 col-span-1 flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
            <h1 className="font-extrabold text-4xl text-center md:text-left animate-fade-in-down">
                <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Painel do Terapeuta</span>
            </h1>
            
            <button
                onClick={handleLogout}
                className="
                bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 
                font-bold py-2 px-6 rounded-xl 
                shadow-sm hover:shadow-md 
                hover:-translate-y-0.5 active:scale-95 
                transition-all duration-200 cursor-pointer flex items-center gap-2 text-sm
                "
            >
                <ArrowRightOnRectangleIcon className="w-8 h-5" /> Sair da conta
            </button>
          </div>

          {/* Área de agendamentos */}
          <div className="
            flex flex-col gap-4 col-span-1 md:row-span-3 
            bg-white border border-gray-100 rounded-xl p-4
            shadow-sm hover:shadow-md transition-all duration-300
          ">
            <h2 className="font-bold text-2xl text-gray-800">📅 Agendamentos de Hoje</h2>

            {carregandoAgendamentos && <InfoGen message="⏳ Carregando agendamentos..." />}
            {erroAgendamentos && <InfoGen message={erroAgendamentos} />}
            {!carregandoAgendamentos && !erroAgendamentos && (
              agendamentos.length === 0 ? (
                <InfoGen message="Nenhum agendamento para hoje." />
              ) : (
                <AgenPag agendamentos={agendamentos} />
              )
            )}
          </div>

          {/* Área de evoluções pendentes */}
          <div className="
            flex flex-col gap-4 col-span-1 md:row-span-3 h-full
            bg-white border border-gray-100 rounded-xl p-4
            shadow-sm hover:shadow-md transition-all duration-300
          ">
            <h2 className="font-bold text-2xl text-gray-800">⚠️ Pendências</h2>
            
            {carregandoPendencias && <InfoGen message="⏳ Carregando pendências..." />}
            {erroPendencias && <InfoGen message={erroPendencias} />}
            {!carregandoPendencias && !erroPendencias && (
              agendamentosPendentes.length === 0 ? (
                <InfoGen message="Nenhuma evolução ou avaliação pendente." />
              ) : (
                <EvoPag pendenciasLista={agendamentosPendentes} />
              )
            )}
          </div>

          {/* Área de Navegação (Botões de Ação) */}
          <div className="flex flex-col row-span-1 md:col-span-2 gap-5 pt-4 border-t border-gray-100 mt-2">
            <h2 className="font-extrabold text-2xl text-left md:col-span-2 col-span-1 text-gray-800">
              Navegação
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              
              <button
                onClick={() => navigate("/forms-terapeuta/jornada")}
                className="
                  w-full bg-indigo-500 hover:bg-indigo-600 text-white 
                  font-bold py-3 px-4 rounded-xl 
                  shadow-md hover:shadow-lg hover:shadow-indigo-200/40 
                  hover:-translate-y-0.5 active:scale-95 
                  transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                "
              >
                <span>💫</span> Jornada
              </button>
              
              {podeEditar &&(
                <button
                  onClick={() => navigate("/forms-terapeuta/editar-formulario")}
                  className="
                    w-full bg-apollo-200 hover:bg-apollo-300 text-white 
                    font-bold py-3 px-4 rounded-xl 
                    shadow-md hover:shadow-lg hover:shadow-apollo-200/40 
                    hover:-translate-y-0.5 active:scale-95 
                    transition-all duration-200 col-auto cursor-pointer flex items-center justify-center gap-2
                  "
                >
                  <span>✍️</span> Editar Forms
                </button>
              )}

              <button
                onClick={()=> navigate("/forms-terapeuta/visualizar-formularios")}
                className="
                  w-full bg-amber-500 hover:bg-amber-600 text-white 
                  font-bold py-3 px-4 rounded-xl 
                  shadow-md hover:shadow-lg hover:shadow-amber-200/40 
                  hover:-translate-y-0.5 active:scale-95 
                  transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                "
              >
                <span>👁️</span> Visualizar Forms
              </button>
              
              {/* --- BOTÃO DE GESTÃO (Visível para a lista GESTAO_PERMITIDOS) --- */}
              {(podeAcessarGestao || gestaoIdsPermitidos.length > 0) && (
                <button
                  onClick={() =>
                    navigate("/forms-terapeuta/gestao", {
                      state: podeAcessarGestao
                        ? undefined
                        : {
                            gestaoOnly: true,
                            allowedPatientIds: gestaoIdsPermitidos,
                          },
                    })
                  }
                  className="
                    w-full bg-teal-500 hover:bg-teal-600 text-white 
                    font-bold py-3 px-4 rounded-xl 
                    shadow-md hover:shadow-lg hover:shadow-teal-200/40 
                    hover:-translate-y-0.5 active:scale-95 
                    transition-all duration-200 cursor-pointer flex items-center justify-center gap-2
                  "
                >
                  <span>📋</span> Gestão
                </button>
              )}

              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};


export default TelaInicialTerapeuta;
