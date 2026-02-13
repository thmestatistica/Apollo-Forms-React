import React from 'react';
import Swal from 'sweetalert2';
import { CalendarDaysIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import { buscar_todas_pendencias } from '../../../api/pendencias/pendencias_utils';
import { formatarData } from '../../../utils/format/formatar_utils';
import GestaoActionButton from '../shared/GestaoActionButton';
import GestaoCard from '../shared/GestaoCard';
import GestaoField from '../shared/GestaoField';
import GestaoInput from '../shared/GestaoInput';
import GestaoSelect from '../shared/GestaoSelect';

const formatDateValue = (date) => {
  if (!date) return '';
  return String(date).slice(0, 10);
};

const diasEntre = (base, alvo) => {
  if (!base || !alvo) return null;
  const baseDate = new Date(`${base}T00:00:00`);
  const alvoDate = new Date(`${alvo}T00:00:00`);
  if (Number.isNaN(baseDate.getTime()) || Number.isNaN(alvoDate.getTime())) return null;
  const diffMs = alvoDate.getTime() - baseDate.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const EmissaoCard = ({
  selectedPac,
  setSelectedPac,
  setRascunhos,
  setUltimoPacienteAnalisado,
  ultimoPacienteAnalisado,
  dataManual,
  setDataManual,
  pacientesFiltrados,
  loadingPacientes,
  loadingGen,
  botaoBloqueado,
  gerarSugestoes
}) => {
  const handleTrocaPaciente = (e) => {
    setSelectedPac(e.target.value);
    setRascunhos([]);
    setUltimoPacienteAnalisado(null);
  };

  const handleAnalyze = async () => {
    if (!selectedPac) return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Selecione um paciente.' });
    try {
      const dataReferenciaIso = formatDateValue(dataManual);
      const dataReferenciaLabel = formatarData(dataManual) || dataReferenciaIso;
      if (dataReferenciaIso) {
        const pendencias = await buscar_todas_pendencias({ pacienteId: Number(selectedPac) });
        const pendenciasData = (Array.isArray(pendencias) ? pendencias : []).filter((pend) => {
          const dataPendencia = formatDateValue(pend?.data_referencia);
          const diffDias = diasEntre(dataReferenciaIso, dataPendencia);
          return diffDias != null && Math.abs(diffDias) <= 10;
        });
        if (pendenciasData.length > 0) {
          const escalas = pendenciasData
            .map((pend) => ({
              nome: pend?.formulario?.nomeEscala || 'Sem escala',
              data: formatarData(pend?.data_referencia) || formatDateValue(pend?.data_referencia) || 'Sem data'
            }))
            .slice(0, 6);
          const lista = escalas
            .map((item) => `<li>${item.nome} <span style="color:#64748b; font-size:11px;">(${item.data})</span></li>`)
            .join('');
          const mais = pendenciasData.length > escalas.length ? `<br/><small>+${pendenciasData.length - escalas.length} outras</small>` : '';

          const result = await Swal.fire({
            icon: 'warning',
            title: 'Pendências já existem',
            html: `Encontramos pendências na janela de <b>10 dias antes/depois</b> de ${dataReferenciaLabel}.<br/>${
              escalas.length ? `<ul class="text-left mt-3 list-disc pl-5">${lista}</ul>${mais}` : ''
            }<br/>Deseja continuar?`,
            showCancelButton: true,
            confirmButtonText: 'Sim, continuar',
            cancelButtonText: 'Cancelar'
          });

          if (!result.isConfirmed) return;
        }
      }
    } catch (error) {
      console.error('Erro ao validar pendências existentes:', error);
    }

    gerarSugestoes(Number(selectedPac), dataManual);
    setUltimoPacienteAnalisado(selectedPac);
  };

  return (
    <GestaoCard
      title="Emissão"
      description="Escolha o paciente e a data para gerar as escalas."
      icon={MagnifyingGlassIcon}
    >
      <div className="grid md:grid-cols-3 gap-6 items-end">
        <GestaoField label="Paciente" icon={UserIcon}>
          <GestaoSelect
            value={selectedPac}
            onChange={handleTrocaPaciente}
            disabled={loadingPacientes}
            placeholder={loadingPacientes ? 'Carregando pacientes...' : 'Selecione...'}
          >
            {pacientesFiltrados.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </GestaoSelect>
          {loadingPacientes && (
            <div className="mt-2 text-xs text-gray-400">Carregando pacientes...</div>
          )}
        </GestaoField>
        <GestaoField label="Data Ref." icon={CalendarDaysIcon}>
          <GestaoInput
            type="date"
            className="cursor-pointer"
            value={dataManual}
            onChange={(e) => {
              setDataManual(e.target.value);
              setUltimoPacienteAnalisado(null);
              setRascunhos([]);
            }}
          />
        </GestaoField>
        <div className="w-full">
          <GestaoActionButton onClick={handleAnalyze} disabled={botaoBloqueado}>
            {loadingGen
              ? 'Processando...'
              : selectedPac && selectedPac === ultimoPacienteAnalisado
                ? 'Análise Concluída'
                : 'Buscar Pendências'}
          </GestaoActionButton>
        </div>
      </div>
    </GestaoCard>
  );
};

export default EmissaoCard;
