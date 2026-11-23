export const MS_POR_HORA = 1000 * 60 * 60

export const PACIENTES_IGNORADOS_CRITICA = [
    2778, 2782, 249, 2809, 2799, 2794, 2840, 3044, 2788, 2749, 2745, 2735, 202, 2818, 2779,
]

export const NIVEIS = [
    { chave: 'normal', label: 'Normal', limite: 24, cor: 'bg-green-700 text-white', corVazia: 'bg-green-700/30 text-gray-400' },
    { chave: 'atencao', label: 'Atenção', limite: 36, cor: 'bg-yellow-700 text-white', corVazia: 'bg-yellow-700/30 text-gray-400' },
    { chave: 'alerta', label: 'Alerta', limite: 48, cor: 'bg-orange-700 text-white', corVazia: 'bg-orange-700/30 text-gray-400' },
    { chave: 'urgente', label: 'Urgente', limite: 120, cor: 'bg-rose-700 text-white', corVazia: 'bg-rose-700/30 text-gray-400' },
    { chave: 'critica', label: 'Crítica', limite: Infinity, cor: 'bg-red-700 text-white', corVazia: 'bg-red-700/30 text-gray-400' },
]

export const campoNivel = (chave) => `pend_${chave}`

export const horasDesde = (agora, t) => Math.round((agora - t) / MS_POR_HORA)

export const classificarPendencia = (horas) =>
    NIVEIS.find((n) => horas < n.limite).chave

export const paraChave = (n) => String(n ?? 0).padStart(5, '0')
export const paraLabel = (chave) => String(Number(chave))