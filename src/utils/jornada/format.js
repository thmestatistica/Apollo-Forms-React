export const formatarNome = (nome) => {
    if (!nome) return "";
    return nome.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
};

// RENOMEADO: De 'formatarDataHoraStreamlit' para 'formatarDataHora'
// Lógica: Pega os números exatos (UTC) ignorando o fuso do navegador.
// Use isso para o HISTÓRICO (AppointmentItem)
export const formatarDataHora = (dataIso) => {
    if (!dataIso) return { data: "—", hora: "—" };
    const d = new Date(dataIso);
    
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    
    const hora = String(d.getUTCHours()).padStart(2, '0');
    const min = String(d.getUTCMinutes()).padStart(2, '0');
    
    return { data: `${dia}/${mes}/${ano}`, hora: `${hora}:${min}` };
};

// Lógica: Converte para Fuso Brasil (UTC-3).
// Use isso para o PRONTUÁRIO (ProntuarioItem) para mostrar a hora real do registro.
export const formatarDataHoraBR = (dataIso) => {
    if (!dataIso) return { data: "—", hora: "—" };
    const d = new Date(dataIso);
    
    const data = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    const hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
    
    return { data, hora };
};

// ... (Mantenha extrairEspecialidade e processarProntuario iguais)
const extrairEspecialidade = (ag, sessao) => {
    const unwrap = (val) => {
        if (!val) return null;
        if (Array.isArray(val)) {
            if (val.length === 0) return null;
            const first = val[0];
            if (Array.isArray(first)) return first.length > 0 ? String(first[0]) : null;
            return String(first);
        }
        return String(val);
    };

    let spec = null;
    if (ag?.especialidade) spec = unwrap(ag.especialidade);
    if (!spec && ag?.profissional?.especialidade) spec = unwrap(ag.profissional.especialidade);
    if (!spec && sessao?.profissional?.especialidade) spec = unwrap(sessao.profissional.especialidade);

    if (!spec || spec === "null" || spec === "undefined" || spec.trim() === "") return "Outros";
    return spec.charAt(0).toUpperCase() + spec.slice(1).toLowerCase();
};

export const processarProntuario = (dadosBrutos, agendamentos = []) => {
    if (!dadosBrutos || !Array.isArray(dadosBrutos)) return [];

    const agendamentoMap = new Map();
    agendamentos.forEach(ag => {
        if (ag.id) agendamentoMap.set(String(ag.id), ag);
    });

    const mapaSessoes = {};

    dadosBrutos.forEach(item => {
        const sessao = item.sessao_resposta || {};
        const id = sessao.sessao_resposta_id;
        if (!id) return;

        if (!mapaSessoes[id]) {
            mapaSessoes[id] = {
                id: id,
                agendamento_id: sessao.agendamento_id,
                sessao_raw: sessao,
                data_registro: sessao.data_aplicacao_sessao,
                profissional_nome: sessao.profissional?.nome || "—",
                nome_formulario: sessao.formulario?.nome_formulario || "Evolução",
                tipo_formulario: sessao.formulario?.tipo_formulario || "—",
                respostas: []
            };
        }
        
        let valor = item.valor_resposta;
        if (valor && typeof valor === 'string' && valor.trim().startsWith('[') && valor.trim().endsWith(']')) {
            valor = valor.replace(/["[\]]/g, '');
        }

        mapaSessoes[id].respostas.push({
            pergunta: item.pergunta?.texto_pergunta || "Questão",
            resposta: valor,
            ordem: item.pergunta?.ordem_pergunta || 999
        });
    });

    return Object.values(mapaSessoes)
        .map(s => {
            s.respostas.sort((a, b) => a.ordem - b.ordem);
            const ag = agendamentoMap.get(String(s.agendamento_id));
            s.data_ordenacao = ag ? new Date(ag.inicio) : new Date(s.data_registro);
            s.especialidade = extrairEspecialidade(ag, s.sessao_raw);
            return s;
        })
        .sort((a, b) => b.data_ordenacao - a.data_ordenacao);
};