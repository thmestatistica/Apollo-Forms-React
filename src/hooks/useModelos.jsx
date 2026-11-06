import { useState, useCallback, useEffect, useMemo } from 'react'
import Swal from 'sweetalert2'
import { listar_modelos } from '../api/forms/modelos_utils'

function useModelos(filtros = {}) {
    const [listaModelos, setListaModelos] = useState([])
    const [loadingModelos, setLoadingModelos] = useState(false)
    const [reloadKey, setReloadKey] = useState(0)

    const filtrosKey = JSON.stringify(filtros)

    const fetchModelos = useCallback(async () => {
        setLoadingModelos(true)
        try {
            const dados = await listar_modelos(JSON.parse(filtrosKey))
            setListaModelos(dados || [])
        } catch (error) {
            Swal.fire('Erro', 'Não foi possível carregar os modelos.', 'error')
        } finally {
            setLoadingModelos(false)
        }
    }, [filtrosKey])

    useEffect(() => {
        fetchModelos()
    }, [fetchModelos, reloadKey])

    const modelosOptions = useMemo(
        () =>
            listaModelos.map((modelo) => ({
                value: modelo.modelo_id,
                label: modelo.nome_modelo,
            })),
        [listaModelos]
    )

    const reload = useCallback(() => setReloadKey((k) => k + 1), [])

    return {
        listaModelos,
        modelosOptions,
        loadingModelos,
        reloadKey,
        reload,
    }
}

export default useModelos