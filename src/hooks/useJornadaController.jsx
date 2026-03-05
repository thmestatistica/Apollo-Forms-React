import { useState, useEffect, useCallback } from 'react';

// Imports das funções utilitárias e de API
import { listar_pacientes, listar_agendamentos_paciente, listar_respostas_prontuario, buscar_profissionais } from "../api/jornada/jornada_utils";
import { calcularTotaisRobotica } from "../utils/jornada/stats";
import { formatarNome, processarProntuario } from "../utils/jornada/format";

// 🔥 CACHE GLOBAL (Fora do Hook): 
// Sobrevive à desmontagem do componente visual.
// Isso garante o "Zero Loading" ao voltar para a tela.
const globalCache = {
    pacientes: null,
    dadosPorId: {} // { [id]: { agendamentos, stats, prontuario } }
};

export const useJornadaController = () => {
    // --- Estados de Dados ---
    const [pacientes, setPacientes] = useState([]);
    const [pacienteSelecionadoId, setPacienteSelecionadoId] = useState('');
    const [pacienteDetalhes, setPacienteDetalhes] = useState(null);
    const [agendamentos, setAgendamentos] = useState([]);
    const [stats, setStats] = useState(null);
    const [prontuario, setProntuario] = useState([]);
    const [profissionais, setProfissionais] = useState([])

    // --- Estados de Loading ---
    const [loadingInicial, setLoadingInicial] = useState(true);
    const [loadingDados, setLoadingDados] = useState(false);
    const [loadingProntuario, setLoadingProntuario] = useState(false);

    useEffect(() => {
        const loadProfissionais = async () => {
            if (globalCache.profissionais) {
                setProfissionais(globalCache.profissionais);
                return;
            }

            try {
                const dados = await buscar_profissionais();
                globalCache.profissionais = dados;

                const profissionaisMap = Object.fromEntries(
                    dados.map(p => [p.id, p.usuario.nome])
                );

                setProfissionais(profissionaisMap);
            } catch (e) {
                console.error("Erro ao carregar profissionais", e);
            }
        };

        loadProfissionais();
    }, []);

    // 1. Carregar Pacientes (Executa apenas 1 vez por sessão do app)
    useEffect(() => {
        const loadPacientes = async () => {
            // Se já tem no cache global, usa de lá instantaneamente
            if (globalCache.pacientes) {
                setPacientes(globalCache.pacientes);
                setLoadingInicial(false);
                return;
            }

            try {
                const dados = await listar_pacientes();

                // Filtros de exclusão (ADM, Teste, etc)
                const invalidos = ["ADM", "TESTE", "TEMP", "TREINAMENTO", "AUSÊNCIA", "TERAP.DISP", "TESTA TESTO", "ORTESE"];

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
                setPacientes(validos);
            } catch (e) {
                console.error("Erro ao carregar pacientes", e);
            } finally {
                setLoadingInicial(false);
            }
        };
        loadPacientes();
    }, []);

    // 2. Selecionar Paciente (Busca Paralela + Cache por ID)
    useEffect(() => {
        if (!pacienteSelecionadoId) {
            setAgendamentos([]); setStats(null); setPacienteDetalhes(null); setProntuario([]);
            return;
        }

        const loadDetalhes = async () => {
            // Define detalhes básicos (já temos na lista de pacientes)
            const pct = pacientes.find(p => String(p.id) === String(pacienteSelecionadoId));
            setPacienteDetalhes(pct);

            // 🔥 CHECK DE CACHE: Se já visitou esse paciente, carrega instantâneo
            const cached = globalCache.dadosPorId[pacienteSelecionadoId];
            if (cached) {
                setAgendamentos(cached.agendamentos);
                setStats(cached.stats);
                setProntuario(cached.prontuario);
                setLoadingDados(false);
                return; // Não faz requisição de rede
            }

            setLoadingDados(true);
            try {
                // 🔥 PARALELISMO: Busca Agendamentos e Prontuário ao mesmo tempo
                const [histRaw, formsRaw] = await Promise.all([
                    listar_agendamentos_paciente(pacienteSelecionadoId),
                    listar_respostas_prontuario(pacienteSelecionadoId)
                ]);

                // Processamento Agendamentos
                const sortedHist = (histRaw || []).sort((a, b) => new Date(b.inicio).getTime() - new Date(a.inicio).getTime());
                const statsCalc = calcularTotaisRobotica(sortedHist);

                // Processamento Prontuário (usa a lista de agendamentos para cruzar dados)
                const processedForms = processarProntuario(formsRaw, sortedHist);

                // Atualiza Estado
                setAgendamentos(sortedHist);
                setStats(statsCalc);
                setProntuario(processedForms);

                // Salva no Cache Global
                globalCache.dadosPorId[pacienteSelecionadoId] = {
                    agendamentos: sortedHist,
                    stats: statsCalc,
                    prontuario: processedForms
                };

            } catch (e) {
                console.error("Erro ao carregar detalhes do paciente", e);
            } finally {
                setLoadingDados(false);
            }
        };

        loadDetalhes();

    }, [pacienteSelecionadoId, pacientes]);

    // 3. Ação: Recarregar Prontuário Manualmente
    const recarregarProntuario = useCallback(async () => {
        if (!pacienteSelecionadoId) return;
        setLoadingProntuario(true);
        try {
            const rawForms = await listar_respostas_prontuario(pacienteSelecionadoId);

            // Re-processa usando o estado atual de agendamentos
            const processedForms = processarProntuario(rawForms, agendamentos);

            setProntuario(processedForms);

            // Atualiza o cache também
            if (globalCache.dadosPorId[pacienteSelecionadoId]) {
                globalCache.dadosPorId[pacienteSelecionadoId].prontuario = processedForms;
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingProntuario(false);
        }
    }, [pacienteSelecionadoId, agendamentos]);

    // Retorna tudo que a View precisa
    return {
        pacientes,
        pacienteSelecionadoId, setPacienteSelecionadoId,
        pacienteDetalhes,
        agendamentos,
        stats,
        prontuario,

        loadingInicial,
        loadingDados,
        loadingProntuario,

        recarregarProntuario,

        profissionais
    };
};