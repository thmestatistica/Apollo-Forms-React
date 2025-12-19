/**
 * @file CampoDinamico.jsx
 * @description Renderiza dinamicamente um campo de formulário com base no tipo de resposta esperado.
 */
// React
// useMemo para otimização de performance e useState para controle de selects controlados
import { useMemo, useState } from "react";

import SingleSelect from "../input/SingleSelect.jsx";
import MultiSelect from "../input/MultiSelect.jsx";

/**
 * Renderiza dinamicamente um campo de formulário conforme o tipo de resposta.
 *
 * @component
 * @param {Object} props - Propriedades do componente.
 * @param {Object} props.campo - Dados do campo definidos nos metadados do formulário.
 * @param {string} props.campo.nome - Nome do campo (usado como id e name).
 * @param {string} props.campo.label - Rótulo exibido acima do campo.
 * @param {string} props.campo.tipo_resposta_esperada - Tipo do campo (ex: TEXTO_LIVRE, DATA, NUMERO_FLOAT...).
 * @param {Array} [props.campo.opcoes=[]] - Opções de seleção para campos do tipo SELECAO_UNICA ou SELECAO_MULTIPLA.
 * @param {Object} [props.campo.meta_dados={}] - Configurações adicionais, como placeholder, step, etc.
 * @param {Object} [props.initialValues={}] - Valores iniciais para preenchimento automático do campo.
 * @returns {JSX.Element} O campo renderizado dinamicamente.
 */
const CampoDinamico = ({ campo, initialValues = {} }) => {
    const {
        nome,
        label,
        tipo_resposta_esperada,
        opcoes = [],
        meta_dados = {},
    } = campo;

    // Define valor inicial com fallback para string vazia
    const valorInicial = initialValues[nome] ?? "";

    /**
     * useMemo evita recomputar o mapeamento das opções em cada renderização,
     * garantindo melhor performance caso o formulário tenha vários campos.
     */
    const selectOptions = useMemo(() => {
        return opcoes.map((opcao) => {
            if (typeof opcao === "object" && opcao !== null) {
                // Permite opções nos formatos: { valor, label } ou { value, label }
                const value = opcao.valor ?? opcao.value ?? opcao;
                const labelOpt = opcao.label ?? String(value);
                return { value, label: labelOpt };
            }

            // Caso a opção seja string ou número simples
            return { value: opcao, label: String(opcao) };
        });
    }, [opcoes]);

    /**
     * Estados locais para armazenar o valor dos selects controlados.
     * Isso evita perda de reatividade nos componentes controlados (Single/MultiSelect).
     */
    const [singleValue, setSingleValue] = useState(() => {
        if (tipo_resposta_esperada !== "SELECAO_UNICA") return null;
        const found = selectOptions.find((o) => o.value === valorInicial);
        return found ?? null;
    });

    const [multiValue, setMultiValue] = useState(() => {
        if (tipo_resposta_esperada !== "SELECAO_MULTIPLA") return [];
        const initialArray = Array.isArray(valorInicial) ? valorInicial : [];
        return selectOptions.filter((o) => initialArray.includes(o.value));
    });

    /**
     * Função que retorna o campo correspondente ao tipo de resposta.
     * Cada caso aplica estilização consistente com Tailwind e segue o padrão visual.
     */
    const renderCampo = () => {
        switch (tipo_resposta_esperada) {
            /** Campo de texto livre (textarea) */
            case "TEXTO_LIVRE":
                return (
                    <textarea
                    id={nome}
                    name={nome}
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                    defaultValue={valorInicial}
                    rows={4}
                    />
                );

            /** Campo de data (input date) */
            case "DATA":
                return (
                    <input
                    id={nome}
                    name={nome}
                    type="date"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                    defaultValue={valorInicial}
                    />
                );

            /** Campo numérico (float) */
            case "NUMERO_FLOAT":
                return (
                    <input
                    id={nome}
                    name={nome}
                    type="number"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                    step={meta_dados.step ?? 0.1}
                    min={meta_dados.min_value ?? 0}
                    defaultValue={valorInicial}
                    />
                );

            /** Campo de seleção única (react-select customizado) */
            case "SELECAO_UNICA":
                return (
                    <>
                    <SingleSelect
                        options={selectOptions}
                        value={singleValue}
                        onChange={(opt) => setSingleValue(opt)}
                        placeholder={meta_dados.placeholder ?? "Selecione..."}
                        isClearable={meta_dados.isClearable ?? true}
                    />
                    {/* Campo oculto para submissão tradicional (HTML form) */}
                    <input
                        type="hidden"
                        id={nome}
                        name={nome}
                        value={singleValue?.value ?? ""}
                    />
                    </>
                );

            /** Campo de seleção múltipla (react-select multi) */
            case "SELECAO_MULTIPLA":
                return (
                    <>
                    <MultiSelect
                        options={selectOptions}
                        value={multiValue}
                        onChange={(opts) => setMultiValue(Array.isArray(opts) ? opts : [])}
                        placeholder={meta_dados.placeholder ?? "Selecione..."}
                        closeMenuOnSelect={meta_dados.closeMenuOnSelect ?? false}
                    />
                    {/* Campos ocultos para submissão HTML (um input por opção selecionada) */}
                    {multiValue.map((opt) => (
                        <input
                        key={String(opt.value)}
                        type="hidden"
                        id={nome}
                        name={nome}
                        value={opt.value}
                        />
                    ))}
                    </>
                );
            case "TEXTO_TOPICO":
                return(
                    <hr></hr>
                )
            
            case "TEXTO_SUBTOPICO":
                return(
                    <h2 className="text-xl font-semibold">{valorInicial}</h2>
                )

            /** Tipo padrão — campo de texto simples */
            default:
                return (
                    <input
                    id={nome}
                    name={nome}
                    type="text"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                    defaultValue={valorInicial}
                    />
                );
            }
    };

    return (
        <div className="flex flex-col gap-1">
            {/* Rótulo do campo */}
            {(tipo_resposta_esperada === "TEXTO_TOPICO" || tipo_resposta_esperada === "TEXTO_SUBTOPICO") ? (
                <label
                    htmlFor={nome}
                    className={
                        tipo_resposta_esperada === "TEXTO_TOPICO"
                            ? "font-bold text-lg mb-2"
                            : "font-med text-md"
                    }
                >
                    {label}
                </label>
            ) : (
                <label htmlFor={nome} className="font-medium text-sm">
                    {label}
                </label>
            )}

            {/* Campo dinâmico conforme tipo */}
            {renderCampo()}
        </div>
    );
};

export default CampoDinamico;
