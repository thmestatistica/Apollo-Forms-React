import React from 'react';


const TabelaMatriz = ({ resposta }) => {
    if (!resposta) return null;

    let dadosParsed = {};
    let isJson = false;

    // Função auxiliar para tentar parsear JSON
    const tentarParsear = (str) => {
        try {
            return JSON.parse(str);
        } catch (e) {
            console.warn("Falha ao parsear resposta como JSON: ", e);
            return null;
        }
    };

    // Tentar identificar se é JSON válido
    if (typeof resposta === 'object' && resposta !== null) {
        dadosParsed = resposta;
        isJson = true;
    } else if (typeof resposta === 'string') {
        const trimmed = resposta.trim();
        // 1. Tenta parse normal
        let parsed = tentarParsear(trimmed);
        
        // 2. Se falhar e parecer Python dict (aspas simples), tenta converter aspas
        if (!parsed && trimmed.includes("'")) {
             // Substitui aspas simples por duplas, tentando evitar quebras simples
             const jsonString = trimmed.replace(/'/g, '"').replace(/True/g, 'true').replace(/False/g, 'false').replace(/None/g, 'null'); 
             parsed = tentarParsear(jsonString);
        }

        if (parsed) {
            dadosParsed = parsed;
            isJson = true;
        }
    }

    // Se não for JSON estruturado, renderiza como texto (fallback)
    if (!isJson) {
        return <p className="text-gray-600 text-sm whitespace-pre-wrap">{String(resposta)}</p>;
    }

    // Ex: { columns: ["A", "B"], data: [{ "A": 1, "B": 2 }] }
    if (dadosParsed.columns && Array.isArray(dadosParsed.columns) && Array.isArray(dadosParsed.data)) {
        const colunas = dadosParsed.columns;
        const linhas = dadosParsed.data;

        if (linhas.length === 0) return <p className="text-gray-500 italic">Tabela vazia.</p>;

        return (
            <div className="overflow-x-auto my-2 border border-apollo-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-apollo-200 text-sm">
                    <thead className="bg-apollo-50">
                        <tr>
                            {colunas.map((col, i) => (
                                <th key={i} scope="col" className="px-4 py-2 font-bold text-apollo-800 uppercase tracking-wider text-xs whitespace-nowrap text-center">
                                    {col}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-apollo-200">
                        {linhas.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                {colunas.map((col, cIdx) => {
                                    const cellValue = row[col];
                                    
                                    // Helper para extrair label se existir
                                    const getDisplayValue = (val) => {
                                        if (val && typeof val === 'object' && val.label) return val.label;
                                        if (val && typeof val === 'object') return JSON.stringify(val);
                                        return String(val);
                                    };

                                    return (
                                        <td key={cIdx} className="px-4 py-2 text-gray-700 whitespace-nowrap text-center">
                                            {Array.isArray(cellValue) ? (
                                                <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                                                    {cellValue.map((item, idx) => (
                                                        <span key={idx} className="bg-gray-100 text-gray-800 text-xs font-medium px-2 py-0.5 rounded border border-gray-200">
                                                            {getDisplayValue(item)}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                cellValue !== undefined ? getDisplayValue(cellValue) : "—"
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }
    
    // Fallback genérico para objetos ou arrays simples (sem colunas definidas)
    let linhasGenericas = [];
    let headersGenericos = ["Chave", "Valor"]; // Padrão

    // Se for array de objetos simples, tentamos criar colunas dinamicamente
    if (Array.isArray(dadosParsed)) {
        if (dadosParsed.length > 0 && typeof dadosParsed[0] === 'object') {
             // Tabela dinâmica simples para array de objetos desconhecidos
             const chaves = Object.keys(dadosParsed[0]);
             if (chaves.length > 0) {
                 return (
                     <div className="overflow-x-auto my-2 border border-apollo-200 rounded-lg shadow-sm">
                         <table className="min-w-full divide-y divide-apollo-100 text-sm">
                             <thead className="bg-apollo-50">
                                 <tr>
                                     {chaves.map((k, i) => <th key={i} className="px-4 py-2 text-left font-bold text-xs uppercase text-apollo-700">{k}</th>)}
                                 </tr>
                             </thead>
                             <tbody className="bg-white divide-y divide-apollo-100">
                                 {dadosParsed.map((item, idx) => (
                                     <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                         {chaves.map((k, cIdx) => (
                                             <td key={cIdx} className="px-4 py-2 text-gray-700">
                                                 {typeof item[k] === 'object' ? JSON.stringify(item[k]) : String(item[k])}
                                             </td>
                                         ))}
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 );
             }
        }
        // Se for array de strings/tipos simples
        linhasGenericas = dadosParsed.map((item, idx) => [`Item ${idx + 1}`, typeof item === 'object' ? JSON.stringify(item) : String(item)]);
        headersGenericos = ["Índice", "Valor"];
    } else {
        // Objeto chave-valor simples
        linhasGenericas = Object.entries(dadosParsed);
        headersGenericos = ["Questão/Chave", "Resposta/Valor"];
    }

    if (linhasGenericas.length === 0) return <p className="text-gray-500 italic">Tabela vazia.</p>;

    return (
        <div className="overflow-x-auto my-2 border border-apollo-200 rounded-lg shadow-sm">
            <table className="min-w-full divide-y divide-apollo-100 text-sm">
                <thead className="bg-apollo-50">
                    <tr>
                        <th scope="col" className="px-4 py-2 text-left font-bold text-apollo-700 uppercase tracking-wider text-xs">
                            {headersGenericos[0]}
                        </th>
                        <th scope="col" className="px-4 py-2 text-left font-bold text-apollo-700 uppercase tracking-wider text-xs">
                            {headersGenericos[1]}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-apollo-100">
                    {linhasGenericas.map(([chave, valor], idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                            <td className="px-4 py-2 text-gray-800 font-medium">
                                {chave}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                                {typeof valor === 'object' ? JSON.stringify(valor) : String(valor)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default TabelaMatriz;
