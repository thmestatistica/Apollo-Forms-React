import axiosInstanceForms from "./axiosInstanceForms";

/**
 * Realiza o upload de um arquivo para o backend.
 * O backend processa o envio para o Google Drive e salva os metadados.
 * 
 * @param {File} arquivo - O objeto File obtido de um input ou dropzone.
 * @param {Object} params - Parâmetros adicionais para o upload.
 * @param {number|string} [params.pacienteId] - ID do paciente para organização de pastas.
 * @param {number|string} [params.profissionalId] - ID do profissional que realiza o upload.
 * @param {string} [params.categoria] - Categoria para a hierarquia de pastas (ex: 'Exames').
 * @param {string} [params.subCategoria] - Subcategoria para a hierarquia (ex: 'Sangue').
 * @returns {Promise<{ok: boolean, data?: Object, error?: Error}>}
 */
export const enviar_upload_arquivo = async (arquivo, { pacienteId, profissionalId, categoria, subCategoria } = {}) => {
  try {
    if (!arquivo) {
      throw new Error("Nenhum arquivo fornecido para upload.");
    }

    // FormData é necessário para enviar arquivos binários via multipart/form-data
    const formData = new FormData();
    formData.append("file", arquivo);

    if (pacienteId) {
      formData.append("paciente_id", String(pacienteId));
    }
    if (profissionalId) {
      formData.append("profissional_id", String(profissionalId));
    }
    if (categoria) {
      formData.append("categoria", categoria);
    }
    if (subCategoria) {
      formData.append("sub_categoria", subCategoria);
    }

    // O cabeçalho 'Content-Type': 'multipart/form-data' é configurado automaticamente pelo Axios ao receber FormData
    const { data } = await axiosInstanceForms.post("/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return { ok: true, data };

  } catch (err) {
    console.error("Erro ao realizar upload do arquivo:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });

    return { ok: false, error: err };
  }
};