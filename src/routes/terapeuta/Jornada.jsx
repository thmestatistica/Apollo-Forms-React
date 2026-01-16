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

          // 👇 USA A FUNÇÃO RENOMEADA
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
      <div className="w-screen min-h-screen flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        <div className="bg-white h-full rounded-xl w-full md:p-8 p-4 overflow-y-auto max-w-7xl xl:shadow-md pb-20">
          
          <div className="flex flex-col md:flex-row justify-between items-center w-full border-b pb-4 mb-6 gap-4">
             <div className='flex flex-col items-center md:items-start'>
                <h1 className="font-extrabold text-4xl text-gray-800 flex items-center gap-2">💫 Jornada do Paciente</h1>
             </div>
             <button onClick={() => navigate('/forms-terapeuta/tela-inicial')} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer">Voltar ao Painel</button>
          </div>

          <div className="w-full mb-8">
            <label className="block font-bold text-xl text-gray-700 mb-2">Selecione o Paciente</label>
            <SearchableSelect options={pacientes} onSelect={setPacienteSelecionadoId} placeholder="Digite o nome do paciente..." />
          </div>

          {loadingDados ? (
             <div className="animate-pulse flex flex-col gap-8"><div className="h-40 bg-gray-200 rounded-xl"></div><div className="h-32 bg-gray-200 rounded-xl"></div><div className="h-64 bg-gray-200 rounded-xl"></div></div>
          ) : pacienteSelecionadoId && pacienteDetalhes ? (
            <div className="flex flex-col gap-10 animate-fade-in w-full">
                {/* DADOS CADASTRAIS */}
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

                {/* SESSÕES */}
                {stats && (
                    <div>
                        <h2 className="font-bold text-2xl mb-4 text-gray-800">Sessões Realizadas</h2>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <DashboardCard title="Armeo" value={stats.ARM} color="bg-blue-500" />
                            <DashboardCard title="C-Mill" value={stats.CML} color="bg-green-500" />
                            <DashboardCard title="Lokomat" value={stats.LKM} color="bg-red-500" />
                            <DashboardCard title="Kratos" value={stats.KTS} color="bg-purple-500" />
                            <DashboardCard title="TMS" value={stats.TMS} color="bg-yellow-500" />
                        </div>
                    </div>
                )}

                <hr className="border-gray-200" />

                {/* HISTÓRICO */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                        <h2 className="font-bold text-2xl text-gray-800">Histórico Recente</h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <select className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg block p-2 cursor-pointer outline-none" value={histLimit} onChange={(e) => { setHistLimit(Number(e.target.value)); setHistPage(1); }}>
                                <option value={2}>2 dias</option><option value={4}>4 dias</option><option value={6}>6 dias</option><option value={10}>10 dias</option>
                            </select>
                            <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <select className="bg-transparent font-medium text-gray-700 outline-none cursor-pointer" value={especialidadeFiltro} onChange={(e) => { setEspecialidadeFiltro(e.target.value); setHistPage(1); }}>
                                    {especialidadesDisponiveis.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    {historicoAgrupado.length === 0 ? <InfoGen message="Nenhum histórico realizado encontrado." /> : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{diasPaginados.map((grupo) => <DayCard key={grupo.label} grupo={grupo} />)}</div>
                            {totalHistPages > 1 && <Pagination page={histPage} total={totalHistPages} setPage={setHistPage} count={historicoAgrupado.length} labelItem="dias" />}
                        </>
                    )}
                </div>

                <hr className="border-gray-200" />

                {/* PRONTUÁRIO */}
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-2">Prontuário <span className='text-gray-400 text-lg'>🔗</span></h2>
                        <button onClick={recarregarProntuario} className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors cursor-pointer text-sm shadow-sm">🔄 Recarregar</button>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mb-2">
                        <select className="bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg p-2 cursor-pointer outline-none" value={prontLimit} onChange={(e) => { const val = e.target.value; setProntLimit(val === "Todos" ? "Todos" : Number(val)); setProntPage(1); }}>
                            <option value={3}>Últimos 3 formulários</option><option value={5}>Últimos 5 formulários</option><option value={10}>Últimos 10 formulários</option><option value="Todos">Todos os formulários</option>
                        </select>
                        <div className="bg-gray-50 p-1 rounded-lg border border-gray-200">
                            <select className="bg-transparent font-medium text-gray-700 text-sm outline-none cursor-pointer p-1" value={prontEspecialidade} onChange={(e) => { setProntEspecialidade(e.target.value); setProntPage(1); }}>
                                {specsProntuario.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    {loadingProntuario ? <div className="text-center py-10 text-gray-500 animate-pulse">Carregando prontuário...</div> : prontuario.length === 0 ? <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-blue-800">Nenhum formulário registrado.</div> : (
                        <div className="flex flex-col gap-3">
                            {prontuarioPaginado.map((item) => <ProntuarioItem key={item.id} item={item} agendamentos={agendamentos} />)}
                            {totalProntPages > 1 && <Pagination page={prontPage} total={totalProntPages} setPage={setProntPage} count={totalProntItens} labelItem="formulários" />}
                        </div>
                    )}
                </div>
            </div>
          ) : !loadingDados && <div className="flex flex-col items-center justify-center py-24 opacity-50"><span className="text-8xl mb-6">🔍</span><p className="text-3xl font-extrabold text-gray-300">Aguardando Seleção</p></div>}
        </div>
      </div>
    </div>
  );
};

export default JornadaPage;