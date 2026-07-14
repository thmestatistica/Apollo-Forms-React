/**
 * TESTE DE CAMINHADA (Capacidade Cardiorrespiratória)
 * Referência: Gibbons et al. (2001) - Reference values for a 6-minute walk test in healthy adults.
 * DOI: 10.1016/s0025-6196(11)63119-4
 */
const calcularDistanciaPreditaGibbons = (idade, sexo) => {
    const ehFeminino = sexo?.toUpperCase().startsWith("F");
    if (ehFeminino) {
        return 834.17 - (5.21 * idade);
    } else {
        return 1011.83 - (6.77 * idade);
    }
};

/**
 * TESTE DE SENTAR E LEVANTAR DE 1 MINUTO (Força Funcional de MMII)
 * Referência: Strassmann et al. (2013) - 1-minute sit-to-stand test: reference values in healthy adults.
 * DOI: 10.1183/09031936.00041712
 */
const obterNormaSTSStrassmann = (idade, sexo) => {
    const ehFeminino = sexo?.toUpperCase().startsWith("F");
    if (idade >= 18 && idade <= 39) return ehFeminino ? 39 : 44;
    if (idade >= 40 && idade <= 49) return ehFeminino ? 34 : 39;
    if (idade >= 50 && idade <= 59) return ehFeminino ? 31 : 35;
    if (idade >= 60 && idade <= 69) return ehFeminino ? 26 : 29;
    if (idade >= 70 && idade <= 79) return ehFeminino ? 21 : 24;
    return ehFeminino ? 15 : 18;
};


const parseNumero = (valor) => {
    if (valor === undefined || valor === null) return 0;
    
    // Se a resposta for um Array 
    if (Array.isArray(valor)) {
        if (valor.length === 0) return 0;
        valor = valor[0]; // Extrai o primeiro item relevante do array
    }
    
    // Se for string vazia ou apenas espaços
    if (typeof valor === 'string' && valor.trim() === '') return 0;

    // Extrai apenas os dígitos numéricos da string
    const numero = parseInt(valor.toString().match(/\d+/)?.[0], 10);
    return isNaN(numero) ? 0 : numero;
};


export const processarCondFisc = (respostas, idade, sexo) => {
    const rawCardio = coletarCardio(respostas);
    const rawSts = coletarSentarLevantar(respostas);

    const cardio = {
        distancia: parseNumero(rawCardio.distancia), 
        carga: parseNumero(rawCardio.carga),         
        fcInicial: parseNumero(rawCardio.fcInicial), 
        fcFinal: parseNumero(rawCardio.fcFinal),    
        borg: parseNumero(rawCardio.borg) 
    };

    // console.log("Cardio:", cardio);

    console.log(sexo, idade)
    const sts = {
        quantidadeRepeticoes: parseNumero(rawSts.quantidadeRepeticoes),
        tempoDecorrido: Number(rawSts.tempoDecorrido) || 60,
        precisouApoio: rawSts.precisouApoio,
        formaUnilateral: rawSts.formaUnilateral,
        repeticoesEsquerda: parseNumero(rawSts.repeticoesEsquerda),
        repeticoesDireita: parseNumero(rawSts.repeticoesDireita)
    };

    // console.log("STS:", sts);


    const normaDistancia = calcularDistanciaPreditaGibbons(idade, sexo);
    const scoreDistancia = (cardio.distancia / normaDistancia) * 10;
    const scoreBorg = cardio.borg > 0 ? (11 - cardio.borg) : 10;

    let radarCardio = (scoreDistancia + scoreBorg) / 2;
    radarCardio = Math.min(Math.max(radarCardio, 0), 10); // Limita de 0 a 10


    const normaSTS = obterNormaSTSStrassmann(idade, sexo);
    let radarSTS = 0;

    if (sts.formaUnilateral === "Sim") {
        const repEsqProjetada = (sts.repeticoesEsquerda / sts.tempoDecorrido) * 60;
        const repDirProjetada = (sts.repeticoesDireita / sts.tempoDecorrido) * 60;

        const scoreEsq = Math.min((repEsqProjetada / normaSTS) * 10, 10);
        const scoreDir = Math.min((repDirProjetada / normaSTS) * 10, 10);
        
        radarSTS = (scoreEsq + scoreDir) / 2;
    } else {
        const repProjetadas = (sts.quantidadeRepeticoes / sts.tempoDecorrido) * 60;
        radarSTS = (repProjetadas / normaSTS) * 10;
    }

    if (sts.precisouApoio === "Sim") {
        radarSTS -= 2; 
    }

    if (sts.tempoDecorrido < 60) {
        radarSTS *= 0.85;
    }

    radarSTS = Math.min(Math.max(radarSTS, 0), 10); // Limita de 0 a 10

    return [
            {
                resultado: Number(radarCardio.toFixed(2)),
                descricao: "Avaliação Cardiorrespiratória",
                doi: "10.1016/s0025-6196(11)63119-4",
                nome_curto: "Cardiorrespiratório",
                calculo: "Média ponderada entre a distância percorrida vs norma populacional e a percepção de esforço de Borg invertida.",
                calculo_processado: "Escore = ((((Distância Real / Distância Normativa) * 10) + (11 - Borg Real)) / 2)",
                interpretacao: "Avalia a capacidade aeróbica e a tolerância ao esforço cardiovascular. A distância de referência normativa (esperada para indivíduos saudáveis) é determinada via equação de regressão linear de Gibbons et al. (2001), baseada no sexo e idade do indivíduo (Mulheres: 834.17 - (5.21 * Idade) / Homens: 1011.83 - (6.77 * Idade)). Valores próximos a 10 indicam que o paciente atingiu ou superou a distância prevista mantendo baixa percepção de fadiga."
            },
            {
                resultado: Number(radarSTS.toFixed(2)),
                descricao: "Força Funcional de Membro Inferior (Sentar e Levantar)",
                doi: "10.1183/09031936.00041712",
                nome_curto: "Força MMII (STS)",
                calculo: "Número de repetições executadas (trabalhadas ou projetadas) em relação aos dados normativos, aplicando penalizações por uso de apoio ou interrupção prematura por exaustão.",
                calculo_processado: "Escore = (((Repetições Projetadas / Repetições Normativas) * 10) - Penalizações (Apoio: -2; Tempo < 60s: *0.85))",
                interpretacao: "Mede a força e a endurance dos membros inferiores. O número esperado (normativo) de repetições é obtido diretamente das tabelas de referência populacional de Strassmann et al. (2013), estabelecido conforme o sexo e faixas etárias específicas. Resultados próximos a 10 indicam excelente desempenho muscular e total independência funcional."
            }
        ];
};



export const coletarCardio = (form) => {
    const ids = { 
        distancia: 2069, 
        carga: 2070, 
        fcInicial: 2071, 
        fcFinal: 2072, 
        borg: 2073 
    };
    const obterResposta = (id) => form.find((item) => Number(item.perguntaId) === id)?.resposta;

    return {
        distancia: obterResposta(ids.distancia) ?? '',
        carga: obterResposta(ids.carga) ?? [],
        fcInicial: obterResposta(ids.fcInicial) ?? '',
        fcFinal: obterResposta(ids.fcFinal) ?? '',
        borg: obterResposta(ids.borg) ?? []
    };
};

export const coletarSentarLevantar = (form) => {
    const ids = {
        quantidadeRepeticoes: 2074,
        tempoDecorridoMedida: 2075,      
        tempoDecorridoMinutos: 2078,     
        tempoDecorridoSegundos: 2077,    
        precisouApoio: 2079,
        formaUnilateral: 2080,
        repeticoesEsquerda: 2081,
        repeticoesDireita: 2082
    };

    const obterResposta = (id) => form.find((item) => Number(item.perguntaId) === id)?.resposta;

    const medidaTempo = obterResposta(ids.tempoDecorridoMedida);
    const textoMedida = (Array.isArray(medidaTempo) ? medidaTempo[0] : medidaTempo)?.toString().toLowerCase() || "";
    
    let tempo = 0;

    if (textoMedida.includes("min")) {
        tempo = parseNumero(obterResposta(ids.tempoDecorridoMinutos)) * 60;
    } else if (textoMedida.includes("seg")) {
        tempo = parseNumero(obterResposta(ids.tempoDecorridoSegundos));
    } else {
        const min = parseNumero(obterResposta(ids.tempoDecorridoMinutos));
        const seg = parseNumero(obterResposta(ids.tempoDecorridoSegundos));
        tempo = min > 0 ? min * 60 : (seg > 0 ? seg : 60);
    }

    if (tempo === 0) {
        tempo = 60; 
    }

    const obterTextoSimples = (id) => {
        const resp = obterResposta(id);
        const valor = Array.isArray(resp) ? resp[0] : resp;
        return valor?.toString() || "Não";
    };

    return {
        quantidadeRepeticoes: obterResposta(ids.quantidadeRepeticoes) ?? '',
        tempoDecorrido: tempo, 
        precisouApoio: obterTextoSimples(ids.precisouApoio),
        formaUnilateral: obterTextoSimples(ids.formaUnilateral),
        repeticoesEsquerda: obterResposta(ids.repeticoesEsquerda) ?? '',
        repeticoesDireita: obterResposta(ids.repeticoesDireita) ?? ''
    };
};
