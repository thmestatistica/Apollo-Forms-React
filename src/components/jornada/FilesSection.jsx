import React, { useState, useEffect, useMemo } from "react";

import { DocumentIcon, ArrowPathIcon, ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";

import { listar_arquivos_paciente } from "../../api/forms/upload_utils";

import LoadingGen from "../info/LoadingGen";
import InfoGen from "../info/InfoGen";
import Pagination from "./Pagination";
import SingleSelect from "../input/SingleSelect";

const FilesSection = ({ pacienteId, profissionais }) => {
  const [arquivos, setArquivos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filtroCategoria, setFiltroCategoria] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const carregarArquivos = async () => {
    if (!pacienteId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listar_arquivos_paciente(pacienteId);
      if (res.ok) {
        setArquivos(res.data || []);
      } else {
        setError("Não foi possível carregar a lista de arquivos.");
      }
    } catch (err) {
      console.error("Erro ao carregar arquivos:", err);
      setError("Erro de conexão ao buscar arquivos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarArquivos();
    setFiltroCategoria("");
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pacienteId]);

  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set(arquivos.map(a => a.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [arquivos]);

  const optionsCategorias = useMemo(() => [
    { value: "", label: "Todas Categorias" },
    ...categoriasDisponiveis.map(cat => ({ value: cat, label: cat }))
  ], [categoriasDisponiveis]);

  const arquivosFiltrados = arquivos.filter(a => {
    return !filtroCategoria || a.categoria === filtroCategoria;
  });

  const totalPages = Math.ceil(arquivosFiltrados.length / itemsPerPage);

  const arquivosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return arquivosFiltrados.slice(start, start + itemsPerPage);
  }, [arquivosFiltrados, currentPage]);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-1">
          <div className="p-2 bg-apollo-50 rounded-xl">
            <p className="text-3xl font-bold text-apollo-400 uppercase tracking-widest">
                🗂️
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Arquivos e Documentos</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filtro Categoria */}
          <div className="w-full md:w-64">
            <SingleSelect
              options={optionsCategorias}
              value={optionsCategorias.find(c => c.value === filtroCategoria) || optionsCategorias[0]}
              onChange={(opt) => {
                setFiltroCategoria(opt?.value || "");
                setCurrentPage(1);
              }}
              placeholder="Filtrar por categoria..."
            />
          </div>

          <button
            onClick={carregarArquivos}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-apollo-400 hover:border-apollo-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <div className="py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
          <LoadingGen mensagem="Consultando arquivos no Google Drive..." />
        </div>
      ) : error ? (
        <div className="py-8"><InfoGen message={error} /></div>
      ) : arquivosFiltrados.length === 0 ? (
        <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center bg-gray-50/30">
          <DocumentIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-400 font-bold text-sm">Nenhum documento encontrado.</p>
          <p className="text-gray-300 text-xs mt-1">Realize o upload de novos arquivos na seção de Upload.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {arquivosPaginados.map((arquivo, index) => {
            return (
              <div key={arquivo.id || `file-${index}`} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-apollo-200 transition-all flex flex-col overflow-hidden">
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex flex-col min-w-0 mb-2">
                    <span className="text-[10px] font-extrabold text-apollo-400 uppercase tracking-widest truncate">
                      {arquivo.categoria} {arquivo.sub_categoria && `• ${arquivo.sub_categoria}`}
                    </span>
                    <h3 className="text-base font-bold text-gray-800 line-clamp-2 mt-1" title={arquivo.nome_arquivo}>
                      {arquivo.nome_arquivo}
                    </h3>
                  </div>
                  
                  <a 
                    href={arquivo.drive_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-apollo-50 text-apollo-600 font-bold text-sm border border-apollo-100 hover:bg-apollo-200 hover:text-white hover:border-transparent transition-all shadow-sm active:scale-95"
                  >
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                    Abrir no Drive
                  </a>
                </div>

                <div className="p-3 bg-gray-50 border-t border-gray-100 mt-auto flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                  <span className="truncate max-w-[120px]">
                    Por: {profissionais?.[arquivo.profissional_id]?.nome || 
                         profissionais?.[arquivo.profissional_id]?.usuario?.nome || 
                         (typeof profissionais?.[arquivo.profissional_id] === 'string' ? profissionais[arquivo.profissional_id] : 'Apollo')
                    }
                  </span>
                  <span>{new Date(arquivo.criado_em).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            );
          })}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination 
                page={currentPage} 
                total={totalPages} 
                setPage={setCurrentPage} 
                count={arquivosFiltrados.length} 
                labelItem="arquivos" 
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FilesSection;