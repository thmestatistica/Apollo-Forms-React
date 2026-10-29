import { useState, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { listar_profissionais } from '../api/profissionais/profissionais_utils';

function useProfissionais() {
    const [listaProfissionais, setListaProfissionais] = useState([]);
    const [loadingLista, setLoadingLista] = useState(false);

    const fetchProfissionais = useCallback(async () => {
        setLoadingLista(true);
        try {
            const dados = await listar_profissionais();
            setListaProfissionais(dados || []);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os profissionais.', 'error');
        } finally {
            setLoadingLista(false);
        }
    }, []);

    const profissionaisOptions = useMemo(() => {
        return listaProfissionais.map((profissional) => ({
            value: profissional.id,
            label: profissional.nomeCompleto || `Profissional #${profissional.id}`,
        }));
    }, [listaProfissionais]);

    const presencasList = useMemo(() => {
        return listaProfissionais.flatMap((profissional) =>
            (profissional.ag_presenca_ids || []).map((agPresencaId) => ({
                id: agPresencaId,
                profissional: {
                    id: profissional.id,
                    nomeCompleto: profissional.nomeCompleto,
                },
            }))
        );
    }, [listaProfissionais]);

    const presencasMap = useMemo(() => {
        return presencasList.reduce((acc, item) => {
            acc[item.id] = item.profissional;
            return acc;
        }, {});
    }, [presencasList]);

    const reload = useCallback(() => {
        return fetchProfissionais();
    }, [fetchProfissionais]);

    return {
        listaProfissionais,
        profissionaisOptions,
        presencasList,
        presencasMap,
        loadingLista,
        fetchProfissionais,
        reload,
    };
}

export default useProfissionais;