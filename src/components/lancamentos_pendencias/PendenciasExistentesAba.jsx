import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Hooks e componentes compartilhados do app
import { useAuth } from "../../hooks/useAuth";

import LoadingGen from "../info/LoadingGen";
import ErroGen from "../info/ErroGen";

import { formatarData } from "../../utils/format/formatar_utils";

import { buscar_pendencias_profissional_status } from "../../api/pendencias/pendencias_utils";

import LancamentoCard from "./LancamentoCard";

// Status alvo que identifica pendências que já foram aplicadas, mas ainda não lançadas
const STATUS_ALVO = "APLICADO_NAO_LANCADO";

/**
 * Normaliza uma pendência recebida da API para a forma usada pela UI.
 * Ajusta nomes, identifica fallback de ids e normaliza datas para ISO.
 * Mantemos o objeto original em `raw` para acesso a campos pouco usados.
 */
const normalizarPendencia = (item) => {
  const pacienteNome = item.paciente?.nome ?? '-';
  const formularioId = item.formularioId ?? null;
  const formularioNome = item.formulario?.nomeEscala ?? '-';
  const fallbackId = item.id;

  // Ajuste simples de timezone/local — o código original subtrai 3 horas.
  let dataUpdate = item.updatedAt ? new Date(item.updatedAt) : null;
  if (dataUpdate) {
    dataUpdate.setHours(dataUpdate.getHours() - 3);
  }

  return {
    id: fallbackId,
    pacienteNome,
    formularioId,
    formularioNome,
    pacienteId: item.pacienteId ?? null,
    agendamentoId: item?.agendamentoId ?? null,
    especialidade: item.especialidade ?? null,
    status: item?.status ?? STATUS_ALVO,
    data_referencia: item?.data_referencia ?? null,
    data_update: dataUpdate ? dataUpdate.toISOString() : item.updatedAt ?? null,
    raw: item,
  };
};

export default function PendenciasExistentesAba() {
  // Usuário autenticado e navegação/rota
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados locais: lista de pendências, loading e mensagem de erro
  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  
  // Filtro de paciente e paginação
  const [filtroPaciente, setFiltroPaciente] = useState("TODOS");
  const [paginaAtual, setPaginaAtual] = useState(1);
  
  // Controle de quantos cards mostramos por página (ajustável)
  const PAGE_SIZE = 8; 

  /**
   * Carrega pendências do profissional (filtradas por status definido acima).
   * Faz validações simples (profissionalId presente) e trata erros.
   */
  const carregarPendencias = useCallback(async () => {
    const profissionalId = user?.profissionalId ?? user?.id ?? user?.usuarioId;
    
    if (!profissionalId) {
      // Caso o usuário não tenha identificação profissional, não tentamos a API
      setPendencias([]);
      setErro("Perfil sem identificação profissional.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const lista = await buscar_pendencias_profissional_status(profissionalId, [STATUS_ALVO]);
      setPendencias(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("Erro ao carregar pendencias:", err);
      setErro("Falha ao carregar pendências aplicadas.");
      setPendencias([]);
    } finally {
      setLoading(false);
    }
  }, [user?.profissionalId, user?.id, user?.usuarioId]);

  useEffect(() => {
    carregarPendencias();
  }, [carregarPendencias]);

  useEffect(() => {
    const { formSuccess, formTitulo, refreshPendencias } = location.state || {};
    // Verifica se o usuário veio de um formulário recém-salvo e mostra aviso
    const verificarAvisos = async () => {
      if (formSuccess) {
        await Swal.fire({
          icon: "success",
          title: "Lançamento concluído!",
          text: formTitulo ? `${formTitulo} foi salvo corretamente.` : "As respostas foram salvas corretamente.",
          confirmButtonColor: "#7C3AED",
        });
      }

      // Se for para atualizar, recarrega as pendências e limpa o state da rota
      if (formSuccess || refreshPendencias) {
        await carregarPendencias();
        navigate(location.pathname, { replace: true, state: {} }); 
      }
    };

    verificarAvisos();
  }, [location.state, location.pathname, navigate, carregarPendencias]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroPaciente, pendencias.length]);

  // Prepara e ordena pendências pela data de atualização (mais recentes primeiro)
  const pendenciasOrdenadas = useMemo(() => {
    const normalizadas = (pendencias || []).map(normalizarPendencia);
    return normalizadas.sort((a, b) => {
      const da = a?.data_update ? new Date(a.data_update).getTime() : Number.POSITIVE_INFINITY;
      const db = b?.data_update ? new Date(b.data_update).getTime() : Number.POSITIVE_INFINITY;
      return db - da;
    });
  }, [pendencias]);

  // Gera lista única de pacientes para o filtro (ordenada alfabeticamente)
  const listaPacientes = useMemo(() => {
    const nomes = pendenciasOrdenadas
      .map((item) => item.pacienteNome)
      .filter(Boolean)
      .map((nome) => String(nome).trim())
      .filter((nome) => nome.length > 0);

    return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b));
  }, [pendenciasOrdenadas]);

  // Aplica o filtro selecionado (paciente) sobre as pendências já ordenadas
  const pendenciasFiltradas = useMemo(() => {
    if (filtroPaciente === "TODOS") return pendenciasOrdenadas;
    return pendenciasOrdenadas.filter((item) => item.pacienteNome === filtroPaciente);
  }, [pendenciasOrdenadas, filtroPaciente]);

  const totalPaginas = Math.max(1, Math.ceil(pendenciasFiltradas.length / PAGE_SIZE));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaSegura - 1) * PAGE_SIZE;
  const pendenciasPaginadas = pendenciasFiltradas.slice(inicio, inicio + PAGE_SIZE);
  
  const handleAbrirFormulario = (item) => {
    if (!item.formularioId) {
      Swal.fire({
        icon: "error",
        title: "Formulário indisponível",
        text: "Não foi possível identificar o formulário desta pendência.",
      });
      return;
    }

    // Monta um objeto usado pela tela de formulário para preencher contexto
    const pendenciaParaFormulario = {
      Paciente: item.pacienteNome,
      PacienteID: item.pacienteId ?? null,
      AgendamentoID: item.agendamentoId ?? null,
      ProfissionalEspecialidade: item.especialidade ?? null,
      Data: item.data_update ? formatarData(item.data_update) : null,
    };

    // Navega até o formulário passando estado para retorno e refresh
    navigate(`/forms-terapeuta/formulario/escala/${item.formularioId}`, {
      state: {
        pendencia: pendenciaParaFormulario,
        pendenciaEscala: item.raw,
        formTitulo: item.formularioNome,
        returnTo: "/forms-terapeuta/lancamentos-pendencias",
        refreshPendencias: true,
      },
    });
  };

  if (loading) return <LoadingGen mensagem="Carregando pendências aplicadas..." primaryColor="#ffffff" secondaryColor="#ffffff" messageColor="text-apollo-100" />;

  return (
    <div className="flex flex-col gap-6">
        {/* Cabeçalho de Filtros */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
                 <h2 className="text-lg font-bold text-gray-700">Pendências para Lançamento</h2>
                 <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                    {pendenciasFiltradas.length} total
                 </span>
            </div>

            <div className="w-full lg:w-64">
                <select
                id="filtro-paciente"
                value={filtroPaciente}
                onChange={(event) => setFiltroPaciente(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-apollo-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-apollo-300 focus:border-apollo-300 cursor-pointer"
                >
                    <option value="TODOS">Todos os pacientes</option>
                    {listaPacientes.map((nome) => (
                        <option key={nome} value={nome}>
                        {nome}
                        </option>
                    ))}
                </select>
            </div>
        </div>

        {/* Lista de Cards */}
        <div className="flex-1 min-h-[400px]">
            {/* Mesagem de Erro */}
            {erro && <ErroGen erro={erro} />}

            {/* Mensagem de Não Encontrada Nenhuma Pendência */}
            {!erro && pendenciasFiltradas.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500">
                     <span className="text-4xl mb-3">📂</span>
                     <p className="font-medium">Nenhuma pendência aplicada para lançamento encontrada.</p>
                </div>
            )}
            
            {/* Card's de Lançamento */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendenciasPaginadas.map((item) => (
                    <LancamentoCard 
                        key={item.id} 
                        item={item} 
                        handleAbrirFormulario={handleAbrirFormulario} 
                    />
                ))}
            </div>
        </div>
        
        {/* Paginação */}
        {pendenciasFiltradas.length > PAGE_SIZE && (
            <div className="mt-4 pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs font-medium text-gray-500">
                    Mostrando <span className="text-gray-900">{inicio + 1}</span> a <span className="text-gray-900">{Math.min(inicio + PAGE_SIZE, pendenciasFiltradas.length)}</span> de <span className="text-gray-900">{pendenciasFiltradas.length}</span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                        disabled={paginaSegura === 1}
                        className="px-3 py-1.5 rounded border border-gray-300 text-apollo-200 text-xs font-bold bg-white hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    >
                        Anterior
                    </button>
                    <div className="flex items-center gap-1 mx-1">
                        <span className="text-xs font-bold text-gray-800">{paginaSegura}</span>
                        <span className="text-xs text-gray-500">/ {totalPaginas}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                        disabled={paginaSegura === totalPaginas}
                        className="px-3 py-1.5 rounded border border-gray-300 text-apollo-200 text-xs font-bold bg-white hover:bg-gray-50 disabled:opacity-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        )}
    </div>
  );
}