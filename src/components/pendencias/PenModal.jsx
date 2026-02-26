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

import { formatarData } from "../../utils/format/formatar_utils.js";
import { formatDataVisual } from "../../utils/pendencias/escala_utils";

import { EQUIPAMENTO_SLOT } from "../../config/variaveisGlobais.js";

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
  
  // Clona as escalas garantindo que seja um array
  const rawOptions = Array.isArray(escalasDisponiveis) ? [...escalasDisponiveis] : [];
  
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
      case "PREENCHIDA": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "NAO_APLICA": return "bg-slate-100 text-slate-700 border-slate-200";
      case "NAO_FEITO": return "bg-gray-100 text-gray-800 border-gray-400";
      case "APLICADO_NAO_LANCADO": return "bg-amber-100 text-amber-800 border-amber-200";
      case "ABERTA": return "bg-emerald-100 text-emerald-800 border-emerald-200";
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
    return `${baseClass} ${isActive ? activeClass : "opacity-60 hover:opacity-100"}`;
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
    const tipoRaw = String(penData?.["TipoAtendimento"] || "").toUpperCase();
    const isAvaliacao = tipoRaw.includes("AVALIACAO") || tipoRaw.includes("REAVALIACAO");
    const grupo = isAvaliacao ? "Avaliações" : "Evoluções";

    const sigla = penData?.["Sigla"] || penData?.["Slot"] || penData?.["ProfissionalEspecialidade"] || "";
    const mapa = tipoForms?.[grupo] || {};

    const especialidade = penData?.["ProfissionalEspecialidade"] || "";
    

    let alvoId = null;
    const siglaNorm = String(sigla || "").toUpperCase();

    // Lógica para detectar e vincular equipamentos aos seus respectivos forms
    if (EQUIPAMENTO_SLOT.includes(siglaNorm)) {
      for (const [fid, slots] of Object.entries(mapa)) {
        if (!Array.isArray(slots)) continue;
        const slotsUpper = slots.map(s => String(s).toUpperCase());
        if (slotsUpper.includes(siglaNorm)) {
          const parsed = Number(fid);
          if (Number.isFinite(parsed)) alvoId = parsed;
          break;
        }
      }
    } else {
      // Lógica para detectar forms padrões vinculados diretamente à especialidade
      const idPorEsp = tipoPorEspecialidade?.[especialidade]?.[grupo] ?? null;
      if (idPorEsp != null) {
        const parsed = Number(idPorEsp);
        if (Number.isFinite(parsed)) {
          alvoId = parsed;
        }
      }
    }

    if (alvoId === null) {
      alert("Nenhum formulário configurado para este atendimento/slot.");
      return;
    }

    const titulo = `${isAvaliacao ? "Avaliação" : "Evolução"} ${sigla}`.trim();
    const tipoParam = isAvaliacao ? "Avaliacao" : "Evolucao"; // Formatação safe URL sem acentos
    handleNavForm(alvoId, tipoParam, titulo, { id: null, agendamentoId, pacienteId: null }, !isAvaliacao);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Título do modal */}
      <h2 className="font-bold text-xl text-apollo-200">Pendências do Agendamento</h2>

      {/* Grid com as informações principais descritivas do agendamento vindo da props `penData` */}
      <div className="grid md:grid-cols-2 gap-2 text-apollo-200">
        <p><strong>Paciente:</strong> {penData["Paciente"]}</p>
        <p><strong>Data:</strong> {penData["Data"]}</p>
        <p><strong>Horário:</strong> {penData["Início"]} até {penData["Fim"]}</p>
        <p><strong>ID:</strong> {penData["AgendamentoID"]}</p>
        <p><strong>Slot:</strong> {penData['Sigla']}</p>
      </div>

      {/* Seção das Listagens das Escalas */}
      <div className="mt-3">
        {loadingEscalas ? (
          <p className="text-sm text-apollo-200">Carregando escalas…</p>
        ) : erroEscalas ? (
          <p className="text-sm text-red-600">{erroEscalas}</p>
        ) : options.length === 0 ? (
          <p className="text-sm text-apollo-200">Nenhuma escala pendente para este agendamento.</p>
        ) : (
          <>
            {/* Checkbox para desmarcar escalas de data distante em lote */}
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-apollo-200/5 border border-apollo-200">
              <input
                type="checkbox"
                id="toggleDistantes"
                checked={isToggleDistantesAtivo}
                onChange={(e) => handleToggleDistantes(e.target.checked)}
                className="cursor-pointer w-4 h-4 text-apollo-500 rounded focus:ring-apollo-500"
              />
              <label htmlFor="toggleDistantes" className="text-sm font-medium text-apollo-200 cursor-pointer select-none">
                Marcar escalas com mais de 10 dias de distância como "Não feito"
              </label>
            </div>

            {/* Grid responsivo organizando os cards de escala */}
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2"> 
              {options.map((escala) => {
                const status = getEffectiveStatus(escala);
                const statusLabel = getStatusLabel(status);
                
                // Se o status indica que o usuário já tomou uma decisão firme, bloqueia as outras ações
                const isLocked = Boolean(status) && !["PENDENTE", "NAO_FEITO", "ABERTA"].includes(status);
                
                return (
                <li
                  key={getPendenciaKey(escala) || escala.formularioId}
                  className="relative flex flex-col gap-3 p-3 border border-gray-200 rounded-lg shadow-sm bg-white"
                >
                  {/* Cabeçalho do Card da Escala: Título, Tag de Status e Data Referência */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-apollo-200">{escala.formulario?.nomeEscala || escala.label}</span>
                    
                    {/* Badge de Status Atualizado */}
                    {statusLabel && (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${getStatusClass(status)}`}
                      >
                        {statusLabel}
                      </span>
                    )}

                    {/* Badge da Data Referência para o profissional saber para quando era a escala */}
                    {escala.data_referencia && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-apollo-200/15 text-apollo-200 border-apollo-200"
                      >
                        Ref.: {formatDataVisual(escala.data_referencia) || formatarData(escala.data_referencia)}
                      </span>
                    )}
                  </div>

                  {/* Conjunto de Ações/Botões para a escala específica */}
                  <div className="relative z-10 flex flex-wrap gap-2">
                    
                    {/* Botão de "Não Feito" (Apenas Front) */}
                    <button
                      type="button"
                      onClick={() => handleNaoFeito(escala)}
                      className={getActionButtonClass(
                        status,
                        "NAO_FEITO",
                        "bg-gray-500 hover:bg-gray-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-gray-400 "
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
                        "bg-red-800 hover:bg-red-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-red-300"
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
                        "bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-yellow-300 opacity-100!"
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
                        "bg-apollo-200 hover:bg-apollo-300 text-white py-1.5 px-3 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
                        "ring-2 ring-apollo-300"
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

      {/* Botão inferior: Fica bloqueado enquanto não decidirem o status de cada pendência */}
      <button
        onClick={handlePreencherAuto}
        disabled={hasPendenciasEmAberto}
        className={`mt-6 font-semibold py-2 px-4 rounded-xl transition  ${
          hasPendenciasEmAberto
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-apollo-500 hover:bg-apollo-600 cursor-pointer"
        } text-white`}
      >
        Preencher{" "}
        {penData["TipoAtendimento"] === "AVALIACAO_INICIAL" ||
        penData["TipoAtendimento"] === "REAVALIACAO"
          ? "Avaliação"
          : "Evolução"}
      </button>
    </div>
  );
};

// Exportando o componente como default
export default PenModal;

// Tipagem básica de propriedades para evitar quebra de contrato na chamada deste Modal
PenModal.propTypes = {
  penData: PropTypes.object.isRequired,
};