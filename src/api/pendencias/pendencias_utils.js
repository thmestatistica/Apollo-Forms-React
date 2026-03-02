import axiosInstance from "../axiosInstance";

// Formata para 'YYYY-MM-DD HH:mm:ss.SSS' removendo 'T' e 'Z' do ISO.
const formatDateBackend = (date) => {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    return d.toISOString().replace('T', ' ').replace('Z', '');
  } catch {
    return null;
  }
};

/**
 * ============================================================
 * 🛡️ FUNÇÕES ADMINISTRATIVAS (Painel de Gestão)
 * ============================================================
 */

// 1. LISTAR TUDO (ADMIN)
export const buscar_todas_pendencias = async (filtros = {}) => {
  try {
    const { data } = await axiosInstance.get('/pendencias/admin/todas', { params: filtros });
    return data;
  } catch (error) {
    console.error("Erro ao buscar pendências admin:", error);
    throw error;
  }
};

// 2. ATUALIZAR NA FORÇA BRUTA (ADMIN)
export const atualizar_pendencia_admin = async (id, dadosAtualizados) => {
  try {
    const { data } = await axiosInstance.put(`/pendencias/admin/${id}`, dadosAtualizados);
    return data;
  } catch (error) {
    console.error(`Erro ao atualizar pendência ${id}:`, error);
    throw error;
  }
};

// 3. DELETAR REGISTRO (ADMIN)
export const deletar_pendencia_admin = async (id) => {
  try {
    const { data } = await axiosInstance.delete(`/pendencias/admin/${id}`);
    return data;
  } catch (error) {
    console.error(`Erro ao deletar pendência ${id}:`, error);
    throw error;
  }
};

// 4. PENDÊNCIAS SEM AVALIAÇÃO (JOURNEY API)
export const buscar_pendencias_sem_avaliacao = async () => {
  try {
    const { data } = await axiosInstance.get('/pendencias/verificar/sem-avaliacao');
    return data;
  } catch (error) {
    console.error('Erro ao buscar pendências sem avaliação:', error);
    throw error;
  }
};

// 5. PACIENTES POR PROFISSIONAL (JOURNEY API)
export const buscar_pacientes_profissional = async (profissionalId) => {
  try {
    if (!profissionalId) return [];
    const { data } = await axiosInstance.get(`/pendencias/verificar/pacientes-profissional/${Number(profissionalId)}`);
    return data;
  } catch (error) {
    console.error('Erro ao buscar pacientes do profissional:', error);
    throw error;
  }
};

/**
 * Gera pendencias de escala para um paciente e especialidade.
 * Endpoint: POST /pendencias/gerar-pendencias
 * payload: { pacienteId, especialidade }
 */
export const gerar_pendencias_escala = async ({ pacienteId, especialidade }) => {
  try {
    if (!pacienteId || !especialidade) {
      throw new Error("pacienteId e especialidade sao obrigatorios");
    }

    const payload = {
      pacienteId: Number(pacienteId),
      especialidade: String(especialidade),
    };

    const { data } = await axiosInstance.post('/pendencias/gerar-pendencias', payload);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao gerar pendencias de escala:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};

/**
 * ============================================================
 * 🩺 FUNÇÕES DO TERAPEUTA (Uso Diário)
 * ============================================================
 */

/**
 * Atualiza uma pendência de escala para CONCLUIDA.
 * PUT /pendencias/:id
 */
export const concluir_pendencia_escala = async (pendencia) => {
  try {
    const id = pendencia?.id ?? pendencia?.pendenciaId;
    if (!id) throw new Error("ID da pendência não informado");
    
    const criadaEmFormatada = formatDateBackend(pendencia?.criadaEm) || formatDateBackend(new Date());
    const resolvidaEmFormatada = formatDateBackend(new Date());

    const rawPayload = {
      pacienteId: pendencia?.pacienteId != null ? Number(pendencia.pacienteId) : undefined,
      agendamentoId: pendencia?.agendamentoId != null ? Number(pendencia.agendamentoId) : undefined,
      formularioId: pendencia?.formularioId != null ? Number(pendencia.formularioId) : undefined,
      status: "CONCLUIDA",
      criadaEm: criadaEmFormatada,
      resolvidaEm: resolvidaEmFormatada,
      diagnosticoMacro: pendencia?.diagnosticoMacro ?? undefined,
      especialidade: pendencia?.especialidade ?? undefined,
      // Mantém a data de referência se existir
      data_referencia: pendencia?.data_referencia ?? undefined 
    };

    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, v]) => v !== undefined && v !== null)
    );

    const { data } = await axiosInstance.put(`/pendencias/${Number(id)}`, payload);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao concluir pendência:", err);
    return { ok: false, error: err };
  }
};

/**
 * Marca uma pendência como NÃO APLICÁVEL.
 * ATENÇÃO: Nunca criar! Somente atualizar (PUT) quando houver ID.
 * - Se vier com ID: Atualiza (PUT) -> Caso dos cards da Direita.
 */
export const nao_aplicar_pendencia_escala = async (pendencia) => {
  try {
    const id = pendencia?.id ?? pendencia?.pendenciaId;
    const criadaEmFormatada = formatDateBackend(pendencia?.criadaEm) || formatDateBackend(new Date());
    const resolvidaEmFormatada = formatDateBackend(new Date());

    // Payload base comum
    const rawPayload = {
      pacienteId: pendencia?.pacienteId != null ? Number(pendencia.pacienteId) : undefined,
      agendamentoId: pendencia?.agendamentoId != null ? Number(pendencia.agendamentoId) : undefined,
      formularioId: pendencia?.formularioId != null ? Number(pendencia.formularioId) : undefined,
      status: "NAO_APLICA", // Status de dispensa
      criadaEm: criadaEmFormatada,
      resolvidaEm: resolvidaEmFormatada,
      diagnosticoMacro: pendencia?.diagnosticoMacro ?? undefined,
      especialidade: pendencia?.especialidade ?? undefined,
      data_referencia: pendencia?.data_referencia ?? undefined
    };

    // Limpa undefined/null
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, v]) => v !== undefined && v !== null)
    );

    if (!id) {
      const error = new Error("Operação não permitida: criação de pendência NAO_APLICA sem ID é proibida.");
      console.error("Tentativa de criação indevida em nao_aplicar_pendencia_escala:", { pendencia, payload });
      throw error;
    }

    // Somente atualização com ID
    const resposta = await axiosInstance.put(`/pendencias/${Number(id)}`, payload);
    return { ok: true, data: resposta.data };

  } catch (err) {
    console.error("Erro ao marcar como NÃO APLICAR:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};

/**
 * Atualiza o status de uma pendência de escala.
 * ATENÇÃO: Nunca criar! Somente atualizar (PUT) quando houver ID.
 */
export const atualizar_status_pendencia_escala = async (pendencia, status) => {
  try {
    const id = pendencia?.id ?? pendencia?.pendenciaId;
    if (!id) throw new Error("ID da pendência não informado");

    const criadaEmFormatada = formatDateBackend(pendencia?.criadaEm) || formatDateBackend(new Date());

    const rawPayload = {
      pacienteId: pendencia?.pacienteId != null ? Number(pendencia.pacienteId) : undefined,
      agendamentoId: pendencia?.agendamentoId != null ? Number(pendencia.agendamentoId) : undefined,
      formularioId: pendencia?.formularioId != null ? Number(pendencia.formularioId) : undefined,
      status,
      criadaEm: criadaEmFormatada,
      resolvidaEm: null,
      diagnosticoMacro: pendencia?.diagnosticoMacro ?? undefined,
      especialidade: pendencia?.especialidade ?? undefined,
      data_referencia: pendencia?.data_referencia ?? undefined,
    };

    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, v]) => v !== undefined && v !== null)
    );

    const resposta = await axiosInstance.put(`/pendencias/${Number(id)}`, payload);
    return { ok: true, data: resposta.data };
  } catch (err) {
    console.error("Erro ao atualizar status da pendência:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};

/**
 * Busca pendencias de escala por profissional e status.
 * GET /pendencias
 */
export const buscar_pendencias_profissional_status = async (profissionalId, statusList = []) => {
  try {
    if (!profissionalId) return [];

    const params = new URLSearchParams();
    params.append("profissionalId", String(profissionalId));
    (Array.isArray(statusList) ? statusList : [statusList]).forEach((status) => {
      if (status) params.append("status", status);
    });

    const { data } = await axiosInstance.get("/pendencias", { params });
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.pendencias)) return data.pendencias;
    return [];
  } catch (error) {
    console.error("Erro ao buscar pendencias do profissional:", error);
    return [];
  }
};


export const carregar_pendencias_filtro = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();

    // Monta os params de forma genérica a partir do objeto `filtros`.
    // - Arrays são expandidos como múltiplos parâmetros com mesmo nome
    // - Valores nulos/undefined/'' são ignorados
    Object.entries(filtros || {}).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, String(v)));
      } else {
        params.append(key, String(value));
      }
    });

    const resp = await axiosInstance.get("/pendencias", { params });
    const data = resp?.data;
    const list = Array.isArray(data) ? data : data?.pendencias ?? [];

    // Ordena pelas mais recentes de resolução (resolvidaEm) -> se não, pela criação
    list.sort((a, b) => {
      const va = a?.resolvidaEm ?? a?.criadaEm ?? null;
      const vb = b?.resolvidaEm ?? b?.criadaEm ?? null;
      return new Date(vb) - new Date(va);
    });

    return list;
  } catch (error) {
    console.error("Erro ao carregar pendências com filtro:", error);
    return [];
  }
};