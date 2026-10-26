import React from 'react';
import Swal from 'sweetalert2';
import { ArrowPathIcon, CheckCircleIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import GestaoActionButton from '../shared/GestaoActionButton';
import GestaoCard from '../shared/GestaoCard';
import GestaoField from '../shared/GestaoField';
import GestaoInput from '../shared/GestaoInput';
import GestaoSelect from '../shared/GestaoSelect';

const AdminPesquisaCard = ({
  selectedPacienteId,            // ID do paciente atualmente selecionado
  setSelectedPacienteId,         // Setter do ID do paciente selecionado
  editados,                      // Set/Coleção contendo os identificadores dos itens com alterações pendentes
  setEditados,                   // Setter para limpar ou redefinir as edições pendentes
  carregarDadosAdmin,            // Função assíncrona que busca os dados no servidor para o paciente
  loadingAdmin,                  // Indicador de carregamento dos dados do painel
  loadingPacientes,              // Indicador de carregamento da lista de pacientes
  pacientesDisponiveis,          // Lista de objetos com os pacientes disponíveis
  filtros,                       // Objeto contendo os filtros ativos ({ busca, status })
  setFiltros                     // Setter para atualizar o objeto de filtros
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
      description="Selecione o paciente para listar as pendencias."
      icon={MagnifyingGlassIcon}
    >
      <div className="grid md:grid-cols-3 gap-6 items-end">
        <GestaoField className="col-span-2" label="Paciente" icon={UserIcon}>
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
        </GestaoField>
        {/*<GestaoField label="Busca" icon={MagnifyingGlassIcon}>
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
        </GestaoField>*/}
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
