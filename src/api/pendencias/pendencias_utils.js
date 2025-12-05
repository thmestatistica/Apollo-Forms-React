import axiosInstance from "../axiosInstance";

// Formata para 'YYYY-MM-DD HH:mm:ss.SSS' removendo 'T' e 'Z' do ISO.
const formatDateBackend = (date) => {
  if (!date) return null;
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return null;
    // ISO: 2025-11-17T17:06:30.312Z -> 2025-11-17 17:06:30.312
    return d.toISOString().replace('T', ' ').replace('Z', '');
  } catch {
    return null;
  }
};

/**
 * Atualiza uma pendência de escala para CONCLUIDA.
 * PUT /pendencias/:id
 * Ajustes:
 * - Remove campos undefined/null antes de enviar.
 * - Não envia `criadaEm` se não vier válido (evita erro Invalid date).
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
    };

    // Limpa chaves com undefined ou null
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, v]) => v !== undefined && v !== null)
    );

    const { data } = await axiosInstance.put(`/pendencias/${Number(id)}`, payload);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao concluir pendência de escala:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};


export const nao_aplicar_pendencia_escala = async (pendencia) => {
  try {
    const id = pendencia?.id ?? pendencia?.pendenciaId;
    if (!id) throw new Error("ID da pendência não informado");
    const criadaEmFormatada = formatDateBackend(pendencia?.criadaEm) || formatDateBackend(new Date());
    const resolvidaEmFormatada = formatDateBackend(new Date());

    const rawPayload = {
      pacienteId: pendencia?.pacienteId != null ? Number(pendencia.pacienteId) : undefined,
      agendamentoId: pendencia?.agendamentoId != null ? Number(pendencia.agendamentoId) : undefined,
      formularioId: pendencia?.formularioId != null ? Number(pendencia.formularioId) : undefined,
      status: "NAO_APLICA",
      criadaEm: criadaEmFormatada,
      resolvidaEm: resolvidaEmFormatada,
      diagnosticoMacro: pendencia?.diagnosticoMacro ?? undefined,
      especialidade: pendencia?.especialidade ?? undefined,
    };
    // Limpa chaves com undefined ou null
    const payload = Object.fromEntries(
      Object.entries(rawPayload).filter(([, v]) => v !== undefined && v !== null)
    );
    const { data } = await axiosInstance.put(`/pendencias/${Number(id)}`, payload);
    return { ok: true, data };
  } catch (err) {
    console.error("Erro ao marcar pendência de escala como NÃO APLICAR:", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });
    return { ok: false, error: err };
  }
};