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
const CampoDinamico = ({ campo, initialValues = {}, onFieldChange = null}) => {
    const {
        nome,
        label,
        tipo_resposta_esperada,
        opcoes = [],
        meta_dados = {},
    } = campo;

    // Define valor inicial com fallback para string vazia
    const valorInicial = initialValues[nome] ?? "";

    // Extrai configurações da matriz para uso no escopo do componente
    const { titulo_linhas = [], titulo_colunas = [], titulo_geral_linhas } = meta_dados || {};
    // Define a chave da primeira coluna (onde fica o nome da linha)
    const rowKey = titulo_geral_linhas && titulo_geral_linhas.trim() !== "" ? titulo_geral_linhas : "linha";

    // Garante a ordem das colunas para saída JSON (Linha -> Colunas)
    const columnOrder = useMemo(() => [rowKey, ...titulo_colunas], [rowKey, titulo_colunas]);

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
        const found = selectOptions.find((o) => o.value === valorInicial || o.label === valorInicial);
        return found ?? null;
    });

    const [multiValue, setMultiValue] = useState(() => {
        if (tipo_resposta_esperada !== "SELECAO_MULTIPLA") return [];
        const initialArray = Array.isArray(valorInicial) ? valorInicial : [];
        return selectOptions.filter((o) => initialArray.includes(o.value) || initialArray.includes(o.label));
    });

    const [matrizData, setMatrizData] = useState(() => {
        if (tipo_resposta_esperada !== "MATRIZ") return [];
        
        // Tenta carregar do cache ou dos initialValues se já existir
        if (valorInicial && typeof valorInicial === "string") {
            try {
                const parsed = JSON.parse(valorInicial);
                // Lida com o formato antigo (array) e o novo (columns/data)
                const rows = Array.isArray(parsed) ? parsed : (parsed.data || parsed.matriz || []);
                return rows;
            } catch (e) {
                console.warn("Aviso: Falha ao fazer parse do valor inicial da Matriz.", e);
            }
        }

        
        return titulo_linhas.map((linha) => {
            // Garante que a chave da linha seja a primeira prop do objeto
            const rowObj = { [rowKey]: linha };
            titulo_colunas.forEach((col) => {
                rowObj[col] = "";
            });
            return rowObj;
        });
    });

    // Manipuladores de estado da Matriz
    const handleMatrizChange = (rowIndex, colName, value) => {
        const newData = [...matrizData];
        const currentRow = newData[rowIndex];

        // Recria o objeto da linha garantindo a ordem das chaves:
        // 1. Chave da Linha (rowKey)
        // 2. Colunas de dados na ordem de titulo_colunas
        const newRow = { 
            [rowKey]: currentRow[rowKey] 
        };

        titulo_colunas.forEach((col) => {
            if (col === colName) {
                newRow[col] = value;
            } else {
                newRow[col] = currentRow[col];
            }
        });

        newData[rowIndex] = newRow;
        setMatrizData(newData);
        
        // Empacota os dados com a ordem das colunas explicita
        const payload = {
            columns: columnOrder,
            data: newData
        };

        if (onFieldChange) {
            onFieldChange(nome, JSON.stringify(payload));
        }
    };

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
                        onChange={(opt) => {
                            setSingleValue(opt);

                            if (onFieldChange) {
                                onFieldChange(nome, opt?.label ?? "");
                            }
                        }}
                        placeholder={meta_dados.placeholder ?? "Selecione..."}
                        isClearable={meta_dados.isClearable ?? true}
                    />
                    {/* Campo oculto para submissão tradicional (HTML form) */}
                    <input
                        type="hidden"
                        id={nome}
                        name={nome}
                        value={singleValue?.label ?? ""}
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
                        onChange={(opts) => {
                            const array = Array.isArray(opts) ? opts : [];
                            setMultiValue(array);

                            if (onFieldChange) {
                                onFieldChange(nome, array.map(o => o.label));
                            }
                        }}

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
                        value={opt.label}
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

            case "MATRIZ": {
                const {
                    titulo_linhas = [],
                    titulo_colunas = [],
                    titulo_geral_colunas = "",
                    titulo_geral_linhas = "",
                    celulas = {},
                    config_linhas = {}
                } = meta_dados || {};

                return (
                    <div className="w-full overflow-x-auto rounded-xl border border-zinc-300 bg-white shadow-sm p-3">
                        <table className="w-full table-auto border-collapse text-sm text-left">
                            <thead>
                                {/* 1ª Linha: Títulos Gerais */}
                                {(titulo_geral_linhas || titulo_geral_colunas) && (
                                    <tr>
                                        <th className="p-3 border-b border-r border-zinc-200 bg-zinc-50 font-bold text-gray-500 uppercase tracking-wider text-center align-bottom min-w-[150px]">
                                            {titulo_geral_linhas}
                                        </th>
                                        <th 
                                            colSpan={titulo_colunas.length || 1}
                                            className="p-3 border-b border-zinc-200 bg-zinc-50 font-bold text-center text-gray-800 align-bottom uppercase tracking-wider"
                                        >
                                            {titulo_geral_colunas}
                                        </th>
                                    </tr>
                                )}
                                
                                {/* 2ª Linha: Títulos das Colunas */}
                                <tr>
                                    <th className="p-3 bg-zinc-100/50 border-b border-r border-zinc-200 text-xs font-medium text-gray-400 italic text-center min-w-[150px]">
                                        {/* Primira "Colunas" em branco */}
                                    </th>
                                    {titulo_colunas.map((col, idx) => (
                                        <th key={idx} className="p-2 border-b border-zinc-200 bg-zinc-50 font-semibold text-center text-gray-700 min-w-[120px]">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {titulo_linhas.map((linha, rowIndex) => {
                                    // Verifica se há configuração específica para a linha atual (índice baseado em 1)
                                    const rowConfig = config_linhas[String(rowIndex + 1)];

                                    return (
                                        <tr key={rowIndex} className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50/50 transition-colors">
                                            {/* Célula do Título da Linha */}
                                            <td className="p-3 border-r border-zinc-200 font-medium text-gray-700 whitespace-nowrap bg-zinc-50/30">
                                                {linha}
                                            </td>
                                            
                                            {/* Células de Input Dinâmicas */}
                                            {titulo_colunas.map((col, colIndex) => {
                                                const cellKey = `${rowIndex + 1}x${colIndex + 1}`;
                                                const value = matrizData[rowIndex]?.[col] ?? "";
                                                
                                                let currentType = "texto";
                                                let options = [];

                                                if (rowConfig && rowConfig.tipo) {
                                                    // Se houver config_linhas, usa o tipo definido na linha
                                                    currentType = rowConfig.tipo;
                                                    
                                                    // Prepara opções se for do tipo seleção
                                                    if (currentType === "selecao_unica" || currentType === "selecao_multipla") {
                                                        options = (rowConfig.opcoes || []).map((opcao) => {
                                                            if (typeof opcao === "object" && opcao !== null) {
                                                                const val = opcao.valor ?? opcao.value ?? opcao;
                                                                const lab = opcao.label ?? String(val);
                                                                return { value: val, label: lab };
                                                            }
                                                            return { value: opcao, label: String(opcao) };
                                                        });
                                                    }
                                                } else {
                                                    // Fallback para lógica antiga de 'celulas'
                                                    const allowedTypes = celulas[cellKey] || ["texto"];
                                                    currentType = allowedTypes.length > 1 ? "texto" : allowedTypes[0];
                                                }

                                                // Lógica de Renderização por Tipo
                                                
                                                // 1. Seleção Única
                                                if (currentType === "selecao_unica") {
                                                    const selectedOpt = options.find(o => o.value === value || o.label === value) || null;
                                                    return (
                                                        <td key={colIndex} className="p-2 align-top min-w-[200px]">
                                                            <SingleSelect 
                                                                options={options}
                                                                value={selectedOpt}
                                                                onChange={(opt) => handleMatrizChange(rowIndex, col, opt?.label ?? "")}
                                                                placeholder="Selecione..."
                                                                isClearable={true}
                                                            />
                                                        </td>
                                                    );
                                                }

                                                // 2. Seleção Múltipla
                                                if (currentType === "selecao_multipla") {
                                                    const currentValArray = Array.isArray(value) ? value : [];
                                                    const selectedOpts = options.filter(o => currentValArray.includes(o.value) || currentValArray.includes(o.label));
                                                    
                                                    return (
                                                        <td key={colIndex} className="p-2 align-top min-w-[200px]">
                                                            <MultiSelect
                                                                options={options}
                                                                value={selectedOpts}
                                                                onChange={(opts) => {
                                                                    const val = Array.isArray(opts) ? opts.map(o => o.label) : [];
                                                                    handleMatrizChange(rowIndex, col, val);
                                                                }}
                                                                placeholder="Selecione..."
                                                                closeMenuOnSelect={false}
                                                            />
                                                        </td>
                                                    );
                                                }

                                                // 3. Inputs Padrão (Texto/Número)
                                                const mapTypeToInput = (type) => {
                                                    switch (type) {
                                                        case "numero": return "number";
                                                        case "texto": return "text";
                                                        default: return "text";
                                                    }
                                                };

                                                const placeholderText = currentType === "numero" ? "Ex: 1,2" : "Ex: Texto";

                                                return (
                                                    <td key={colIndex} className="p-2 align-top">
                                                        <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                            <input
                                                                type={mapTypeToInput(currentType)}
                                                                className="w-full rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-1 focus:ring-apollo-200/30 hover:border-apollo-200"
                                                                value={value}
                                                                placeholder={placeholderText}
                                                                
                                                                onChange={(e) => handleMatrizChange(rowIndex, col, e.target.value)}
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {/* Input Oculto que envia os dados como JSON com estrutura columns + data */}
                        <input
                            type="hidden"
                            id={nome}
                            name={nome}
                            value={JSON.stringify({ columns: columnOrder, data: matrizData })}
                        />
                    </div>
                );
            }

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
