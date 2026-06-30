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
    const [tipoOrdenacao, setTipoOrdenacao] = useState('agendamento');

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
                const pct = pacientes.find(p => String(p.id) === String(pacienteSelecionadoId));
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

        // 🔥 Adicionado 'tipoOrdenacao' como dependência para disparar o recarregamento ao mudar o filtro
        }, [pacienteSelecionadoId, pacientes, tipoOrdenacao]);

    // 3. Ação: Recarregar Prontuário Manualmente
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
        pacienteSelecionadoId, setPacienteSelecionadoId,
        pacienteDetalhes,
        agendamentos,
        stats,
        prontuario,
        tipoOrdenacao,      
        setTipoOrdenacao,  
        loadingInicial,
        loadingDados,
        loadingProntuario,

        recarregarProntuario,

        profissionais
    };
};