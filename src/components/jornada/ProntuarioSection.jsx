import React, { useMemo, useState, useEffect } from 'react';
import EditableSelect from "../input/EditableSelect.jsx";
import Pagination from "./Pagination.jsx";
import ProntuarioItem from "./ProntuarioItem.jsx";

const ProntuarioSection = ({ prontuario, agendamentos, loadingProntuario, onReload, resetKey }) => {
  const [prontNomeFiltro, setProntNomeFiltro] = useState("");
  const [prontLimit, setProntLimit] = useState(3);
  const [prontEspecialidade, setProntEspecialidade] = useState("Todas");
  const [prontPage, setProntPage] = useState(1);

  useEffect(() => {
    setProntNomeFiltro("");
    setProntLimit(3);
    setProntEspecialidade("Todas");
    setProntPage(1);
  }, [resetKey]);

  const specsProntuario = useMemo(() => {
    const specs = new Set(["Todas"]);
    prontuario.forEach(p => { if (p.especialidade) specs.add(p.especialidade); });
    return Array.from(specs).sort();
  }, [prontuario]);

  const nomesFormulariosDisponiveis = useMemo(() => {
    const nomes = new Set();
    prontuario.forEach(p => { if (p.nome_formulario) nomes.add(p.nome_formulario); });
    return Array.from(nomes).sort();
  }, [prontuario]);

  const prontuarioPaginado = useMemo(() => {
    const filtroNome = prontNomeFiltro.trim().toLowerCase();
    let lista = prontEspecialidade === "Todas" ? prontuario : prontuario.filter(p => p.especialidade === prontEspecialidade);
    if (filtroNome) {
      lista = lista.filter(p => (p.nome_formulario || "").toLowerCase().includes(filtroNome));
    }
    if (prontLimit === "Todos") return lista;
    const start = (prontPage - 1) * prontLimit;
    return lista.slice(start, start + prontLimit);
  }, [prontuario, prontEspecialidade, prontPage, prontLimit, prontNomeFiltro]);

  const totalProntItens = useMemo(() => {
    const filtroNome = prontNomeFiltro.trim().toLowerCase();
    let lista = prontEspecialidade === "Todas" ? prontuario : prontuario.filter(p => p.especialidade === prontEspecialidade);
    if (filtroNome) {
      lista = lista.filter(p => (p.nome_formulario || "").toLowerCase().includes(filtroNome));
    }
    return lista.length;
  }, [prontuario, prontEspecialidade, prontNomeFiltro]);

  const totalProntPages = prontLimit === "Todos" ? 1 : Math.ceil(totalProntItens / prontLimit);

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up delay-300 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
          📋 Prontuário Eletrônico
        </h2>

        <button
          onClick={onReload}
          className="bg-apollo-50 text-apollo-600 border border-apollo-200 hover:bg-apollo-100 hover:border-apollo-300 font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 cursor-pointer text-sm shadow-sm"
        >
          🔄 Atualizar Lista
        </button>
      </div>

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

        <EditableSelect
          options={nomesFormulariosDisponiveis}
          value={prontNomeFiltro}
          onChange={(val) => { setProntNomeFiltro(val); setProntPage(1); }}
          placeholder="Filtrar por formulário..."
        />
      </div>

      {loadingProntuario ? (
        <div className="text-center py-12 text-apollo-300 font-medium animate-pulse bg-white rounded-2xl border border-gray-100">
          ⏳ Carregando registros...
        </div>
      ) : totalProntItens === 0 ? (
        <div className="bg-blue-50 border border-blue-100 p-8 rounded-2xl text-blue-700 text-center">
          Nenhum formulário encontrado com estes filtros.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {prontuarioPaginado.map((item) => (
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
  );
};

export default ProntuarioSection;
