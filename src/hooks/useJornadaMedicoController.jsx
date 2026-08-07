import { useState, useEffect, useCallback } from 'react';

import { 
    listar_pacientes, 
    listar_agendamentos_paciente, 
    listar_respostas_prontuario, 
    buscar_profissionais_stockcare, 
    buscar_agendamentos_stockcare 
} from "../api/jornada/jornada_utils";

import { obter_pacientes_controle_do_medico } from "../api/stockcare/controle_visualizacao";
import { calcularTotaisRobotica } from "../utils/jornada/stats";
import { formatarNome, processarProntuario } from "../utils/jornada/format";
import { useAuth } from './useAuth';

// 🔥 CACHE GLOBAL (Fora do Hook)
const globalCache = {
    pacientes: null,
    dadosPorId: {}
};

export const useJornadaMedicoController = () => {
    const [pacientes, setPacientes] = useState([]);
    const [pacientesAll, setPacientesAll] = useState([]);
    const [pacientesProfissional, setPacientesProfissional] = useState([]);
    
    const [pacientesBloqueadosIds, setPacientesBloqueadosIds] = useState([]);
    const [pacientesAdicionadosIds, setPacientesAdicionadosIds] = useState([]);

    const [agendamentos, setAgendamentos] = useState([]);
    const [pacienteDetalhes, setPacienteDetalhes] = useState([]);
    const [stats, setStats] = useState(null);
    const [prontuario, setProntuario] = useState([]);
    const [profissionais, setProfissionais] = useState([]);
    const [tipoOrdenacao, setTipoOrdenacao] = useState('agendamento');

    const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState();

    const [loadingInicial, setLoadingInicial] = useState(false);
    const [loadingDados, setLoadingDados] = useState(false);
    const [loadingProntuario, setLoadingProntuario] = useState(false);

    const { user } = useAuth();

    const idUsuarioLogado = user?.id || user?.usuario?.id_usuario;
    const USUARIO_APOLLO = user?.usuario?.id_usuario === 109 && user?.usuario?.id_papel_usuario === 7;

    useEffect(() => {
        const loadProfissionais = async () => {
            try {
                const dados = await buscar_profissionais_stockcare();
                globalCache.profissionais = dados;

                const PAPEIS_PERMITIDOS = [1, 3];

                const profissionaisFiltrados = (Array.isArray(dados) ? dados : []).filter(p => {
                    const papelValido = PAPEIS_PERMITIDOS.includes(p.id_papel_usuario);

                    const nomeUpper = (p.nome || "").toUpperCase();
                    const naoETeste = !nomeUpper.includes("TESTE");
                    const naoEOttobock = !nomeUpper.includes("OTT");
                    const naoEAdmin = !nomeUpper.includes("ADMIN");

                    return papelValido && naoETeste && naoEOttobock && naoEAdmin;
                });

                const profissionaisMap = Object.fromEntries(
                    profissionaisFiltrados.map(p => [p.id_usuario, p.nome])
                );

                setProfissionais(profissionaisMap);
            } catch (e) {
                console.error("Erro ao carregar profissionais do stockcare", e);
            }
        };

        loadProfissionais();
    }, [user]);

    useEffect(() => {
        const loadPacientes = async () => {
            if (globalCache.pacientes) {
                setPacientesAll(globalCache.pacientes);
                return;
            }

            try {
                const dados = await listar_pacientes();

                // Filtros de exclusão (ADM, Teste, etc)
                const invalidos = ["ADM", "TEMP", "TREINAMENTO", "AUSÊNCIA", "TERAP.DISP", "TESTA TESTO", "ORTESE"];

                const validos = dados
                    .filter(p => {
                        if (!p.ativo) return false;
                        const nome = (p.nome || "").toUpperCase();
                        return !invalidos.some(t => nome.includes(t));
                    })
                    .map(p => ({ ...p, nomeFormatado: formatarNome(p.nome) }))
                    .sort((a, b) => a.nomeFormatado.localeCompare(b.nomeFormatado));

                // Salva no Cache Global e no Estado Local
                globalCache.pacientes = validos;

                setPacientesAll(validos);
            } catch (e) {
                console.error("Erro ao carregar pacientes", e);
            }
        };
        loadPacientes();
    }, []);

    useEffect(() => {
        const loadPacientesControle = async () => {
            if (!idUsuarioLogado) return;

            try {
                const res = await obter_pacientes_controle_do_medico(idUsuarioLogado);
                setPacientesBloqueadosIds(res?.ids_pacientes_bloqueados || []);
                setPacientesAdicionadosIds(res?.ids_pacientes_adicionados || []);
            } catch (e) {
                console.error("Erro ao carregar controles de pacientes do médico", e);
            }
        };

        loadPacientesControle();
    }, [idUsuarioLogado]);

    useEffect(() => {
        const loadPacientesDoProfissional = async () => {
            if (!idUsuarioLogado) return;

            try {
                const res = await buscar_agendamentos_stockcare({ usuarioId: idUsuarioLogado });
                const listaAgendamentos = Array.isArray(res) ? res : (res?.data || []);

                setAgendamentos(listaAgendamentos);

                const idsUnicos = [...new Set(listaAgendamentos.map(ag => ag.id_paciente))];
                setPacientesProfissional(idsUnicos);
            } catch (e) {
                console.error("Erro ao carregar agendamentos do profissional", e);
            }
        };

        loadPacientesDoProfissional();
    }, [idUsuarioLogado]);

    useEffect(() => {
        if (!pacientesAll.length) {
            setPacientes([]);
            return;
        }

        // Se for o usuário APOLLO, carrega todos. Senão, carrega quem tem agendamento OU quem foi adicionado.
        let basePacientes = USUARIO_APOLLO 
            ? pacientesAll 
            : pacientesAll.filter(p => 
                pacientesProfissional.includes(p.id) || pacientesAdicionadosIds.includes(p.id)
            );

        // Remove os pacientes cujos IDs estão na lista de bloqueados
        const filtradosSemBloqueados = basePacientes.filter(
            p => !pacientesBloqueadosIds.includes(p.id)
        );

        setPacientes(filtradosSemBloqueados);
    }, [pacientesAll, pacientesProfissional, pacientesBloqueadosIds, pacientesAdicionadosIds, USUARIO_APOLLO]);

    useEffect(() => {
        if (!pacienteSelecionadoId) {
            setAgendamentos([]); setStats(null); setPacienteDetalhes(null); setProntuario([]);
            return;
        }

        const loadDetalhes = async () => {
            const listaPacientes = USUARIO_APOLLO ? pacientesAll : pacientes;

            const pct = listaPacientes.find(
                p => String(p.id) === String(pacienteSelecionadoId)
            );
            setPacienteDetalhes(pct);

            const cacheKey = `${pacienteSelecionadoId}_${tipoOrdenacao}`;
            const cached = globalCache.dadosPorId[cacheKey];
            if (cached) {
                setAgendamentos(cached.agendamentos);
                setStats(cached.stats);
                setProntuario(cached.prontuario);
                setLoadingDados(false);
                return;
            }

            setLoadingDados(true);
            try {
                const [histRaw, formsRaw] = await Promise.all([
                    listar_agendamentos_paciente(pacienteSelecionadoId),
                    listar_respostas_prontuario(pacienteSelecionadoId)
                ]);

                const sortedHist = (histRaw || []).sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
                const statsCalc = calcularTotaisRobotica(sortedHist);

                // 🔥 Passando o tipo de ordenação atual aqui
                const processedForms = processarProntuario(formsRaw, sortedHist, tipoOrdenacao);

                setAgendamentos(sortedHist);
                setStats(statsCalc);
                setProntuario(processedForms);

                // Salva no cache com a chave específica da ordenação
                globalCache.dadosPorId[cacheKey] = {
                    agendamentos: sortedHist,
                    stats: statsCalc,
                    prontuario: processedForms
                };

            } catch (e) {
                console.error("Erro ao carregar detalhes", e);
            } finally {
                setLoadingDados(false);
            }
        };

        loadDetalhes();
    }, [pacienteSelecionadoId, pacientes, tipoOrdenacao, pacientesAll, USUARIO_APOLLO]);

    const recarregarProntuario = useCallback(async () => {
        if (!pacienteSelecionadoId) return;
        setLoadingProntuario(true);
        try {
            const rawForms = await listar_respostas_prontuario(pacienteSelecionadoId);

            const processedForms = processarProntuario(rawForms, agendamentos, tipoOrdenacao);

            setProntuario(processedForms);

            const cacheKey = `${pacienteSelecionadoId}_${tipoOrdenacao}`;
            if (globalCache.dadosPorId[cacheKey]) {
                globalCache.dadosPorId[cacheKey].prontuario = processedForms;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProntuario(false);
        }
    }, [pacienteSelecionadoId, agendamentos, tipoOrdenacao]);

    // Retorna tudo que a View precisa
    return {
        pacientes,
        profissionais,
        agendamentos,
        pacienteSelecionadoId,
        setProfissionais,
        setPacienteSelecionadoId,
        loadingInicial,
        setLoadingInicial,
        loadingDados,
        setLoadingDados,
        loadingProntuario,
        setLoadingProntuario,
        pacienteDetalhes,
        setPacienteDetalhes,
        tipoOrdenacao,
        setTipoOrdenacao,
        stats,
        setStats,
        prontuario,
        setProntuario,
        recarregarProntuario,
        pacientesAll
    };
};
