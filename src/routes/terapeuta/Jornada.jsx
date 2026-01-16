import React, { useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import InfoGen from "../../components/info/InfoGen.jsx";
import { useJornadaController } from "../../hooks/useJornadaController";
import { DashboardCard, DayCard, ProntuarioItem, Pagination, SearchableSelect } from "../../components/jornada/JornadaUI.jsx";

// Utils
import { formatarDataHora } from "../../utils/jornada/format";
import { calcularIdade } from "../../utils/jornada/stats";

const JornadaPage = () => {
  const navigate = useNavigate();
  
  const {
      pacientes, setPacienteSelecionadoId, pacienteDetalhes, pacienteSelecionadoId,
      agendamentos, stats, prontuario,
      loadingInicial, loadingDados, loadingProntuario,
      recarregarProntuario,
      histLimit, setHistLimit, especialidadeFiltro, setEspecialidadeFiltro, histPage, setHistPage,
      prontLimit, setProntLimit, prontEspecialidade, setProntEspecialidade, prontPage, setProntPage
  } = useJornadaController();

  const especialidadesDisponiveis = useMemo(() => {
      const specs = new Set(["Todas"]);
      agendamentos.forEach(ag => { if(ag.profissional?.especialidade?.[0]) specs.add(ag.profissional.especialidade[0]); });
      return Array.from(specs).sort();
  }, [agendamentos]);

  const historicoAgrupado = useMemo(() => {
      const grupos = {};
      for (const ag of agendamentos) {
          const st = (ag.presenca || "").toLowerCase();
          if (!st || st === "null" || st === "agendado") continue;
          
          const spec = ag.profissional?.especialidade?.[0] || "Outros";
          if (especialidadeFiltro !== "Todas" && spec !== especialidadeFiltro) continue;

          const { data: dataLabel } = formatarDataHora(ag.inicio);
          
          if (!grupos[dataLabel]) grupos[dataLabel] = { dataOriginal: new Date(ag.inicio), label: dataLabel, itens: [] };
          grupos[dataLabel].itens.push(ag);
      }
      return Object.values(grupos).sort((a, b) => b.dataOriginal - a.dataOriginal);
  }, [agendamentos, especialidadeFiltro]);

  const diasPaginados = useMemo(() => {
      const start = (histPage - 1) * histLimit;
      return historicoAgrupado.slice(start, start + histLimit);
  }, [historicoAgrupado, histPage, histLimit]);

  const specsProntuario = useMemo(() => {
      const specs = new Set(["Todas"]);
      prontuario.forEach(p => { if (p.especialidade) specs.add(p.especialidade); });
      return Array.from(specs).sort();
  }, [prontuario]);

  const prontuarioPaginado = useMemo(() => {
      let lista = prontEspecialidade === "Todas" ? prontuario : prontuario.filter(p => p.especialidade === prontEspecialidade);
      if (prontLimit === "Todos") return lista;
      const start = (prontPage - 1) * prontLimit;
      return lista.slice(start, start + prontLimit);
  }, [prontuario, prontEspecialidade, prontPage, prontLimit]);

  const totalHistPages = Math.ceil(historicoAgrupado.length / histLimit);
  const totalProntItens = prontEspecialidade === "Todas" ? prontuario.length : prontuario.filter(p => p.especialidade === prontEspecialidade).length;
  const totalProntPages = prontLimit === "Todos" ? 1 : Math.ceil(totalProntItens / prontLimit);

  if (loadingInicial) return <LoadingGen />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-100">
      {/* Container Principal com Gradiente Apollo */}
      <div className="w-screen min-h-screen flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* Card Branco Base */}
        <div className="bg-white h-full rounded-2xl w-full md:p-10 p-5 overflow-y-auto max-w-7xl xl:shadow-2xl pb-20">
          
          {/* --- CABEÇALHO --- */}
          <div className="flex flex-col md:flex-row justify-between items-center w-full border-b border-gray-100 pb-6 mb-8 gap-4">
             <div className="flex flex-col items-center md:items-start gap-1">
                <h1 className="font-extrabold text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
                    💫 <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Jornada do Paciente</span>
                </h1>
                <p className="text-gray-400 text-sm hidden md:block">Acompanhe a evolução e histórico completo</p>
             </div>
             <button 
                onClick={() => navigate('/forms-terapeuta/tela-inicial')} 
                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
            >
                <span>↩</span> Voltar ao Painel
             </button>
          </div>

          {/* --- BUSCA DE PACIENTE --- */}
          <div className="w-full mb-10">
            <label className="block font-bold text-sm text-gray-500 tracking-wide uppercase mb-3 ml-1">Selecione o Paciente</label>
            <div className="relative z-10 hover:scale-[1.005] transition-transform duration-300">
                <SearchableSelect options={pacientes} onSelect={setPacienteSelecionadoId} placeholder="Digite o nome do paciente..." />
            </div>
          </div>

          {loadingDados ? (
             <div className="animate-pulse flex flex-col gap-8">
                <div className="h-40 bg-gray-100 rounded-2xl border border-gray-200"></div>
                <div className="h-32 bg-gray-100 rounded-2xl border border-gray-200"></div>
                <div className="h-64 bg-gray-100 rounded-2xl border border-gray-200"></div>
             </div>
          ) : pacienteSelecionadoId && pacienteDetalhes ? (
            <div className="flex flex-col gap-12 animate-fade-in w-full">
                
                {/* --- 1. DADOS CADASTRAIS (ESTILO NOVO) --- */}
                <div className="
                    group
                    bg-white border-2 border-gray-100 rounded-2xl p-8
                    shadow-sm hover:shadow-2xl hover:shadow-apollo-200/10
                    hover:border-apollo-200/50 hover:-translate-y-1
                    transition-all duration-300 ease-out
                ">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-2xl p-2 bg-blue-50 rounded-lg group-hover:bg-apollo-100 transition-colors">👤</span>
                        <h2 className="font-bold text-2xl text-gray-800 group-hover:text-apollo-600 transition-colors">Dados Cadastrais</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-gray-600">
                        <div className='space-y-3'>
                            <p className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-800">Nome:</span> <span>{pacienteDetalhes.nomeFormatado}</span></p>
                            <p className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-800">Idade:</span> <span>{calcularIdade(pacienteDetalhes.dataNascimento)} anos</span></p>
                            <p className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-800">Período:</span> <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono">{pacienteDetalhes.periodoAvaliacaoSemanas || "—"} semanas</span></p>
                        </div>
                        <div className='space-y-3'>
                            <div className="flex flex-col gap-1 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-800">Diagnóstico Principal:</span> 
                                <span className="text-sm bg-gray-50 p-2 rounded border border-gray-100 italic">{pacienteDetalhes.diagnosticoPrincipal || "—"}</span>
                            </div>
                            <div className="flex flex-col gap-1 border-b border-gray-50 pb-2">
                                <span className="font-bold text-gray-800">Objetivo Principal:</span> 
                                <span className="text-sm bg-gray-50 p-2 rounded border border-gray-100 italic">{pacienteDetalhes.objetivoPrincipal || "—"}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 2. SESSÕES (DASHBOARD CARDS) --- */}
                {stats && (
                    <div className="animate-fade-in-up delay-100">
                        <h2 className="font-bold text-xl mb-4 text-gray-700 flex items-center gap-2">
                            📊 Resumo de Sessões
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {/* Nota: Assumindo que DashboardCard aceita className ou style, se não, o efeito é apenas no grid */}
                            <div className="contents *:hover:-translate-y-1 *:transition-transform *:duration-300 *:cursor-default">
                                <DashboardCard title="Armeo" value={stats.ARM} color="bg-blue-500" />
                                <DashboardCard title="C-Mill" value={stats.CML} color="bg-green-500" />
                                <DashboardCard title="Lokomat" value={stats.LKM} color="bg-red-500" />
                                <DashboardCard title="Kratos" value={stats.KTS} color="bg-purple-500" />
                                <DashboardCard title="TMS" value={stats.TMS} color="bg-yellow-500" />
                            </div>
                        </div>
                    </div>
                )}

                <hr className="border-gray-100" />

                {/* --- 3. HISTÓRICO --- */}
                <div className="flex flex-col gap-6 animate-fade-in-up delay-200">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                            📅 Histórico Recente
                        </h2>
                        
                        {/* Filtros Estilizados */}
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group">
                                <select 
                                    className="appearance-none bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl py-2 pl-4 pr-10 cursor-pointer outline-none focus:border-apollo-300 hover:border-apollo-200 transition-all shadow-sm"
                                    value={histLimit} 
                                    onChange={(e) => { setHistLimit(Number(e.target.value)); setHistPage(1); }}
                                >
                                    <option value={2}>2 dias</option><option value={4}>4 dias</option><option value={6}>6 dias</option><option value={10}>10 dias</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">▼</div>
                            </div>
                            
                            <div className="relative group">
                                <select 
                                    className="appearance-none bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold rounded-xl py-2 pl-4 pr-10 cursor-pointer outline-none focus:border-apollo-300 hover:border-apollo-200 transition-all shadow-sm"
                                    value={especialidadeFiltro} 
                                    onChange={(e) => { setEspecialidadeFiltro(e.target.value); setHistPage(1); }}
                                >
                                    {especialidadesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">▼</div>
                            </div>
                        </div>
                    </div>

                    {historicoAgrupado.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-8 text-center border-2 border-dashed border-gray-200 text-gray-400">
                            Nenhum histórico encontrado com estes filtros.
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {diasPaginados.map((grupo) => (
                                    // Wrapper para adicionar hover effect no DayCard se ele não tiver internamente
                                    <div key={grupo.label} className="transition-transform hover:-translate-y-1 duration-300">
                                        <DayCard grupo={grupo} />
                                    </div>
                                ))}
                            </div>
                            {totalHistPages > 1 && (
                                <div className="flex justify-center mt-4">
                                    <Pagination page={histPage} total={totalHistPages} setPage={setHistPage} count={historicoAgrupado.length} labelItem="dias" />
                                </div>
                            )}
                        </>
                    )}
                </div>

                <hr className="border-gray-100" />

                {/* --- 4. PRONTUÁRIO --- */}
                <div className="flex flex-col gap-6 animate-fade-in-up delay-300 pb-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
                            📋 Prontuário Eletrônico
                        </h2>
                        
                        <button 
                            onClick={recarregarProntuario} 
                            className="bg-apollo-50 text-apollo-600 border border-apollo-200 hover:bg-apollo-100 hover:border-apollo-300 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-sm"
                        >
                            🔄 Atualizar Lista
                        </button>
                    </div>

                    {/* Filtros Prontuário */}
                    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mr-2">Filtros:</span>
                        
                        <div className="relative">
                             <select 
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-1.5 pl-3 pr-8 cursor-pointer outline-none focus:border-apollo-300 hover:border-apollo-300 transition-colors"
                                value={prontLimit} 
                                onChange={(e) => { const val = e.target.value; setProntLimit(val === "Todos" ? "Todos" : Number(val)); setProntPage(1); }}
                            >
                                <option value={3}>Últimos 3</option><option value={5}>Últimos 5</option><option value={10}>Últimos 10</option><option value="Todos">Ver Todos</option>
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 text-xs">▼</div>
                        </div>

                        <div className="relative">
                            <select 
                                className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg py-1.5 pl-3 pr-8 cursor-pointer outline-none focus:border-apollo-300 hover:border-apollo-300 transition-colors"
                                value={prontEspecialidade} 
                                onChange={(e) => { setProntEspecialidade(e.target.value); setProntPage(1); }}
                            >
                                {specsProntuario.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 text-xs">▼</div>
                        </div>
                    </div>

                    {loadingProntuario ? (
                        <div className="text-center py-12 text-apollo-300 font-medium animate-pulse bg-white rounded-2xl border border-gray-100">
                            ⏳ Carregando registros...
                        </div>
                    ) : prontuario.length === 0 ? (
                        <div className="bg-blue-50 border border-blue-100 p-8 rounded-2xl text-blue-700 text-center">
                            Nenhum formulário registrado para este paciente.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {prontuarioPaginado.map((item) => (
                                // Adicionando wrapper para espaçamento e hover
                                <div key={item.id} className="transform transition-all duration-300 hover:scale-[1.005]">
                                    <ProntuarioItem item={item} agendamentos={agendamentos} />
                                </div>
                            ))}
                            {totalProntPages > 1 && (
                                <div className="mt-4 flex justify-center">
                                    <Pagination page={prontPage} total={totalProntPages} setPage={setProntPage} count={totalProntItens} labelItem="formulários" />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
          ) : !loadingDados && (
            <div className="flex flex-col items-center justify-center py-32 opacity-60 animate-fade-in text-center">
                <div className="text-8xl mb-6 bg-gray-50 p-8 rounded-full shadow-inner">🔍</div>
                <h3 className="text-3xl font-extrabold text-gray-300 mb-2">Aguardando Seleção</h3>
                <p className="text-gray-400">Utilize a barra de busca acima para encontrar um paciente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JornadaPage;