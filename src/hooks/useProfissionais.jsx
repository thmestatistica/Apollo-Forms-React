import { useState, useCallback, useMemo } from 'react';
import Swal from 'sweetalert2';
import { listar_pendencias_profissionais, listar_profissionais } from '../api/profissionais/profissionais_utils';

function useProfissionais() {
    const [listaProfissionais, setListaProfissionais] = useState([]);
    const [pendenciasProfissionais, setPendenciasProfissionais] = useState([]);
    const [loadingLista, setLoadingLista] = useState(false);
    const [loadingPendencias, setLoadingPendencias] = useState(false)

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

    const fetchPendenciasProfissionais = useCallback(async () => {
        setLoadingPendencias(true);
        try {
            const dados = await listar_pendencias_profissionais();
            setPendenciasProfissionais(dados || [])
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar as pendencias dos profissionais.', 'error');
        } finally {
            setLoadingPendencias(false)
        }
    })

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
        fetchProfissionais(); 
        fetchPendenciasProfissionais()
        return
    }, [fetchProfissionais]);

    return {
        listaProfissionais,
        pendenciasProfissionais,
        profissionaisOptions,
        presencasList,
        presencasMap,
        loadingLista,
        loadingPendencias,
        fetchProfissionais,
        fetchPendenciasProfissionais,
        reload,
    };
}

export default useProfissionais;