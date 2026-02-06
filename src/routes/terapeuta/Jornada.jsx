// Componente Genérico de Loading
import LoadingGen from "../../components/info/LoadingGen.jsx";
// Hook de Controle da Jornada
import { useJornadaController } from "../../hooks/useJornadaController";
// Componentes da Jornada
import JornadaHeader from "../../components/jornada/JornadaHeader.jsx";
import PacienteSearch from "../../components/jornada/PacienteSearch.jsx";
import DadosCadastraisSection from "../../components/jornada/DadosCadastraisSection.jsx";
import ResumoSessoesSection from "../../components/jornada/ResumoSessoesSection.jsx";
import HistoricoSection from "../../components/jornada/HistoricoSection.jsx";
import ProntuarioSection from "../../components/jornada/ProntuarioSection.jsx";
import JornadaEmptyState from "../../components/jornada/JornadaEmptyState.jsx";
import JornadaLoadingSkeleton from "../../components/jornada/JornadaLoadingSkeleton.jsx";

const JornadaPage = () => {
  const {
      pacientes, setPacienteSelecionadoId, pacienteDetalhes, pacienteSelecionadoId,
      agendamentos, stats, prontuario,
      loadingInicial, loadingDados, loadingProntuario,
      recarregarProntuario
  } = useJornadaController();

  if (loadingInicial) return <LoadingGen />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-100">
      {/* Container Principal com Gradiente Apollo */}
      <div className="w-screen min-h-screen flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* Card Branco Base */}
        <div className="bg-white h-full rounded-2xl w-full md:p-10 p-5 overflow-y-auto max-w-7xl xl:shadow-2xl pb-20">
          
             {/* --- CABECALHO --- */}
             <JornadaHeader />

                    {/* --- BUSCA DE PACIENTE --- */}
                    <PacienteSearch pacientes={pacientes} onSelect={setPacienteSelecionadoId} />

          {loadingDados ? (
            <JornadaLoadingSkeleton />
          ) : pacienteSelecionadoId && pacienteDetalhes ? (
            <div className="flex flex-col gap-12 animate-fade-in w-full">
              <DadosCadastraisSection pacienteDetalhes={pacienteDetalhes} />

              <ResumoSessoesSection stats={stats} />

              <hr className="border-gray-100" />

              <HistoricoSection agendamentos={agendamentos} resetKey={pacienteSelecionadoId} />

              <hr className="border-gray-100" />

              <ProntuarioSection
                prontuario={prontuario}
                agendamentos={agendamentos}
                loadingProntuario={loadingProntuario}
                onReload={recarregarProntuario}
                resetKey={pacienteSelecionadoId}
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

export default JornadaPage;