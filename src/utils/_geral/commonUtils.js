// --- CONSTANTES (Mantidas iguais) ---
export const OPCOES_ESPECIALIDADES = [
  { value: 'Fisioterapia', label: 'Fisioterapia' },
  { value: 'Terapia Ocupacional', label: 'Terapia Ocupacional' },
  { value: 'Fonoaudiologia', label: 'Fonoaudiologia' },
  { value: 'Psicologia', label: 'Psicologia' },
  { value: 'Enfermagem', label: 'Enfermagem' },
  { value: 'Nutrição', label: 'Nutrição' },
  { value: 'Condicionamento Físico', label: 'Condicionamento Físico' },
  { value: 'Teste', label: 'Teste' }
];

export const formatDateValue = (date) => {
  if (!date) return '';
  return String(date).slice(0, 10);
};

export function toISODate(date) {
  const parsedDate = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return '';
  }

  const y = parsedDate.getFullYear();
  const m = String(parsedDate.getMonth() + 1).padStart(2, '0');
  const d = String(parsedDate.getDate()).padStart(2, '0');

  return `${d}/${m}/${y}`;
}

export const parseWeeksValue = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
};

export const parseDateOnly = (value) => {
  const dateValue = formatDateValue(value);
  if (!dateValue) return null;
  const parsed = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const isFutureDate = (value, baseDate) => {
  const parsed = parseDateOnly(value);
  if (!parsed) return false;
  return parsed.getTime() > baseDate.getTime();
};

export const addDaysToDateValue = (value, daysToAdd) => {
  const parsed = parseDateOnly(value);
  if (!parsed) return value;
  parsed.setDate(parsed.getDate() + daysToAdd);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};