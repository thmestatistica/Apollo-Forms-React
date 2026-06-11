import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth"; // Importe useRef
import { enviar_upload_arquivo } from "../../api/forms/upload_utils";
import axiosInstance from "../../api/axiosInstance";
import SingleSelect from "../../components/input/SingleSelect";
import { ChevronLeftIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import LoadingGen from "../../components/info/LoadingGen";
import Swal from "sweetalert2";

/**
 * Página de Upload de Arquivos para o Terapeuta.
 * Permite selecionar um paciente, categoria, subcategoria e realizar o upload para o Google Drive.
 */
const UploadArquivos = () => {
  const { user } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true); // Novo estado para carregamento inicial de pacientes
  const [loadingUpload, setLoadingUpload] = useState(false); // Estado para o upload do arquivo
  const fileInputRef = useRef(null); // Ref para o input de arquivo

  const [formData, setFormData] = useState({
    pacienteId: "",
    categoria: "",
    subCategoria: "",
    arquivo: [],
  });

  // Opções para categorias e subcategorias conforme a hierarquia de pastas do Drive
  const categoriasOptions = [
    { value: "Robótica", label: "Robótica" },
    { value: "Exames", label: "Exames" },
    { value: "Tecnologia", label: "Tecnologia" },
    { value: "Fotos/Registros", label: "Fotos/Registros" },
    { value: "Outros", label: "Outros" },
  ];

  const subCategoriasMap = {
    Robótica: [
      { value: "C-Mill", label: "C-Mill" },
      { value: "Armeo", label: "Armeo" },
      { value: "Lokomat", label: "Lokomat" },
    ],
    Tecnologia: [
      { value: "Baiobit", label: "Baiobit"}
    ]
  };

  // Carrega a lista de pacientes para o SelectBox
  useEffect(() => {
    const carregarPacientes = async () => {
      setLoadingPatients(true);
      try {
        const { data } = await axiosInstance.get("/pacientes");
        const listaFormatada = data.map((p) => ({
          value: p.id,
          label: p.nome,
        }));
        setPacientes(listaFormatada);
      } catch (err) {
        console.error("Erro ao carregar lista de pacientes:", err);
      } finally { // Garante que o loading seja desativado, mesmo em caso de erro
        setLoadingPatients(false);
      }
    };

    carregarPacientes();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();

    if (formData.arquivo.length === 0 || !formData.pacienteId) {
      Swal.fire("Atenção", "Selecione o paciente e o arquivo antes de continuar.", "warning");
      return;
    }

    setLoadingUpload(true); // Ativa o loading para o upload
    const uploadPromises = formData.arquivo.map(async (file) => {
      const resultado = await enviar_upload_arquivo(file, {
        pacienteId: formData.pacienteId,
        profissionalId: user?.profissionalId, // Obtido do contexto de autenticação
        categoria: formData.categoria,
        subCategoria: formData.subCategoria,
      });
      return { file, ok: resultado.ok, error: resultado.error };
    });

    const results = await Promise.all(uploadPromises);
    setLoadingUpload(false); // Desativa o loading após o upload

    const successfulUploads = results.filter(res => res.ok);
    const failedUploads = results.filter(res => !res.ok);

    if (successfulUploads.length > 0 && failedUploads.length === 0) {
      Swal.fire("Sucesso!", `${successfulUploads.length} arquivo(s) enviado(s) e organizado(s) no Drive.`, "success");
      setFormData({ pacienteId: "", categoria: "", subCategoria: "", arquivo: [] });
      // Reinicia o input de arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else if (successfulUploads.length > 0 && failedUploads.length > 0) {
      const failedNames = failedUploads.map(res => res.file.name).join(", ");
      Swal.fire(
        "Sucesso Parcial",
        `${successfulUploads.length} arquivo(s) enviado(s). Falha ao enviar: ${failedNames}.`,
        "warning"
      );
      setFormData({ pacienteId: "", categoria: "", subCategoria: "", arquivo: [] });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      Swal.fire(
        "Erro",
        "Não foi possível completar o upload de nenhum arquivo. Verifique sua conexão e tente novamente.",
        "error"
      );
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 8) {
      Swal.fire("Atenção", "Você pode selecionar no máximo 8 arquivos por vez.", "warning");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFormData({ ...formData, arquivo: [] });
      return;
    }
    setFormData({ ...formData, arquivo: selectedFiles });
  };

  const removeFile = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      arquivo: prev.arquivo.filter((_, index) => index !== indexToRemove)
    }));
    if (formData.arquivo.length === 1 && fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Exibe o LoadingGen em tela cheia enquanto os pacientes estão sendo carregados
  if (loadingPatients) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-linear-to-tr from-apollo-300 to-apollo-400">
        <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
          <div className="bg-white w-full min-h-[75dvh] rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
              <LoadingGen mensagem="Carregando lista de pacientes..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
      <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
        <div className="bg-white w-full min-h-[85dvh] rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
          
          {/* Cabeçalho Unificado */}
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-gray-100 pb-6 gap-6 shrink-0">
            <div className="flex flex-col items-center md:items-start">
              <h1 className="font-extrabold text-3xl md:text-4xl text-gray-800 flex items-center gap-3 animate-fade-in-down">
                <span>📤</span>
                <span className="bg-clip-text text-transparent bg-linear-to-r from-gray-800 to-gray-500">Upload de Documentos</span>
              </h1>
              <p className="text-gray-400 mt-2 text-sm md:text-base hidden md:block">
                Selecione o paciente e organize os arquivos por categorias.
              </p>
            </div>
            
            <button 
              onClick={() => window.history.back()}
              className="bg-white border border-red-100 text-red-500 font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm hover:bg-red-50 hover:border-red-200 active:scale-95 flex items-center gap-2 text-sm cursor-pointer"
            >
              <ChevronLeftIcon className="w-5 h-5" /> Voltar
            </button>
          </div>

          <div className="mt-8 w-full flex-1 animate-fade-in">
            <form onSubmit={handleUpload} className="flex flex-col mx-auto w-full gap-8 bg-gray-50/50 p-6 md:p-10 rounded-3xl border border-gray-100 h-fit">
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">Paciente Destinatário</label>
                  <SingleSelect
                    options={pacientes}
                    value={pacientes.find(p => p.value === formData.pacienteId) || null}
                    onChange={(opt) => setFormData({ ...formData, pacienteId: opt?.value || "" })}
                    placeholder="Pesquise o paciente..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">Categoria</label>
                    <SingleSelect
                      options={categoriasOptions}
                      value={categoriasOptions.find(c => c.value === formData.categoria) || null}
                      onChange={(opt) => setFormData({ ...formData, categoria: opt?.value || "", subCategoria: "" })}
                      placeholder="Selecione..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">Subcategoria (Opcional)</label>
                    <SingleSelect
                      options={subCategoriasMap[formData.categoria] || []}
                      value={(subCategoriasMap[formData.categoria] || []).find(s => s.value === formData.subCategoria) || null}
                      onChange={(opt) => setFormData({ ...formData, subCategoria: opt?.value || "" })}
                      placeholder="Selecione..."
                      disabled={!formData.categoria}
                    />
                  </div>
                </div>
              </div>

            <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-gray-400 uppercase ml-1 tracking-wider">Arquivo</label>
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef} // Atribui a ref ao input
                    multiple // Permite múltiplos arquivos
                    onChange={handleFileChange}
                    className="block w-full min-h-[120px] text-sm text-gray-500 border-2 border-dashed border-gray-200 rounded-xl p-8 bg-white hover:border-apollo-200 transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-apollo-50 file:text-apollo-600 hover:file:bg-apollo-100 cursor-pointer"
                  />
                  {formData.arquivo.length > 0 && (
                    <div className="absolute top-2 right-2 flex flex-col gap-1 bg-white p-2 rounded-lg shadow-md text-sm text-gray-700 max-h-[100px] overflow-y-auto">
                      {formData.arquivo.map((file, index) => (
                        <div key={index} className="flex items-center justify-between gap-2">
                          <span className="truncate max-w-[150px]">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
                            title={`Remover ${file.name}`}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            </div>
            <button
                type="submit"
                className="w-full bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-apollo-200/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer text-lg"
                disabled={loadingUpload}
            >
                {loadingUpload ? <span className="animate-spin h-6 w-6 border-2 border-white border-t-transparent rounded-full"></span> : <CloudArrowUpIcon className="w-7 h-7" />}
                {loadingUpload ? "Processando..." : "Enviar para o Drive"}
            </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadArquivos;