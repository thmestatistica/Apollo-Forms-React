import { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { listar_formularios } from '../api/forms/forms_utils';

function useForms() {
    const [listaFormularios, setListaFormularios] = useState([]);
    const [loadingLista, setLoadingLista] = useState(false);

    const fetchFormularios = useCallback(async () => {
        setLoadingLista(true);
        try {
            const dados = await listar_formularios();
            setListaFormularios(dados || []);
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os formulários.', 'error');
        } finally {
            setLoadingLista(false);
        }
    }, []);

    const formulariosOptions = useMemo(() => {
        return listaFormularios.map((formulario) => ({
            value: formulario.formulario_id,
            label: formulario.nome_formulario,
        }));
    }, [listaFormularios]);

    const reload = useCallback(() => {
        return fetchFormularios();
    }, [fetchFormularios]);

    return {
        listaFormularios,
        formulariosOptions,
        loadingLista,
        fetchFormularios,
        reload,
    };
}

export default useForms;