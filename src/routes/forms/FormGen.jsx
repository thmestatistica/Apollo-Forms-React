/**
 * @file FormularioGenerico.jsx
 * @description
 * Exibe e processa formulários dinâmicos com base no `id_form` da URL.
 * Pode receber dados de pendência via state do react-router.
 */

import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import CampoDinamico from "../../components/form/CampoDinamico.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";

import { formularios } from "../../data/formulario.jsx";

const FormularioGenerico = () => {
    const { id_form } = useParams();
    const location = useLocation();
    const pendencia = location.state?.pendencia;

    const [formulario, setFormulario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    /**
     * Busca o formulário com base no ID da URL.
     * Simula uma chamada de API real, mas pode ser trocado por um fetch.
     */
    useEffect(() => {
        const fetchFormulario = async () => {
            try {
                setLoading(true);
                setErro(null);

                const response = await new Promise((resolve, reject) => {
                    setTimeout(() => {
                    const found = formularios.find((f) => f.id === Number(id_form));
                    found ? resolve(found) : reject("Formulário não encontrado");
                    }, 800);
                });

                setFormulario(response);
            } catch (err) {
                setErro(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchFormulario();
    }, [id_form]);

    // Estado de carregamento ou erro
    if (loading) return <LoadingGen mensagem="Carregando formulário..." />;

    if (erro)
    return (
        <div className="flex flex-col justify-center items-center min-h-screen bg-apollo-50 text-center px-4">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
                Erro ao carregar formulário
            </h2>
            <p className="text-gray-600">{erro}</p>
            <Link
                to="/forms-terapeuta/tela-inicial"
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
    };

    /**
     * Manipula o envio do formulário.
     * Faz a leitura e validação dos campos dinamicamente.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formulario) return;

        const fd = new FormData(e.currentTarget);
        const data = {};
        const missing = [];

        formulario.campos.forEach((campo) => {
            const { nome, label, tipo_resposta_esperada, meta_dados } = campo;

            const isOptional =
            (meta_dados?.required === false) ||
            tipo_resposta_esperada === "TEXTO_LIVRE" ||
            /observac/i.test(nome);

            if (tipo_resposta_esperada === "SELECAO_MULTIPLA") {
                const values = fd.getAll(nome).filter(Boolean);
                
                if (!isOptional && values.length === 0) missing.push(label || nome);
                data[nome] = values;

            } else {
                const raw = fd.get(nome);
                const value = typeof raw === "string" ? raw.trim() : raw;
                const isEmpty = !value;

                if (!isOptional && isEmpty) missing.push(label || nome);

                data[nome] =
                    tipo_resposta_esperada === "NUMERO_FLOAT" && !isEmpty
                    ? Number.parseFloat(value)
                    : value || "";
            }
        });

        if (missing.length > 0) {
            alert(
                `Preencha os campos obrigatórios antes de enviar:\n\n- ${missing.join(
                    "\n- "
            )}`
            );
            return;
        }

        const resumo = {
            formulario: formulario.titulo,
            dados: data,
        };

        alert(`Dados do formulário:\n\n${JSON.stringify(resumo, null, 2)}`);
    };

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
                    className="flex flex-col gap-6 w-full"
                    noValidate
                >
                    {formulario.campos.map((campo) => (
                        <CampoDinamico
                            key={campo.id}
                            campo={campo}
                            initialValues={initialValues}
                        />
                    ))}

                    <div className="flex flex-col gap-4 justify-between mt-4">
                        <button
                            type="submit"
                            className="bg-apollo-200 hover:bg-apollo-300 text-white font-medium rounded-lg px-6 py-2 transition-colors"
                        >
                            Enviar
                        </button>

                        <Link
                            to="/forms-terapeuta/tela-inicial"
                            state={{ reopenModal: true }}
                            className="text-apollo-200 hover:text-apollo-300 text-center font-medium"
                        >
                            Voltar para a tela inicial
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FormularioGenerico;
