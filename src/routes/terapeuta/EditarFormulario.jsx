import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiSelect from "../../components/input/MultiSelect.jsx";
import { listar_formularios } from "../../api/forms/forms_utils";
import ErroGen from "../../components/info/ErroGen.jsx";
import InfoGen from "../../components/info/InfoGen.jsx";
import PaginationButtons from "../../components/pagination/PaginationButtons.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";

function EditarFormulario() {
  const navigate = useNavigate();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [selectedTipos, setSelectedTipos] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(2); 

  // 1. Carregamento dos dados
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await listar_formularios();
        if (isMounted) setForms(Array.isArray(data) ? data : []);
      } catch (e) {
        if (isMounted) setError("Falha ao carregar formulários.");
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // 2. Filtros e Lógica
  const tipoOptions = useMemo(() => {
    const set = new Map();
    for (const f of forms) {
      const t = f?.tipo_formulario ?? f?.tipo ?? null;
      if (t && !set.has(t)) set.set(t, { value: t, label: String(t) });
    }
    return Array.from(set.values());
  }, [forms]);

  const filteredForms = useMemo(() => {
    if (!selectedTipos?.length) return forms;
    const allowed = new Set(selectedTipos.map((o) => o.value));
    return forms.filter((f) => allowed.has(f?.tipo_formulario ?? f?.tipo));
  }, [forms, selectedTipos]);

  // Responsividade
  useEffect(() => {
    const computeItemsPerPage = () => {
      const w = window.innerWidth;
      if (w >= 1024) return 9;
      if (w >= 640) return 6;
      return 3;
    };
    const update = () => setItemsPerPage(computeItemsPerPage());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredForms?.length || 0) / itemsPerPage)), [filteredForms, itemsPerPage]);

  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev > totalPages) return totalPages;
      if (prev < 1) return 1;
      return prev;
    });
  }, [totalPages]);

  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredForms.slice(pageStart, pageStart + itemsPerPage);

  // Ação Principal: EDITAR
  const handleEdit = (form) => {
    const id = form?.id ?? form?.formulario_id ?? form?.formId;
    if (!id) return;
    navigate(`/forms-terapeuta/editar-formulario/${id}`);
  };

  const getTitulo = (f) => f?.nome_formulario ?? f?.titulo ?? f?.nomeEscala ?? `Formulário ${f?.id ?? ""}`;
  const getTipo = (f) => f?.tipo_formulario ?? f?.tipo ?? "-";

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      {/* Container com Gradiente Apollo */}
      <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* Card Branco Principal */}
        <div className="bg-white h-full rounded-2xl flex flex-col gap-8 xl:shadow-2xl w-full md:p-10 p-5 overflow-y-auto relative pb-16">
          
          <div className="flex flex-col gap-4">
             <h1 className="font-extrabold text-3xl md:text-4xl text-center md:text-left flex items-center gap-3 text-gray-800 animate-fade-in-down">
               ✍️ <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Editar Formulários</span>
             </h1>
          </div>

          <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-6 border-b border-gray-100">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-bold text-gray-600 tracking-wide">FILTRAR POR TIPO</label>
              <MultiSelect
                options={tipoOptions}
                value={selectedTipos}
                onChange={setSelectedTipos}
                placeholder="Selecione um ou mais tipos..."
                className="text-sm cursor-pointer shadow-sm hover:shadow transition-shadow"
              />
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
                {/* Botão de Troca de Modo (Ir para Visualização) */}
                <button 
                  onClick={() => navigate('/forms-terapeuta/visualizar-formularios')}
                  className="bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-2.5 px-5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  👁️ Ir para Visualização
                </button>

                <button 
                  onClick={() => navigate('/forms-terapeuta/tela-inicial')}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>↩ </span> Voltar
                </button>
            </div>
          </div>

          {loading && <div className="text-center text-apollo-200 font-semibold animate-pulse">⏳ Carregando formulários...</div>}
          
          {!!error && !loading && <ErroGen mensagem={error} />}

          {!loading && !error && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 flex-1 content-start">
              {filteredForms?.length ? (
                pageItems.map((f) => (
                  <div
                    key={f?.id ?? Math.random()}
                    onClick={() => handleEdit(f)}
                    className="
                        group 
                        relative 
                        cursor-pointer 
                        bg-white 
                        border-2 border-gray-200 
                        rounded-2xl 
                        p-6 
                        flex flex-col justify-between 
                        shadow-md 
                        hover:shadow-2xl hover:shadow-apollo-200/20 
                        hover:border-apollo-200 
                        transform hover:-translate-y-1 
                        transition-all duration-300 ease-out
                    "
                  >
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                             <span className="bg-gray-100 text-gray-600 group-hover:text-apollo-200 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider transition-colors duration-300 border border-gray-200">
                                {getTipo(f)}
                             </span>
                        </div>
                        <h2 className="font-bold text-lg text-apollo-200 line-clamp-2 leading-tight group-hover:text-apollo-300 transition-colors duration-300">
                            {getTitulo(f)}
                        </h2>
                    </div>
                    
                    {/* Botão de Ação: Editar */}
                    <div className="
                        mt-6 w-full py-2.5 rounded-xl 
                        bg-apollo-700 text-apollo-600 border border-apollo-600 
                        font-bold 
                        group-hover:bg-apollo-200 group-hover:text-white group-hover:border-apollo-200 
                        transition-all duration-300 
                        flex items-center justify-center gap-2 text-sm shadow-sm group-hover:shadow-lg
                    ">
                      <span>Editar Formulário</span>
                      <span className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">✏️</span>
                    </div>
                  </div>
                ))
              ) : (
                <InfoGen mensagem="Nenhum formulário encontrado com os filtros selecionados." />
              )}
            </div>
          )}

          {!loading && !error && filteredForms?.length > 0 && (
            <div className="pt-4 mt-auto">
                <PaginationButtons
                currentPage={currentPage}
                totalPages={totalPages}
                onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
                onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditarFormulario;