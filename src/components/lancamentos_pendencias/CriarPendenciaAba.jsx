import { useState, useEffect, useCallback, useMemo } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";
import LoadingGen from "../info/LoadingGen";
import ErroGen from "../info/ErroGen";
import InfoGen from "../info/InfoGen";
import SingleSelect from "../input/SingleSelect";

import { buscar_paciente_por_id } from "../../api/pacientes/pacientes_utils";
import { formatarData, formatarHora } from "../../utils/format/formatar_utils";

// API
import { criar_pendencia_manual } from "../../api/pendencias/pendencias_utils";
import { listar_agendamentos } from "../../api/agenda/agenda_utils";
import { listar_escalas } from "../../api/forms/forms_utils";

export default function CriarPendenciaAba() {
const { user } = useAuth();
const navigate = useNavigate();

// Estados de Dados
const [listaPacientes, setListaPacientes] = useState([]);
const [listaAgendamentos, setListaAgendamentos] = useState([]);
const [listaFormularios, setListaFormularios] = useState([]);
const [diagnosticoMacro, setDiagnosticoMacro] = useState(null);
const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split('T')[0]);

// Estados de Seleção
const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
const [agendamentoSelecionado, setAgendamentoSelecionado] = useState(null);
const [formularioSelecionado, setFormularioSelecionado] = useState(null);

// Estados de Filtro
    // Filtro de data inicial para agendamentos (não obrigatório)
    const [dataInicio, setDataInicio] = useState("");
    // Filtro de data final para agendamentos (não obrigatório)
    const [dataFim, setDataFim] = useState("");
    
    // Estados de Controle de Interface
    // Página atual da lista de agendamentos
    const [paginaAtual, setPaginaAtual] = useState(1);
    // Quantidade de itens por página na lista de agendamentos
    const ITENS_POR_PAGINA = 6;
    // Etapa ativa do wizard (1: Paciente, 2: Agendamento, 3: Formulário)
    const [etapaAtiva, setEtapaAtiva] = useState(1);
    
    // Estados de Carregamento e Erro
    // Tela de carregamento inicial (pacientes + forms)
    const [loading, setLoading] = useState(false);
    // Carregamento específico da busca de agendamentos
    const [loadingAgendamentos, setLoadingAgendamentos] = useState(false);
    // Mensagem de erro global
    const [erro, setErro] = useState(null);

    // Carregar lista de pacientes (via agendamentos) e formulários ao montar
    useEffect(() => {
    const carregarDadosIniciais = async () => {
    const usuarioId = user?.id; // Usar usuarioId para agendamentos
    const profissionalId = user?.profissionalId; // Apenas check

    if (!profissionalId && !usuarioId) {
        setErro("Identificação do profissional não encontrada.");
        return;
    }

    setLoading(true);
    try {
        // Obter especialidade para filtrar formulários (escalas)
        const userEspecialidade = Array.isArray(user?.especialidade) 
          ? user.especialidade[0] 
          : (user?.especialidade || user?.profissional?.especialidade || "Não identificada");

        const filtros = userEspecialidade !== "Não identificada" ? { especialidade: userEspecialidade } : {};

        const [agendamentosData, forms] = await Promise.all([
            listar_agendamentos({ usuarioId: Number(usuarioId), pageSize: 10000 }), // Tenta pegar muitos agendamentos para extrair pacientes
            listar_escalas(filtros)
        ]);
        
        // console.log("Agendamentos recebidos:", agendamentosData);

        // Processar formulários (escalas)
        if (Array.isArray(forms)) {
            // Filtra escalas que tenham ID de formulário válido
            const validas = forms.filter(s => s.formularioId);

            // Ordena a lista alfabeticamente
            validas.sort((a, b) => {
                const nomeA = (a.nomeEscala || a.titulo || "").toLowerCase();
                const nomeB = (b.nomeEscala || b.titulo || "").toLowerCase();
                return nomeA.localeCompare(nomeB);
            });
            setListaFormularios(validas);
        } else {
             setListaFormularios([]);
        }

        // Processar pacientes únicos dos agendamentos
        const listaBrutaAgendamentos = Array.isArray(agendamentosData) 
            ? agendamentosData 
            : (agendamentosData?.agendamentos || []);

        const listaAgendamentosFiltrada = listaBrutaAgendamentos.filter(ag => ag.paciente.nome && !['FÉRIAS', 'AUSÊNCIA', 'Teste', 'ADM/TEMP', 'VAGO/TEMP', 'RESERVADO'].includes(ag.paciente.nome)); 

        const mapPacientes = new Map();
        listaAgendamentosFiltrada.forEach((ag) => {
            if (ag.paciente && ag.paciente.id) {
                mapPacientes.set(ag.paciente.id, ag.paciente);
            }
        });

        // Converter para formato do SingleSelect
        const optionsPacientes = Array.from(mapPacientes.values())
            .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
            .map((p) => ({
                value: p.id,
                label: p.nome
            }));

        setListaPacientes(optionsPacientes);

    } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
        setErro("Falha ao carregar lista de pacientes ou formulários.");
    } finally {
        setLoading(false);
    }
    };

    carregarDadosIniciais();
}, [user]);

// Buscar agendamentos quando o paciente muda (ou datas)
const buscarAgendamentos = useCallback(async () => {
    if (!pacienteSelecionado) {
        setListaAgendamentos([]);
        setDiagnosticoMacro(null);
        return;
    }

    const usuarioId = user?.usuarioId ?? user?.id;
    if (!usuarioId) return;

    setLoadingAgendamentos(true);
    setAgendamentoSelecionado(null); // Limpa seleção anterior
    try {
    const filtros = {
        pacienteId: Number(pacienteSelecionado.value), // Extrai ID do objeto SingleSelect
        usuarioId: Number(usuarioId),
        order: 'desc' // Mais recentes primeiro
    };

    // Busca Diagnóstico Macro do Paciente
    const p = await buscar_paciente_por_id(Number(pacienteSelecionado.value));
    if (p && p.diagnosticoMacro) {
        const dm = p.diagnosticoMacro;
        setDiagnosticoMacro(Array.isArray(dm) ? dm[0] : dm);
    } else {
        setDiagnosticoMacro(null);
    }

    if (dataInicio) filtros.startDate = dataInicio;
    if (dataFim) filtros.endDate = dataFim;

    const resultado = await listar_agendamentos(filtros);
    
    // A API pode retornar array direto ou objeto com chave 'agendamentos'
    const agendamentos = Array.isArray(resultado) 
        ? resultado 
        : Array.isArray(resultado?.agendamentos) 
            ? resultado.agendamentos 
            : [];
            
    setListaAgendamentos(agendamentos);
    } catch (err) {
    console.error("Erro ao buscar agendamentos:", err);
    mostrarErroToast("Erro ao buscar histórico de agendamentos.");
    } finally {
    setLoadingAgendamentos(false);
    }
}, [pacienteSelecionado, dataInicio, dataFim, user]);

// Trigger automático ao selecionar paciente
    useEffect(() => {
        if (pacienteSelecionado) {
            buscarAgendamentos();
        } else {
            setListaAgendamentos([]);
        }
    }, [pacienteSelecionado, buscarAgendamentos]);

    // Reset paginação quando filtros mudam
    useEffect(() => {
        setPaginaAtual(1);
    }, [pacienteSelecionado, dataInicio, dataFim]);

    const mostrarErroToast = (msg) => {
    Swal.fire({
        icon: 'error',
        title: 'Atenção',
        text: msg,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
};
const opcoesFormularios = useMemo(() => {
        return listaFormularios.map(form => ({
            value: form.formularioId,
            label: form.nomeEscala || `Escala ${form.formularioId}`
        }));
    }, [listaFormularios]);

    // Calcula a especialidade do usuário para garantir envio correto no payload
    const userEspecialidade = useMemo(() => {
        return Array.isArray(user?.especialidade) 
          ? user.especialidade[0] 
          : (user?.especialidade || user?.profissional?.especialidade || "Não identificada");
    }, [user]);

    const handleCriarPendencia = async () => {
    if (!agendamentoSelecionado || !formularioSelecionado) {
    mostrarErroToast("Selecione um agendamento e um formulário.");
    return;
    }

    try {
        // Encontra objeto completo do formulário para exibir nome se necessário
        // Com SingleSelect, formularioSelecionado é o objeto {value, label}
        const formId = Number(formularioSelecionado.value);
        const formObj = listaFormularios.find(f => f.formularioId === formId);
        
        // Payload alinhado com o backend esperado
        const payload = {
            pacienteId: Number(pacienteSelecionado?.value),
            agendamentoId: Number(agendamentoSelecionado.id),
            formularioId: formId,
            status: "APLICADO_NAO_LANCADO",
            criadaEm: new Date().toISOString(),
            resolvidaEm: null,
            data_referencia: new Date(dataReferencia).toISOString(),
            especialidade: userEspecialidade,
            diagnosticoMacro: diagnosticoMacro
        };

        const { ok, data, error } = await criar_pendencia_manual(payload);

        if (!ok) throw error;

        // Sucesso na criação
        const result = await Swal.fire({
            icon: 'success',
            title: 'Pendência Criada!',
            text: 'Deseja preencher o formulário agora?',
            showCancelButton: true,
            confirmButtonColor: '#7C3AED',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Sim, preencher agora',
            cancelButtonText: 'Não, fazer depois'
        });

        if (result.isConfirmed) {
            // Navega para preenchimento
            const pendenciaCriada = data; // Supõe que a API retorna o objeto criado
            
            // Monta objeto para navegação similar ao fluxo existente
            navigate(`/forms-terapeuta/formulario/escala/${formId}`, {
                state: {
                    pendencia: {
                        PacienteID: Number(pacienteSelecionado?.value),
                        Paciente: pacienteSelecionado?.label,
                        AgendamentoID: agendamentoSelecionado.id,
                        ProfissionalEspecialidade: user?.especialidade, // Ou do agendamento
                        Data: formatarData(new Date()), // Data de referência hoje
                    },
                    pendenciaEscala: pendenciaCriada, // Objeto completo se possível
                    formTitulo: formObj?.nomeEscala ?? `Formulário ${formId}`,
                    returnTo: "/forms-terapeuta/lancamentos-pendencias",
                    refreshPendencias: true,
                },
            });
        } else {
            // Fica na tela, talvez limpar seleção ou avisar onde encontrar
            Swal.fire({
                icon: 'info',
                title: 'Pendência salva',
                text: 'Ela estará disponível na aba "Pendências Existentes".',
                timer: 3000
            });
            // Resetar fluxo?
            setAgendamentoSelecionado(null);
            setFormularioSelecionado(null);
        }

    } catch (err) {
        console.error("Erro ao criar pendência:", err);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao criar',
            text: 'Não foi possível criar a pendência. Tente novamente.',
        });
    }
};

if (loading) return <LoadingGen mensagem="Carregando dados iniciais..." />;
    if (erro) return <ErroGen erro={erro} />;

    // Se não houver pacientes, mostra InfoGen
    if (!loading && listaPacientes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 w-full h-full">
                <InfoGen message="Nenhum paciente cadastrado encontrado para seleção." />
            </div>
        );
    }
    
    // Configurações de Paginação e Passos
    // Calcula o total de páginas com base no número de agendamentos e itens por página
    const totalPaginas = Math.ceil(listaAgendamentos.length / ITENS_POR_PAGINA);
    
    // Fatia o array de agendamentos para exibir apenas os itens da página atual
    const agendamentosExibidos = listaAgendamentos.slice(
        (paginaAtual - 1) * ITENS_POR_PAGINA,
        paginaAtual * ITENS_POR_PAGINA
    );

    // Funções de navegação da paginação
    const irParaPaginaAnterior = () => setPaginaAtual(p => Math.max(1, p - 1));
    const irParaPaginaProxima = () => setPaginaAtual(p => Math.min(totalPaginas, p + 1));

    // Manipula o clique no cabeçalho dos passos (Accordion)
    const handleStepClick = (step) => {
        // Permite voltar para passos anteriores ou avançar se o anterior estiver completo
        if (step === 1) setEtapaAtiva(1);
        else if (step === 2 && pacienteSelecionado && dataReferencia) setEtapaAtiva(2);
        else if (step === 3 && agendamentoSelecionado) setEtapaAtiva(3);
    };

    const podeCriar = pacienteSelecionado && agendamentoSelecionado && formularioSelecionado;

    return (
        <div className="flex flex-col gap-6 p-4 w-full">
            {/* Step 1: Paciente */}
            <div className={`
                bg-white rounded-xl border transition-all duration-300 overflow-hidden
                ${etapaAtiva === 1 ? 'ring-2 ring-apollo-100 border-apollo-200 shadow-md' : 'border-gray-200 shadow-sm'}
            `}>
                <div 
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    onClick={() => handleStepClick(1)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors
                            ${pacienteSelecionado ? 'bg-green-500 border-green-500 text-white' : (etapaAtiva === 1 ? 'border-apollo-500 text-apollo-500' : 'border-gray-300 text-gray-400')}
                        `}>
                            {pacienteSelecionado ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : '1'}
                        </div>
                        <div>
                            <h3 className={`font-semibold ${etapaAtiva === 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                                Selecione o Paciente
                            </h3>
                            {pacienteSelecionado && etapaAtiva !== 1 && (
                                <p className="text-xs text-green-600 font-medium">Selecionado: {pacienteSelecionado.label}</p>
                            )}
                        </div>
                    </div>
                    <div className={`transition-transform duration-200 ${etapaAtiva === 1 ? 'rotate-180' : ''}`}>
                       <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {etapaAtiva === 1 && (
                    <div className="p-4 border-t border-gray-100 bg-white animate-fade-in-down">
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="w-full sm:max-w-md">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Paciente</label>
                                <SingleSelect
                                    options={listaPacientes}
                                    value={pacienteSelecionado}
                                    onChange={(opt) => {
                                        setPacienteSelecionado(opt);
                                        if (opt) setEtapaAtiva(2);
                                    }}
                                    placeholder={loading ? "Carregando pacientes..." : "Pesquise o paciente..."}
                                    isClearable={true}
                                />
                            </div>
                            <div className="w-full sm:w-48">
                                <label className="text-xs font-semibold text-gray-500 mb-1 block">Data Referência</label>
                                <input 
                                    type="date" 
                                    value={dataReferencia}
                                    onChange={(e) => setDataReferencia(e.target.value)}
                                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Step 2: Agendamento */}
            <div className={`
                 bg-white rounded-xl border transition-all duration-300 overflow-hidden
                 ${etapaAtiva === 2 ? 'ring-2 ring-apollo-100 border-apollo-200 shadow-md' : 'border-gray-200 shadow-sm'}
                 ${!pacienteSelecionado ? 'opacity-60 pointer-events-none' : ''}
            `}>
                 <div 
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    onClick={() => handleStepClick(2)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors
                            ${agendamentoSelecionado ? 'bg-green-500 border-green-500 text-white' : (etapaAtiva === 2 ? 'border-apollo-500 text-apollo-500' : 'border-gray-300 text-gray-400')}
                        `}>
                             {agendamentoSelecionado ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : '2'}
                        </div>
                        <div>
                            <h3 className={`font-semibold ${etapaAtiva === 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                                Escolha um Agendamento
                            </h3>
                            {agendamentoSelecionado && etapaAtiva !== 2 && (
                                 <p className="text-xs text-green-600 font-medium">Selecionado: {formatarData(agendamentoSelecionado.inicio)} - {agendamentoSelecionado.slot?.nome}</p>
                            )}
                        </div>
                    </div>
                    <div className={`transition-transform duration-200 ${etapaAtiva === 2 ? 'rotate-180' : ''}`}>
                       <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {etapaAtiva === 2 && (
                      <div className="p-4 border-t border-gray-100 bg-white animate-fade-in-down">
                        {/* Filtros de Data para Agendamentos */}
                        <div className="flex justify-start mb-4">
                            <div className="flex gap-2 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">De</label>
                                    <input 
                                        type="date" 
                                        value={dataInicio}
                                        onChange={(e) => setDataInicio(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] uppercase font-bold text-gray-400">Até</label>
                                    <input 
                                        type="date"
                                        value={dataFim}
                                        onChange={(e) => setDataFim(e.target.value)}
                                        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
                                    />
                                </div>
                            </div>
                        </div>

                        {loadingAgendamentos ? (
                            <div className="flex justify-center items-center py-8">
                                <LoadingGen mensagem="Buscando agendamentos..." />
                            </div>
                        ) : listaAgendamentos.length === 0 ? (
                            <div className="flex justify-center items-center py-8">
                                <InfoGen message="Nenhum agendamento encontrado para este paciente." />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {agendamentosExibidos.map((ag) => {
                                        const isSelected = agendamentoSelecionado?.id === ag.id;
                                        const dataFormatada = ag.inicio ? formatarData(ag.inicio) : "—";
                                        const horarioIni = ag.inicio ? formatarHora(ag.inicio) : "—";
                                        const horarioFim = ag.fim ? formatarHora(ag.fim) : null;
                                        const horaFormatada = horarioFim ? `${horarioIni} - ${horarioFim}` : horarioIni;
                                        
                                        return (
                                            <button
                                                key={ag.id}
                                                onClick={() => {
                                                    setAgendamentoSelecionado(ag);
                                                    setEtapaAtiva(3);
                                                }}
                                                type="button"
                                                className={`
                                                    text-left relative p-4 rounded-xl border transition-all duration-200 group flex flex-col gap-2
                                                    ${isSelected 
                                                        ? 'bg-apollo-50 border-apollo-500 ring-1 ring-apollo-500 shadow-md' 
                                                        : 'bg-white border-gray-200 hover:border-apollo-300 hover:bg-gray-50 hover:shadow-sm'}
                                                `}
                                            >
                                               <div className="flex justify-between items-start w-full">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${isSelected ? 'bg-apollo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                        #{ag.id}
                                                    </span>
                                                    <span className={`text-[10px] font-bold uppercase ${ag.presenca === 'Compareceu' ? 'text-green-600' : 'text-gray-400'}`}>
                                                        {ag.presenca || "-"}
                                                    </span>
                                                </div>
                                                
                                                <div>
                                                    <div className="text-base font-bold text-gray-800">
                                                        {dataFormatada}
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium">🕒 {horaFormatada}</span> 
                                                        <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-medium truncate max-w-[120px]" title={ag.slot?.nome}>🧩 {ag.slot?.nome}</span>
                                                    </div>
                                                </div>
                                                
                                                {ag.profissional?.usuario?.nome && (
                                                    <div className="mt-auto pt-2 border-t border-gray-100 w-full">
                                                         <div className="text-[10px] text-gray-400 uppercase tracking-wide truncate">
                                                            {ag.profissional.usuario.nome}
                                                        </div>
                                                    </div>
                                                )}

                                                {isSelected && (
                                                    <div className="absolute -top-2 -right-2 bg-apollo-500 text-white rounded-full p-1 shadow-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Paginação */}
                                {totalPaginas > 1 && (
                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 mt-2">
                                        <button
                                            onClick={irParaPaginaAnterior}
                                            disabled={paginaAtual === 1}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors flex items-center gap-1"
                                        >
                                            ← Anterior
                                        </button>
                                        <span className="text-xs text-gray-400 font-medium">
                                            Página {paginaAtual} de {totalPaginas}
                                        </span>
                                        <button
                                            onClick={irParaPaginaProxima}
                                            disabled={paginaAtual === totalPaginas}
                                            className="px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors flex items-center gap-1"
                                        >
                                            Próxima →
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Step 3: Seleção de Formulário e Ação */}
            <div className={`
                 bg-white rounded-xl border transition-all duration-300 overflow-hidden
                 ${etapaAtiva === 3 ? 'ring-2 ring-apollo-100 border-apollo-200 shadow-md' : 'border-gray-200 shadow-sm'}
                 ${!agendamentoSelecionado ? 'opacity-60 pointer-events-none' : ''}
            `}>
                <div 
                    className="flex items-center justify-between p-4 cursor-pointer bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    onClick={() => handleStepClick(3)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`
                            flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border-2 transition-colors
                            ${formularioSelecionado ? 'bg-green-500 border-green-500 text-white' : (etapaAtiva === 3 ? 'border-apollo-500 text-apollo-500' : 'border-gray-300 text-gray-400')}
                        `}>
                            3
                        </div>
                        <div>
                            <h3 className={`font-semibold ${etapaAtiva === 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                                Selecione o Formulário
                            </h3>
                        </div>
                    </div>
                     <div className={`transition-transform duration-200 ${etapaAtiva === 3 ? 'rotate-180' : ''}`}>
                       <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>


                {etapaAtiva === 3 && (
                    <div className="p-4 border-t border-gray-100 bg-white animate-fade-in-down">
                        <div className="w-full">
                            <label className="text-xs font-semibold text-gray-500 mb-1 block">Formulário a aplicar</label>
                            <SingleSelect
                                options={opcoesFormularios}
                                value={formularioSelecionado}
                                onChange={(opt) => setFormularioSelecionado(opt)}
                                placeholder="Selecione o formulário..."
                                isClearable={true}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Ação Final: Criar Pendência */}
            <div className={`p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-300 ${!podeCriar ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <div className="text-sm">
                    {podeCriar ? (
                        <span className="text-green-600 flex items-center gap-2 font-semibold">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Tudo pronto para criar a pendência!
                        </span>
                    ) : (
                        <span className="text-gray-400 font-medium">Preencha todas as etapas acima para habilitar a criação.</span>
                    )}
                </div>
                
                <button
                    type="button"
                    onClick={handleCriarPendencia}
                    disabled={!podeCriar}
                    className={`
                        w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2
                        ${podeCriar 
                            ? 'bg-apollo-500 text-white hover:bg-apollo-600 hover:shadow-lg transform active:scale-95 cursor-pointer' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                >
                    <span>Criar Pendência</span>
                    <svg className="w-5 h-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        </div>
    );
}