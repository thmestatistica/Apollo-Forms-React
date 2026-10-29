import { useState, useCallback, useEffect, useMemo } from 'react';
import Swal from 'sweetalert2';
import { listar_pacientes, listar_respostas_prontuario } from '../api/jornada/jornada_utils';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../utils/gestao/gestaoReavaliacaoUtils';
import { buscar_sessoes_paciente } from '../api/gestao/gestao_utils';

export const useAdminPacientes = ({ accessMode, allowedPatientIds, selectedPacienteId, setSelectedPacienteId }) => {
  const [pacientesAdmin, setPacientesAdmin] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(false);
  const [answeredLast, setAnsweredLast] = useState([]);
  const [loadingAnsweredLast, setLoadingAnsweredLast] = useState(false);

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

  const carregarUltimasRespostas = useCallback(async (pacienteId) => {
    if (!pacienteId) {
      setAnsweredLast([]);
      return;
    }
    setLoadingAnsweredLast(true);
    try {
      const respostas = await buscar_sessoes_paciente(pacienteId);
      setAnsweredLast(Array.isArray(respostas) ? respostas : []);
    } catch (error) {
      console.error('Erro ao carregar últimas respostas:', error);
      setAnsweredLast([]);
    } finally {
      setLoadingAnsweredLast(false);
    }
  }, []);

  const pacienteSelecionado = useMemo(
    () => pacientesDisponiveis.find((p) => String(p.id) === String(selectedPacienteId)),
    [pacientesDisponiveis, selectedPacienteId]
  );

  useEffect(() => {
    if (!selectedPacienteId) return;
    if (!pacienteSelecionado) setSelectedPacienteId('');
  }, [selectedPacienteId, pacienteSelecionado, setSelectedPacienteId]);

  useEffect(() => {
    if (!pacienteSelecionado) {
      setAnsweredLast([]);
      return;
    }
    let cancelado = false;

    (async () => {
      setLoadingAnsweredLast(true);
      const respostas = await buscar_sessoes_paciente(pacienteSelecionado.id);
      if (!cancelado) {
        setAnsweredLast(Array.isArray(respostas) ? respostas : []);
        setLoadingAnsweredLast(false);
      }
    })();

    return () => { cancelado = true; };
  }, [pacienteSelecionado?.id]);

  return {
    pacientesDisponiveis,
    pacienteSelecionado,
    loadingPacientes,
    carregarPacientesAdmin,
    answeredLast,
    loadingAnsweredLast,
    carregarUltimasRespostas
  };
};