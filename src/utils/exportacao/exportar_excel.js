import * as XLSX from 'xlsx-js-style';

export const exportarPendenciasSemAvaliacao = ({
  pacientes,
  totalPendencias,
  filePrefix = 'pendencias_sem_avaliacao'
}) => {
  const totalPacientes = pacientes.length;

  const linhas = [
    ['Relatório Pendências Sem Avaliação'],
    ['Total pacientes únicos', totalPacientes],
    ['Total pendências', totalPendencias],
    [],
    ['Paciente ID', 'Paciente', 'Especialidade']
  ];

  pacientes.forEach((p) => {
    const especialidades = Array.isArray(p.especialidade)
      ? p.especialidade.join(' | ')
      : (p.especialidade || '-');
    linhas.push([p.pacienteId, p.pacienteNome, especialidades]);
  });

  const ws = XLSX.utils.aoa_to_sheet(linhas);

  const headerStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '5A2779' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const titleStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
    fill: { fgColor: { rgb: '5A2779' } },
    alignment: { horizontal: 'center', vertical: 'center' }
  };

  const labelStyle = {
    font: { bold: true, color: { rgb: '5A2779' } },
    alignment: { horizontal: 'left', vertical: 'center' }
  };

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }
  ];

  if (ws['A1']) ws['A1'].s = titleStyle;
  if (ws['A2']) ws['A2'].s = labelStyle;
  if (ws['A3']) ws['A3'].s = labelStyle;
  if (ws['A5']) ws['A5'].s = headerStyle;
  if (ws['B5']) ws['B5'].s = headerStyle;
  if (ws['C5']) ws['C5'].s = headerStyle;

  ws['!cols'] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 40 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pendências');

  XLSX.writeFile(wb, `${filePrefix}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
