/**
 * Renderiza dinamicamente um campo do formulário com base em seu tipo.
 */
const CampoDinamico = ({ campo, initialValues }) => {
  const { tipo, nome, label, opcoes } = campo;
  const valorInicial = initialValues?.[nome];

  switch (tipo) {
    case "texto":
      return (
        <div className="flex flex-col">
          <label htmlFor={nome}>{label}</label>
          <input
            id={nome}
            name={nome}
            type="text"
            className="border rounded p-2"
            defaultValue={valorInicial ?? ""}
          />
        </div>
      );

    case "textarea":
      return (
        <div className="flex flex-col">
          <label htmlFor={nome}>{label}</label>
          <textarea id={nome} name={nome} className="border rounded p-2" defaultValue={valorInicial ?? ""} />
        </div>
      );

    case "select":
      return (
        <div className="flex flex-col">
          <label htmlFor={nome}>{label}</label>
          <select id={nome} name={nome} className="border rounded p-2" defaultValue={valorInicial}
          >
            {opcoes.map((opcao) => (
              <option key={opcao.valor} value={opcao.valor}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
      );

    default:
      return null;
  }
};

export default CampoDinamico;
