import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  CheckCircleIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';
import { useReavaliacao } from '../../hooks/useReavaliacao';
import { exportarPendenciasSemAvaliacao } from '../../utils/exportacao/exportar_excel';
import { listar_escalas, listar_formularios, salvar_associacao_escala } from '../../api/forms/forms_utils';
import { buscar_pendencias_sem_avaliacao, buscar_todas_pendencias } from '../../api/pendencias/pendencias_utils';
import { tipoPorEspecialidade } from '../../config/tipoSlot';
import { Modal } from '../modal/Modal';
import MultiSelect from '../input/MultiSelect';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../../utils/gestao/gestaoReavaliacaoUtils';

const DIAGNOSTICO_OPCOES = [
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

const MetodoTab = () => {
  const { pacientes, avaliarPossiveisSugestoesPaciente } = useReavaliacao();

  const [activeMetodoTab, setActiveMetodoTab] = useState('sem-avaliacao');
  const [pendenciasSemAvaliacao, setPendenciasSemAvaliacao] = useState({});
  const [loadingSemAvaliacao, setLoadingSemAvaliacao] = useState(false);
  const [erroSemAvaliacao, setErroSemAvaliacao] = useState('');
  const [paginaSemAvaliacao, setPaginaSemAvaliacao] = useState(1);
  const ITENS_POR_PAGINA_SEM_AVALIACAO = 10;

  const [pendenciasEscala, setPendenciasEscala] = useState([]);
  const [loadingPendenciasEscala, setLoadingPendenciasEscala] = useState(false);
  const [erroPendenciasEscala, setErroPendenciasEscala] = useState('');
  const [paginaComPendenciaEscala, setPaginaComPendenciaEscala] = useState(1);
  const [paginaSemPendenciaEscala, setPaginaSemPendenciaEscala] = useState(1);
  const ITENS_POR_PAGINA_PENDENCIA = 10;

  const [analiseSemPendencia, setAnaliseSemPendencia] = useState({});
  const [loadingAnaliseSemPendencia, setLoadingAnaliseSemPendencia] = useState(false);

  const [formulariosSistema, setFormulariosSistema] = useState([]);
  const [escalasAssociadas, setEscalasAssociadas] = useState([]);
  const [loadingAssociacao, setLoadingAssociacao] = useState(false);
  const [erroAssociacao, setErroAssociacao] = useState('');
  const [buscaAssociacao, setBuscaAssociacao] = useState('');
  const [associacaoModalAberto, setAssociacaoModalAberto] = useState(false);
  const [associacaoFormSelecionado, setAssociacaoFormSelecionado] = useState(null);
  const [associacaoEscalaSelecionada, setAssociacaoEscalaSelecionada] = useState(null);
  const [associacaoEspecialidades, setAssociacaoEspecialidades] = useState([]);
  const [associacaoDiagnosticos, setAssociacaoDiagnosticos] = useState([]);
  const [salvandoAssociacao, setSalvandoAssociacao] = useState(false);

  const metodoCarregando = loadingSemAvaliacao || loadingPendenciasEscala || loadingAnaliseSemPendencia;

  const normalizeNome = useCallback((value) => String(value ?? '').trim().toLocaleLowerCase('pt-BR'), []);

  const carregarPendenciasSemAvaliacao = useCallback(async () => {
    setLoadingSemAvaliacao(true);
    setErroSemAvaliacao('');
    try {
      const resposta = await buscar_pendencias_sem_avaliacao();
      setPendenciasSemAvaliacao(resposta?.data ?? resposta ?? {});
    } catch (err) {
      console.error(err);
      setErroSemAvaliacao('Não foi possível carregar as pendências.');
    } finally {
      setLoadingSemAvaliacao(false);
    }
  }, []);

  const carregarPendenciasEscala = useCallback(async () => {
    setLoadingPendenciasEscala(true);
    setErroPendenciasEscala('');
    try {
      const resposta = await buscar_todas_pendencias({});
      setPendenciasEscala(resposta || []);
    } catch (err) {
      console.error(err);
      setErroPendenciasEscala('Não foi possível carregar pendências de escala.');
    } finally {
      setLoadingPendenciasEscala(false);
    }
  }, []);

  const carregarAssociacoes = useCallback(async () => {
    setLoadingAssociacao(true);
    setErroAssociacao('');
    try {
      const [forms, escalas] = await Promise.all([listar_formularios(), listar_escalas()]);
      const normalizarFormulario = (form) => {
        const base = form?.formulario ?? form?.form ?? form;
        const id =
          base?.formulario_id ??
          base?.id ??
          base?.formularioId ??
          base?.formId ??
          form?.formulario_id ??
          form?.id ??
          form?.formularioId;
        const nomeEscala =
          base?.nome_formulario ??
          base?.nomeEscala ??
          base?.nomeFormulario ??
          base?.formulario_nome ??
          base?.titulo ??
          base?.tituloFormulario ??
          base?.nome ??
          base?.name ??
          base?.nome_escala;
        const tipoFormulario = base?.tipo_formulario ?? base?.tipoFormulario ?? base?.tipo ?? base?.categoria ?? form?.tipoFormulario;
        const ativo = base?.ativo ?? base?.ativoFormulario ?? form?.ativo ?? form?.ativoFormulario;

        return {
          ...base,
          id,
          nomeEscala,
          tipoFormulario,
          ativo
        };
      };

      const listaForms = Array.isArray(forms) ? forms.map(normalizarFormulario) : [];
      setFormulariosSistema(listaForms);
      setEscalasAssociadas(Array.isArray(escalas) ? escalas : []);
    } catch (err) {
      console.error(err);
      setErroAssociacao('Não foi possível carregar formulários/escalas.');
    } finally {
      setLoadingAssociacao(false);
    }
  }, []);

  useEffect(() => {
    carregarPendenciasEscala();
  }, [carregarPendenciasEscala]);

  useEffect(() => {
    carregarAssociacoes();
  }, [carregarAssociacoes]);

  useEffect(() => {
    if (activeMetodoTab === 'sem-avaliacao') {
      carregarPendenciasSemAvaliacao();
    }
  }, [activeMetodoTab, carregarPendenciasSemAvaliacao]);

  useEffect(() => {
    if (activeMetodoTab === 'associacao') {
      carregarAssociacoes();
    }
  }, [activeMetodoTab, carregarAssociacoes]);

  const abrirModalAssociacao = useCallback((form, escala) => {
    const listaDiag = Array.isArray(escala?.listaDiagnosticos)
      ? escala.listaDiagnosticos
      : String(escala?.listaDiagnosticos || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
    const listaEsp = Array.isArray(escala?.especialidade)
      ? escala.especialidade
      : String(escala?.especialidade || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

    setAssociacaoFormSelecionado(form);
    setAssociacaoEscalaSelecionada(escala || null);
    setAssociacaoDiagnosticos(listaDiag);
    setAssociacaoEspecialidades(listaEsp);
    setAssociacaoModalAberto(true);
  }, []);

  const fecharModalAssociacao = useCallback(() => {
    setAssociacaoModalAberto(false);
    setAssociacaoFormSelecionado(null);
    setAssociacaoEscalaSelecionada(null);
    setAssociacaoDiagnosticos([]);
    setAssociacaoEspecialidades([]);
  }, []);

  const salvarAssociacao = useCallback(async () => {
    if (!associacaoFormSelecionado) return;
    setSalvandoAssociacao(true);
    try {
      const formId = associacaoFormSelecionado?.id ?? associacaoFormSelecionado?.formularioId ?? associacaoFormSelecionado?.formId;
      const nomeEscala =
        associacaoFormSelecionado?.nome_formulario ??
        associacaoFormSelecionado?.nomeEscala ??
        associacaoFormSelecionado?.nomeFormulario ??
        associacaoFormSelecionado?.titulo ??
        associacaoFormSelecionado?.nome;
      const tipoFormulario =
        associacaoFormSelecionado?.tipo_formulario ??
        associacaoFormSelecionado?.tipoFormulario ??
        associacaoFormSelecionado?.tipo;
      const significado =
        associacaoFormSelecionado?.descricao_formulario ??
        associacaoFormSelecionado?.significado ??
        associacaoEscalaSelecionada?.significado ??
        null;

      const payload = {
        formularioId: Number(formId),
        nomeEscala,
        tipoFormulario,
        especialidade: associacaoEspecialidades,
        listaDiagnosticos: associacaoDiagnosticos,
        significado
      };

      const escalaId = associacaoEscalaSelecionada?.id;
      const resultado = await salvar_associacao_escala(payload, escalaId);
      if (!resultado.ok) throw resultado.error;

      await Swal.fire({ icon: 'success', title: 'Associação salva!', timer: 1600, showConfirmButton: false });
      fecharModalAssociacao();
      carregarAssociacoes();
    } catch (err) {
      console.error(err);
      Swal.fire('Erro', 'Não foi possível salvar a associação.', 'error');
    } finally {
      setSalvandoAssociacao(false);
    }
  }, [associacaoFormSelecionado, associacaoEscalaSelecionada, associacaoEspecialidades, associacaoDiagnosticos, fecharModalAssociacao, carregarAssociacoes]);

  const opcoesEspecialidades = useMemo(() => {
    return Object.keys(tipoPorEspecialidade).map((esp) => ({ value: esp, label: esp }));
  }, []);

  const opcoesDiagnosticos = useMemo(() => {
    return DIAGNOSTICO_OPCOES.map((diag) => ({ value: diag, label: diag }));
  }, []);

  const pacientesPendenciasUnicas = useMemo(() => {
    const lista = pendenciasSemAvaliacao?.pacientes ?? pendenciasSemAvaliacao ?? [];
    const normalizados = Array.isArray(lista) ? lista : [];
    const mapa = new Map();
    normalizados.forEach((p) => {
      const nome = String(p?.pacienteNome ?? '').trim();
      if (!nome || isNomeIgnorado(nome, INCLUIR_TESTES_GESTAO)) return;
      if (!mapa.has(nome)) {
        mapa.set(nome, p);
      }
    });
    return Array.from(mapa.values()).sort((a, b) => {
      const nomeA = String(a?.pacienteNome ?? '').trim();
      const nomeB = String(b?.pacienteNome ?? '').trim();
      return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
    });
  }, [pendenciasSemAvaliacao]);

  const { pendenciasComResumo, pacientesSemPendenciaEscala, totalPacientesConsiderados } = useMemo(() => {
    const pendentes = new Map();
    (pendenciasEscala || []).forEach((item) => {
      const nome = item?.paciente?.nome ?? item?.pacienteNome ?? '';
      if (!nome || isNomeIgnorado(nome, INCLUIR_TESTES_GESTAO)) return;
      const key = normalizeNome(nome);
      if (!key) return;
      const atual = pendentes.get(key) || { nome, total: 0, abertas: 0, concluidas: 0, nao_aplica: 0, ultimaData: null };
      atual.total += 1;
      const status = String(item?.status ?? '').toUpperCase();
      if (status === 'ABERTA') atual.abertas += 1;
      else if (status === 'CONCLUIDA') atual.concluidas += 1;
      else if (status === 'NAO_APLICA') atual.nao_aplica += 1;

      const rawDate = item?.resolvidaEm ?? item?.data_referencia ?? item?.criadaEm ?? item?.createdAt ?? item?.dataReferencia;
      const data = rawDate ? new Date(rawDate) : null;
      if (data && !isNaN(data.getTime())) {
        if (!atual.ultimaData || data > atual.ultimaData) atual.ultimaData = data;
      }
      pendentes.set(key, atual);
    });

    const todosPacientes = (pacientes || [])
      .map((p) => p?.nome ?? p?.pacienteNome)
      .filter((nome) => Boolean(nome) && !isNomeIgnorado(nome, INCLUIR_TESTES_GESTAO));
    const semPendencia = [];

    todosPacientes.forEach((nome) => {
      const key = normalizeNome(nome);
      if (!pendentes.has(key)) {
        semPendencia.push(nome);
      }
    });

    const sortFn = (a, b) => String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' });
    return {
      pendenciasComResumo: Array.from(pendentes.values()).sort((a, b) => {
        const aSemAbertas = a.abertas === 0 ? 1 : 0;
        const bSemAbertas = b.abertas === 0 ? 1 : 0;
        if (aSemAbertas !== bSemAbertas) return bSemAbertas - aSemAbertas;
        if (a.total !== b.total) return b.total - a.total;
        return sortFn(a.nome, b.nome);
      }),
      pacientesSemPendenciaEscala: semPendencia.sort(sortFn),
      totalPacientesConsiderados: todosPacientes.length
    };
  }, [pendenciasEscala, pacientes, normalizeNome]);

  const mapaPacientePorNome = useMemo(() => {
    const map = new Map();
    (pacientes || []).forEach((p) => {
      const nome = p?.nome ?? p?.pacienteNome;
      if (!nome) return;
      const key = normalizeNome(nome);
      if (!map.has(key)) map.set(key, p);
    });
    return map;
  }, [pacientes, normalizeNome]);

  const analisarSemPendenciaEscala = useCallback(async () => {
    setLoadingAnaliseSemPendencia(true);
    const resultados = {};

    await Promise.all(
      pacientesSemPendenciaEscala.map(async (nome) => {
        const key = normalizeNome(nome);
        const paciente = mapaPacientePorNome.get(key);
        if (!paciente?.id) {
          resultados[key] = { status: 'sem_dados', motivo: 'Paciente não encontrado', sugestoes: 0, diagnosticoMacro: null };
          return;
        }

        const res = await avaliarPossiveisSugestoesPaciente(paciente.id);
        resultados[key] = res;
      })
    );

    setAnaliseSemPendencia(resultados);
    setLoadingAnaliseSemPendencia(false);
  }, [pacientesSemPendenciaEscala, mapaPacientePorNome, avaliarPossiveisSugestoesPaciente, normalizeNome]);

  useEffect(() => {
    setAnaliseSemPendencia({});
  }, [pacientesSemPendenciaEscala.length]);
  useEffect(() => {
    if (pacientesSemPendenciaEscala.length === 0) return;
    if (loadingAnaliseSemPendencia) return;
    const totalAnalisados = Object.keys(analiseSemPendencia).length;
    if (totalAnalisados === pacientesSemPendenciaEscala.length) return;
    analisarSemPendenciaEscala();
  }, [pacientesSemPendenciaEscala.length, loadingAnaliseSemPendencia, analiseSemPendencia, analisarSemPendenciaEscala]);

  const pacientesSemPendenciaOrdenados = useMemo(() => {
    const prioridadeStatus = {
      com_sugestoes: 0,
      sem_sugestoes_outros: 1,
      sem_presenca: 2,
      sem_sugestoes: 3,
      sem_diagnostico: 4,
      sem_dados: 5
    };

    return [...pacientesSemPendenciaEscala].sort((a, b) => {
      const keyA = normalizeNome(a);
      const keyB = normalizeNome(b);
      const statusA = analiseSemPendencia[keyA]?.status ?? 'nao_analisado';
      const statusB = analiseSemPendencia[keyB]?.status ?? 'nao_analisado';
      const prioA = prioridadeStatus[statusA] ?? 5;
      const prioB = prioridadeStatus[statusB] ?? 5;
      if (prioA !== prioB) return prioA - prioB;
      return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' });
    });
  }, [pacientesSemPendenciaEscala, analiseSemPendencia, normalizeNome]);

  const totalPacientesComSugestoes = useMemo(() => {
    return Object.values(analiseSemPendencia).filter((item) => item?.status === 'com_sugestoes').length;
  }, [analiseSemPendencia]);

  const totalPendenciasConcluidas = useMemo(() => {
    return pendenciasComResumo.filter((item) => item.abertas === 0).length;
  }, [pendenciasComResumo]);

  const formulariosAtivos = useMemo(() => {
    const tiposValidos = ['escalas/testes', 'avaliacao', 'avaliação'];
    return (formulariosSistema || []).filter((form) => {
      const tipo = String(form?.tipo_formulario ?? form?.tipoFormulario ?? form?.tipo ?? '').toLowerCase();
      const elegivel = tiposValidos.some((t) => tipo.includes(t));
      if (!elegivel) return false;
      if (form?.ativo == null) return true;
      return Boolean(form.ativo);
    });
  }, [formulariosSistema]);

  const formulariosSemAssociacao = useMemo(() => {
    const mapaEscalas = new Map((escalasAssociadas || []).map((esc) => [Number(esc?.formularioId), esc]));

    return formulariosAtivos.filter((form) => {
      const escala = mapaEscalas.get(Number(form?.id ?? form?.formularioId ?? form?.formId));
      if (!escala) return true;
      const listaDiag = Array.isArray(escala?.listaDiagnosticos)
        ? escala.listaDiagnosticos
        : String(escala?.listaDiagnosticos || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
      const listaEsp = Array.isArray(escala?.especialidade)
        ? escala.especialidade
        : String(escala?.especialidade || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
      return listaDiag.length === 0 || listaEsp.length === 0;
    });
  }, [formulariosAtivos, escalasAssociadas]);

  const formulariosAssociacaoOrdenados = useMemo(() => {
    const termo = String(buscaAssociacao || '').toLowerCase().trim();
    return [...formulariosAtivos]
      .filter((form) => {
        if (!termo) return true;
        const nome = String(
          form?.nomeEscala ??
            form?.nome_formulario ??
            form?.nomeFormulario ??
            form?.formulario_nome ??
            form?.titulo ??
            form?.nome ??
            ''
        ).toLowerCase();
        return nome.includes(termo);
      })
      .sort((a, b) => {
        const aSem = formulariosSemAssociacao.some((item) => Number(item?.id) === Number(a?.id));
        const bSem = formulariosSemAssociacao.some((item) => Number(item?.id) === Number(b?.id));
        if (aSem !== bSem) return aSem ? -1 : 1;
        const nomeA = String(a?.nomeEscala ?? a?.nome_formulario ?? a?.nomeFormulario ?? a?.formulario_nome ?? a?.titulo ?? a?.nome ?? '');
        const nomeB = String(b?.nomeEscala ?? b?.nome_formulario ?? b?.nomeFormulario ?? b?.formulario_nome ?? b?.titulo ?? b?.nome ?? '');
        return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
      });
  }, [formulariosAtivos, formulariosSemAssociacao, buscaAssociacao]);

  const totalPaginasComPendencia = Math.max(1, Math.ceil(pendenciasComResumo.length / ITENS_POR_PAGINA_PENDENCIA));
  const totalPaginasSemPendencia = Math.max(1, Math.ceil(pacientesSemPendenciaOrdenados.length / ITENS_POR_PAGINA_PENDENCIA));

  const pendenciasComPaginadas = useMemo(() => {
    const inicio = (paginaComPendenciaEscala - 1) * ITENS_POR_PAGINA_PENDENCIA;
    return pendenciasComResumo.slice(inicio, inicio + ITENS_POR_PAGINA_PENDENCIA);
  }, [pendenciasComResumo, paginaComPendenciaEscala]);

  const pacientesSemPendenciaPaginados = useMemo(() => {
    const inicio = (paginaSemPendenciaEscala - 1) * ITENS_POR_PAGINA_PENDENCIA;
    return pacientesSemPendenciaOrdenados.slice(inicio, inicio + ITENS_POR_PAGINA_PENDENCIA);
  }, [pacientesSemPendenciaOrdenados, paginaSemPendenciaEscala]);

  useEffect(() => {
    setPaginaComPendenciaEscala(1);
  }, [pendenciasComResumo.length]);

  useEffect(() => {
    setPaginaSemPendenciaEscala(1);
  }, [pacientesSemPendenciaOrdenados.length]);

  const totalPaginasSemAvaliacao = Math.max(1, Math.ceil(pacientesPendenciasUnicas.length / ITENS_POR_PAGINA_SEM_AVALIACAO));
  const pacientesPaginadosSemAvaliacao = useMemo(() => {
    const inicio = (paginaSemAvaliacao - 1) * ITENS_POR_PAGINA_SEM_AVALIACAO;
    return pacientesPendenciasUnicas.slice(inicio, inicio + ITENS_POR_PAGINA_SEM_AVALIACAO);
  }, [pacientesPendenciasUnicas, paginaSemAvaliacao]);

  useEffect(() => {
    setPaginaSemAvaliacao(1);
  }, [pacientesPendenciasUnicas.length]);

  const handleExportarSemAvaliacao = () => {
    const totalPendencias = Number(pendenciasSemAvaliacao?.total ?? pacientesPendenciasUnicas.length);
    exportarPendenciasSemAvaliacao({
      pacientes: pacientesPendenciasUnicas,
      totalPendencias
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
      <div className="bg-emerald-50/50 p-6 border-b border-emerald-100">
        <h2 className="text-emerald-800 font-bold flex items-center gap-2 text-xl">
          <CheckBadgeIcon className="w-6 h-6" /> Método Apollo
        </h2>
        <p className="text-emerald-600 text-sm mt-2">Fluxos e integrações do método.</p>
      </div>

      {metodoCarregando ? (
        <div className="p-16 flex flex-col items-center justify-center text-emerald-600">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500"></div>
          <div className="mt-4 text-sm font-bold uppercase tracking-wide">Carregando método...</div>
        </div>
      ) : (
        <div className="p-6 flex flex-col gap-6">
          <div className="bg-white/70 border border-white/60 shadow-sm rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
              Notificações
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl p-3">
                <CheckCircleIcon className="w-5 h-5" />
                <div className="text-sm font-semibold">
                  {loadingAnaliseSemPendencia ? 'Analisando sugestões...' : `Pacientes que possuem sugestões de escalas: ${totalPacientesComSugestoes}`}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl p-3">
                <CheckBadgeIcon className="w-5 h-5" />
                <div className="text-sm font-semibold">Pacientes com pendências de escala concluídas: {totalPendenciasConcluidas}</div>
              </div>
              <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl p-3">
                <ExclamationTriangleIcon className="w-5 h-5" />
                <div className="text-sm font-semibold">Formulários sem associação completa: {formulariosSemAssociacao.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-1 rounded-xl shadow-inner w-full">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1">
              <button
                onClick={() => setActiveMetodoTab('sem-avaliacao')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all cursor-pointer w-full ${activeMetodoTab === 'sem-avaliacao' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ExclamationTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Sem Avaliação
              </button>
              <button
                onClick={() => setActiveMetodoTab('sem-pendencia-escala')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all cursor-pointer w-full ${activeMetodoTab === 'sem-pendencia-escala' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Pendência Escalas
              </button>
              <button
                onClick={() => setActiveMetodoTab('associacao')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-bold transition-all cursor-pointer w-full ${activeMetodoTab === 'associacao' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <PencilSquareIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Associação
              </button>
            </div>
          </div>

          {activeMetodoTab === 'sem-avaliacao' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
              <div className="bg-rose-50/60 p-6 border-b border-rose-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-rose-800 font-bold flex items-center gap-2 text-xl">
                    <ExclamationTriangleIcon className="w-6 h-6" /> Pendências Sem Avaliação
                  </h2>
                  <p className="text-rose-600 text-sm mt-1">Avaliação Inicial / Reavaliação</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                  <button
                    onClick={carregarPendenciasSemAvaliacao}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 transition-all shadow-md flex items-center gap-2 justify-center"
                  >
                    <ArrowPathIcon className={`w-5 h-5 ${loadingSemAvaliacao ? 'animate-spin' : ''}`} /> Atualizar
                  </button>
                  <button
                    onClick={handleExportarSemAvaliacao}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all shadow-md flex items-center gap-2 justify-center"
                  >
                    <ArchiveBoxArrowDownIcon className="w-5 h-5" /> Exportar Excel
                  </button>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                    <div className="text-xs text-rose-500 font-bold uppercase">Total pendências</div>
                    <div className="text-2xl font-extrabold text-rose-700">{Number(pendenciasSemAvaliacao?.total ?? pacientesPendenciasUnicas.length)}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-xs text-emerald-500 font-bold uppercase">Pacientes únicos</div>
                    <div className="text-2xl font-extrabold text-emerald-700">{pacientesPendenciasUnicas.length}</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs text-slate-500 font-bold uppercase">Última atualização</div>
                    <div className="text-sm font-semibold text-slate-700">{new Date().toLocaleString()}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="bg-white relative">
                    {loadingSemAvaliacao && (
                      <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-9 w-9 border-b-4 border-rose-500"></div>
                          <span className="text-rose-600 font-bold text-xs uppercase tracking-wide">Carregando...</span>
                        </div>
                      </div>
                    )}
                    {erroSemAvaliacao ? (
                      <div className="p-10 text-center text-rose-600 font-semibold">{erroSemAvaliacao}</div>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                          <tr>
                            <th className="p-4">Paciente</th>
                            <th className="p-4 w-36">Paciente ID</th>
                            <th className="p-4">Especialidade</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {pacientesPendenciasUnicas.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="p-10 text-center text-gray-400 italic">
                                Nenhum registro encontrado.
                              </td>
                            </tr>
                          ) : (
                            pacientesPaginadosSemAvaliacao.map((p, idx) => (
                              <tr key={`${p.pacienteId}-${idx}`} className="hover:bg-rose-50/40 transition-colors">
                                <td className="p-4 font-semibold text-slate-700 whitespace-normal wrap-break-word">{p.pacienteNome}</td>
                                <td className="p-4 text-slate-500 font-mono text-xs">{p.pacienteId || '-'}</td>
                                <td className="p-4 text-slate-600">
                                  {Array.isArray(p.especialidade) ? p.especialidade.join(', ') : p.especialidade || '-'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {pacientesPendenciasUnicas.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                    <span className="hidden sm:inline">Pág. {paginaSemAvaliacao} de {totalPaginasSemAvaliacao}</span>
                    <div className="flex gap-1">
                      <button
                        disabled={paginaSemAvaliacao === 1}
                        onClick={() => setPaginaSemAvaliacao(1)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDoubleLeftIcon className="w-4 h-4" />
                      </button>
                      <button
                        disabled={paginaSemAvaliacao === 1}
                        onClick={() => setPaginaSemAvaliacao((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeftIcon className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        max={totalPaginasSemAvaliacao}
                        value={paginaSemAvaliacao}
                        onChange={(e) => {
                          let val = Number(e.target.value);
                          if (val < 1) val = 1;
                          if (val > totalPaginasSemAvaliacao) val = totalPaginasSemAvaliacao;
                          setPaginaSemAvaliacao(val);
                        }}
                        className="w-12 text-center border border-gray-300 rounded-md focus:border-rose-400 outline-none bg-white py-0.5"
                      />
                      <button
                        disabled={paginaSemAvaliacao === totalPaginasSemAvaliacao}
                        onClick={() => setPaginaSemAvaliacao((p) => Math.min(totalPaginasSemAvaliacao, p + 1))}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRightIcon className="w-4 h-4" />
                      </button>
                      <button
                        disabled={paginaSemAvaliacao === totalPaginasSemAvaliacao}
                        onClick={() => setPaginaSemAvaliacao(totalPaginasSemAvaliacao)}
                        className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                      >
                        <ChevronDoubleRightIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeMetodoTab === 'associacao' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
              <div className="bg-violet-50/60 p-6 border-b border-violet-100">
                <h2 className="text-violet-800 font-bold flex items-center gap-2 text-xl">
                  <PencilSquareIcon className="w-6 h-6" /> Associação de Formulário
                </h2>
                <p className="text-violet-600 text-sm mt-2">Criar ou Editar Associação de Formulário</p>
              </div>
              <div className="p-6 flex flex-col gap-6">
                {loadingAssociacao ? (
                  <div className="p-10 flex flex-col items-center justify-center text-violet-600">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-violet-500"></div>
                    <div className="mt-3 text-xs font-bold uppercase tracking-wide">Carregando associações...</div>
                  </div>
                ) : erroAssociacao ? (
                  <div className="p-6 text-center text-violet-600 font-semibold">{erroAssociacao}</div>
                ) : (
                  <>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5">
                        <div className="text-xs text-violet-500 font-bold uppercase">Formulários ativos</div>
                        <div className="text-3xl font-extrabold text-violet-700">{formulariosAtivos.length}</div>
                      </div>
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                        <div className="text-xs text-rose-500 font-bold uppercase">Sem associação completa</div>
                        <div className="text-3xl font-extrabold text-rose-700">{formulariosSemAssociacao.length}</div>
                        <div className="text-[11px] text-rose-500 mt-1">Sem especialidade ou diagnóstico</div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="relative w-full sm:max-w-md">
                        <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3.5 text-violet-400" />
                        <input
                          type="text"
                          placeholder="Buscar formulário..."
                          value={buscaAssociacao}
                          onChange={(e) => setBuscaAssociacao(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 border-2 border-violet-100 rounded-xl focus:border-violet-400 outline-none text-sm text-violet-900 placeholder-violet-300 font-medium bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                          <tr>
                            <th className="p-4">Formulário</th>
                            <th className="p-4 w-36">Tipo</th>
                            <th className="p-4 w-40">Associação</th>
                            <th className="p-4 w-44 text-center">Ação</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                          {formulariosAssociacaoOrdenados.length === 0 ? (
                            <tr>
                              <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                                Nenhum formulário ativo.
                              </td>
                            </tr>
                          ) : (
                            formulariosAssociacaoOrdenados.map((form) => {
                              const formId = form?.id ?? form?.formularioId ?? form?.formId;
                              const escala = (escalasAssociadas || []).find((esc) => Number(esc?.formularioId) === Number(formId));
                              const listaDiag = Array.isArray(escala?.listaDiagnosticos)
                                ? escala.listaDiagnosticos
                                : String(escala?.listaDiagnosticos || '')
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                              const listaEsp = Array.isArray(escala?.especialidade)
                                ? escala.especialidade
                                : String(escala?.especialidade || '')
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean);
                              const associacaoCompleta = Boolean(escala) && listaDiag.length > 0 && listaEsp.length > 0;
                              const nomeFormulario =
                                form?.nome_formulario ??
                                form?.nomeEscala ??
                                form?.nomeFormulario ??
                                form?.formulario_nome ??
                                form?.titulo ??
                                form?.tituloFormulario ??
                                form?.nome ??
                                form?.name ??
                                form?.nome_escala;
                              const tipoFormulario = form?.tipo_formulario ?? form?.tipoFormulario ?? form?.tipo ?? form?.categoria ?? '-';

                              return (
                                <tr key={formId ?? nomeFormulario} className="hover:bg-violet-50/30 transition-colors">
                                  <td className="p-4 text-slate-700 font-semibold whitespace-normal wrap-break-word">
                                    {nomeFormulario || `Formulário ${formId ?? '—'}`}
                                  </td>
                                  <td className="p-4 text-slate-500">{tipoFormulario}</td>
                                  <td className="p-4">
                                    <span
                                      className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${
                                        associacaoCompleta
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : 'bg-rose-50 text-rose-700 border-rose-200'
                                      }`}
                                    >
                                      {associacaoCompleta ? 'Completa' : 'Incompleta'}
                                    </span>
                                  </td>
                                  <td className="p-4 text-center">
                                    <button
                                      onClick={() => abrirModalAssociacao(form, escala)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all ${
                                        associacaoCompleta ? 'bg-violet-600 text-white hover:bg-violet-700' : 'bg-rose-600 text-white hover:bg-rose-700'
                                      }`}
                                    >
                                      {associacaoCompleta ? 'Editar associação' : 'Criar associação'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeMetodoTab === 'sem-pendencia-escala' && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
              <div className="bg-indigo-50/60 p-6 border-b border-indigo-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <h2 className="text-indigo-800 font-bold flex items-center gap-2 text-xl">
                    <CheckBadgeIcon className="w-6 h-6" /> Pendência Escalas
                  </h2>
                  <p className="text-indigo-600 text-sm mt-1">Cruzado entre pacientes com e sem pendência.</p>
                </div>
                <button
                  onClick={carregarPendenciasEscala}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-all shadow-md flex items-center gap-2 justify-center"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${loadingPendenciasEscala ? 'animate-spin' : ''}`} /> Atualizar
                </button>
              </div>

              <div className="p-6 flex flex-col gap-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                    <div className="text-xs text-indigo-500 font-bold uppercase">Com pendência</div>
                    <div className="text-2xl font-extrabold text-indigo-700">{pendenciasComResumo.length}</div>
                  </div>
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                    <div className="text-xs text-emerald-500 font-bold uppercase">Sem pendência</div>
                    <div className="text-2xl font-extrabold text-emerald-700">{pacientesSemPendenciaEscala.length}</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="text-xs text-slate-500 font-bold uppercase">Total pacientes</div>
                    <div className="text-2xl font-extrabold text-slate-700">{totalPacientesConsiderados}</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="bg-white relative">
                    {loadingPendenciasEscala && (
                      <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-9 w-9 border-b-4 border-emerald-500"></div>
                          <span className="text-emerald-600 font-bold text-xs uppercase tracking-wide">Carregando...</span>
                        </div>
                      </div>
                    )}
                    {erroPendenciasEscala ? (
                      <div className="p-10 text-center text-emerald-600 font-semibold">{erroPendenciasEscala}</div>
                    ) : (
                      <div className="p-4 sm:p-6">
                        <div className="text-xs text-emerald-600 font-bold uppercase mb-3">Sem pendência de escala</div>
                        {loadingAnaliseSemPendencia && (
                          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-emerald-500"></div>
                            Analisando pacientes...
                          </div>
                        )}
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                              <tr>
                                <th className="p-4">Paciente</th>
                                <th className="p-4 w-28 text-center">Sugestões</th>
                                <th className="p-4 w-40">Diagnóstico</th>
                                <th className="p-4 w-44 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                              {pacientesSemPendenciaEscala.length === 0 ? (
                                <tr>
                                  <td colSpan="4" className="p-10 text-center text-gray-400 italic">
                                    Nenhum paciente.
                                  </td>
                                </tr>
                              ) : (
                                pacientesSemPendenciaPaginados.map((nome, idx) => {
                                  const analise = analiseSemPendencia[normalizeNome(nome)];
                                  const status = analise?.status;
                                  let badgeLabel = 'Não analisado';
                                  let badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                                  if (status === 'com_sugestoes') {
                                    badgeLabel = 'Com sugestões';
                                    badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                  } else if (status === 'sem_sugestoes') {
                                    badgeLabel = 'Sem sugestões';
                                    badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
                                  } else if (status === 'sem_sugestoes_outros') {
                                    badgeLabel = 'Diagnóstico Outros';
                                    badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                                  } else if (status === 'sem_diagnostico') {
                                    badgeLabel = 'Sem diagnóstico';
                                    badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                                  } else if (status === 'sem_dados') {
                                    badgeLabel = 'Sem dados';
                                    badgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
                                  } else if (status === 'sem_presenca') {
                                    badgeLabel = 'Sem presença';
                                    badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                  }

                                  return (
                                    <tr key={`sem-${idx}`} className="hover:bg-emerald-50/40 transition-colors">
                                      <td className="p-4 text-slate-700 whitespace-normal wrap-break-word">{nome}</td>
                                      <td className="p-4 text-center font-bold text-slate-700">{analise ? analise.sugestoes : '-'}</td>
                                      <td className="p-4 text-slate-600 whitespace-normal wrap-break-word">{analise?.diagnosticoMacro || '-'}</td>
                                      <td className="p-4 text-center">
                                        <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold border ${badgeClass}`}>{badgeLabel}</span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {pacientesSemPendenciaEscala.length > 0 && (
                          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <span className="hidden sm:inline">Pág. {paginaSemPendenciaEscala} de {totalPaginasSemPendencia}</span>
                            <div className="flex gap-1">
                              <button
                                disabled={paginaSemPendenciaEscala === 1}
                                onClick={() => setPaginaSemPendenciaEscala(1)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDoubleLeftIcon className="w-4 h-4" />
                              </button>
                              <button
                                disabled={paginaSemPendenciaEscala === 1}
                                onClick={() => setPaginaSemPendenciaEscala((p) => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronLeftIcon className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={totalPaginasSemPendencia}
                                value={paginaSemPendenciaEscala}
                                onChange={(e) => {
                                  let val = Number(e.target.value);
                                  if (val < 1) val = 1;
                                  if (val > totalPaginasSemPendencia) val = totalPaginasSemPendencia;
                                  setPaginaSemPendenciaEscala(val);
                                }}
                                className="w-12 text-center border border-gray-300 rounded-md focus:border-emerald-400 outline-none bg-white py-0.5"
                              />
                              <button
                                disabled={paginaSemPendenciaEscala === totalPaginasSemPendencia}
                                onClick={() => setPaginaSemPendenciaEscala((p) => Math.min(totalPaginasSemPendencia, p + 1))}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronRightIcon className="w-4 h-4" />
                              </button>
                              <button
                                disabled={paginaSemPendenciaEscala === totalPaginasSemPendencia}
                                onClick={() => setPaginaSemPendenciaEscala(totalPaginasSemPendencia)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDoubleRightIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="bg-white relative">
                    {loadingPendenciasEscala && (
                      <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="animate-spin rounded-full h-9 w-9 border-b-4 border-indigo-500"></div>
                          <span className="text-indigo-600 font-bold text-xs uppercase tracking-wide">Carregando...</span>
                        </div>
                      </div>
                    )}
                    {erroPendenciasEscala ? (
                      <div className="p-10 text-center text-indigo-600 font-semibold">{erroPendenciasEscala}</div>
                    ) : (
                      <div className="p-4 sm:p-6">
                        <div className="text-xs text-indigo-600 font-bold uppercase mb-3">Com pendência de escala</div>
                        <div className="rounded-xl border border-gray-100 overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                              <tr>
                                <th className="p-4">Paciente</th>
                                <th className="p-4 w-24 text-center">Abertas</th>
                                <th className="p-4 w-28 text-center">Concluídas</th>
                                <th className="p-4 w-28 text-center">Não aplica</th>
                                <th className="p-4 w-20 text-center">Total</th>
                                <th className="p-4 w-36 text-center">Dias desde última</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                              {pendenciasComResumo.length === 0 ? (
                                <tr>
                                  <td colSpan="6" className="p-10 text-center text-gray-400 italic">
                                    Nenhum paciente.
                                  </td>
                                </tr>
                              ) : (
                                pendenciasComPaginadas.map((item, idx) => (
                                  <tr key={`com-${idx}`} className="hover:bg-indigo-50/40 transition-colors">
                                    <td className="p-4 text-slate-700 whitespace-normal wrap-break-word">{item.nome}</td>
                                    <td className="p-4 text-center font-bold text-rose-600">{item.abertas}</td>
                                    <td className="p-4 text-center font-bold text-emerald-600">{item.concluidas}</td>
                                    <td className="p-4 text-center font-bold text-slate-500">{item.nao_aplica}</td>
                                    <td className="p-4 text-center font-bold text-indigo-700">{item.total}</td>
                                    <td className="p-4 text-center text-slate-600">
                                      {item.abertas === 0 && item.ultimaData
                                        ? Math.floor((Date.now() - item.ultimaData.getTime()) / (1000 * 60 * 60 * 24))
                                        : '-'}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {pendenciasComResumo.length > 0 && (
                          <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
                            <span className="hidden sm:inline">Pág. {paginaComPendenciaEscala} de {totalPaginasComPendencia}</span>
                            <div className="flex gap-1">
                              <button
                                disabled={paginaComPendenciaEscala === 1}
                                onClick={() => setPaginaComPendenciaEscala(1)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDoubleLeftIcon className="w-4 h-4" />
                              </button>
                              <button
                                disabled={paginaComPendenciaEscala === 1}
                                onClick={() => setPaginaComPendenciaEscala((p) => Math.max(1, p - 1))}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronLeftIcon className="w-4 h-4" />
                              </button>
                              <input
                                type="number"
                                min="1"
                                max={totalPaginasComPendencia}
                                value={paginaComPendenciaEscala}
                                onChange={(e) => {
                                  let val = Number(e.target.value);
                                  if (val < 1) val = 1;
                                  if (val > totalPaginasComPendencia) val = totalPaginasComPendencia;
                                  setPaginaComPendenciaEscala(val);
                                }}
                                className="w-12 text-center border border-gray-300 rounded-md focus:border-indigo-400 outline-none bg-white py-0.5"
                              />
                              <button
                                disabled={paginaComPendenciaEscala === totalPaginasComPendencia}
                                onClick={() => setPaginaComPendenciaEscala((p) => Math.min(totalPaginasComPendencia, p + 1))}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronRightIcon className="w-4 h-4" />
                              </button>
                              <button
                                disabled={paginaComPendenciaEscala === totalPaginasComPendencia}
                                onClick={() => setPaginaComPendenciaEscala(totalPaginasComPendencia)}
                                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                              >
                                <ChevronDoubleRightIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={associacaoModalAberto} onClose={fecharModalAssociacao}>
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Associação de Escala</h3>
            <p className="text-sm text-slate-500">
              {associacaoFormSelecionado?.nome_formulario ??
                associacaoFormSelecionado?.nomeEscala ??
                associacaoFormSelecionado?.nomeFormulario ??
                associacaoFormSelecionado?.titulo ??
                associacaoFormSelecionado?.nome ??
                'Formulário'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-100 p-3">
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Especialidades</div>
              <MultiSelect
                options={opcoesEspecialidades}
                value={opcoesEspecialidades.filter((opt) => associacaoEspecialidades.includes(opt.value))}
                onChange={(selected) => setAssociacaoEspecialidades((selected || []).map((opt) => opt.value))}
                placeholder="Selecione especialidades..."
              />
            </div>

            <div className="rounded-xl border border-slate-100 p-3">
              <div className="text-xs font-bold text-slate-500 uppercase mb-2">Diagnósticos Macros</div>
              <MultiSelect
                options={opcoesDiagnosticos}
                value={opcoesDiagnosticos.filter((opt) => associacaoDiagnosticos.includes(opt.value))}
                onChange={(selected) => setAssociacaoDiagnosticos((selected || []).map((opt) => opt.value))}
                placeholder="Selecione diagnósticos..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={fecharModalAssociacao} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm">
              Cancelar
            </button>
            <button
              onClick={salvarAssociacao}
              disabled={salvandoAssociacao}
              className="px-4 py-2 rounded-lg bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 disabled:opacity-60"
            >
              {salvandoAssociacao ? 'Salvando...' : 'Salvar associação'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MetodoTab;
