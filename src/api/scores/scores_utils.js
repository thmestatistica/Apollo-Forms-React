import { agendamentos_pendentes, carregar_agendamento_por_id } from "../agenda/agenda_utils";
import axiosInstanceForms from "../forms/axiosInstanceForms";
import { carregar_info_form, carregar_perguntas_form, verificar_forms_respondidos } from "../forms/forms_utils";
import { listar_respostas_prontuario } from "../jornada/jornada_utils";

export const createScore = async (payload) => {
    try {
        const { data } = await axiosInstanceForms.post(`/score`, payload);
        return { ok: true, data };
    } catch (err) {
        console.error("Erro ao cadastrar Score", {
            message: err?.message,
            status: err?.response?.status,
            data: err?.response?.data,
        });
        return { ok: false, error: err };
    }
};

export const getScore = async (params) => {
    try {
        const { data } = await axiosInstanceForms.get('/score', { params });
        return { ok: true, data };

    } catch (err) {

        // Se não encontrou score, não considera erro fatal
        if (err?.response?.data?.detail === "Nenhum score encontrado") {
            return { ok: false, data: null };
        }

        console.error("Erro ao buscar Score com os filtros", {
            message: err?.message,
            status: err?.response?.status,
            data: err?.response?.data
        });

        return { ok: false, error: err };
    }
}

export const createPayloadForScore = async (pendencia, respostas, resultado) => {
    const agendamento = await carregar_agendamento_por_id(pendencia?.agendamentoId);
    const form = await carregar_info_form(pendencia?.formularioId);
    const perguntas = await carregar_perguntas_form(pendencia?.formularioId)

    const idsPerguntas = perguntas.map((pergunta) => pergunta?.pergunta_id);
    const textoPerguntas = perguntas.map((pergunta) => pergunta?.texto_pergunta)

    const inicio = new Date(agendamento?.inicio)
    const fim = new Date(agendamento?.fim)

    const formsRespondidos = await listar_respostas_prontuario(agendamento?.pacienteId)
    const ultimoForms = formsRespondidos?.at(-1)

    if (!ultimoForms) {
        // Regra de negócio, essa função é executada depois da resposta ser enviada, então se existe um formulário respondido para hoje talvez esse formulário seja o que queremos enviar a escala
        return "Não existem formulários respondidos para esse paciente";
    }

    if (ultimoForms.sessao_resposta?.agendamento_id != agendamento?.id) {
        // Se a ultima resposta não tiver o id do agendamento atual ele tenta achar pelo id do agendamento
        const formsRespondidoAg = formsRespondidos.filter(form => form.sessao_resposta.agendamento_id === agendamento?.id);

        if (formsRespondidoAg) {
            ultimoForms = formsRespondidoAg?.at(-1)
        } else {
            return "Falha ao encontrar id da resposta pelo id do agendamento"
        }
    }

    /*if (ultimoForms.sessao_resposta?.formulario_id != pendencia?.formularioId) {
        return "A resposta encontrada não condiz com o formulario atual"
    }*/

    /*const scoreExiste = await getScore({paciente_id: agendamento?.pacienteId, formulario_id: pendencia?.formularioId, sessao_resposta_id: ultimoForms?.sessao_resposta?.sessao_resposta_id})
    console.log(scoreExiste)

    if(scoreExiste.data){
        return "Esse score ja existe dentro da base"
    }*/

    const payload = {
        sessao_resposta_id: ultimoForms?.sessao_resposta?.sessao_resposta_id,
        formulario_id: pendencia?.formularioId,
        agendamento_id: agendamento?.id,

        slot_id: agendamento?.slotId,
        profissional_id: agendamento?.profissionalId,
        paciente_id: agendamento?.pacienteId,

        data_registro_sessao_resposta: new Date().toISOString(),
        data_score: new Date().toISOString(),

        nome_slot: agendamento?.slot?.nome,
        data_agendamento: inicio.toISOString().split("T")[0],
        hora_inicio: inicio.toISOString().split("T")[1].slice(0, 5),
        hora_final: fim.toISOString().split("T")[1].slice(0, 5),

        nome_paciente: agendamento.paciente?.nome,
        sexo_biologico: agendamento?.paciente?.sexoBiologico,

        diagnostico_macro: agendamento?.paciente?.diagnosticoMacro,
        diagnostico_principal: agendamento?.paciente?.diagnosticoPrincipal,
        diagnostico_secundario: agendamento?.paciente?.diagnostico_secundario,

        cid10_principal: agendamento?.paciente?.cid10_princ,
        cid10_secundario: agendamento?.paciente?.cid10_sec,

        nome_formulario: form?.nome_formulario,
        descricao_formulario: form?.descricao_formulario,
        tipo_formulario: form?.tipo_formulario,
        o_que_significa: form?.o_que_significa,
        doi: resultado?.doi,

        lista_pergunta_id: idsPerguntas,
        lista_perguntas: textoPerguntas,

        score_num: resultado?.resultado,
        score_descritivo: resultado?.descricao,
    };

    return payload;
};