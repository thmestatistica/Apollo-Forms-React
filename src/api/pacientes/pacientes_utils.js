import axiosInstance from '../axiosInstance';

/**
 * Busca os dados de um paciente pelo ID.
 */
export const buscar_paciente_por_id = async (id) => {
  if (!id) return null;
  try {
    const { data } = await axiosInstance.get(`/pacientes/${Number(id)}`);
    return data;
  } catch (err) {
    console.error(`Erro ao buscar paciente ${id}:`, err);
    throw err;
  }
};

export const atualizar_diagnostico_paciente = async (pacienteId, diagnosticoMacro) => {
  if (!pacienteId) throw new Error('ID do paciente nao informado');

  const diagnosticoList = Array.isArray(diagnosticoMacro) ? diagnosticoMacro : [diagnosticoMacro];

  const payload = {
    diagnosticoMacro: diagnosticoList
  };

  const { data } = await axiosInstance.put(`/pacientes/${Number(pacienteId)}`, payload);
  return data;
};

/**
 * Lista todos os pacientes via GET /pacientes
 * Retorna array de pacientes.
 */
export const listar_pacientes_geral = async () => {
  try {
    const { data } = await axiosInstance.get('/pacientes');
    // Ajuste conforme retorno da API (se vier { pacientes: [...] } ou array direto)
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.pacientes)) return data.pacientes;
    return [];
  } catch (err) {
    console.error("Erro ao listar todos os pacientes:", err);
    // Retorna vazio para evitar quebrar a UI
    return [];
  }
};

/**
 * Lista pacientes vinculados a agendamentos de um profissional.
 * GET /pacientes/profissionais/:id_profissional/listar-pacientes
 */
export const listar_pacientes_por_profissional = async (profissionalId) => {
  if (!profissionalId) return [];

  try {
    const { data } = await axiosInstance.get(
      `/pacientes/profissionais/${Number(profissionalId)}/listar-pacientes`
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.pacientes)) return data.pacientes;
    return [];
  } catch (err) {
    console.error(`Erro ao listar pacientes do profissional ${profissionalId}:`, err);
    return [];
  }
};
