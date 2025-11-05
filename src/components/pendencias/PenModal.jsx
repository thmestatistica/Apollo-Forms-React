/**
 * @file PenModal.jsx
 * @description Modal de Pendência com seleção persistente por agendamento.
 */

import { useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "../../hooks/useFormContext";

const PenModal = ({ penData }) => {
  const navigate = useNavigate();
  const {
    escalasPorAgendamento,
    atualizarEscalas,
    closeModal,
  } = useFormContext();

  // ID do agendamento atual
  const agendamentoId = penData["AgendamentoID"];

  // Opções disponíveis
  const escalasDisponiveis = [
    { id: 1, value: "TUG", label: "TUG - Timed Up and Go", tipo_form: "Escala" },
    { id: 2, value: "Berg", label: "Berg Balance Scale", tipo_form: "Escala" },
    { id: 3, value: "Fugl-Meyer", label: "Fugl-Meyer Assessment", tipo_form: "Escala" },
  ];

  // Escalas do agendamento atual (carregadas do contexto)
  const escalasAtuais = escalasPorAgendamento[agendamentoId] || [];

  const [temEscala, setTemEscala] = useState(escalasAtuais.length > 0);

  // Mantém o checkbox sincronizado com os dados persistidos
  useEffect(() => {
    setTemEscala(escalasAtuais.length > 0);
  }, [escalasAtuais.length]);

  /** Atualiza escalas no contexto e localStorage */
  const handleChange = (selectedOptions) => {
    const novas = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    atualizarEscalas(agendamentoId, novas);
  };

  /** Mantém seleção visível */
  const selectedValues = escalasDisponiveis.filter((opt) =>
    escalasAtuais.includes(opt.value)
  );

  /** Navegar para formulário específico */
  const handleNavForm = (id, tipo_form) => {
    closeModal();
    // Envia os dados da pendência para o formulário via state
    navigate(`/forms-terapeuta/formulario/${tipo_form}/${id}` , {
      state: { pendencia: penData }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-xl text-apollo-200">Pendências do Agendamento</h2>

      <div className="grid md:grid-cols-2 gap-2 text-apollo-200">
        <p><strong>Paciente:</strong> {penData["Paciente"]}</p>
        <p><strong>Data:</strong> {penData["Data"]}</p>
        <p><strong>Horário:</strong> {penData["Início"]} até {penData["Fim"]}</p>
        <p><strong>ID:</strong> {penData["AgendamentoID"]}</p>
      </div>

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

      {temEscala && (
        <div className="mt-3">
          <Select
            isMulti
            closeMenuOnSelect={false}
            options={escalasDisponiveis}
            value={selectedValues}
            onChange={handleChange}
            placeholder="Selecione as escalas..."
            className="text-sm"
            menuPortalTarget={document.body}
            menuPosition="fixed"
            styles={{
              // Corrige sobreposição do menu
              menuPortal: (base) => ({ ...base, zIndex: 9999 }),

              // Estilo do container principal
              control: (base, state) => ({
                ...base,
                borderRadius: "0.75rem",
                borderColor: state.isFocused ? "#5A2779" : "#d4d4d8",
                boxShadow: "none",
                "&:hover": { borderColor: "#5A2779" },
                minHeight: "42px",
              }),

              // 🔽 Estilo das opções do menu
              option: (base, state) => ({
                ...base,
                fontSize: "0.9rem",
                padding: "10px 12px",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: state.isSelected
                  ? "#5A2779" // quando selecionada
                  : state.isFocused
                  ? "#F3E8FF" // quando o mouse passa
                  : "white", // estado normal
                color: state.isSelected ? "white" : "#1F2937", // texto branco se selecionada
                transition: "background-color 0.2s ease, color 0.2s ease",
              }),

              // Estilo da lista de opções (container)
              menu: (base) => ({
                ...base,
                borderRadius: "0.75rem",
                marginTop: "6px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                overflow: "hidden",
              }),

              // Estilo dos valores selecionados (tags no caso de multi)
              multiValue: (base) => ({
                ...base,
                backgroundColor: "#E9D8FD",
                borderRadius: "0.5rem",
                padding: "2px 6px",
              }),
              multiValueLabel: (base) => ({
                ...base,
                color: "#5A2779",
                fontWeight: 500,
              }),
              multiValueRemove: (base) => ({
                ...base,
                color: "#5A2779",
                "&:hover": {
                  backgroundColor: "#5A2779",
                  color: "white",
                  borderRadius: "0.5rem",
                },
              }),
            }}
          />
          <ul className="mt-4 flex flex-col gap-2">
            {selectedValues.map((escala) => (
              <li
                key={escala.value}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg shadow-sm bg-white"
              >
                <span className="font-medium text-apollo-200">{escala.label}</span>
                <button
                  className="bg-apollo-200 hover:bg-apollo-300 text-white py-1 px-3 rounded-lg text-sm transition"
                  type="button"
                  onClick={() => handleNavForm(escala.id, escala.tipo_form)}
                >
                  Preencher {escala.value}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => handleNavForm(penData["AgendamentoID"])}
        className="mt-6 bg-apollo-500 hover:bg-apollo-600 text-white font-semibold py-2 px-4 rounded-xl transition"
      >
        Preencher Evolução
      </button>
    </div>
  );
};

export default PenModal;
