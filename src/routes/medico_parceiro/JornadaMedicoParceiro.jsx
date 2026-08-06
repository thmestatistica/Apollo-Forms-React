import { useState } from "react";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import JornadaHeader from "../../components/jornada/JornadaHeader.jsx";
import PacienteSearch from "../../components/jornada/PacienteSearch.jsx";
import DadosCadastraisSection from "../../components/jornada/DadosCadastraisSection.jsx";
import ResumoSessoesSection from "../../components/jornada/ResumoSessoesSection.jsx";
import HistoricoSection from "../../components/jornada/HistoricoSection.jsx";
import ProntuarioSection from "../../components/jornada/ProntuarioSection.jsx";
import JornadaEmptyState from "../../components/jornada/JornadaEmptyState.jsx";
import JornadaLoadingSkeleton from "../../components/jornada/JornadaLoadingSkeleton.jsx";
import FilesSection from "../../components/jornada/FilesSection.jsx";
import BotaoVerAnexo from "../../components/common/BotaoVerAnexo.jsx";
import CardAgendamentoJornada from "../../components/agenda/CardAgendamentoJornada.jsx";
import AgendaSemanalJornada from "../../components/agenda/AgendaSemanalJornada.jsx";
import SingleSelect from "../../components/input/SingleSelect.jsx";

import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

import { useJornadaMedicoController } from "../../hooks/useJornadaMedicoController.jsx";

import { useAuth } from "../../hooks/useAuth.jsx";
import { useNavigate } from "react-router-dom";
import { listar_agendamentos_filtrados } from "../../api/agenda/agenda_utils.js";
import { listar_pacientes, buscar_agendamentos_stockcare } from "../../api/jornada/jornada_utils.js";

const JornadaMedicoParceiro = () => {
  const {
    pacientes,
    profissionais,
    agendamentos,
    pacienteSelecionadoId,
    setProfissionais,
    setPacienteSelecionadoId,
    loadingInicial,
    setLoadingInicial,
    loadingDados,
    setLoadingDados,
    loadingProntuario,
    setLoadingProntuario,
    pacienteDetalhes,
    setPacienteDetalhes,
    tipoOrdenacao,
    setTipoOrdenacao,
    stats,
    setStats,
    prontuario,
    setProntuario,
    recarregarProntuario,
    pacientesAll
  } = useJornadaMedicoController();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [modoVisualizacao, setModoVisualizacao] = useState("TODOS"); // "TODOS" | "MEDICO"
  const [medicoSelecionadoOption, setMedicoSelecionadoOption] = useState(null);
  const [pacientesDoMedicoSelecionado, setPacientesDoMedicoSelecionado] = useState([]);
  const [loadingPacientesMedico, setLoadingPacientesMedico] = useState(false);

  const listarAgendamentos = async ({ startDate, endDate, pacienteId }) => {
    return await listar_agendamentos_filtrados({ startDate, endDate, pacienteId });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login/medico-parceiro');
  };

  const USUARIO_APOLLO = user?.usuario?.id_usuario === 109 && user?.usuario?.id_papel_usuario === 7;

  const medicoOptions = profissionais && typeof profissionais === 'object'
    ? Object.entries(profissionais).map(([id, nome]) => ({
        value: Number(id),
        label: nome || `Profissional ${id}`
      }))
    : [];

  const handleSelectMedico = async (option) => {
    setMedicoSelecionadoOption(option);
    setPacienteSelecionadoId(null);

    if (!option) {
      setPacientesDoMedicoSelecionado([]);
      return;
    }

    setLoadingPacientesMedico(true);
    try {
      const res = await buscar_agendamentos_stockcare({ usuarioId: option.value });
      const listaAgendamentos = Array.isArray(res) ? res : (res?.data || []);
      const idsPacientes = [...new Set(listaAgendamentos.map(ag => ag.id_paciente))];

      const filtrados = (pacientesAll || []).filter(p => idsPacientes.includes(p.id));
      setPacientesDoMedicoSelecionado(filtrados);
    } catch (e) {
      console.error("Erro ao buscar pacientes do médico selecionado", e);
      setPacientesDoMedicoSelecionado([]);
    } finally {
      setLoadingPacientesMedico(false);
    }
  };

  const getPacientesParaExibir = () => {
    if (!USUARIO_APOLLO) return pacientes || [];

    if (modoVisualizacao === "TODOS") {
      return pacientesAll || [];
    }

    if (modoVisualizacao === "MEDICO") {
      return pacientesDoMedicoSelecionado || [];
    }

    return pacientes || [];
  };

  if (loadingInicial) return <LoadingGen primaryColor="#ffffff" secondaryColor="#ffffff" messageColor="text-apollo-100" />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
      <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
        {/* Card Branco Base */}
        <div className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
          
          {/* --- CABECALHO --- */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full border-b border-gray-100 pb-6 mb-8 gap-4">
            <div className="flex flex-col items-center md:items-start gap-1">
              <h1 className="font-extrabold text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
                💫 <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Jornada do Paciente</span>
              </h1>
              <p className="text-gray-400 text-sm hidden md:block">Acompanhe a evolução e histórico completo</p>
            </div>
            <button
              onClick={() => handleLogout()}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" /> Sair
            </button>
          </div>

          {USUARIO_APOLLO && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700">Modo de Visualização:</span>
                <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
                  <button
                    onClick={() => {
                      setModoVisualizacao("TODOS");
                      setMedicoSelecionadoOption(null);
                      setPacientesDoMedicoSelecionado([]);
                      setPacienteSelecionadoId(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      modoVisualizacao === "TODOS"
                        ? "bg-apollo-500 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Ver Todos
                  </button>
                  <button
                    onClick={() => {
                      setModoVisualizacao("MEDICO");
                      setPacienteSelecionadoId(null);
                    }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                      modoVisualizacao === "MEDICO"
                        ? "bg-apollo-500 text-white shadow-xs"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Ver como Médico Parceiro
                  </button>
                </div>
              </div>

              {/* Select para escolher o Médico Parceiro */}
              {modoVisualizacao === "MEDICO" && (
                <div className="w-full md:w-80">
                  <SingleSelect
                    options={medicoOptions}
                    value={medicoSelecionadoOption}
                    onChange={handleSelectMedico}
                    placeholder="Selecione o Médico Parceiro..."
                    isLoading={loadingPacientesMedico}
                  />
                </div>
              )}
            </div>
          )}

          {/* --- BUSCA DE PACIENTE --- */}
          <PacienteSearch 
            pacientes={getPacientesParaExibir()} 
            onSelect={setPacienteSelecionadoId} 
          />

          {loadingDados ? (
            <JornadaLoadingSkeleton />
          ) : pacienteSelecionadoId && pacienteDetalhes ? (
            <div className="flex flex-col gap-12 animate-fade-in w-full mt-6">
              
              <div className="flex justify-end -mb-8">
                <BotaoVerAnexo pacienteId={pacienteSelecionadoId} />
              </div>

              <DadosCadastraisSection pacienteDetalhes={pacienteDetalhes} medicoParceiro={true} />

              <hr className="border-gray-100" />

              <AgendaSemanalJornada
                listarAgendamentos={listarAgendamentos}
                listarPacientes={listar_pacientes}
                medicoParceiro={true}
                CardComponent={CardAgendamentoJornada}
                tipo="paciente"
                titulo="🗓️ Agenda Semanal"
                initialPessoaId={pacienteSelecionadoId}
              />

              <hr className="border-gray-100" />

              <FilesSection pacienteId={pacienteSelecionadoId} profissionais={profissionais} medicoParceiro={true} />

              <hr className="border-gray-100" />

              <ProntuarioSection
                tipoOrdenacao={tipoOrdenacao}
                setTipoOrdenacao={setTipoOrdenacao}
                prontuario={prontuario}
                agendamentos={agendamentos}
                loadingProntuario={loadingProntuario}
                onReload={recarregarProntuario}
                resetKey={pacienteSelecionadoId}
                pacienteDetalhes={pacienteDetalhes}
                profissionais={profissionais}
                medicoParceiro={true}
              />
            </div>
          ) : !loadingDados && (
            <JornadaEmptyState />
          )}
        </div>
      </div>
    </div>
  );
};

export default JornadaMedicoParceiro;