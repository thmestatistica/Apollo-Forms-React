import { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { listar_pacientes } from '../api/jornada/jornada_utils';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../utils/gestao/gestaoReavaliacaoUtils';

export const useAdminPacientes = ({ accessMode, allowedPatientIds, selectedPacienteId, setSelectedPacienteId }) => {
  const [pacientesAdmin, setPacientesAdmin] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);

  const carregarPacientesAdmin = useCallback(async () => {
    setLoadingPacientes(true);
    try {
      const resposta = await listar_pacientes();
      const lista = Array.isArray(resposta) ? resposta : [];
      const filtrados = lista.filter((pac) => {
        if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
          if (!allowedPatientIds.has(Number(pac?.id))) return false;
        }
        if (isNomeIgnorado(pac?.nome, INCLUIR_TESTES_GESTAO)) return false;
        if (pac?.ativo == null) return true;
        return Boolean(pac?.ativo);
      });
      setPacientesAdmin(filtrados);
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar pacientes.', 'error');
      console.error('Erro ao carregar pacientes admin:', error);
      setPacientesAdmin([]);
    } finally {
      setLoadingPacientes(false);
    }
  }, [accessMode, allowedPatientIds]);

  useEffect(() => {
    carregarPacientesAdmin();
  }, [carregarPacientesAdmin]);

  const pacientesDisponiveis = useMemo(() => {
    return (pacientesAdmin || [])
      .map((pac) => ({
        id: pac?.id,
        nome: pac?.nome || 'Sem paciente'
      }))
      .filter((pac) => pac.id != null)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [pacientesAdmin]);

  const pacienteSelecionado = useMemo(
    () => pacientesDisponiveis.find((p) => String(p.id) === String(selectedPacienteId)),
    [pacientesDisponiveis, selectedPacienteId]
  );

  useEffect(() => {
    if (!selectedPacienteId) return;
    if (!pacienteSelecionado) setSelectedPacienteId('');
  }, [selectedPacienteId, pacienteSelecionado, setSelectedPacienteId]);

  return {
    pacientesDisponiveis,
    pacienteSelecionado,
    loadingPacientes,
    carregarPacientesAdmin
  };
};