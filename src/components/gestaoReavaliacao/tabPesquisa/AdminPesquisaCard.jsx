import React from 'react';
import Swal from 'sweetalert2';
import { ArrowPathIcon, CheckCircleIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import GestaoActionButton from '../shared/GestaoActionButton';
import GestaoCard from '../shared/GestaoCard';
import GestaoField from '../shared/GestaoField';
import GestaoInput from '../shared/GestaoInput';
import GestaoSelect from '../shared/GestaoSelect';

const AdminPesquisaCard = ({
  selectedPacienteId,
  setSelectedPacienteId,
  editados,
  setEditados,
  setGrupoEdicoes,
  setDiagnosticoPacienteEdicao,
  carregarDadosAdmin,
  loadingAdmin,
  loadingPacientes,
  pacientesDisponiveis,
  filtros,
  setFiltros
}) => {
  const handlePacienteChange = async (e) => {
    const novoPacienteId = e.target.value;
    if (editados.size > 0 && novoPacienteId !== selectedPacienteId) {
      const result = await Swal.fire({
        title: 'Alteracoes pendentes',
        text: 'Salve ou descarte as alteracoes antes de trocar de paciente.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Trocar e descartar',
        cancelButtonText: 'Cancelar'
      });
      if (!result.isConfirmed) return;
      setEditados(new Set());
    }
    setGrupoEdicoes({});
    setDiagnosticoPacienteEdicao(null);
    setSelectedPacienteId(novoPacienteId);
    carregarDadosAdmin(true, novoPacienteId);
  };

  const handleAtualizar = () => {
    if (!selectedPacienteId) {
      Swal.fire({ icon: 'info', title: 'Selecione um paciente', timer: 1600, showConfirmButton: false });
      return;
    }
    carregarDadosAdmin(true, selectedPacienteId);
  };

  return (
    <GestaoCard
      title="Pesquisa"
      description="Selecione o paciente para listar as pendencias e filtre por status."
      icon={MagnifyingGlassIcon}
    >
      <div className="grid md:grid-cols-4 gap-6 items-end">
        <GestaoField label="Paciente" icon={UserIcon}>
          <GestaoSelect
            value={selectedPacienteId}
            onChange={handlePacienteChange}
            disabled={loadingPacientes}
            placeholder={loadingPacientes ? 'Carregando pacientes...' : 'Selecione o paciente...'}
          >
            {pacientesDisponiveis.map((pac) => (
              <option key={pac.id} value={pac.id}>
                {pac.nome}
              </option>
            ))}
          </GestaoSelect>
          {loadingPacientes && (
            <div className="mt-2 text-xs text-gray-400">Carregando pacientes...</div>
          )}
        </GestaoField>
        <GestaoField label="Busca" icon={MagnifyingGlassIcon}>
          <GestaoInput
            type="text"
            placeholder="Buscar escala ou ID"
            value={filtros.busca}
            onChange={(e) => setFiltros({ ...filtros, busca: e.target.value })}
            disabled={!selectedPacienteId}
          />
        </GestaoField>
        <GestaoField label="Status" icon={CheckCircleIcon}>
          <GestaoSelect
            value={filtros.status}
            onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}
            disabled={!selectedPacienteId}
          >
            <option value="TODOS">Todos Status</option>
            <option value="ABERTA">Aberta</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="NAO_APLICA">Não se Aplica</option>
            <option value="APLICADO_NAO_LANCADO">Aplicado, Não Lançado</option>
          </GestaoSelect>
        </GestaoField>
        <div className="w-full">
          <GestaoActionButton
            onClick={handleAtualizar}
            disabled={!selectedPacienteId}
            loading={loadingAdmin}
            icon={ArrowPathIcon}
          >
            Atualizar
          </GestaoActionButton>
        </div>
      </div>
    </GestaoCard>
  );
};

export default AdminPesquisaCard;
