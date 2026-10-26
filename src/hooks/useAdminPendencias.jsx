import { useState, useCallback, useRef, useMemo } from 'react';
import Swal from 'sweetalert2';
import { buscar_todas_pendencias } from '../api/pendencias/pendencias_utils';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../utils/gestao/gestaoReavaliacaoUtils';

export const useAdminPendencias = ({ selectedPacienteId, accessMode, allowedPatientIds }) => {
  const [dadosAdmin, setDadosAdmin] = useState([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [editados, setEditados] = useState(new Set());
  const [grupoEdicoes, setGrupoEdicoes] = useState({});
  const [filtros, setFiltros] = useState({ busca: '', status: 'TODOS' });

  const adminDataCache = useRef(null);
  const dataLoaded = useRef(false);

  const carregarDadosAdmin = useCallback(async (forceRefresh = false, pacienteId = '') => {
    if (!pacienteId) {
      setDadosAdmin([]);
      adminDataCache.current = null;
      dataLoaded.current = false;
      return;
    }
    if (!forceRefresh && adminDataCache.current?.pacienteId === pacienteId && dataLoaded.current) {
      setDadosAdmin(adminDataCache.current?.data || []);
      return;
    }
    setLoadingAdmin(true);
    try {
      const resposta = await buscar_todas_pendencias({ pacienteId: pacienteId });
      const data = resposta || [];
      setDadosAdmin(data);
      adminDataCache.current = { pacienteId, data };
      dataLoaded.current = true;
      setEditados(new Set());
      setGrupoEdicoes({});
    } catch (error) {
      Swal.fire('Erro', 'Falha ao carregar tabela.', 'error');
      console.error('Erro ao carregar pendências admin:', error);
    } finally {
      setLoadingAdmin(false);
    }
  }, []);

  const dadosFiltrados = useMemo(() => {
    if (!selectedPacienteId) return [];
    const termo = filtros.busca.toLowerCase();
    const statusFiltro = filtros.status;

    return dadosAdmin.filter((item) => {
      if (accessMode === 'gestao' && allowedPatientIds.size > 0) {
        const pid = item?.paciente?.id ?? item?.pacienteId;
        if (pid == null || !allowedPatientIds.has(Number(pid))) return false;
      }
      if (isNomeIgnorado(item?.paciente?.nome, INCLUIR_TESTES_GESTAO)) return false;

      const pid = item?.paciente?.id ?? item?.pacienteId;
      if (String(pid) !== String(selectedPacienteId)) return false;

      const matchStatus = statusFiltro === 'TODOS' || item.status === statusFiltro;
      if (!matchStatus) return false;

      if (!termo) return true;
      const nomeEsc = item.formulario?.nomeEscala?.toLowerCase() || '';
      const idStr = String(item.id);
      return nomeEsc.includes(termo) || idStr.includes(termo);
    });
  }, [dadosAdmin, filtros, accessMode, allowedPatientIds, selectedPacienteId]);

  return {
    dadosAdmin,
    dadosFiltrados,
    loadingAdmin,
    editados,
    setEditados,
    grupoEdicoes,
    setGrupoEdicoes,
    filtros,
    setFiltros,
    carregarDadosAdmin
  };
};