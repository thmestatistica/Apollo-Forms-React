import React, { useMemo, useState, useEffect } from 'react';
import { DayCard, Pagination } from "./JornadaUI.jsx";
import { formatarDataHora } from "../../utils/jornada/format.js";

const HistoricoSection = ({ agendamentos, resetKey }) => {
  const [histLimit, setHistLimit] = useState(2);
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState("Todas");
  const [histPage, setHistPage] = useState(1);

  useEffect(() => {
    setHistLimit(2);
    setEspecialidadeFiltro("Todas");
    setHistPage(1);
  }, [resetKey]);

  const especialidadesDisponiveis = useMemo(() => {
    const specs = new Set(["Todas"]);
    agendamentos.forEach(ag => { if (ag.profissional?.especialidade?.[0]) specs.add(ag.profissional.especialidade[0]); });
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

  const totalHistPages = Math.ceil(historicoAgrupado.length / histLimit);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up delay-200">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
          📅 Histórico Recente
        </h2>

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
  );
};

export default HistoricoSection;
