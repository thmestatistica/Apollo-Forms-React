// src/utils/jornada/format.js

// 1. Formata Nome (Ex: "JOAO DA SILVA" -> "Joao Da Silva")
export const formatarNome = (nome) => {
    if (!nome) return "";
    return nome
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// 2. Processa os dados brutos de respostas (Prontuário)
export const processarProntuario = (dadosBrutos) => {
    if (!dadosBrutos || !Array.isArray(dadosBrutos)) return [];

    const mapa = {};

    dadosBrutos.forEach(item => {
        const sessao = item.sessao_resposta || {};
        const id = sessao.sessao_resposta_id;
        
        if (!id) return;

        // Se a sessão ainda não existe no mapa, cria o cabeçalho
        if (!mapa[id]) {
            mapa[id] = {
                id: id,
                data_registro: sessao.data_aplicacao_sessao, // Data ISO
                profissional_nome: sessao.profissional?.nome || "—",
                nome_formulario: sessao.formulario?.nome_formulario || "Evolução",
                tipo_formulario: sessao.formulario?.tipo_formulario || "—",
                respostas: []
            };
        }

        // Processa o valor da resposta
        let valor = item.valor_resposta;

        // Verifica se existe, se é string e se parece um array (ex: '["Opção A"]')
        if (valor && typeof valor === 'string' && valor.trim().startsWith('[') && valor.trim().endsWith(']')) {
            // Remove aspas duplas, colchete de abertura e colchete de fechamento
            // Regex corrigido: /["[\]]/g remove ", [ e ]
            valor = valor.replace(/["[\]]/g, ''); 
        }

        // Adiciona a resposta à sessão
        mapa[id].respostas.push({
            pergunta: item.pergunta?.texto_pergunta || "Questão",
            resposta: valor,
            ordem: item.pergunta?.ordem_pergunta || 999
        });
    });

    // Converte o mapa em array ordenado por data (mais recente primeiro)
    return Object.values(mapa)
        .map(sessao => {
            // Ordena as perguntas pela ordem definida no formulário
            sessao.respostas.sort((a, b) => a.ordem - b.ordem);
            return sessao;
        })
        .sort((a, b) => new Date(b.data_registro) - new Date(a.data_registro));
};