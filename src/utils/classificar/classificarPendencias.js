/**
 * @file classificar.js
 * @description Classificação de pendências de agendamentos.
 */

import { _parseIso, formatarHora } from "../format/formatar_utils";

/**
 * Classifica pendências por horas desde o fim do agendamento.
 *
 * @param {Array<number|string>} idsPendentes
 * @param {(id: number|string) => Promise<Object>} carregarAgendamento
 * @returns {Promise<Array<Object>>}
 */
export const classificarPendencias = async (idsPendentes, carregarAgendamento) => {
  const linhas = [];

    for (const agId of idsPendentes) {
        try {
            const ag = await carregarAgendamento(agId);

            if (!ag || Array.isArray(ag)) continue;

            // Usa o parse ISO seguro (preserva 'Z' e remove ms)
            const dtIni = _parseIso(ag?.inicio);
            const dtFim = _parseIso(ag?.fim);

            let horasPendencia = 0;
            let nivel = "—";

            if (dtFim) {
                // diferença em horas (Date.now() e dtFim.getTime() ambos em ms UTC)
                const diffHoras = (Date.now() - dtFim.getTime()) / 3600000;
                horasPendencia = Math.max(diffHoras, 0);
                console.log("[classificarPendencias] id=", agId, " horasPendencia=", horasPendencia);
                console.log(dtFim, new Date());

                // Determina o nível conforme as horas de pendência
                if (horasPendencia < 24) nivel = "Normal";
                else if (horasPendencia < 36) nivel = "Atenção";
                else if (horasPendencia < 48) nivel = "Alerta";
                else if (horasPendencia < 120) nivel = "Urgente";
                else nivel = "Crítico";
            }

            const paciente = ag?.paciente?.nome || "Paciente";
            const slotNome = ag?.slot?.nome || "—";
            const slotSigla = ag?.slot?.sigla || "—";
            const profissionalEspecialidade = ag?.profissional?.especialidade[0] || "—";
            console.log("[classificarPendencias] id=", agId, " paciente=", paciente, " slot=", slotNome);
            console.log(ag);
            console.log(profissionalEspecialidade);

            linhas.push({
                _ordem: dtIni || new Date(8640000000000000),
                "Nível de Pendência": nivel,
                "Horas": Math.round(horasPendencia * 100) / 100, // arredonda 2 casas
                "AgendamentoID": ag.id ?? agId,
                "PacienteID": ag?.paciente?.id || "—",
                "ProfissionalEspecialidade": profissionalEspecialidade,
                "Data": dtIni ? dtIni.toLocaleDateString("pt-BR") : "—",
                "Início": dtIni
                    ? formatarHora(ag.inicio)
                    : "—",
                "Fim": dtFim
                    ? formatarHora(ag.fim)
                    : "—",
                "Paciente": paciente.trim().toLowerCase() === "paciente de testes" ? "VAGO" : paciente,
                "Slot": slotNome,
                "Sigla": slotSigla,
                "TipoAtendimento": ag?.tipo || "—",
            });
        } catch (err) {
            console.log("[classificarPendencias] erro ao carregar id=", agId);
            console.log(err);
        }
    }

  return linhas;
};
