/**
 * @file PenModal.jsx
 * @description Modal que exibe pendências de um agendamento e permite selecionar e preencher escalas associadas.
 */
// useState e useEffect para controle de estado local e efeitos colaterais
import { useState, useEffect } from "react";
import PropTypes from "prop-types";
// useNavigate para navegação programática
import { useNavigate } from "react-router-dom";

// Componentes
// MultiSelect para seleção múltipla de escalas
import MultiSelect from "../input/MultiSelect.jsx";

// Hook customizado para acessar o contexto de formulários
import { useFormContext } from "../../hooks/useFormContext";
// Mapeamento de formulários por Slot/Tipo
import { tipoForms, tipoPorEspecialidade } from "../../config/tipoSlot";

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
const PenModal = ({ penData, escalasDisponiveis }) => {
  const navigate = useNavigate();

  // Contexto global com informações sobre formulários e escalas
  const { escalasPorAgendamento, atualizarEscalas, closeModal } = useFormContext();

  /** ID do agendamento atual (chave de referência no contexto) */
  const agendamentoId = penData["AgendamentoID"];

  /** Escalas selecionadas para este agendamento (vindas do contexto) */
  const escalasAtuais = escalasPorAgendamento[agendamentoId] || [];

  /** Estado local para controlar o checkbox "foi feita alguma escala?" */
  const [temEscala, setTemEscala] = useState(escalasAtuais.length > 0);

  /**
   * Mantém o estado do checkbox sincronizado caso a lista de escalas
   * seja atualizada externamente (ex: outro componente).
   */
  useEffect(() => {
    setTemEscala(escalasAtuais.length > 0);
  }, [escalasAtuais.length]);

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

      {/* Checkbox indicando se houve aplicação de escala */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="checkbox"
          id="checkboxEscala"
          checked={temEscala}
          onChange={() => setTemEscala(!temEscala)}
          className="accent-apollo-200 w-5 h-5 hover:scale-110 transition-all"
        />
        <label htmlFor="checkboxEscala" className="font-semibold text-apollo-200">
          Foi feita alguma escala?
        </label>
      </div>

      {/* Seleção e listagem das escalas (apenas se o checkbox estiver marcado) */}
      {temEscala && (
        <div className="mt-3">
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
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botão inteligente para preencher o formulário do agendamento */}
      <button
        onClick={handlePreencherAuto}
        className="mt-6 bg-apollo-500 hover:bg-apollo-600 text-white font-semibold py-2 px-4 rounded-xl transition"
      >
        Preencher {penData["TipoAtendimento"] === 'AVALIACAO_INICIAL' || penData["TipoAtendimento"] === 'REAVALIACAO' ? 'Avaliação' : 'Evolução'}
      </button>
    </div>
  );
};

export default PenModal;

PenModal.propTypes = {
  penData: PropTypes.object.isRequired,
  // Aceita lista bruta vinda da API ou já no formato label/value
  escalasDisponiveis: PropTypes.arrayOf(PropTypes.object),
};
