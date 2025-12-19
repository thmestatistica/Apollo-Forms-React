import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MultiSelect from "../../components/input/MultiSelect.jsx";
import { listar_formularios } from "../../api/forms/forms_utils";
import ErroGen from "../../components/info/ErroGen.jsx";
import InfoGen from "../../components/info/InfoGen.jsx";
import PaginationButtons from "../../components/pagination/PaginationButtons.jsx";

function EditarFormulario() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forms, setForms] = useState([]);
  const [selectedTipos, setSelectedTipos] = useState([]); // [{value,label}]
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(2); // small: 1x2 => 2

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      setError("");
      const data = await listar_formularios();
      if (!isMounted) return;
      setForms(Array.isArray(data) ? data : []);
      setLoading(false);
    })().catch((e) => {
      if (!isMounted) return;
      setError("Falha ao carregar formulários.");
      setLoading(false);
      console.error(e);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Monta opções únicas de tipo_formulario
  const tipoOptions = useMemo(() => {
    const set = new Map();
    for (const f of forms) {
      const t = f?.tipo_formulario ?? f?.tipo ?? null;
      if (!t) continue;
      if (!set.has(t)) set.set(t, { value: t, label: String(t) });
    }
    return Array.from(set.values());
  }, [forms]);

  const filteredForms = useMemo(() => {
    if (!selectedTipos?.length) return forms;
    const allowed = new Set(selectedTipos.map((o) => o.value));
    return forms.filter((f) => allowed.has(f?.tipo_formulario ?? f?.tipo));
  }, [forms, selectedTipos]);

  // Responsivo: define itens por página conforme largura
  useEffect(() => {
    const computeItemsPerPage = () => {
      const w = window.innerWidth;
      // Tailwind breakpoints: sm=640, md=768, lg=1024
      if (w >= 1024) return 9; // 3 cols x 3 rows
      if (w >= 640) return 6; // 2 cols x 3 rows
      return 3; // 1 col x 3 rows
    };

    const update = () => {
      const ipp = computeItemsPerPage();
      setItemsPerPage((prev) => {
        if (prev !== ipp) return ipp;
        return prev;
      });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Paginação: calcula páginas totais e fatia os itens exibidos
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((filteredForms?.length || 0) / itemsPerPage));
  }, [filteredForms, itemsPerPage]);

  // Garante currentPage válido quando filtros ou itens por página mudam
  useEffect(() => {
    setCurrentPage((prev) => {
      if (prev > totalPages) return totalPages;
      if (prev < 1) return 1;
      return prev;
    });
  }, [totalPages]);

  const pageStart = (currentPage - 1) * itemsPerPage;
  const pageItems = filteredForms.slice(pageStart, pageStart + itemsPerPage);

  const handleEdit = (form) => {
    const id = form?.id ?? form?.formulario_id ?? form?.formId;
    if (!id) return;
    navigate(`/forms-terapeuta/editar-formulario/${id}`);
  };

  const getTitulo = (f) => f?.nome_formulario ?? f?.titulo ?? f?.nomeEscala ?? f?.formulario_nome ?? `Formulário ${f?.id ?? ""}`;

  const getTipo = (f) => f?.tipo_formulario ?? f?.tipo ?? "-";

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8">
      <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        <div className="bg-white h-full rounded-xl flex flex-col gap-6 xl:shadow-md w-full md:p-8 p-4 overflow-y-auto relative pb-16">
          <h1 className="font-extrabold text-3xl md:text-4xl text-center md:text-left">
            ✍️ Editar Formulário
          </h1>

          {/* Filtro por Tipo */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">Filtrar por tipo de formulário</label>
            <MultiSelect
              options={tipoOptions}
              value={selectedTipos}
              onChange={setSelectedTipos}
              placeholder="Selecione um ou mais tipos"
              className="text-sm"
            />
          </div>

          {/* Status de carregamento/erro */}
          {loading && (
            <div className="text-center text-apollo-200">⏳ Carregando formulários...</div>
          )}
          {!!error && !loading && (
            <ErroGen mensagem={error} />
          )}

          {/* Cards de formulários */}
          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredForms?.length ? (
                pageItems.map((f) => (
                  <div
                    key={f?.id ?? f?.formulario_id ?? Math.random()}
                    className="border rounded-xl p-4 bg-white shadow hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 className="font-bold text-lg line-clamp-2">{getTitulo(f)}</h2>
                      <p className="text-xs text-apollo-200/80">Tipo: {getTipo(f)}</p>
                    </div>
                    <button
                      onClick={() => handleEdit(f)}
                      className="mt-4 w-full py-2 px-3 rounded-lg bg-apollo-200 text-white font-semibold hover:bg-apollo-300 active:scale-[0.99]"
                    >
                      ✍️ Editar
                    </button>
                  </div>
                ))
              ) : (
                <InfoGen mensagem="Nenhum formulário encontrado com os filtros selecionados." />
              )}
            </div>
          )}
          {/* Paginação */}
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

export default EditarFormulario;