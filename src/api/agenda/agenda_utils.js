import axiosInstance from "../axiosInstance";

/**
 * Lista agendamentos com filtros opcionais.
 *
 * @param {Object} filters - Filtros opcionais.
 * @param {string} [filters.startDate] - Data no formato YYYY-MM-DD.
 * @param {number} [filters.usuarioId] - ID do usuário (inteiro).
 */
/**
 * Lista agendamentos com filtros opcionais.
 * @param {Object} filters
 * @param {string} [filters.startDate] - Data no formato YYYY-MM-DD.
 * @param {number} [filters.usuarioId] - ID do usuário.
 * @returns {Promise<Object|null>} Objeto retornado pela API ou null em erro.
 */
export const listar_agendamentos = async (filters = {}) => {
  try {
    // Monta os parâmetros apenas se existirem
    const params = {};

    // Adiciona startDate se fornecido
    if (filters.startDate) {
      params.startDate = filters.startDate;
    }

    // Adiciona usuarioId se for número
    if (typeof filters.usuarioId === "number") {
      params.usuarioId = filters.usuarioId;
    }

    console.log("Listando agendamentos com parâmetros:", params);
    // Requisição GET com query params
    const response = await axiosInstance.get("/pacientes/agendamentos", {
      params,
    });

    console.log("Agendamentos carregados:", response.data);

    return response.data;

  } catch (err) {
    // Log detalhado para debugging
    try {
      console.error("Erro ao listar agendamentos:", {
        message: err.message,
        code: err.code,
        config: err.config,
        responseStatus: err.response?.status,
        responseData: err.response?.data,
        request: err.request,
        axiosBaseURL: axiosInstance.defaults?.baseURL,
      });
    } catch (loggingError) {
      console.error("Erro ao registrar detalhes do erro:", loggingError);
    }

    return null;
  }
};

/**
 * Lista agendamentos e remove aqueles cujo nome do paciente indica vaga ou teste.
 * Critérios de exclusão (case-insensitive): contém "Paciente de Testes" ou "VAGO".
 * @param {Object} filters Mesmo formato de `listar_agendamentos`.
 * @returns {Promise<Array>} Lista filtrada de agendamentos.
 */
export const listar_agendamentos_filtrados = async (filters = {}) => {
  try {
    const dados = await listar_agendamentos(filters);
    // A API pode retornar direto um array ou um objeto com chave 'agendamentos'
    const lista = Array.isArray(dados?.agendamentos)
      ? dados.agendamentos
      : Array.isArray(dados)
        ? dados
        : [];

    const filtrados = lista.filter((agendamento) => {
      const nome = agendamento?.paciente?.nome || "";
      const n = nome.toLowerCase();
      if (n.includes("paciente de testes") || n.includes("vago")) return false;
      return true;
    });

    return filtrados;
  } catch (err) {
    console.error("Erro ao listar agendamentos filtrados", err);
    return [];
  }
};


/**
 * Busca os agendamentos pendentes de um profissional.
 * A função primeiro busca os IDs dos agendamentos do profissional e, em seguida,
 * busca os detalhes de cada agendamento em paralelo para otimizar o tempo de carregamento.
 *
 * @param {number} profissionalId - O ID do profissional.
 * @returns {Promise<Array|null>} Uma lista de objetos de agendamento ou null em caso de erro.
 */
export const agendamentos_pendentes = async (profissionalId) => {
    // 1. Validação para evitar chamadas com ID inválido.
    if (!profissionalId || typeof profissionalId !== 'number') {
        console.error("ID do profissional inválido ou não fornecido.");
        return null;
    }

    try {
        // 2. Busca os dados do profissional, que contêm os IDs dos agendamentos.
        const profissionalData = await axiosInstance.get(`/pacientes/profissionais/${profissionalId}`);

        // Se o profissional não for encontrado ou não tiver agendamentos, retorna uma lista vazia.
        if (!profissionalData?.data || !profissionalData.data.ag_presenca_ids) {
            console.warn(`Profissional com ID ${profissionalId} não encontrado ou sem agendamentos pendentes.`);
            return [];
        }

        const agendamentoIds = Object.values(profissionalData.data.ag_presenca_ids);

        // Se não houver IDs, não há o que buscar.
        if (agendamentoIds.length === 0) {
            return [];
        }

        // 3. Cria um array de promessas para buscar todos os agendamentos em paralelo.
        const promessasDeAgendamentos = agendamentoIds.map(id =>
            axiosInstance.get(`/pacientes/agendamentos/${id}`).then(res => res.data)
        );

        // 4. Executa todas as promessas em paralelo e aguarda a conclusão de todas.
        const agendamentosResolvidos = await Promise.all(promessasDeAgendamentos);

        // Filtra qualquer resultado nulo que possa ter ocorrido se um agendamento individual não for encontrado.
        return agendamentosResolvidos.filter(ag => ag != null);

    } catch (err) {
        console.error(`Erro ao processar agendamentos pendentes para o profissional ${profissionalId}:`, {
            message: err.message,
            code: err.code,
            responseStatus: err.response?.status,
            responseData: err.response?.data,
        });
        return null; // Retorna null para indicar que ocorreu um erro na operação.
    }
}


export const carregar_escalas_pendentes = async (pacienteId, especialidade) => {
  // 1. Validação para evitar chamadas com ID inválido.
  if (!pacienteId || typeof pacienteId !== "number") {
    console.error("ID do paciente inválido ou não fornecido.");
    return null;
  }

  if(!especialidade || typeof especialidade !== "string") {
    console.error("Especialidade inválida ou não fornecida.");
    return null;
  }

  const status = "ABERTA";

  try {
    // 2. Busca as escalas pendentes do paciente. Usa params corretamente.
    const response = await axiosInstance.get(`/pendencias`, {
      params: { pacienteId, especialidade, status },
    });

    const data = response?.data;
    console.log("Escalas pendentes carregadas:", data);

    // Garante retorno previsível (array) para o chamador
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.escalas)) return data.escalas;
    return [];
  } catch (err) {
    console.error(
      `Erro ao carregar escalas pendentes para o paciente ${pacienteId}:`,
      err
    );
    return [];
  }
};