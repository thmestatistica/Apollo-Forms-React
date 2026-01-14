import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import InfoGen from "../../components/info/InfoGen.jsx";

// Imports de lógica e API
import { listar_pacientes, listar_agendamentos_paciente } from "../../api/jornada/jornada_utils";
import { calcularTotaisRobotica, calcularIdade } from "../../utils/jornada/stats";

const JornadaPage = () => {
  const navigate = useNavigate();

  // --- Estados ---
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);
  
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState('');
  const [pacienteDetalhes, setPacienteDetalhes] = useState(null); 
  
  const [agendamentos, setAgendamentos] = useState([]);
  const [stats, setStats] = useState(null);

  // Filtros
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState("Todas");
  const [mostrarTodas, setMostrarTodas] = useState(false);

  // --- 1. Carregar Lista de Pacientes ---
  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const dados = await listar_pacientes();
        // Ordena alfabeticamente
        const ativos = dados.filter(p => p.ativo !== false).sort((a, b) => a.nome.localeCompare(b.nome));
        setPacientes(ativos);
      } catch (error) {
        console.error("Falha lista pacientes", error);
      } finally {
        setLoadingInicial(false);
      }
    };
    fetchPacientes();
  }, []);

  // --- 2. Buscar Dados ao Selecionar ---
  useEffect(() => {
    if (!pacienteSelecionadoId) {
        setAgendamentos([]);
        setStats(null);
        setPacienteDetalhes(null);
        return;
    }

    const fetchDetalhes = async () => {
        setLoadingDados(true);
        try {
            const pct = pacientes.find(p => String(p.id) === String(pacienteSelecionadoId));
            setPacienteDetalhes(pct);

            const hist = await listar_agendamentos_paciente(pacienteSelecionadoId);
            
            // CORREÇÃO DE ORDENAÇÃO: Mais recente primeiro (Data Maior -> Data Menor)
            // Usamos getTime() para garantir a matemática correta
            const sortedHist = [...hist].sort((a, b) => 
                new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
            );
            
            setAgendamentos(sortedHist);
            setStats(calcularTotaisRobotica(sortedHist));
            
        } catch (error) {
            console.error("Erro dados detalhados", error);
        } finally {
            setLoadingDados(false);
        }
    };

    fetchDetalhes();
  }, [pacienteSelecionadoId, pacientes]);

  // --- Filtros ---
  const especialidadesDisponiveis = useMemo(() => {
      const specs = new Set();
      agendamentos.forEach(ag => {
          const spec = ag.profissional?.especialidade?.[0];
          if(spec) specs.add(spec);
      });
      return ["Todas", ...Array.from(specs)];
  }, [agendamentos]);

  const agendamentosFiltrados = useMemo(() => {
      let lista = agendamentos;
      
      if (especialidadeFiltro !== "Todas" && !mostrarTodas) {
          lista = lista.filter(ag => {
              const spec = ag.profissional?.especialidade?.[0] || "Outros";
              return spec === especialidadeFiltro;
          });
      }
      return lista;
  }, [agendamentos, especialidadeFiltro, mostrarTodas]);


  if (loadingInicial) return <LoadingGen mensagem="Carregando painel..." />;

  return (
    // Estrutura idêntica ao TelaInicialTerapeuta (h-screen, bg-linear, card branco arredondado)
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <div className="w-screen h-full flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* Card Principal Branco */}
        <div className="bg-white h-full rounded-xl grid grid-cols-1 auto-rows-min gap-6 xl:shadow-md w-full md:p-8 p-4 overflow-y-auto max-w-7xl">
          
          {/* --- Cabeçalho e Navegação --- */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full border-b pb-4 mb-2 gap-4">
             <div className='flex flex-col items-center md:items-start'>
                <h1 className="font-extrabold text-4xl text-gray-800">
                    💫 Jornada do Paciente
                </h1>
             </div>
             
             <button 
                onClick={() => navigate('/forms-terapeuta/tela-inicial')}
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer"
            >
                Voltar ao Painel
            </button>
          </div>

          {/* --- Seletor de Paciente (Estilo Apollo) --- */}
          <div className="w-full">
            <label className="block font-bold text-xl text-gray-700 mb-2">
                👤 Selecione o Paciente
            </label>
            <select
                value={pacienteSelecionadoId}
                onChange={(e) => setPacienteSelecionadoId(e.target.value)}
                className="w-full md:w-1/2 bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-apollo-300 focus:border-apollo-300 block p-3 shadow-sm transition-all"
            >
                <option value="">-- Clique para buscar --</option>
                {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
            </select>
          </div>

          {pacienteSelecionadoId && pacienteDetalhes && !loadingDados ? (
            <div className="flex flex-col gap-8 animate-fade-in w-full">
                
                {/* --- 📝 Dados do Paciente --- */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="font-bold text-2xl mb-4 text-gray-800">📝 Dados Cadastrais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                        <div className='space-y-2'>
                            <p><span className="font-bold">Nome:</span> {pacienteDetalhes.nome}</p>
                            <p><span className="font-bold">Idade:</span> {calcularIdade(pacienteDetalhes.dataNascimento)} anos</p>
                            <p><span className="font-bold">Período (semanas):</span> {pacienteDetalhes.periodoAvaliacaoSemanas || "—"}</p>
                        </div>
                        <div className='space-y-2'>
                            <p><span className="font-bold">Diagnóstico Principal:</span> {pacienteDetalhes.diagnosticoPrincipal || "—"}</p>
                            <p><span className="font-bold">Objetivo Principal:</span> {pacienteDetalhes.objetivoPrincipal || "—"}</p>
                        </div>
                    </div>
                </div>

                {/* --- 💻 Sessões de Equipamentos --- */}
                <div>
                    <h2 className="font-bold text-2xl mb-4 text-gray-800">💻 Sessões Realizadas (Robótica)</h2>
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <DashboardCard title="Armeo" value={stats.ARM} color="bg-blue-500" />
                            <DashboardCard title="C-Mill" value={stats.CML} color="bg-green-500" />
                            <DashboardCard title="Lokomat" value={stats.LKM} color="bg-red-500" />
                            <DashboardCard title="Kratos" value={stats.KTS} color="bg-purple-500" />
                            <DashboardCard title="TMS" value={stats.TMS} color="bg-yellow-500" />
                        </div>
                    )}
                </div>

                <hr className="border-gray-200" />

                {/* --- 📅 Histórico Recente --- */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <h2 className="font-bold text-2xl text-gray-800">📅 Histórico Recente</h2>
                        
                        {/* Filtros de Especialidade */}
                        <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <select 
                                className="bg-transparent font-medium text-gray-700 focus:outline-none"
                                value={especialidadeFiltro}
                                onChange={(e) => setEspecialidadeFiltro(e.target.value)}
                                disabled={mostrarTodas}
                            >
                                {especialidadesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                            <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
                                <input 
                                    type="checkbox" 
                                    id="allSpecs" 
                                    checked={mostrarTodas}
                                    onChange={(e) => setMostrarTodas(e.target.checked)}
                                    className="w-4 h-4 text-apollo-300 rounded focus:ring-apollo-300 cursor-pointer" 
                                />
                                <label htmlFor="allSpecs" className="text-sm font-bold text-gray-600 cursor-pointer select-none">Ver Tudo</label>
                            </div>
                        </div>
                    </div>

                    {agendamentosFiltrados.length === 0 ? (
                        <InfoGen message="Nenhum agendamento encontrado para este filtro." />
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {agendamentosFiltrados.slice(0, 5).map((ag) => (
                                <AppointmentRow key={ag.id} ag={ag} />
                            ))}
                            {agendamentosFiltrados.length > 5 && (
                                <p className="text-center text-gray-400 text-sm mt-2">
                                    Exibindo os 5 mais recentes de {agendamentosFiltrados.length} registros.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* --- 🧘 Prontuário (Placeholder Visual) --- */}
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-2xl text-gray-800">🧘 Prontuário Clínico</h2>
                        <button className="text-apollo-300 hover:text-apollo-400 font-bold text-sm flex items-center gap-1 transition-colors">
                            🔄 Atualizar
                        </button>
                    </div>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 flex flex-col items-center justify-center text-center opacity-70">
                        <span className="text-4xl mb-2">📄</span>
                        <p className="font-bold text-gray-600">Visualização de Prontuário</p>
                        <p className="text-sm text-gray-500">Selecione o número de formulários para exibir (Em breve)</p>
                    </div>
                </div>

            </div>
          ) : (
            /* Estado Vazio */
            !loadingDados && (
                <div className="flex flex-col items-center justify-center py-24 opacity-50">
                    <span className="text-8xl mb-6">🔍</span>
                    <p className="text-3xl font-extrabold text-gray-300">Aguardando Seleção</p>
                </div>
            )
          )}

        </div>
      </div>
    </div>
  );
};

// Card de Estatística (Estilo limpo e sólido)
const DashboardCard = ({ title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center transition-transform hover:scale-105">
        <div className={`w-full h-1 ${color} rounded-full mb-3 opacity-80`}></div>
        <span className="text-3xl font-extrabold text-gray-800">{value}</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{title}</span>
    </div>
);

// Linha de Agendamento (Estilo similar ao AgenPag)
const AppointmentRow = ({ ag }) => {
    const data = new Date(ag.inicio);
    const horaInicio = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const horaFim = new Date(ag.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const profissionalNome = ag.profissional?.usuario?.nome || "Profissional";
    const especialidade = ag.profissional?.especialidade?.[0] || "Geral";
    const slotNome = ag.slot?.nome || "Slot";
    const presenca = ag.presenca || "Agendado";
    // const corLateral = ag.paciente?.cor || "#A78BFA";

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">
            
            {/* Esquerda: Data e Hora */}
            <div className="flex items-center gap-4">
                <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-2 min-w-[70px]">
                    <span className="text-xs font-bold text-gray-500 uppercase">{data.toLocaleString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                    <span className="text-xl font-extrabold text-gray-800">{data.getDate()}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-800">{horaInicio} - {horaFim}</span>
                    <span className="text-sm text-gray-500 font-medium">{slotNome}</span>
                </div>
            </div>

            {/* Centro: Profissional */}
            <div className="flex flex-col md:items-start">
                <span className="font-bold text-gray-700 flex items-center gap-2">
                    🧑‍⚕️ {profissionalNome}
                </span>
                <span className="text-xs text-apollo-300 font-bold uppercase tracking-wide bg-apollo-50 px-2 py-0.5 rounded w-fit">
                    {especialidade}
                </span>
            </div>

            {/* Direita: Status */}
            <div className="flex items-center">
                <BadgeStatus status={presenca} />
            </div>
        </div>
    );
};

// Badge simples
const BadgeStatus = ({ status }) => {
    const st = (status || "").toLowerCase();
    let style = "bg-gray-100 text-gray-500";
    let icon = "⏳";
    let label = status || "Agendado";

    if (st === 'presente') {
        style = "bg-green-100 text-green-700 border border-green-200";
        icon = "✅";
    } else if (st.includes('cancelado')) {
        style = "bg-red-100 text-red-700 border border-red-200";
        icon = "❌";
    } else if (st.includes('aviso')) {
        style = "bg-orange-100 text-orange-700 border border-orange-200";
        icon = "⚠️";
    }

    return (
        <span className={`px-3 py-1 text-sm font-bold rounded-full flex items-center gap-2 ${style}`}>
            <span>{icon}</span> {label}
        </span>
    );
}

export default JornadaPage;