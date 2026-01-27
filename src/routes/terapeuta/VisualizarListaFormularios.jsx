import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  EyeIcon, 
  ChevronLeftIcon, 
  MagnifyingGlassIcon, 
  PencilSquareIcon,
  ListBulletIcon 
} from '@heroicons/react/24/outline';

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
  const [busca, setBusca] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Inicia com 6 itens para alinhar com a edição
  const [itemsPerPage, setItemsPerPage] = useState(6);

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
    let resultado = forms;

    // --- FILTRO AUTOMÁTICO REMOVIDO CONFORME SOLICITADO ---
    // Agora mostra todos os formulários independente da especialidade do usuário.

    if (selectedTipos?.length) {
      const allowed = new Set(selectedTipos.map((o) => o.value));
      resultado = resultado.filter((f) => allowed.has(f?.tipo_formulario ?? f?.tipo));
    }

    if (busca) {
        resultado = resultado.filter(f => {
            const titulo = f?.nome_formulario ?? f?.titulo ?? f?.nomeEscala ?? "";
            return titulo.toLowerCase().includes(busca.toLowerCase());
        });
    }
    return resultado;
  }, [forms, selectedTipos, busca]);

  // Responsividade
  useEffect(() => {
    const computeItemsPerPage = () => {
      const w = window.innerWidth;
      if (w >= 1024) return 6; 
      if (w >= 640) return 6;  
      return 4;                
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
  const getTipo = (f) => f?.tipo_formulario ?? f?.tipo ?? "Geral";

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-8 bg-gray-100">
      
      {/* CONTAINER PRINCIPAL */}
      <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        
        {/* CARD BRANCO */}
        <div className="bg-white h-full rounded-2xl w-full md:p-10 p-5 overflow-hidden xl:shadow-2xl relative shadow-lg flex flex-col max-w-5xl">
          
          {/* CABEÇALHO */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-100 pb-6 gap-6 shrink-0">
             <div className="flex flex-col items-center md:items-start">
                <h1 className="font-extrabold text-3xl md:text-4xl text-gray-800 line-clamp-1 flex items-center gap-3 animate-fade-in-down">
                    <span>👁️</span> 
                    <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Visualizar Formulários</span>
                </h1>
                <p className="text-gray-400 mt-2 text-sm md:text-base hidden md:block">
                    Acesse e teste os formulários em modo de leitura.
                </p>
             </div>

             <div className="flex flex-wrap gap-3 items-center justify-center w-full md:w-auto">
                
                {/* BOTÃO CORRIGIDO: IR PARA EDIÇÃO */}
                {podeEditar && (
                    <button 
                    onClick={() => navigate('/forms-terapeuta/editar-formulario')}
                    className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm hover:shadow-lg hover:bg-apollo-200 hover:text-white hover:border-apollo-200 hover:-translate-y-1 active:scale-95 text-sm cursor-pointer"
                    >
                    <PencilSquareIcon className="w-5 h-5" /> Ir para Edição
                    </button>
                )}
                
                <button 
                onClick={() => navigate('/forms-terapeuta/tela-inicial')}
                className="bg-white border border-red-100 text-red-500 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm hover:bg-red-50 hover:border-red-200 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
                >
                <ChevronLeftIcon className="w-5 h-5" /> Voltar
                </button>
             </div>
          </div>

          <div className="animate-fade-in flex flex-col flex-1 overflow-hidden mt-6">
            
            {/* BARRA DE FILTROS */}
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 pb-2 bg-gray-50/30 p-6 rounded-2xl border border-gray-100 mb-6 shrink-0">
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                    <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1">Filtrar por Tipo</label>
                    <MultiSelect
                        options={tipoOptions}
                        value={selectedTipos}
                        onChange={setSelectedTipos}
                        placeholder="Selecione os tipos..."
                        className="text-sm cursor-pointer shadow-sm hover:shadow transition-shadow"
                    />
                </div>
                <div className="flex flex-col gap-2 w-full md:w-1/2">
                    <label className="text-xs font-bold text-gray-400 tracking-widest uppercase ml-1">Buscar Formulário</label>
                    <div className="relative group">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-3 text-gray-400 group-hover:text-apollo-400 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Digite o nome..." 
                            className="pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl w-full outline-none focus:border-apollo-300 focus:bg-white bg-white text-sm transition-all font-medium text-gray-700 placeholder-gray-400 shadow-sm" 
                            value={busca} 
                            onChange={e => setBusca(e.target.value)} 
                        />
                    </div>
                </div>
            </div>

            {loading && <LoadingGen mensagem="Carregando formulários..." />}
            
            {!!error && !loading && <ErroGen mensagem={error} />}

            {/* GRID DE CARDS */}
            {!loading && !error && (
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar p-1 pb-10">
                   {pageItems.length === 0 ? (
                       <InfoGen mensagem="Nenhum formulário encontrado." />
                   ) : (
                       <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 content-start">
                           {pageItems.map((f) => (
                               <div
                                   key={f?.id ?? Math.random()}
                                   onClick={() => handlePreview(f)}
                                   className="group relative bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-apollo-300 hover:ring-1 hover:ring-apollo-300 transition-all duration-300 cursor-pointer flex flex-col justify-between h-48 overflow-hidden transform hover:-translate-y-1"
                               >
                                   {/* Decorator Fundo */}
                                   <div className="absolute top-0 right-0 w-24 h-24 bg-linear-to-bl from-apollo-50 to-transparent -mr-8 -mt-8 rounded-full group-hover:from-apollo-100 transition-all duration-500"></div>

                                   <div className="z-10 relative">
                                       <span className="inline-block px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-bold rounded-lg border border-gray-100 uppercase tracking-wide group-hover:bg-apollo-50 group-hover:text-apollo-600 group-hover:border-apollo-100 transition-colors">
                                           {getTipo(f)}
                                       </span>
                                       <h3 className="font-bold text-lg text-gray-800 leading-snug line-clamp-2 mt-4 group-hover:text-apollo-600 transition-colors">
                                           {getTitulo(f)}
                                       </h3>
                                   </div>
                                   
                                   {/* Botão Card */}
                                   <div className="mt-auto w-full py-2.5 rounded-xl bg-gray-50 text-gray-600 font-bold text-center text-xs border border-gray-100 group-hover:bg-apollo-200 group-hover:text-white group-hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 z-10 shadow-sm">
                                       <span>Abrir Visualização</span> <EyeIcon className="w-4 h-4" />
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
                </div>
            )}

            {!loading && !error && filteredForms.length > 0 && (
                <div className="mt-auto pt-6 border-t border-gray-100 shrink-0">
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
    </div>
  );
}

export default VisualizarListaFormularios;