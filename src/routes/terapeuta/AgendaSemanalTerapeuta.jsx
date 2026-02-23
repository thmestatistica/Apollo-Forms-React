import { useAuth } from "../../hooks/useAuth.jsx";

import { listar_agendamentos_filtrados } from "../../api/agenda/agenda_utils.js";
import { listar_profissionais } from "../../api/profissionais/profissionais_utils.js";

import SingleSelect from "../../components/input/SingleSelect.jsx";
import AgendaSemanalGenerica from "../../components/agenda/AgendaSemanalGenerica.jsx";
import CardAgendamentoTerapeuta from "../../components/agenda/CardAgendamentoTerapeuta.jsx";

const SELECT_ALLOWED_USER_IDS = [52, 4];

function AgendaSemanalTerapeuta() {
    const { user } = useAuth();
    const isAdminView = user ? SELECT_ALLOWED_USER_IDS.includes(user.id) : false;

    // Adapter: lista de "pacientes" será, neste caso, profissionais mapeados para { id, nome, ativo }
    const listarProfissionaisAdaptado = async () => {
        const profs = await listar_profissionais();
        return (profs || []).map(p => ({
            id: p.usuarioId ?? p.id ?? p.profissionalId ?? null,
            nome: p.usuario?.nome || p.nome || '—',
            ativo: p.usuario?.ativo ?? true,
            cor: p.cor || (p.usuario && p.usuario.cor)
        }));
    };

    // Adapter: listar agendamentos espera { startDate, endDate, pessoaId } -> usamos pessoaId como usuarioId
    const listarAgendamentosAdaptado = async (params) => {
        const { startDate, endDate, pessoaId, usuarioId: usuarioIdParam } = params || {};
        const usuarioId = pessoaId ?? usuarioIdParam ?? user?.id ?? null;
        const resp = await listar_agendamentos_filtrados({ startDate, endDate, usuarioId });
        return resp || [];
    };

    // Filtro customizado exibido apenas para admins selecionados
    const FiltroProfissionais = ({ pessoas, pessoaId, setPessoaId }) => {
        if (!isAdminView) return null;
        const options = (pessoas || []).filter(p => p.ativo !== false).map(p => ({ value: p.id, label: p.nome }));
        const selected = options.find(o => o.value === pessoaId) ?? options[0];
        return <SingleSelect options={options} value={selected} onChange={opt => setPessoaId(opt?.value ?? null)} placeholder="Filtrar Terapeuta" />;
    };

    const CardGroup = ({ agendamentos, isMobile }) => agendamentos.map(m => <CardAgendamentoTerapeuta key={m.id} agendamento={m} isMobile={isMobile} />);

    return (
        <AgendaSemanalGenerica
            listarAgendamentos={listarAgendamentosAdaptado}
            listarPessoas={listarProfissionaisAdaptado}
            CardComponent={CardGroup}
            FiltroComponent={FiltroProfissionais}
            tipo="terapeuta"
            titulo={"📆 Agenda Semanal do Terapeuta"}
            initialPessoaId={user?.id }
        />
    );
}

export default AgendaSemanalTerapeuta;