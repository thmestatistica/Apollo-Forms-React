
// Fonte: Deles
// Test-retest reproducibility and smallest real difference of 5 hand function tests in patients with stroke
// Autores: H.M. Chen et al.
// Publicado em: Neurorehabilitation and Neural Repair (2009).
const TABELA_NORMAS_BBT = [
    { min: 20, max: 24, M: 88, F: 88 },
    { min: 25, max: 29, M: 86, F: 89 },
    { min: 30, max: 34, M: 81, F: 86 },
    { min: 35, max: 39, M: 82, F: 84 },
    { min: 40, max: 44, M: 79, F: 82 },
    { min: 45, max: 49, M: 77, F: 80 },
    { min: 50, max: 54, M: 79, F: 78 },
    { min: 55, max: 59, M: 75, F: 76 },
    { min: 60, max: 64, M: 71, F: 75 },
    { min: 65, max: 69, M: 71, F: 75 },
    { min: 70, max: 74, M: 66, F: 73 },
    { min: 75, max: Infinity, M: 63, F: 68 }
];

// Busca o valor de referência na tabela
const obterValorNormativo = (idade, sexo) => {
    const genero = sexo?.toUpperCase().startsWith("F") ? "F" : "M";
    
    const faixa = TABELA_NORMAS_BBT.find(f => idade >= f.min && idade <= f.max);
    return faixa ? faixa[genero] : TABELA_NORMAS_BBT[0][genero];
};
export const processarBoxAndBlocks = (respostas, idade, sexo) => {
    const dados = coletarBOXBLOCKTEST(respostas);
    const normaReferencia = obterValorNormativo(idade, sexo);

    // Calcula a normalização individual de cada lado (base 10)
    let radarDireito = (dados.blocosDireito / normaReferencia) * 10;
    let radarEsquerdo = (dados.blocosEsquerdo / normaReferencia) * 10;

    // console.log("Radar Direito:", radarDireito, "Radar Esquerdo:", radarEsquerdo, "Norma Referência:", normaReferencia);
    // console.log("Blocos Direito:", dados.blocosDireito, "Blocos Esquerdo:", dados.blocosEsquerdo);

    // Normalizando de nota de 0 a 10 para nota
    radarDireito = Math.min(Math.max(radarDireito, 0), 10);
    radarEsquerdo = Math.min(Math.max(radarEsquerdo, 0), 10);

    //Tira a média dos dois lados para gerar um ÚNICO resultado numérico
    const scoreFinalNormalizado = (radarDireito + radarEsquerdo) / 2;

    return {
        "resultado": Number(scoreFinalNormalizado), 
        "descricao": "Teste de Caixa e Blocos (Box and Block Test)",
        "doi": "10.5014/ajot.39.6.386",
        "nome_curto": "BOXBLOCK",
        "calculo": `Média do desempenho bilateral em relação à norma de blocos`,
        "calculo_processado": "Escore = (((blocosD / norma) * 10) + ((blocosE / norma) * 10)) / 2",
        "interpretacao": `O resultado final é a média de desempenho de ambos os membros, normalizada para a idade e sexo. O valor de referência populacional em blocos por minuto. Um resultado igual a 10 significa que o paciente atingiu exatamente 100% da média esperada.`
    };
};

export const coletarBOXBLOCKTEST = (form) => {
    const idsPerguntas = {
        blocosDireito: 1243,      
        blocosEsquerdo: 1246,         
    };

    const obterResposta = (id) => form.find((item) => Number(item.perguntaId) === id)?.resposta;

    const parseNumero = (valor) => {
        if (!valor) return 0;
        const numero = parseInt(valor.toString().split(" - ")[0], 10);
        return isNaN(numero) ? 0 : numero;
    };

    return {
        blocosDireito: parseNumero(obterResposta(idsPerguntas.blocosDireito)),
        blocosEsquerdo: parseNumero(obterResposta(idsPerguntas.blocosEsquerdo)),
    };
};
