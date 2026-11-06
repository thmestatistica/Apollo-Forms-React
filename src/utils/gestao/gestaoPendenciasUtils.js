export const mapStatus = {
    APLICADO_NAO_LANCADO: 'Aplicado não lançado',
    CONCLUIDA: 'Concluída',
    ABERTA: 'Aberta',
    NAO_APLICA: 'Não se aplica',
};

export const STATUS_OPTIONS = [
    { value: 'APLICADO_NAO_LANCADO', label: 'Aplicado não lançado' },
    { value: 'CONCLUIDA', label: 'Concluída'},
    { value: 'ABERTA', label: 'Aberta'},
    { value: 'NAO_APLICA', label: 'Não se aplica'},
]

export const COLUNAS = [
	{ titulo: 'Escala', largura: 'w-[40%]' },
	{ titulo: 'Especialidade', largura: 'w-[28%]' },
	{ titulo: 'Data de lançamento', largura: 'w-[25%]' },
	{ titulo: '', largura: 'w-[7%]' }
]

export const ESPECIALIDADES = ['Condicionamento Físico', 'Enfermagem', 'Fisioterapia', 'Nutrição', 'Psicologia', 'Terapia Ocupacional']

export const especialidadesOptions = ESPECIALIDADES.map((e) => ({ value: e, label: e }))