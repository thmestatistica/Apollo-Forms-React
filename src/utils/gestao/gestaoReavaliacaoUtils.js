const TERMOS_IGNORADOS_BASE = [
  'ausência',
  'ausencia',
  'vago/temp',
  'ortese',
  'férias',
  'ferias',
  'adm/temp',
  'reservado',
  'reunião',
  'reuniao',
  'terap.disp'
];

export const DIAGNOSTICO_OPCOES = [
  'AVC',
  'Doença de Parkinson',
  'TCE',
  'Dor Crônica',
  'Doenças Degenerativas',
  'Lesão Medular',
  'Doença Oncológica',
  'Paralisia Cerebral',
  'Neuropatia',
  'Distonia',
  'Ortopedia',
  'Outros'
];

const TERMOS_IGNORADOS_TESTE = ['teste', 'testa'];

export const INCLUIR_TESTES_GESTAO = true;

export const normalizarNome = (value) => String(value ?? '').trim().toLocaleLowerCase('pt-BR');

export const getTermosIgnorados = (incluirTestes = INCLUIR_TESTES_GESTAO) =>
  incluirTestes ? TERMOS_IGNORADOS_BASE : [...TERMOS_IGNORADOS_BASE, ...TERMOS_IGNORADOS_TESTE];

export const isNomeIgnorado = (value, incluirTestes = INCLUIR_TESTES_GESTAO) => {
  const nome = normalizarNome(value);
  if (!nome) return false;
  return getTermosIgnorados(incluirTestes).some((termo) => nome.includes(termo));
};
