import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import InfoGen from "../../components/info/InfoGen.jsx";

// Imports
import { listar_pacientes, listar_agendamentos_paciente, listar_respostas_prontuario } from "../../api/jornada/jornada_utils";
import { calcularTotaisRobotica, calcularIdade } from "../../utils/jornada/stats";
import { formatarNome, processarProntuario } from "../../utils/jornada/format";

const JornadaPage = () => {
  const navigate = useNavigate();

  // --- Estados Globais ---
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingDados, setLoadingDados] = useState(false);
  const [pacientes, setPacientes] = useState([]);
  
  // --- Seleção ---
  const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState('');
  const [pacienteDetalhes, setPacienteDetalhes] = useState(null); 
  
  // --- Histórico ---
  const [agendamentos, setAgendamentos] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Filtros Histórico
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState("Todas");
  const [mostrarTodas, setMostrarTodas] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [histLimit, setHistLimit] = useState(5);

  // --- Prontuário ---
  const [prontuario, setProntuario] = useState([]); // Lista processada e agrupada
  const [loadingProntuario, setLoadingProntuario] = useState(false);
  const [prontPage, setProntPage] = useState(1);
  const [prontLimit, setProntLimit] = useState(3);

  // 1. Carga de Pacientes (Com Filtros Rigorosos e Formatação)
  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const dados = await listar_pacientes();
        const validos = dados.filter(p => {
            if (!p.ativo) return false;
            const nome = (p.nome || "").toUpperCase();
            // Filtros de exclusão
            if (nome.includes("ADM") || nome.includes("TESTE") || nome.includes("TEMP") || nome.includes("TREINAMENTO")) return false;
            return true;
        }).map(p => ({
            ...p,
            nomeFormatado: formatarNome(p.nome) // Padroniza visualização
        }));

        validos.sort((a, b) => a.nomeFormatado.localeCompare(b.nomeFormatado));
        setPacientes(validos);
      } catch (error) {
        console.error("Erro pacientes", error);
      } finally {
        setLoadingInicial(false);
      }
    };
    fetchPacientes();
  }, []);

  // 2. Busca de Dados Completos
  useEffect(() => {
    if (!pacienteSelecionadoId) {
        setAgendamentos([]); setStats(null); setPacienteDetalhes(null); setProntuario([]);
        return;
    }

    const fetchDetalhes = async () => {
        setLoadingDados(true);
        try {
            // Aqui usamos 'pacientes', então ele precisa estar na dependência
            const pct = pacientes.find(p => String(p.id) === String(pacienteSelecionadoId));
            setPacienteDetalhes(pct);

            // A. Agendamentos
            const hist = await listar_agendamentos_paciente(pacienteSelecionadoId);
            // Ordenação por data decrescente (mais recente no topo)
            const sortedHist = [...hist].sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
            setAgendamentos(sortedHist);
            setStats(calcularTotaisRobotica(sortedHist));

            // B. Prontuário
            setLoadingProntuario(true);
            const rawForms = await listar_respostas_prontuario(pacienteSelecionadoId);
            const processedForms = processarProntuario(rawForms);
            setProntuario(processedForms);
            setLoadingProntuario(false);

        } catch (error) {
            console.error("Erro ao carregar detalhes", error);
        } finally {
            setLoadingDados(false);
        }
    };

    fetchDetalhes();
    setHistPage(1);
    setProntPage(1);
  }, [pacienteSelecionadoId, pacientes]);

  // --- Lógica Histórico ---
  const especialidadesDisponiveis = useMemo(() => {
      const specs = new Set();
      agendamentos.forEach(ag => {
          const spec = ag.profissional?.especialidade?.[0];
          if(spec) specs.add(spec);
      });
      return ["Todas", ...Array.from(specs).sort()];
  }, [agendamentos]);

  const historicoFiltrado = useMemo(() => {
      // 1. Remove Agendados/Nulos
      let lista = agendamentos.filter(ag => {
          const st = (ag.presenca || "").toLowerCase();
          // Exclui status de agendamento futuro ou inválido
          return st && st !== "null" && st !== "agendado" && st !== "";
      });

      // 2. Filtro de Especialidade (Checkbox "Ver Tudo" tem prioridade)
      if (!mostrarTodas && especialidadeFiltro !== "Todas") {
          lista = lista.filter(ag => {
              const spec = ag.profissional?.especialidade?.[0] || "Outros";
              return spec === especialidadeFiltro;
          });
      }
      return lista;
  }, [agendamentos, especialidadeFiltro, mostrarTodas]);

  const historicoPaginado = useMemo(() => {
      const start = (histPage - 1) * histLimit;
      return historicoFiltrado.slice(start, start + histLimit);
  }, [historicoFiltrado, histPage, histLimit]);

  const totalHistPages = Math.ceil(historicoFiltrado.length / histLimit);

  // --- Lógica Prontuário ---
  const prontuarioPaginado = useMemo(() => {
      if (prontLimit === "Todos") return prontuario;
      const start = (prontPage - 1) * prontLimit;
      return prontuario.slice(start, start + prontLimit);
  }, [prontuario, prontPage, prontLimit]);

  const totalProntPages = prontLimit === "Todos" ? 1 : Math.ceil(prontuario.length / prontLimit);


  if (loadingInicial) return <LoadingGen mensagem="Carregando..." />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <div className="w-screen min-h-screen flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        <div className="bg-white h-full rounded-xl w-full md:p-8 p-4 overflow-y-auto max-w-7xl xl:shadow-md">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full border-b pb-4 mb-6 gap-4">
             <div className='flex flex-col items-center md:items-start'>
                <h1 className="font-extrabold text-4xl text-gray-800 flex items-center gap-2">
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

          {/* --- SELECT SEARCHABLE DO PACIENTE --- */}
          <div className="w-full mb-8">
            <label className="block font-bold text-xl text-gray-700 mb-2">Selecione o Paciente</label>
            <SearchableSelect 
                options={pacientes} 
                onSelect={(id) => setPacienteSelecionadoId(id)} 
                placeholder="Digite o nome do paciente..."
            />
          </div>

          {pacienteSelecionadoId && pacienteDetalhes && !loadingDados ? (
            <div className="flex flex-col gap-10 animate-fade-in w-full">
                
                {/* 1. DADOS CADASTRAIS (INTOCADO) */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h2 className="font-bold text-2xl mb-4 text-gray-800">Dados Cadastrais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
                        <div className='space-y-2'>
                            <p><span className="font-bold">Nome:</span> {pacienteDetalhes.nomeFormatado}</p>
                            <p><span className="font-bold">Idade:</span> {calcularIdade(pacienteDetalhes.dataNascimento)} anos</p>
                            <p><span className="font-bold">Período (semanas):</span> {pacienteDetalhes.periodoAvaliacaoSemanas || "—"}</p>
                        </div>
                        <div className='space-y-2'>
                            <p><span className="font-bold">Diagnóstico Principal:</span> {pacienteDetalhes.diagnosticoPrincipal || "—"}</p>
                            <p><span className="font-bold">Objetivo Principal:</span> {pacienteDetalhes.objetivoPrincipal || "—"}</p>
                        </div>
                    </div>
                </div>

                {/* 2. SESSÕES (INTOCADO) */}
                <div>
                    <h2 className="font-bold text-2xl mb-4 text-gray-800">Sessões Realizadas (Robótica)</h2>
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

                {/* 3. HISTÓRICO RECENTE */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <h2 className="font-bold text-2xl text-gray-800">Histórico Recente</h2>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Qtd por página */}
                            <select 
                                className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-apollo-300 focus:border-apollo-300 block p-2 cursor-pointer"
                                value={histLimit}
                                onChange={(e) => { setHistLimit(Number(e.target.value)); setHistPage(1); }}
                            >
                                <option value={5}>5 itens</option>
                                <option value={10}>10 itens</option>
                                <option value={20}>20 itens</option>
                            </select>

                            {/* Filtro Especialidade + Checkbox */}
                            <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <select 
                                    className="bg-transparent font-medium text-gray-700 focus:outline-none cursor-pointer"
                                    value={especialidadeFiltro}
                                    onChange={(e) => { setEspecialidadeFiltro(e.target.value); setHistPage(1); }}
                                    disabled={mostrarTodas}
                                >
                                    {especialidadesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="flex items-center gap-2 border-l border-gray-300 pl-3">
                                    <input 
                                        type="checkbox" 
                                        id="allSpecs" 
                                        checked={mostrarTodas}
                                        onChange={(e) => { setMostrarTodas(e.target.checked); setHistPage(1); }}
                                        className="w-4 h-4 text-apollo-300 rounded focus:ring-apollo-300 cursor-pointer" 
                                    />
                                    <label htmlFor="allSpecs" className="text-sm font-bold text-gray-600 cursor-pointer select-none">Ver Tudo</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {historicoFiltrado.length === 0 ? (
                        <InfoGen message="Nenhum histórico realizado encontrado (Agendamentos futuros foram ocultados)." />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4">
                                {historicoPaginado.map((ag) => (
                                    <AppointmentRow key={ag.id} ag={ag} />
                                ))}
                            </div>
                            
                            {/* Paginação Histórico */}
                            {totalHistPages > 1 && (
                                <Pagination 
                                    page={histPage} 
                                    total={totalHistPages} 
                                    setPage={setHistPage} 
                                    count={historicoFiltrado.length}
                                />
                            )}
                        </>
                    )}
                </div>

                <hr className="border-gray-200" />

                {/* 4. PRONTUÁRIO CLÍNICO */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-bold text-2xl text-gray-800">Prontuário</h2>
                        <button 
                            onClick={() => setPacienteSelecionadoId(pacienteSelecionadoId)} // Re-trigger fetch
                            className="text-apollo-300 hover:text-apollo-400 font-bold text-sm flex items-center gap-1 transition-colors cursor-pointer"
                        >
                            🔄 Atualizar
                        </button>
                    </div>

                    {/* Filtros Prontuário */}
                    <div className="flex items-center gap-4 mb-2">
                        <span className="text-sm text-gray-600 font-bold">Exibir:</span>
                        <select 
                            className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg p-2 cursor-pointer"
                            value={prontLimit}
                            onChange={(e) => { 
                                const val = e.target.value; 
                                setProntLimit(val === "Todos" ? "Todos" : Number(val)); 
                                setProntPage(1); 
                            }}
                        >
                            <option value={3}>Últimos 3 formulários</option>
                            <option value={5}>Últimos 5 formulários</option>
                            <option value={10}>Últimos 10 formulários</option>
                            <option value="Todos">Todos os formulários</option>
                        </select>
                    </div>

                    {loadingProntuario ? (
                        <div className="text-center py-10 text-gray-500">Carregando prontuário...</div>
                    ) : prontuario.length === 0 ? (
                        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800">
                            Nenhum formulário registrado para este paciente.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {prontuarioPaginado.map((item) => (
                                <ProntuarioItem key={item.id} item={item} />
                            ))}

                            {/* Paginação Prontuário */}
                            {totalProntPages > 1 && (
                                <Pagination 
                                    page={prontPage} 
                                    total={totalProntPages} 
                                    setPage={setProntPage} 
                                    count={prontuario.length}
                                />
                            )}
                        </div>
                    )}
                </div>

            </div>
          ) : (
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

// --- Componentes Visuais ---

// 1. Searchable Select (Para digitar nome)
const SearchableSelect = ({ options, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedName, setSelectedName] = useState("");
    const wrapperRef = useRef(null);

    const filtered = options.filter(o => o.nomeFormatado.toLowerCase().includes(search.toLowerCase()));

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (opt) => {
        setSelectedName(opt.nomeFormatado);
        setSearch("");
        onSelect(opt.id);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full md:w-1/2">
            <div 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg flex justify-between items-center p-3 shadow-sm cursor-pointer"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span>{selectedName || placeholder}</span>
                <span className="text-gray-500">▼</span>
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full bg-white border border-gray-300 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    <input 
                        type="text" 
                        className="w-full p-2 border-b border-gray-200 focus:outline-none"
                        placeholder="Buscar..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                    {filtered.length > 0 ? (
                        filtered.map(opt => (
                            <div 
                                key={opt.id} 
                                className="p-2 hover:bg-apollo-50 cursor-pointer text-gray-700"
                                onClick={() => handleSelect(opt)}
                            >
                                {opt.nomeFormatado}
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-gray-500">Nenhum resultado</div>
                    )}
                </div>
            )}
        </div>
    );
};

// 2. Card de Estatística
const DashboardCard = ({ title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer">
        <div className={`w-full h-1 ${color} rounded-full mb-3 opacity-80`}></div>
        <span className="text-3xl font-extrabold text-gray-800">{value}</span>
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">{title}</span>
    </div>
);

// 3. Linha de Agendamento (Histórico)
const AppointmentRow = ({ ag }) => {
    const dataObj = new Date(ag.inicio);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    const dataBonita = new Intl.DateTimeFormat('pt-BR', options).format(dataObj);
    const horaInicio = dataObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const horaFim = new Date(ag.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const profissionalNome = formatarNome(ag.profissional?.usuario?.nome || "Profissional");
    const especialidade = ag.profissional?.especialidade?.[0] || "Geral";
    const slotNome = ag.slot?.nome || "Slot";
    const presenca = ag.presenca || "Agendado";

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-6 w-full md:w-1/3">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-800 capitalize">{dataBonita}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500 font-medium mt-1">
                        <span>⏰ {horaInicio} - {horaFim}</span>
                        <span>•</span>
                        <span>{slotNome}</span>
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center w-full md:w-1/3 text-center">
                <span className="font-bold text-gray-700 text-base">{profissionalNome}</span>
                <span className="text-xs text-white font-bold uppercase tracking-wide bg-apollo-300 px-3 py-1 rounded-full mt-1">
                    {especialidade}
                </span>
            </div>
            <div className="flex items-center justify-end w-full md:w-1/3">
                <BadgeStatus status={presenca} />
            </div>
        </div>
    );
};

// 4. Item de Prontuário (Accordion)
const ProntuarioItem = ({ item }) => {
    const [expanded, setExpanded] = useState(false);
    const dataStr = new Date(item.data_registro).toLocaleString('pt-BR');

    return (
        <div className="border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
            <div 
                className="p-4 flex justify-between items-center bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div>
                    <h4 className="font-bold text-lg text-apollo-400">{item.nome_formulario}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        Registrado em {dataStr} • 🧑‍⚕️ {formatarNome(item.profissional_nome)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-white border border-gray-300 text-gray-600 text-xs px-2 py-1 rounded uppercase font-bold">
                        {item.tipo_formulario}
                    </span>
                    <span className="text-gray-400 text-xl">{expanded ? '▲' : '▼'}</span>
                </div>
            </div>
            
            {expanded && (
                <div className="p-4 bg-white border-t border-gray-100 animate-fade-in">
                    {item.respostas.map((r, i) => (
                        <div key={i} className="mb-3 border-b border-gray-100 pb-2 last:border-0">
                            <p className="font-bold text-gray-800 text-sm mb-1">{r.pergunta}</p>
                            <p className="text-gray-600 text-base whitespace-pre-wrap">{r.resposta}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// 5. Componente de Paginação Genérico
const Pagination = ({ page, total, setPage, count }) => (
    <div className="flex justify-between items-center mt-2 px-2">
        <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-sm font-bold text-gray-600"
        >
            ◀ Anterior
        </button>
        <span className="text-sm text-gray-500">
            Página {page} de {total} ({count} itens)
        </span>
        <button 
            onClick={() => setPage(p => Math.min(total, p + 1))}
            disabled={page === total}
            className="px-4 py-2 border rounded bg-white hover:bg-gray-50 disabled:opacity-50 cursor-pointer text-sm font-bold text-gray-600"
        >
            Próxima ▶
        </button>
    </div>
);

const BadgeStatus = ({ status }) => {
    const st = (status || "").toLowerCase();
    let style = "bg-gray-100 text-gray-500";
    let icon = "⏳";
    let label = status || "Agendado";

    if (st === 'presente') {
        style = "bg-green-100 text-green-800 border border-green-200";
        icon = "✅";
    } else if (st.includes('cancelado')) {
        style = "bg-red-100 text-red-800 border border-red-200";
        icon = "❌";
    } else if (st.includes('aviso')) {
        style = "bg-orange-100 text-orange-800 border border-orange-200";
        icon = "⚠️";
    }

    return (
        <span className={`px-3 py-1 text-sm font-bold rounded-full flex items-center gap-2 ${style}`}>
            <span>{icon}</span> {label}
        </span>
    );
}

export default JornadaPage;