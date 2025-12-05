/**
 * @file PenModal.jsx
 * @description Modal que exibe pendências de um agendamento e permite selecionar e preencher escalas associadas.
 */
// useState e useEffect para controle de estado local e efeitos colaterais
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
// useNavigate para navegação programática
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

// Componentes
// MultiSelect para seleção múltipla de escalas
import MultiSelect from "../input/MultiSelect.jsx";

// Hook customizado para acessar o contexto de formulários
import { useFormContext } from "../../hooks/useFormContext";
// Mapeamento de formulários por Slot/Tipo
import { tipoForms, tipoPorEspecialidade } from "../../config/tipoSlot";
import { carregar_escalas_pendentes } from "../../api/agenda/agenda_utils";
import { nao_aplicar_pendencia_escala } from "../../api/pendencias/pendencias_utils.js";

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
  const navigate = useNavigate();

  // Contexto global com informações sobre formulários e escalas
  const { escalasPorAgendamento, atualizarEscalas, closeModal } = useFormContext();

  /** ID do agendamento atual (chave de referência no contexto) */
  const agendamentoId = penData["AgendamentoID"];

  /** Escalas selecionadas para este agendamento (vindas do contexto) */
  const escalasAtuais = escalasPorAgendamento[agendamentoId] || [];

  /**
   * Estado local para controlar a pergunta "foi feita alguma escala?"
   * Tri-state: null (não respondido), true (Sim), false (Não)
   */
  const [temEscala, setTemEscala] = useState(
    escalasAtuais.length > 0 ? true : null
  );

  // Restaura a opção do rádio ao reabrir o modal
  useEffect(() => {
    const storageKey = `penModal:temEscala:${agendamentoId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true") setTemEscala(true);
      else if (saved === "false") setTemEscala(false);
    } catch {
      // Ignorar erros de acesso ao localStorage
    }
  }, [agendamentoId]);

  // Estado local para escalas disponíveis + carregamento
  const [escalasDisponiveis, setEscalasDisponiveis] = useState([]);
  const [loadingEscalas, setLoadingEscalas] = useState(false);
  const [erroEscalas, setErroEscalas] = useState(null);

  // Carrega escalas com base no paciente e especialidade da pendência
  useEffect(() => {
    const pacienteId = penData?.["PacienteID"] ?? null;
    const profissionalEspecialidade = penData?.["ProfissionalEspecialidade"] ?? null;

    if (!pacienteId || !profissionalEspecialidade) {
      setEscalasDisponiveis([]);
      return;
    }

    let ativo = true;
    setLoadingEscalas(true);
    setErroEscalas(null);
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

    return () => {
      ativo = false;
    };
  }, [penData]);

  /**
   * Mantém o estado do checkbox sincronizado caso a lista de escalas
   * seja atualizada externamente (ex: outro componente).
   */
  useEffect(() => {
    // Se alguma escala foi selecionada externamente, marcar como "Sim" automaticamente
    if (escalasAtuais.length > 0) setTemEscala(true);
  }, [escalasAtuais.length]);

  // Persiste a escolha do rádio para lembrar ao voltar
  useEffect(() => {
    const storageKey = `penModal:temEscala:${agendamentoId}`;
    try {
      if (temEscala === true) localStorage.setItem(storageKey, "true");
      else if (temEscala === false) localStorage.setItem(storageKey, "false");
      else localStorage.removeItem(storageKey);
    } catch {
      // Ignorar erros de acesso ao localStorage
    }
  }, [temEscala, agendamentoId]);

  /**
   * Atualiza as escalas selecionadas no contexto global.
   * @param {Array<{value: string}>} selectedOptions - Opções selecionadas no MultiSelect.
   */
  const handleChange = (selectedOptions) => {
    const novas = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    atualizarEscalas(agendamentoId, novas);
  };

  /**
   * Normaliza as opções para o formato esperado pelo react-select
   * mantendo os campos originais para uso posterior na UI.
   */
  const rawOptions = Array.isArray(escalasDisponiveis) ? escalasDisponiveis : [];
  const options = rawOptions.map((item) => {
    const value = String(
      item?.formularioId ?? ""
    );
    const label =
      item?.label ??
      item?.formulario?.nomeEscala ??
      item?.especialidade ??
      `Escala ${value}`;
    return { ...item, value, label };
  });

  console.log("Escalas disponíveis no PenModal (normalizadas):", options);

  // Selecionadas atuais normalizadas para string e comparadas via Set
  const selectedSet = new Set((escalasAtuais || []).map((v) => String(v)));
  const selectedValues = options.filter((opt) => selectedSet.has(String(opt.value)));

  /**
   * Navega até o formulário de uma escala específica.
   * Fecha o modal e envia o estado da pendência via `navigate`.
   *
   * @param {number} id - ID da escala a ser preenchida.
   * @param {string} tipo_form - Tipo do formulário (ex: "Escala", "Evolução").
   */
  const handleNavForm = (id, tipo_form, titulo, pendenciaEscala, isEvolucao = false) => {
    closeModal();
    navigate(`/forms-terapeuta/formulario/${tipo_form.toLowerCase()}/${id}`, {
      state: { pendencia: penData, formTitulo: titulo, pendenciaEscala, isEvolucao },
    });
  };

  /**
   * Faz a marcação de uma pendência de escala como "Não Aplicável".
   *
   * @param {Object} escala - Dados da escala a ser marcada como não aplicável.
   */
  const handleNaoAplicar = async (escala) => {
    const result = await Swal.fire({
      title: "Marcar como não aplicável?",
      text: `A escala "${escala.formulario?.nomeEscala || escala.label}" será marcada como não aplicável para este paciente.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#5A2779",
      cancelButtonColor: "#E0AC00",
      confirmButtonText: "Sim, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      // Lógica para marcar a pendência como "Não Aplicável"
      console.log("Marcar pendência como Não Aplicável para escala:", escala);

      const resposta = await nao_aplicar_pendencia_escala(escala);
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

        // Recarregar dados mantendo o modal aberto (soft refresh)
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
   * Determina automaticamente o formulário a preencher com base no tipo de atendimento
   * e no Slot/Sigla do agendamento, usando o mapeamento de `tipoSlot`.
   */
  const handlePreencherAuto = () => {
    const tipoRaw = String(penData?.["TipoAtendimento"] || "").toUpperCase();
    const isAvaliacao = tipoRaw.includes("AVALIACAO") || tipoRaw.includes("REAVALIACAO");
    const grupo = isAvaliacao ? "Avaliações" : "Evoluções";

    const sigla = penData?.["Sigla"] || penData?.["Slot"] || penData?.["ProfissionalEspecialidade"] || "";
    const mapa = tipoForms?.[grupo] || {};

    const especialidade = penData?.["ProfissionalEspecialidade"] || "";
    const lista_slots_equipamentos = ['LKM', 'CML', 'ARM', 'KTS', 'ORT', 'TMS']

    // alvoId precisa existir fora dos blocos para ser usado depois
    let alvoId = null;
    const siglaNorm = String(sigla || "").toUpperCase();

    // Se é um equipamento, procurar o formulário cujo array contém a sigla
    if (lista_slots_equipamentos.includes(siglaNorm)) {
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
      // Por especialidade: mapeamento direto para o ID conforme grupo
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
    const tipoParam = isAvaliacao ? "Avaliacao" : "Evolucao"; // sem acento para URL
    handleNavForm(alvoId, tipoParam, titulo, { id: null, agendamentoId, pacienteId: null }, !isAvaliacao);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Título do modal */}
      <h2 className="font-bold text-xl text-apollo-200">Pendências do Agendamento</h2>

      {/* Informações principais do agendamento */}
      <div className="grid md:grid-cols-2 gap-2 text-apollo-200">
        <p><strong>Paciente:</strong> {penData["Paciente"]}</p>
        <p><strong>Data:</strong> {penData["Data"]}</p>
        <p><strong>Horário:</strong> {penData["Início"]} até {penData["Fim"]}</p>
        <p><strong>ID:</strong> {penData["AgendamentoID"]}</p>
        <p><strong>Slot:</strong> {penData['Sigla']}</p>
      </div>

      {/* Pergunta Sim/Não indicando se houve aplicação de escala */}
      <div className="flex flex-col gap-2 mt-3">
        <span className="font-semibold text-apollo-200">Foi feita alguma escala?</span>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="escala-feita"
              value="sim"
              checked={temEscala === true}
              onChange={() => setTemEscala(true)}
              className="accent-apollo-200 w-5 h-5 hover:scale-110 transition-all"
            />
            <span className="text-apollo-200">Sim</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="escala-feita"
              value="nao"
              checked={temEscala === false}
              onChange={() => setTemEscala(false)}
              className="accent-apollo-200 w-5 h-5 hover:scale-110 transition-all"
            />
            <span className="text-apollo-200">Não</span>
          </label>
        </div>
        {temEscala === null && (
          <p className="text-xs text-apollo-200/80">Selecione uma opção para continuar.</p>
        )}
      </div>

      {/* Seleção e listagem das escalas (apenas se o checkbox estiver marcado) */}
      {temEscala === true && (
        <div className="mt-3">
          {loadingEscalas ? (
            <p className="text-sm text-apollo-200">Carregando escalas…</p>
          ) : erroEscalas ? (
            <p className="text-sm text-red-600">{erroEscalas}</p>
          ) : (
            <>
              {/* Campo de seleção múltipla */}
              <MultiSelect
                options={options}
                value={selectedValues}
                onChange={handleChange}
                placeholder="Selecione as escalas..."
                className="text-sm"
              />

              {/* Lista de escalas selecionadas com botão para preenchimento */}
              <ul className="mt-4 flex flex-col gap-2">
                {selectedValues.map((escala) => (
                  <li
                    key={escala.formularioId}
                    className="flex justify-between items-center p-3 border border-gray-200 rounded-lg shadow-sm bg-white"
                  >
                    <span className="font-medium text-apollo-200">{escala.formulario?.nomeEscala || escala.label}</span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="bg-apollo-200 hover:bg-apollo-300 text-white py-1 px-3 rounded-lg text-sm transition"
                        onClick={() => handleNaoAplicar(escala)}
                      >
                        Não aplicável
                      </button>
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
                        className="bg-apollo-200 hover:bg-apollo-300 text-white py-1 px-3 rounded-lg text-sm transition"
                      >
                        Preencher
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Botão inteligente para preencher o formulário do agendamento */}
      <button
        onClick={handlePreencherAuto}
        disabled={temEscala === null}
        className={`mt-6 font-semibold py-2 px-4 rounded-xl transition ${
          temEscala === null
            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
            : "bg-apollo-500 hover:bg-apollo-600 text-white"
        }`}
      >
        Preencher {penData["TipoAtendimento"] === 'AVALIACAO_INICIAL' || penData["TipoAtendimento"] === 'REAVALIACAO' ? 'Avaliação' : 'Evolução'}
      </button>
    </div>
  );
};

export default PenModal;

PenModal.propTypes = {
  penData: PropTypes.object.isRequired,
};
