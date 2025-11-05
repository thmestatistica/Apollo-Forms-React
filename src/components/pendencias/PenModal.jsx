/**
 * @file PenModal.jsx
 * @description Modal de Pendência com multiselect e persistência global.
 */

import { useState } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "../../hooks/use";

/**
 * @component PenModal
 * Exibe informações da pendência e um seletor de escalas.
 */
const PenModal = ({ penData }) => {
  const navigate = useNavigate();
  const { escalasSelecionadas, setEscalasSelecionadas, closeModal } = useFormContext(); 

  // Opções de escalas disponíveis
  const escalasDisponiveis = [
    { value: "TUG", label: "TUG - Timed Up and Go" },
    { value: "Berg", label: "Berg Balance Scale" },
    { value: "Fugl-Meyer", label: "Fugl-Meyer Assessment" },
  ];

  // Controle local: checkbox principal
  const [temEscala, setTemEscala] = useState(escalasSelecionadas.length > 0);

  /** Atualiza o contexto e localStorage ao mudar a seleção */
  const handleChange = (selectedOptions) => {
    const valores = selectedOptions ? selectedOptions.map((opt) => opt.value) : [];
    setEscalasSelecionadas(valores);
  };

  /** Inicializa as opções selecionadas ao montar */
  const selectedValues = escalasDisponiveis.filter((opt) =>
    escalasSelecionadas.includes(opt.value)
  );

  /** Avança para página de evolução */
  const handleEvoluir = () => {
    closeModal();
    navigate("/evolucao"); // ajuste o caminho conforme suas rotas
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-bold text-xl">Pendências do Agendamento</h2>

      {/* Informações básicas */}
      <div className="grid md:grid-cols-2 gap-2 text-gray-700">
        <p><strong>Paciente:</strong> {penData["Paciente"]}</p>
        <p><strong>Data:</strong> {penData["Data"]}</p>
        <p><strong>Horário:</strong> {penData["Início"]} até {penData["Fim"]}</p>
        <p><strong>ID:</strong> {penData["AgendamentoID"]}</p>
      </div>

      {/* Checkbox principal */}
      <div className="flex items-center gap-2 mt-3">
        <input
          type="checkbox"
          id="checkboxEscala"
          checked={temEscala}
          onChange={() => setTemEscala(!temEscala)}
          className="accent-apollo-200 w-5 h-5 transition-all duration-300 hover:scale-110"
        />
        <label htmlFor="checkboxEscala" className="font-semibold">
          Foi feita alguma escala?
        </label>
      </div>

      {/* Multiselect */}
      {temEscala && (
        <div className="mt-3">
          <Select
            isMulti
            options={escalasDisponiveis}
            value={selectedValues}
            onChange={handleChange}
            placeholder="Selecione as escalas..."
            className="text-sm"
            menuPortalTarget={document.body}   // <-- renderiza o menu fora do modal
            menuPosition="fixed"               // <-- fixa o menu corretamente
            styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }), // garante que fique acima de tudo
                control: (base) => ({
                ...base,
                borderRadius: "0.75rem",
                borderColor: "#ccc",
                boxShadow: "none",
                "&:hover": { borderColor: "#60a5fa" },
                }),
            }}
            />


          {/* Lista de escalas selecionadas */}
          <ul className="mt-4 flex flex-col gap-2">
            {selectedValues.map((escala) => (
              <li
                key={escala.value}
                className="flex justify-between items-center p-3 border border-gray-200 rounded-lg shadow-sm bg-white"
              >
                <span className="font-medium">{escala.label}</span>
                <button
                  className="bg-apollo-200 hover:bg-apollo-300 text-white py-1 px-3 rounded-lg text-sm transition"
                  type="button"
                >
                  Preencher {escala.value}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Botão final */}
      <button
        onClick={handleEvoluir}
        className="mt-6 bg-apollo-200 hover:bg-apollo-300 text-white font-semibold py-2 px-4 rounded-xl transition"
      >
        Preencher Evolução/Avaliação
      </button>
    </div>
  );
};

export default PenModal;
