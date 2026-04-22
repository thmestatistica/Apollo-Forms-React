import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useFormContext } from "../../hooks/useFormContext";
import { tipoForms, tipoPorEspecialidade } from "../../config/tipoSlot";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";
import {
  nao_aplicar_pendencia_escala,
  atualizar_status_pendencia_escala,
} from "../../api/pendencias/pendencias_utils.js";
import { listar_formularios } from "../../api/forms/forms_utils.js";

import { formatarData } from "../../utils/format/formatar_utils.js";
import { formatDataVisual } from "../../utils/pendencias/escala_utils";
import { filterEscalasByRange } from "../../utils/pendencias/filterEscalasByProximidade";

import { EQUIPAMENTO_SLOT } from "../../config/variaveisGlobais.js";
import SkeletonGen from "../info/SkeletonGen.jsx";
import InfoGen from "../info/InfoGen.jsx";
import ErroGen from "../info/ErroGen.jsx";
import VazioGen from "../info/VazioGen.jsx";
import SingleSelect from "../input/SingleSelect.jsx";

/**
 * Módulo utilitário: Calcula a diferença em dias entre a data alvo e a data atual (hoje).
 * Retorna valores positivos se a data for no futuro.
 * * @param {string|Date} data - A data de referência a ser comparada.
 * @returns {number} O número de dias de diferença.
 */
const calcularDiferencaDias = (data) => {
  if (!data) return 0;
  const dataRef = new Date(data);
  const hoje = new Date();
  const diffTime = dataRef.getTime() - hoje.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Componente responsável por exibir as pendências de um agendamento específico,
 * permitindo ao terapeuta indicar se alguma escala foi aplicada, selecionar quais,
 * e navegar para o formulário correspondente.
 *
 * @component
 * @param {Object} props - Propriedades do componente.
 * @param {Object} props.penData - Dados da pendência/agendamento.
 * @param {string} props.penData.Paciente - Nome do paciente.
 * @param {string} props.penData.Data - Data da sessão.
 * @param {string} props.penData.Início - Horário inicial da sessão.
 * @param {string} props.penData.Fim - Horário final da sessão.
 * @param {number} props.penData.AgendamentoID - ID único do agendamento.
 * @returns {JSX.Element} O modal de pendência renderizado.
 */
const PenModal = ({ penData }) => {
  // Inicialização da função de navegação do react-router
  const navigate = useNavigate();

  // Desestruturação das funções e estados do contexto global de formulários
  const { closeModal, setPendenciaStatus, pendenciasEscalaStatus } = useFormContext();

  /** ID do agendamento atual (usado como referência primária para vincular as escalas) */
  const agendamentoId = penData["AgendamentoID"];

  // Armazena a lista de escalas que retornam da API
  const [escalasDisponiveis, setEscalasDisponiveis] = useState([]);
  // Indica se a requisição das escalas está em andamento (loading)
  const [loadingEscalas, setLoadingEscalas] = useState(false);
  // Armazena possíveis mensagens de erro na busca das escalas
  const [erroEscalas, setErroEscalas] = useState(null);
  // Estado para controlar o toggle de escalas distantes (> 10 dias)
  const [isToggleDistantesAtivo, setIsToggleDistantesAtivo] = useState(false);

  // Estados para controle de Avaliação vs Evolução
  const [isAvaliacaoDeclarada, setIsAvaliacaoDeclarada] = useState(false);
  const [avaliacaoForms, setAvaliacaoForms] = useState([]);
  const [selectedAvaliacaoForm, setSelectedAvaliacaoForm] = useState(null);
  const [loadingAvaliacao, setLoadingAvaliacao] = useState(false);

  // Carrega lista de avaliações se o usuário declarar que é uma avaliação
  useEffect(() => {
    if (isAvaliacaoDeclarada && avaliacaoForms.length === 0) {
      setLoadingAvaliacao(true);
      listar_formularios()
        .then((data) => {
          const lista = Array.isArray(data) ? data : [];
          // Filtra no frontend apenas os formulários que são do tipo 'Avaliações'
          const avaliacoes = lista.filter((f) => {
             const tipo = String(f.tipo_formulario || "").toUpperCase();

             return tipo.includes("AVALIAÇÕES"); 
          });

          const options = avaliacoes.map((f) => ({
              value: f.formulario_id ?? f.id,
              label: f.nome_formulario ?? f.titulo ?? `Formulário ${f.formulario_id}`,
          }));
          
          setAvaliacaoForms(options);
        })
        .catch((err) => console.error("Erro ao listar avaliações:", err))
        .finally(() => setLoadingAvaliacao(false));
    }
  }, [isAvaliacaoDeclarada, avaliacaoForms.length]);


  // Efeito responsável por buscar as escalas pendentes assim que os dados do agendamento mudam
  useEffect(() => {
    // Extrai os IDs necessários para a busca, utilizando optional chaining e nullish coalescing
    const pacienteId = penData?.["PacienteID"] ?? null;
    const profissionalEspecialidade = penData?.["ProfissionalEspecialidade"] ?? null;

    // Se faltar informação crítica, limpa a lista e aborta a busca
    if (!pacienteId || !profissionalEspecialidade) {
      setEscalasDisponiveis([]);
      return;
    }

    // Flag para evitar atualizações de estado se o componente for desmontado antes da Promise resolver
    let ativo = true;
    
    setLoadingEscalas(true);
    setErroEscalas(null);
    
    // Dispara a requisição à API
    carregar_escalas_pendentes(pacienteId, profissionalEspecialidade)
      .then((lista) => {
        if (ativo) setEscalasDisponiveis(Array.isArray(lista) ? lista : []);
      })
      .catch(() => {
        if (ativo) setErroEscalas("Não foi possível carregar as escalas.");
      })
      .finally(() => {
        if (ativo) setLoadingEscalas(false);
      });

    // Função de limpeza: marca a flag 'ativo' como falsa ao desmontar o componente
    return () => {
      ativo = false;
    };
  }, [penData]);
  
  // Clona as escalas garantindo que seja um array e filtra no range (15 dias para trás e 7 para frente)
  const rawOptions = Array.isArray(escalasDisponiveis)
    ? filterEscalasByRange(escalasDisponiveis, 15)
    : [];
  
  /**
   * Normaliza as opções para padronizar labels e valores, facilitando a renderização na UI.
   * Por fim, ordena as escalas pela 'data_referencia'.
   */
  const options = rawOptions
    .map((item) => {
      const value = String(item?.formularioId ?? "");
      // Tenta extrair o nome da escala de diferentes propriedades possíveis
      const label =
        item?.label ??
        item?.formulario?.nomeEscala ??
        item?.especialidade ??
        `Escala ${value}`;
      return { ...item, value, label };
    })
    .sort((a, b) => {
      // Ordenação cronológica baseada na data_referencia
      const da = a?.data_referencia ? new Date(a.data_referencia).getTime() : Number.POSITIVE_INFINITY;
      const db = b?.data_referencia ? new Date(b.data_referencia).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  
  /**
   * Obtém a chave única de uma pendência para uso no controle de estado via Contexto.
   * @param {Object} escala - Objeto da escala atual.
   * @returns {string} Chave formatada.
   */
  const getPendenciaKey = (escala) =>
    String(
      escala?.id ??
        escala?.pendenciaId ??
        escala?.pendenciaEscalaId ??
        ""
    );

  // Armazena o mapeamento de status oriundo do contexto global
  const statusPorPendencia =
    pendenciasEscalaStatus && typeof pendenciasEscalaStatus === "object"
      ? pendenciasEscalaStatus
      : {};

  /**
   * Converte a string de status interno (API/Estado) para um texto amigável (Label).
   * @param {string} status - Status interno.
   * @returns {string|null} Label formatado ou null se não houver correspondência.
   */
  const getStatusLabel = (status) => {
    switch (status) {
      case "PREENCHIDA": return "Preenchida";
      case "NAO_APLICA": return "Não aplicável";
      case "NAO_FEITO": return "Não feito";
      case "APLICADO_NAO_LANCADO": return "Aplicado, não lançado";
      case "ABERTA": return "Em aberto";
      default: return null;
    }
  };

  /**
   * Retorna classes Tailwind específicas para estilizar a tag de exibição dependendo do status atual.
   * @param {string} status - Status da escala.
   * @returns {string} Classes CSS (Tailwind).
   */
  const getStatusClass = (status) => {
    switch (status) {
      case "PREENCHIDA": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "NAO_APLICA": return "bg-slate-100 text-slate-600 border-slate-200";
      case "NAO_FEITO": return "bg-gray-100 text-gray-700 border-gray-300";
      case "APLICADO_NAO_LANCADO": return "bg-amber-50 text-amber-700 border-amber-200";
      case "ABERTA": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "";
    }
  };

  /**
   * Descobre qual o status efetivo da escala, priorizando o status modificado no Contexto
   * em relação ao status original vindo do banco/API.
   * @param {Object} escala - Objeto da escala.
   * @returns {string|null} Status real a ser aplicado.
   */
  const getEffectiveStatus = (escala) => {
    const key = getPendenciaKey(escala);
    const fromContext = key ? statusPorPendencia?.[key]?.status : null;
    return fromContext || escala?.status || null;
  };

  // Verifica se o formulário inteiro está bloqueado caso ainda existam pendências ativas
  const hasPendenciasEmAberto = options.some((escala) => {
    const status = getEffectiveStatus(escala);
    return !status || status === "PENDENTE" || status === "ABERTA";
  });

  /**
   * Define o visual de um botão de ação com base em ele ser o status ativo no momento ou não.
   */
  const getActionButtonClass = (currentStatus, targetStatus, baseClass, activeClass) => {
    const isActive = currentStatus === targetStatus;
    return `${baseClass} ${isActive ? activeClass : "opacity-60 hover:opacity-100 shadow-sm"}`;
  };


  /**
   * Lida com a ativação/desativação do toggle que marca escalas distantes como "Não feito".
   * É um switch puramente de front-end (modifica o Contexto local) e reversível.
   * * @param {boolean} checked - Estado atual do checkbox/toggle.
   */
  const handleToggleDistantes = (checked) => {
    const dayDistance = 10; // Define a distância em dias para considerar uma escala como "distante"
    setIsToggleDistantesAtivo(checked);

    options.forEach((escala) => {
      const diffDays = calcularDiferencaDias(escala.data_referencia);
      const key = getPendenciaKey(escala);
      if (!key) return;

      const statusAtual = getEffectiveStatus(escala);

      if (checked) {
        // Se ativou o toggle, a escala está há mais de 10 dias de distância, e ainda está "aberta/pendente"
        if (diffDays > dayDistance && (!statusAtual || statusAtual === "PENDENTE" || statusAtual === "ABERTA")) {
          // Marca a pendência instantaneamente como "Não Feito" via Contexto
          setPendenciaStatus(key, "NAO_FEITO");
        }
      } else {
        // Se desativou o toggle, reverta APENAS as que foram marcadas como "NAO_FEITO" que estão a > 10 dias
        if (diffDays > dayDistance && statusAtual === "NAO_FEITO") {
          // Retorna o status para aberta/pendente
          setPendenciaStatus(key, "ABERTA");
        }
      }
    });
  };

  /**
   * Constrói o payload necessário para as requisições de atualização de uma escala específica,
   * garantindo que IDs do paciente, agendamento e formulário sejam passados corretamente.
   */
  const buildEscalaUpdate = (escala) => ({
    ...escala,
    agendamentoId: penData["AgendamentoID"],
    pacienteId: escala?.pacienteId ?? escala?.paciente?.id ?? penData?.["PacienteID"] ?? null,
    formularioId: escala?.formularioId ?? escala?.formulario?.id ?? null,
  });

  /**
   * Navega até a página de preenchimento do formulário da escala clicada.
   * @param {number} id - ID do formulário.
   * @param {string} tipo_form - Categoria ("Escala" ou "Evolucao").
   * @param {string} titulo - Título do Formulário/Escala.
   * @param {Object} pendenciaEscala - Dados da pendência.
   * @param {boolean} isEvolucao - Flag indicando se a escala se trata de uma evolução médica/clínica.
   */
  const handleNavForm = (id, tipo_form, titulo, pendenciaEscala, isEvolucao = false) => {
    closeModal();
    // Envia o estado completo para a próxima rota, garantindo o contexto da aplicação
    navigate(`/forms-terapeuta/formulario/${tipo_form.toLowerCase()}/${id}`, {
      state: { pendencia: penData, formTitulo: titulo, pendenciaEscala, isEvolucao },
    });
  };

  /**
   * Dispara um alert para confirmação antes de invalidar a necessidade desta escala para o paciente.
   * Interage com o backend via `nao_aplicar_pendencia_escala`.
   */
  const handleNaoAplicar = async (escala) => {
    const result = await Swal.fire({
      title: "Marcar como não aplicável?",
      text: `A escala "${escala.formulario?.nomeEscala || escala.label}" será marcada como não aplicável para este paciente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#bd2121",
      cancelButtonColor: "#817c7c",
      confirmButtonText: "Não se aplica",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const resposta = await nao_aplicar_pendencia_escala(buildEscalaUpdate(escala));
      
      if (!resposta?.ok) {
        await Swal.fire({
          title: "Erro",
          text: "Não foi possível marcar a escala como não aplicável.",
          icon: "error",
          timer: 1800,
          showConfirmButton: false,
        });
        console.error("Erro ao marcar pendência como não aplicável:", resposta?.error);
      } else {
        await Swal.fire({
          title: "Sucesso",
          text: "A escala foi marcada como não aplicável.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        // Atualiza imediatamente a UI no contexto local
        const key = getPendenciaKey(escala);
        if (key) {
          setPendenciaStatus(key, "NAO_APLICA");
        }

        // Realiza um "soft-refresh": recarrega os dados sem fechar o modal
        try {
          setLoadingEscalas(true);
          const pacienteId = penData?.["PacienteID"] ?? null;
          const profissionalEspecialidade = penData?.["ProfissionalEspecialidade"] ?? null;
          const lista = await carregar_escalas_pendentes(pacienteId, profissionalEspecialidade);
          setEscalasDisponiveis(Array.isArray(lista) ? lista : []);
        } catch (err) {
          console.error("Erro ao recarregar escalas após marcação:", err);
        } finally {
          setLoadingEscalas(false);
        }
      }
    }
  };

  /**
   * Marca a pendência momentaneamente na sessão (contexto) como Não Feita, 
   * liberando o acesso ao botão principal de evolução se for o caso.
   */
  const handleNaoFeito = (escala) => {
    const key = getPendenciaKey(escala);
    if (!key) return;
    setPendenciaStatus(key, "NAO_FEITO");
  };

  /**
   * Marca a escala no banco indicando que o profissional a aplicou, mas preencherá 
   * os dados brutos ou a avaliação posteriormente.
   */
  const handleAplicadoNaoLancado = async (escala) => {
    const result = await Swal.fire({
      title: "Tem certeza? Aplicou a escala e lançará depois?",
      text: `A escala "${escala.formulario?.nomeEscala || escala.label}" será marcada como aplicada e não lançada.`,
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#5A2779",
      cancelButtonColor: "#E0AC00",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const resposta = await atualizar_status_pendencia_escala(
      buildEscalaUpdate(escala),
      "APLICADO_NAO_LANCADO"
    );

    if (!resposta?.ok) {
      await Swal.fire({
        title: "Erro",
        text: "Não foi possível atualizar a pendência.",
        icon: "error",
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }

    await Swal.fire({
      title: "Sucesso",
      text: "A pendência foi atualizada.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    // Atualiza o estado da aplicação localmente
    const key = getPendenciaKey(escala);
    if (key) {
      setPendenciaStatus(key, "APLICADO_NAO_LANCADO");
    }
  };

  /**
   * Navega para o formulário base principal do atendimento (Avaliador ou Evolução)
   * detectando automaticamente o ID da configuração baseada na Sigla ou Especialidade.
   */
  const handlePreencherAuto = () => {
    // Se não for declarada explicitamente como avaliação, assume Evolução
    const isAvaliacao = isAvaliacaoDeclarada;

    // Se for avaliação declarada, o formulário deve ter sido selecionado pelo usuário
    if (isAvaliacao && !selectedAvaliacaoForm) {
      Swal.fire({
        id: "avaliacao-nao-selecionada",
        title: "Seleção necessária",
        text: "Por favor, selecione qual formulário de avaliação deseja preencher.",
        icon: "warning",
      });
      return;
    }

    let alvoId = null;
    const sigla = penData?.["Sigla"] || penData?.["Slot"] || penData?.["ProfissionalEspecialidade"] || "";
    const siglaNorm = String(sigla || "").toUpperCase();

    if (isAvaliacao) {
      alvoId = Number(selectedAvaliacaoForm);
    } else {
      // Lógica padrão para Evolução (automática por slot/especialidade)
      const grupo = "Evoluções";
      const mapa = tipoForms?.[grupo] || {};
      const especialidade = penData?.["ProfissionalEspecialidade"] || "";

      // Prioridade 1: Equipamento/Slot específico
      if (EQUIPAMENTO_SLOT.includes(siglaNorm)) {
        for (const [fid, slots] of Object.entries(mapa)) {
          if (!Array.isArray(slots)) continue;
          const slotsUpper = slots.map((s) => String(s).toUpperCase());
          if (slotsUpper.includes(siglaNorm)) {
            const parsed = Number(fid);
            if (Number.isFinite(parsed)) alvoId = parsed;
            break;
          }
        }
      } 
      
      // Prioridade 2: Especialidade genérica (se não achou por slot)
      if (alvoId === null) {
        const idPorEsp = tipoPorEspecialidade?.[especialidade]?.[grupo] ?? null;
        if (idPorEsp != null) {
          const parsed = Number(idPorEsp);
          if (Number.isFinite(parsed)) {
            alvoId = parsed;
          }
        }
      }

      if (alvoId === null) {
        Swal.fire("Erro", "Nenhum formulário de evolução configurado para este atendimento/slot.", "error");
        return;
      }
    }

    const titulo = `${isAvaliacao ? "Avaliação" : "Evolução"} ${sigla}`.trim();
    // O backend/frontend espera 'Avaliacao' ou 'Evolucao' (sem acento/cedilha)
    const tipoParam = isAvaliacao ? "Avaliacao" : "Evolucao"; 
    
    // isEvolucao é o inverso de isAvaliacao
    handleNavForm(alvoId, tipoParam, titulo, { id: null, agendamentoId, pacienteId: null }, !isAvaliacao);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Título do modal */}
      <h2 className="font-bold text-2xl text-apollo-200 tracking-tight">Pendências do Agendamento</h2>


      {/* Grid com as informações principais descritivas do agendamento vindo da props `penData` */}
      <div className="grid md:grid-cols-2 gap-3 p-4 bg-apollo-100 rounded-xl border border-apollo-200/30 shadow-sm text-sm">
        <p><strong className="text-apollo-200 font-semibold mr-1">Paciente:</strong> <span className="text-gray-700">{penData["Paciente"]}</span></p>
        <p><strong className="text-apollo-200 font-semibold mr-1">Data:</strong> <span className="text-gray-700">{penData["Data"]}</span></p>
        <p><strong className="text-apollo-200 font-semibold mr-1">Horário:</strong> <span className="text-gray-700">{penData["Início"]} até {penData["Fim"]}</span></p>
        <p><strong className="text-apollo-200 font-semibold mr-1">ID:</strong> <span className="text-gray-700">{penData["AgendamentoID"]}</span></p>
        <p><strong className="text-apollo-200 font-semibold mr-1">Slot:</strong> <span className="text-gray-700">{penData['Sigla']}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Toggle para declarar Avaliação */}
        <div className="p-4 bg-apollo-200/5 border border-apollo-200/30 hover:bg-apollo-200/10 rounded-xl shadow-sm transition-all duration-300">
          <label className="flex items-center gap-2.5 cursor-pointer w-fit select-none text-apollo-200 font-semibold">
            <input
              type="checkbox"
              className="w-4 h-4 text-apollo-500 rounded border-gray-300 focus:ring-apollo-500 cursor-pointer transition-all"
              checked={isAvaliacaoDeclarada}
              onChange={(e) => {
                setIsAvaliacaoDeclarada(e.target.checked);
                if (!e.target.checked) setSelectedAvaliacaoForm(null);
              }}
            />
            Este atendimento é uma Avaliação?
          </label>
        
          {isAvaliacaoDeclarada && (
            <div className="mt-4 w-full max-w-md animate-fadeIn">
              <SingleSelect
                label="Selecione o Formulário de Avaliação"
                placeholder={loadingAvaliacao ? "Carregando avaliações..." : "Busque pelo nome..."}
                options={avaliacaoForms}
                value={
                  selectedAvaliacaoForm
                    ? avaliacaoForms.find((o) => String(o.value) === String(selectedAvaliacaoForm))
                    : null
                }
                onChange={(opt) => setSelectedAvaliacaoForm(opt?.value || null)}
                isDisabled={loadingAvaliacao}
              />
            </div>
          )}
        </div>
        {/* Checkbox para desmarcar escalas de data distante em lote */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-apollo-200/5 border border-apollo-200/30 transition-colors hover:bg-apollo-200/10">
          <input
            type="checkbox"
            id="toggleDistantes"
            checked={isToggleDistantesAtivo}
            onChange={(e) => handleToggleDistantes(e.target.checked)}
            className="cursor-pointer w-4 h-4 text-apollo-500 rounded border-gray-300 focus:ring-apollo-500 transition-all"
          />
          <label htmlFor="toggleDistantes" className="text-sm font-medium text-apollo-200 cursor-pointer select-none">
            Marcar escalas com mais de 10 dias de distância como "Não feito"
          </label>
        </div>
      </div>
      {/* Seção das Listagens das Escalas */}
      <div>
        {loadingEscalas ? (
          <div className="flex flex-col gap-3">
            <SkeletonGen range={1} />
            <SkeletonGen range={6} display="grid" className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"/>
          </div>
        ) : erroEscalas ? (
          <ErroGen error={erroEscalas} />
        ) : options.length === 0 ? (
          <VazioGen message="Nenhuma pendência registrada" subMessage="Não foi encontrada nenhuma escala pendente para este paciente."/>
        ) : (
          <>

            {/* Grid responsivo organizando os cards de escala */}
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"> 
              {options.map((escala) => {
                const status = getEffectiveStatus(escala);
                const statusLabel = getStatusLabel(status);
                
                // Se o status indica que o usuário já tomou uma decisão firme, bloqueia as outras ações
                const isLocked = Boolean(status) && !["PENDENTE", "NAO_FEITO", "ABERTA"].includes(status);
                
                return (
                <li
                  key={getPendenciaKey(escala) || escala.formularioId}
                  className="relative flex flex-col justify-between gap-4 p-4 border border-apollo-200/30 rounded-xl bg-white shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {/* Cabeçalho do Card da Escala: Título, Tag de Status e Data Referência */}
                  <div className="flex flex-wrap items-start gap-2">
                    <span className="font-semibold text-apollo-200 w-full mb-1">{escala.formulario?.nomeEscala || escala.label}</span>
                    
                    {/* Badge de Status Atualizado */}
                    {statusLabel && (
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border ${getStatusClass(status)} tracking-wide uppercase`}
                      >
                        {statusLabel}
                      </span>
                    )}

                    {/* Badge da Data Referência para o profissional saber para quando era a escala */}
                    {escala.data_referencia && (
                      <span
                        className="text-[11px] font-semibold px-2.5 py-1 rounded-md border bg-apollo-200/10 text-apollo-200 border-apollo-200/30 tracking-wide uppercase"
                      >
                        Ref: {formatDataVisual(escala.data_referencia) || formatarData(escala.data_referencia)}
                      </span>
                    )}
                  </div>

                  {/* Conjunto de Ações/Botões para a escala específica */}
                  <div className="relative z-10 flex flex-wrap gap-2 mt-auto pt-2">
                    
                    {/* Botão de "Não Feito" (Apenas Front) */}
                    <button
                      type="button"
                      onClick={() => handleNaoFeito(escala)}
                      className={getActionButtonClass(
                        status,
                        "NAO_FEITO",
                        "bg-slate-500 hover:bg-slate-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-slate-400 ring-offset-1"
                      )}
                      disabled={isLocked}
                    >
                      Não feito
                    </button>

                    {/* Botão de "Não se aplica" (Invalida no Banco) */}
                    <button
                      type="button"
                      className={getActionButtonClass(
                        status,
                        "NAO_APLICA",
                        "bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-red-400 ring-offset-1"
                      )}
                      onClick={() => handleNaoAplicar(escala)}
                      disabled={isLocked}
                    >
                      Não se aplica
                    </button>

                    {/* Botão Aplicado mas não lançado no momento */}
                    <button
                      type="button"
                      onClick={() => handleAplicadoNaoLancado(escala)}
                      className={getActionButtonClass(
                        status,
                        "APLICADO_NAO_LANCADO",
                        "bg-amber-500 hover:bg-amber-600 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-amber-400 ring-offset-1 opacity-100!"
                      )}
                      disabled={isLocked}
                    >
                      Aplicado, não lançado
                    </button>

                    {/* Botão Principal de Preenchimento da Escala (Navegação) */}
                    <button
                      type="button"
                      onClick={() =>
                        handleNavForm(
                          escala.formularioId,
                          "Escala",
                          escala.formulario?.nomeEscala || escala.label,
                          escala
                        )
                      }
                      className={getActionButtonClass(
                        status,
                        "PREENCHIDA",
                        "bg-apollo-200/80 hover:bg-apollo-200 text-white py-1.5 px-3 rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full mt-1 sm:mt-0 sm:w-auto",
                        "ring-2 ring-apollo-400 ring-offset-1"
                      )}
                      disabled={isLocked}
                    >
                      Preencher
                    </button>
                  </div>
                </li>
              );
              })}
            </ul>
          </>
        )}
      </div>

      
      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-100">
        {/* Botão inferior: Ação Principal */}
        <button
          onClick={handlePreencherAuto}
          disabled={hasPendenciasEmAberto || (isAvaliacaoDeclarada && !selectedAvaliacaoForm)}
          className={`mt-2 font-semibold py-2.5 px-2 rounded-xl transition-all duration-200 shadow-sm w-full flex items-center justify-center gap-2 ${
            hasPendenciasEmAberto || (isAvaliacaoDeclarada && !selectedAvaliacaoForm)
              ? "bg-gray-300 cursor-not-allowed text-gray-500 border border-gray-300"
              : "bg-apollo-500 hover:bg-apollo-600 hover:shadow-md text-white cursor-pointer"
          }`}
        >
          {isAvaliacaoDeclarada ? (
            <>
              Preencher Avaliação
            </>
          ) : (
            <>
              Preencher Evolução
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Exportando o componente como default
export default PenModal;

// Tipagem básica de propriedades para evitar quebra de contrato na chamada deste Modal
PenModal.propTypes = {
  penData: PropTypes.object.isRequired,
};