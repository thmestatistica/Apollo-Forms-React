/**
 * @file FormularioGenerico.jsx
 * @description
 * Exibe e processa formulários dinâmicos com base no `id_form` da URL.
 * Pode receber dados de pendência via state do react-router.
 */

import { Link, useLocation, useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import CampoDinamico from "../../components/form/CampoDinamico.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";

import { carregar_perguntas_form, montarFormularioGenerico, carregar_info_form, enviar_respostas_form } from "../../api/forms/forms_utils";
import { remover_presenca_profissional } from "../../api/profissionais/profissionais_utils";
import { concluir_pendencia_escala } from "../../api/pendencias/pendencias_utils";
import { useAuth } from "../../hooks/useAuth";
import { useFormContext } from "../../hooks/useFormContext";
import Swal from "sweetalert2";

const CACHE_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 dias em milisegundos

// Chave para inserir, atualizar, recuperar e deletar os dados do cache
const getCacheKey = (formId, userId, agendamentoId) => {
    const agendamentoKey = agendamentoId ?? "sem_agendamento";
    return `form_cache_${formId}_${userId}_${agendamentoKey}`;
};

// Salva o cache
const saveFormCache = (key, data) => {
    const payload = {
        timestamp: Date.now(),
        data
    };
    localStorage.setItem(key, JSON.stringify(payload));
};

// Retornar os dados do cache
const loadFormCache = (key) => {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION;

        if (isExpired) {
            localStorage.removeItem(key);
            return null;
        }

        return parsed.data;
    } catch {
        localStorage.removeItem(key);
        return null;
    }
};

// Remover os dados em cache
const clearFormCache = (key) => {
    localStorage.removeItem(key);
};

const FormularioGenerico = () => {
    const { id_form, tipo_form } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { removerPendenciaStatus, closeModal } = useFormContext();
    const pendencia = location.state?.pendencia;
    const returnTo = location.state?.returnTo;

    const [formulario, setFormulario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);
    const [submitting, setSubmitting] = useState(false); // indica envio em progresso

    const userId = user?.profissionalId ?? user?.id ?? user?.usuarioId ?? "anon";
    const agendamentoCacheId = pendencia?.["AgendamentoID"] ?? pendencia?.agendamentoId ?? null;
    const cacheKey = getCacheKey(id_form, userId, agendamentoCacheId);
    const [cachedValues, setCachedValues] = useState({});
    const [cacheLoaded, setCacheLoaded] = useState(false);

    /**
     * Busca o formulário com base no ID da URL.
     * 1) Tenta carregar do backend (API Forms)
     * 2) Se vazio, faz fallback para o mock local
     */
    useEffect(() => {
        const fetchFormulario = async () => {
            try {
                setLoading(true);
                setErro(null);
                const tituloFromNav = location.state?.formTitulo;
                // 1) API real: /forms/:id/questions e /forms/:id para nome
                const [perguntas, info] = await Promise.all([
                    carregar_perguntas_form(Number(id_form)),
                    carregar_info_form(Number(id_form))
                ]);

                // console.log(`Formulário ${id_form} carregado da API com sucesso:`, { perguntas, info });
                if (Array.isArray(perguntas) && perguntas.length > 0) {
                    const titulo = info.nome_formulario || tituloFromNav || `Formulário ${id_form}`;
                    const f = montarFormularioGenerico(id_form, perguntas, { titulo });
                    setFormulario(f);

                    const cached = loadFormCache(cacheKey);
                    if (cached) {
                        setCachedValues(cached);
                    }
                    setCacheLoaded(true);


                    return;
                } else{
                    console.warn(`API de formulários retornou vazio para ID ${id_form}.`);

                    setCacheLoaded(true);

                    throw new Error("Formulário vazio");
                }

            } catch (err) {
                setErro(err?.message || String(err));
                throw err;
            } finally {
                setLoading(false);
            }
        };

        fetchFormulario();
    }, [id_form, user, location]);

    // Estado de carregamento ou erro
    if (loading) return <LoadingGen mensagem="Carregando formulário..." primaryColor="#ffffff" secondaryColor="#ffffff" messageColor="text-apollo-100" />;

    if (erro)
        return (
            <div className="flex flex-col justify-center items-center min-h-screen bg-apollo-50 text-center px-4">
                <h2 className="text-xl font-semibold text-red-600 mb-2">
                    Erro ao carregar formulário
                </h2>
                <p className="text-gray-600">{erro}</p>
                <Link
                    to={returnTo || "/forms-terapeuta/tela-inicial"}
                    state={{ reopenModal: true }}
                    className="mt-4 bg-apollo-200 hover:bg-apollo-300 text-white rounded-lg px-4 py-2"
                >
                    Voltar
                </Link>
            </div>
        );

    /**
     * Valores iniciais mapeados da pendência (caso exista).
     */
    const initialValues = {
        paciente: pendencia?.["Paciente"] || "",
        ...cachedValues
    };

    /**
     * Manipula o envio do formulário.
     * Faz a leitura e validação dos campos dinamicamente.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formulario || submitting) return; // evita duplo submit
        setSubmitting(true);

        // =====================
        // 1. Coleta & Validação
        // =====================
        const fd = new FormData(e.currentTarget);
        const respostasForm = {};
        const obrigatoriosFaltando = [];

        for (const campo of formulario.campos) {
            const { nome, label, tipo_resposta_esperada, meta_dados } = campo;
            const isOptional = (meta_dados?.required === false) || tipo_resposta_esperada === "TEXTO_LIVRE" || /observac/i.test(nome);

            if (tipo_resposta_esperada === "SELECAO_MULTIPLA") {
                const values = fd.getAll(nome).filter(Boolean);
                if (!isOptional && values.length === 0) obrigatoriosFaltando.push(label || nome);
                respostasForm[nome] = values;
                continue;
            }

            const raw = fd.get(nome);
            const value = typeof raw === "string" ? raw.trim() : raw;
            const isEmpty = !value;
            if (!isOptional && isEmpty) obrigatoriosFaltando.push(label || nome);
            respostasForm[nome] = (tipo_resposta_esperada === "NUMERO_FLOAT" && !isEmpty) ? Number.parseFloat(value) : (value || "");
        }

        if (obrigatoriosFaltando.length > 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos Obrigatórios',
                html: `<div style="text-align: left;">Preencha os seguintes campos antes de enviar: <br><br><b>- ${obrigatoriosFaltando.join("<br>- ")}</b></div>`,
                confirmButtonColor: '#7C3AED',
                confirmButtonText: 'Entendido'
            });
            setSubmitting(false);
            return;
        }

        // =====================
        // 2. Montagem Payload
        // =====================
        const paciente_id = pendencia?.["PacienteID"] ?? pendencia?.pacienteId ?? null;
        const profissional_id = user?.profissionalId ?? user?.id ?? user?.usuarioId ?? null;
        const agendamento_id = pendencia?.["AgendamentoID"] ?? pendencia?.agendamentoId ?? null;
        const payloadRespostas = {
            paciente_id,
            profissional_id,
            disponibilizado_id: null,
            respostas: respostasForm,
            agendamento_id: agendamento_id
        };

        // console.log("Payload de respostas preparado:", payloadRespostas);

        // =====================
        // 3. Execução das Requisições
        //    Todas precisam ter ok === true
        // =====================
        const pendEscala = location.state?.pendenciaEscala;
        const isEvolucao = location.state?.isEvolucao === true || /evolu/i.test(tipo_form ?? "");
        const isAvaliacao = location.state?.isAvaliacao === true || /avaliac/i.test(tipo_form ?? "");

        // Sinais do agendamento para regras de negocio
        // const tipoAtendimento = String(pendencia?.["TipoAtendimento"] ?? "").toUpperCase();
        // // const isAvaliacaoInicial = location.state?.isAvaliacaoInicial === true || tipoAtendimento === "AVALIACAO_INICIAL";
        // const slotSigla = String(pendencia?.["Sigla"] ?? pendencia?.["Slot"] ?? pendencia?.slot?.sigla ?? "").toUpperCase();
        // const isSlotEquipamento = EQUIPAMENTO_SLOT.some((sigla) => slotSigla.includes(sigla));

        // Especialidade do profissional do agendamento (fallback para dados do usuario)
        // const especialidadeAgendamento =
        //     pendencia?.["ProfissionalEspecialidade"] ??
        //     pendencia?.profissionalEspecialidade ??
        //     (Array.isArray(user?.especialidade) ? user.especialidade[0] : user?.especialidade) ??
        //     (Array.isArray(user?.profissional?.especialidade) ? user.profissional.especialidade[0] : user?.profissional?.especialidade) ??
        //     null;
        
        // console.warn("Dados de contexto para regras de negócio:",especialidadeAgendamento, tipoAtendimento, slotSigla, { isAvaliacaoInicial, isSlotEquipamento });

        const cameFromEscalaTag = location.state?.fromEscalaTag === true;

        const resultados = { enviar: null, concluirPendencia: null, gerarPendencias: null, removerPresenca: null };
        let houveErro = false;
        let mensagensErro = [];

        // Envia respostas
        resultados.enviar = await enviar_respostas_form(Number(id_form), payloadRespostas);
        if (!resultados.enviar?.ok) {
            houveErro = true;
            mensagensErro.push("Falha ao salvar respostas.");
        }

        // Concluir pendência de escala (se aplicável)
        if (!houveErro && pendEscala?.id) {
            resultados.concluirPendencia = await concluir_pendencia_escala({
                id: pendEscala.id,
                pacienteId: pendEscala.pacienteId ?? paciente_id,
                agendamentoId: pendEscala.agendamentoId ?? agendamento_id,
                formularioId: pendEscala.formularioId ?? Number(id_form),
                diagnosticoMacro: pendEscala.diagnosticoMacro,
                especialidade: pendEscala.especialidade,
            });
            if (!resultados.concluirPendencia?.ok) {
                houveErro = true;
                mensagensErro.push("Falha ao concluir pendência de escala.");
            }
        }

        // Regra: ao concluir avaliacao inicial, gerar pendencias de escala para paciente/especialidade
        // Não gerar pendências de escala para avaliações iniciais de slots de equipamento
        // if (!houveErro && isAvaliacaoInicial && !isSlotEquipamento) {
        //     if (!paciente_id || !especialidadeAgendamento) {
        //         houveErro = true;
        //         mensagensErro.push("Dados insuficientes para gerar pendencias de escala.");
        //     } else {
        //         resultados.gerarPendencias = await gerar_pendencias_escala({
        //             pacienteId: paciente_id,
        //             especialidade: especialidadeAgendamento,
        //         });
        //         if (!resultados.gerarPendencias?.ok) {
        //             houveErro = true;
        //             mensagensErro.push("Falha ao gerar pendencias de escala.");
        //         }
        //     }
        // }

        // =====================
        // 4. Tratamento de Erros
        // =====================
        if (houveErro) {
            Swal.fire({
                icon: 'error',
                title: 'Falha no Envio',
                html: `<div style="text-align: left;">Encontramos os seguintes problemas: <br><br><b>- ${mensagensErro.join("<br>- ")}</b></div>`,
                confirmButtonColor: '#EF4444',
                confirmButtonText: 'Tentar Novamente'
            });
            setSubmitting(false);
            return;
        }

        // =====================
        // 5. Remover presença (após sucesso geral) para Evolução/Avaliação
        // =====================
        if ((isEvolucao || isAvaliacao) && profissional_id && agendamento_id) {
            try {
                resultados.removerPresenca = await remover_presenca_profissional(profissional_id, agendamento_id);
                if (!resultados.removerPresenca?.ok) {
                    // Falha não crítica: alerta mas continua fluxo
                    const Toast = Swal.mixin({
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 3000,
                        timerProgressBar: true
                    });
                    Toast.fire({
                        icon: 'info',
                        title: 'Salvo, mas houve uma falha interna ao remover presença.'
                    });
                }
            } catch (errRem) {
                console.error("Erro ao remover presença:", errRem);

                // Alerta profissional para erro inesperado (Non-blocking)
                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000,
                    timerProgressBar: true
                });

                Toast.fire({
                    icon: 'error',
                    title: 'Formulário salvo!',
                    text: 'Porém, ocorreu um erro inesperado ao processar a presença.'
                });
            }
        }

        // =====================
        // 6. Atualiza Contexto (Escalas restantes) somente após sucesso geral
        // =====================
        if (pendEscala?.id) {
            removerPendenciaStatus(pendEscala.id);
        }

        // =====================
        // 7. Navegação de Sucesso
        // =====================

        // Fecha modal apenas para evolução/avaliação bem sucedida
        if (isEvolucao || isAvaliacao) {
            closeModal();
        }

        clearFormCache(cacheKey);

        navigate(returnTo || "/forms-terapeuta/tela-inicial", {
            replace: true,
            state: {
                formSuccess: true,
                formTitulo: formulario?.titulo,
                refreshPendencias: true,
                // Só reabrir modal se NÃO veio de tag de escala e não for evolução/avaliação
                reopenModal: !cameFromEscalaTag && !(isEvolucao || isAvaliacao)
            }
        });
    };

    if (!cacheLoaded) return <LoadingGen mensagem="Carregando..." />;

    // Renderização do conteúdo principal
    return (
        <div className="min-h-screen flex justify-center items-center bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-3">
            <div className="bg-white w-full max-w-4xl rounded-2xl shadow-lg flex flex-col gap-6 p-6 sm:p-8">
                <h1 className="text-2xl font-semibold text-center text-gray-800">
                    {formulario.titulo}
                </h1>


                {/* Bloco com informações da pendência */}
                {pendencia && (
                    <section className="border rounded-lg bg-purple-50 text-purple-900 p-4 shadow-sm">
                        <h2 className="font-semibold mb-2 text-lg">
                            Informações da Pendência
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            <p>
                                <strong>Paciente:</strong> {pendencia["Paciente"]}
                            </p>
                            <p>
                                <strong>Data:</strong> {pendencia["Data"]}
                            </p>
                            <p>
                                <strong>ID do Agendamento:</strong> {pendencia["AgendamentoID"]}
                            </p>
                        </div>
                    </section>
                )}

                {/* Formulário dinâmico */}
                <form
                    onSubmit={handleSubmit}
                    onChange={(e) => {
                        const fd = new FormData(e.currentTarget);
                        const obj = {};

                        for (let [key, value] of fd.entries()) {
                            if (obj[key]) {
                                if (!Array.isArray(obj[key])) {
                                    obj[key] = [obj[key]];
                                }
                                obj[key].push(value);
                            } else {
                                obj[key] = value;
                            }
                        }

                        // console.log("Salvando no cache:", obj);
                        saveFormCache(cacheKey, obj);
                    }}
                    className="flex flex-col gap-6 w-full"
                    noValidate
                >
                    {formulario.campos.map((campo) => (
                        <CampoDinamico
                            key={campo.id}
                            campo={campo}
                            initialValues={initialValues}
                            onFieldChange={(name, value) => {
                                const updated = {
                                    ...cachedValues,
                                    [name]: value
                                };

                                setCachedValues(updated);
                                saveFormCache(cacheKey, updated);
                            }}
                        />
                    ))}

                    <div className="flex flex-col gap-4 justify-between mt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            aria-busy={submitting}
                            className={`bg-apollo-200 text-white font-medium rounded-lg px-6 py-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${!submitting ? 'hover:bg-apollo-300' : ''}`}
                        >
                            {submitting ? 'Enviando…' : 'Enviar'}
                        </button>

                        {submitting && (
                            <div className="flex items-center gap-2 text-sm text-apollo-200 justify-center" aria-live="polite">
                                <span className="animate-pulse">⌛ Enviando respostas, aguarde…</span>
                            </div>
                        )}

                        <Link
                            to={returnTo || "/forms-terapeuta/tela-inicial"}
                            state={{ reopenModal: true }}
                            className="text-apollo-200 hover:text-apollo-300 text-center font-medium"
                        >
                            Voltar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default FormularioGenerico;
