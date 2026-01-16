import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiSelect from "../../components/input/MultiSelect.jsx";
import { listar_formularios } from "../../api/forms/forms_utils";
import ErroGen from "../../components/info/ErroGen.jsx";
import InfoGen from "../../components/info/InfoGen.jsx";
import PaginationButtons from "../../components/pagination/PaginationButtons.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import { useAuth } from "../../hooks/useAuth";

function VisualizarListaFormularios() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Lógica de Permissão
  const EDITORES_PERMITIDOS = [8, 43, 17, 13, 15, 40];
  const podeEditar = EDITORES_PERMITIDOS.includes(Number(user?.profissionalId));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [selectedTipos, setSelectedTipos] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(2); // Igual ao original

  // 1. Carregamento
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

  // Ação de Visualizar
  const handlePreview = (form) => {
    const id = form?.id ?? form?.formulario_id ?? form?.formId;
    if (!id) return;
    navigate(`/forms-terapeuta/visualizar-formulario/${id}`);
  };

  const getTitulo = (f) => f?.nome_formulario ?? f?.titulo ?? f?.nomeEscala ?? `Formulário ${f?.id ?? ""}`;
  const getTipo = (f) => f?.tipo_formulario ?? f?.tipo ?? "-";

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      {/* Container com Gradiente Apollo */}
      <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* Card Branco Principal */}
        <div className="bg-white h-full rounded-xl flex flex-col gap-6 xl:shadow-md w-full md:p-8 p-4 overflow-y-auto relative pb-16">
          
          <h1 className="font-extrabold text-3xl md:text-4xl text-center md:text-left flex items-center gap-2">
            👁️ Visualizar Formulários
          </h1>

          <div className="flex items-end justify-between gap-6">
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-semibold">Filtrar por tipo de formulário</label>
              <MultiSelect
                options={tipoOptions}
                value={selectedTipos}
                onChange={setSelectedTipos}
                placeholder="Selecione um ou mais tipos"
                className="text-sm cursor-pointer"
              />
            </div>
            {podeEditar && (
                <button 
                onClick={() => navigate('/forms-terapeuta/editar-formulario')}
                className="bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2 flex-1 md:flex-none"
                >
                📝 Ir para Edição
                </button>
            )}
            <button 
              onClick={() => navigate('/forms-terapeuta/tela-inicial')}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer"
            >
              Voltar ao Painel
            </button>
          </div>

          {loading && <div className="text-center text-apollo-200">⏳ Carregando formulários...</div>}
          
          {!!error && !loading && <ErroGen mensagem={error} />}

          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredForms?.length ? (
                pageItems.map((f) => (
                  <div
                    key={f?.id ?? Math.random()}
                    className="border border-gray-200 rounded-xl p-4 bg-white shadow hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 className="font-bold text-lg line-clamp-2">{getTitulo(f)}</h2>
                      <p className="text-xs text-apollo-200/80">Tipo: {getTipo(f)}</p>
                    </div>
                    
                    {/* Botão de Ação - Mesma cor do Apollo, ícone de olho */}
                    <button
                      onClick={() => handlePreview(f)}
                      className="mt-4 w-full py-2 px-3 rounded-lg bg-apollo-200 text-white font-semibold hover:bg-apollo-300 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Abrir Visualização</span>
                    </button>
                  </div>
                ))
              ) : (
                <InfoGen mensagem="Nenhum formulário encontrado com os filtros selecionados." />
              )}
            </div>
          )}

          {!loading && !error && filteredForms?.length > 0 && (
            <PaginationButtons
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default VisualizarListaFormularios;