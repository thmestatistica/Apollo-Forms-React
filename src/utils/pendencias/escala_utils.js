const DEFAULT_OFFSET_DAYS = 5;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const getEscalaNome = (item) =>
  item?.formulario?.nomeEscala || item?.label || item?.nome || item?.titulo || "Escala";

export const getDataVisualDate = (dataIso, offsetDays = DEFAULT_OFFSET_DAYS) => {
  if (!dataIso) return null;

  // Tenta normalizar para evitar problemas de fuso horário (UTC -> Local -3h virando dia anterior)
  // Se for string YYYY-MM-DD ou ISO com hora zerada, forçamos meio-dia local
  let d;
  if (typeof dataIso === 'string' && (dataIso.length === 10 || dataIso.includes('T00:00:00'))) {
      const datePart = dataIso.split('T')[0];
      const [y, m, day] = datePart.split('-').map(Number);
      d = new Date(y, m - 1, day, 12, 0, 0);
  } else {
      d = new Date(dataIso);
  }

  d.setDate(d.getDate() - offsetDays);
  return d;
};

export const formatDataVisual = (dataIso, locale = "pt-BR", offsetDays = DEFAULT_OFFSET_DAYS) => {
  const d = getDataVisualDate(dataIso, offsetDays);
  return d ? d.toLocaleDateString(locale) : null;
};

export const isEscalaOverdue = (dataIso, offsetDays = DEFAULT_OFFSET_DAYS, now = new Date()) => {
  const d = getDataVisualDate(dataIso, offsetDays);
  if (!d) return false;
  return startOfDay(now) > startOfDay(d);
};

export const uniqueEscalasByNomeClosestDate = (list, now = new Date()) => {
  const today = startOfDay(now);
  const grupos = new Map();

  (Array.isArray(list) ? list : []).forEach((item) => {
    const nome = getEscalaNome(item);
    const target = getDataVisualDate(item?.data_referencia);
    const targetDay = target ? startOfDay(target) : null;
    const distance = targetDay ? Math.abs(targetDay - today) : Number.POSITIVE_INFINITY;

    const atual = grupos.get(nome);
    if (!atual) {
      grupos.set(nome, { item, distance, targetDay });
      return;
    }

    if (distance < atual.distance) {
      grupos.set(nome, { item, distance, targetDay });
      return;
    }

    if (distance === atual.distance && targetDay && atual.targetDay && targetDay > atual.targetDay) {
      grupos.set(nome, { item, distance, targetDay });
    }
  });

  return Array.from(grupos.values()).map((entry) => entry.item);
};
