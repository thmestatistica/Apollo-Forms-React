// Estilos padrão compartilhados para react-select
export const defaultSelectStyles = {
  // Corrige sobreposição do menu
  menuPortal: (base) => ({ ...base, zIndex: 9999 }),

  // Estilo do container principal
  control: (base, state) => ({
    ...base,
    borderRadius: "0.75rem",
    borderColor: state.isFocused ? "#5A2779" : "#d4d4d8",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(90, 39, 121, 0.3)" : "none", 
    "&:hover": { 
      borderColor: "#5A2779",
      boxShadow: "0 0 0 3px rgba(90, 39, 121, 0.2)", 
    },
    minHeight: "42px",
  }),

  // Estilo das opções do menu
  option: (base, state) => ({
    ...base,
    fontSize: "0.9rem",
    padding: "10px 12px",
    borderRadius: "0.5rem",
    cursor: "pointer",
    backgroundColor: state.isSelected
      ? "#5A2779"
      : state.isFocused
      ? "#F3E8FF"
      : "white",
    color: state.isSelected ? "white" : "#1F2937",
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

  // Estilo dos valores selecionados (multi)
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
};
