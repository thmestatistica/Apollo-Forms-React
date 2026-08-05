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

import { useJornadaMedicoController } from "../../hooks/useJornadaMedicoController.jsx";

import { useAuth } from "../../hooks/useAuth.jsx";

import { listar_agendamentos_filtrados } from "../../api/agenda/agenda_utils.js";
import { listar_pacientes } from "../../api/jornada/jornada_utils.js";


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

  const { user } = useAuth();
  // Função para buscar agendamentos filtrados por paciente
  const listarAgendamentos = async ({ startDate, endDate, pacienteId }) => {
      // O backend espera pacienteId como parâmetro
      return await listar_agendamentos_filtrados({ startDate, endDate, pacienteId });
  };
  const USUARIO_APOLLO = user?.usuario?.id_usuario === 109 && user?.usuario.id_papel_usuario === 7;

  if (loadingInicial) return <LoadingGen primaryColor="#ffffff" secondaryColor="#ffffff" messageColor="text-apollo-100" />;

  return (
    <div className="lex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
      <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
        {/* Card Branco Base */}
        <div className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
          
          {/* --- CABECALHO --- */}
          <JornadaHeader />

          {/* --- BUSCA DE PACIENTE --- */}
          <PacienteSearch pacientes={USUARIO_APOLLO ? pacientesAll : pacientes} onSelect={setPacienteSelecionadoId} />

          {loadingDados ? (
            <JornadaLoadingSkeleton />
          ) : pacienteSelecionadoId && pacienteDetalhes ? (
            <div className="flex flex-col gap-12 animate-fade-in w-full">
              
              <div className="flex justify-end -mb-8">
                <BotaoVerAnexo pacienteId={pacienteSelecionadoId} />
              </div>

              <DadosCadastraisSection pacienteDetalhes={pacienteDetalhes} medicoParceiro={true} />

              <hr className="border-gray-100" />

              {/* <HistoricoSection agendamentos={agendamentos} resetKey={pacienteSelecionadoId} /> */}
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

              <FilesSection pacienteId={pacienteSelecionadoId} profissionais={profissionais} />

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