import { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { listar_agendamentos_paciente } from '../api/jornada/jornada_utils';

function useAgendamentos(pacienteId) {
    const [agendamentos, setAgendamentos] = useState([]);
    const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);

    const fetchAgendamentos = useCallback(async () => {
        if (!pacienteId) {
            setAgendamentos([]);
            return;
        }

        setLoadingAgendamentos(true);
        try {
            const dados = await listar_agendamentos_paciente(pacienteId);

            const ordenados = [...(dados || [])].sort(
                (a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime()
            );

            setAgendamentos(ordenados);
        } catch (error) {
            console.error('Erro ao carregar agendamentos', error);
            Swal.fire('Erro', 'Não foi possível carregar os agendamentos.', 'error');
        } finally {
            setLoadingAgendamentos(false);
        }
    }, [pacienteId]);

    useEffect(() => {
        fetchAgendamentos();
    }, [fetchAgendamentos]);

    const reload = useCallback(() => {
        return fetchAgendamentos();
    }, [fetchAgendamentos]);

    const agendamentosIdsList = useMemo(
        () => agendamentos.map(({ id, tipo }) => ({ id, tipo })),
        [agendamentos]
    );

    return {
        agendamentos,
        agendamentosIdsList,
        loadingAgendamentos,
        fetchAgendamentos,
        reload,
    };
}

export default useAgendamentos;