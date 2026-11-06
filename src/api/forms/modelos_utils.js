import axiosInstanceForms from "./axiosInstanceForms";

// ---------- Modelo ----------

export const criar_modelo = async (payload) => {
    if (!payload) {
        return
    }

    try {
        const response = await axiosInstanceForms.post("/modelos/", payload)
        return response.data
    } catch (error) {
        console.error("Erro ao criar modelo")
    }
}

// filtros opcionais: { ativo: true/false, nome: "texto parcial" }
export const listar_modelos = async (filtros = {}) => {
    try {
        const response = await axiosInstanceForms.get("/modelos/", {
            params: filtros,
        })
        return response.data
    } catch (error) {
        console.error("Erro ao listar modelos")
    }
}

export const listar_modelos_por_formulario = async (formularioId, ativo) => {
    if (!formularioId) {
        return
    }

    try {
        const response = await axiosInstanceForms.get(
            `/modelos/by-formulario/${formularioId}`,
            { params: { ativo } }
        )
        return response.data
    } catch (error) {
        console.error("Erro ao listar modelos do formulário")
    }
}

export const buscar_modelo = async (modeloId) => {
    if (!modeloId) {
        return
    }

    try {
        const response = await axiosInstanceForms.get(`/modelos/${modeloId}`)
        return response.data
    } catch (error) {
        console.error("Erro ao buscar modelo")
    }
}

// payload: { nome?, observacao?, ativo? }
export const atualizar_modelo = async (modeloId, payload) => {
    if (!modeloId || !payload) {
        return
    }

    try {
        const response = await axiosInstanceForms.put(`/modelos/${modeloId}`, payload)
        return response.data
    } catch (error) {
        console.error("Erro ao atualizar modelo")
    }
}

export const deletar_modelo = async (modeloId) => {
    if (!modeloId) {
        return
    }

    try {
        await axiosInstanceForms.delete(`/modelos/${modeloId}`)
        return true
    } catch (error) {
        console.error("Erro ao deletar modelo")
        return false
    }
}

// ---------- Modelo <-> Formulário ----------

export const listar_formularios_do_modelo = async (modeloId, ativo) => {
    if (!modeloId) {
        return
    }

    try {
        const response = await axiosInstanceForms.get(
            `/modelos/${modeloId}/formularios`,
            { params: { ativo } }
        )
        return response.data
    } catch (error) {
        console.error("Erro ao listar formulários do modelo")
    }
}

// Associa (os já associados são ignorados). formularioIds: [1, 2, 3]
export const adicionar_formularios_ao_modelo = async (modeloId, formularioIds) => {
    if (!modeloId || !formularioIds) {
        return
    }

    try {
        const response = await axiosInstanceForms.post(
            `/modelos/${modeloId}/formularios`,
            { formulario_ids: formularioIds }
        )
        return response.data
    } catch (error) {
        console.error("Erro ao associar formulários ao modelo")
    }
}

// Substitui todos os formulários do modelo pela lista informada
export const definir_formularios_do_modelo = async (modeloId, formularioIds) => {
    if (!modeloId || !formularioIds) {
        return
    }

    try {
        const response = await axiosInstanceForms.put(
            `/modelos/${modeloId}/formularios`,
            { formulario_ids: formularioIds }
        )
        return response.data
    } catch (error) {
        console.error("Erro ao atualizar formulários do modelo")
    }
}

export const remover_formulario_do_modelo = async (modeloId, formularioId) => {
    if (!modeloId || !formularioId) {
        return
    }

    try {
        await axiosInstanceForms.delete(`/modelos/${modeloId}/formularios/${formularioId}`)
        return true
    } catch (error) {
        console.error("Erro ao remover formulário do modelo")
        return false
    }
}