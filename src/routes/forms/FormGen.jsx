import { Link, useLocation, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import CampoDinamico from "../../components/form/CampoDinamico.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";

// Dados de exemplo estáticos para simular os metadados do formulário
const formulario_exemplo = [
    {
        id: 2,
        titulo: "Berg Balance Scale",
        campos: [
            { id: 1, tipo: "texto", nome: "paciente", label: "Nome do Paciente" },
            { id: 2, tipo: "textarea", nome: "observacoes", label: "Observações" },
            {
                tipo: "select",
                nome: "nivel",
                label: "Nível de Risco",
                opcoes: [
                    { valor: "baixo", label: "Baixo" },
                    { valor: "medio", label: "Médio" },
                    { valor: "alto", label: "Alto" },
                ],
            },
        ],
    },
    {
        id: 1,
        titulo: "TUG",
        campos: [
            { id: 1, tipo: "texto", nome: "paciente", label: "Nome do Paciente" },
            { id: 2, tipo: "textarea", nome: "progresso", label: "Progresso do Paciente" },
        ],
    },
    {
        id: 3,
        titulo: "Fugl-Meyer Assessment",
        campos: [
            { id: 1, tipo: "texto", nome: "paciente", label: "Nome do Paciente" },
            { id: 2, tipo: "textarea", nome: "detalhes", label: "Detalhes da Avaliação" },
        ],
    }
];

/**
 * Componente genérico que renderiza formulários dinâmicos.
 * O tipo de formulário é determinado pelo `slug` na URL.
 */
const FormularioGenerico = () => {
    // Obtém o id do formulário da rota
    const { id_form } = useParams();
    const location = useLocation();
    const pendencia = location.state?.pendencia;

    // Estado para armazenar os metadados e campos do formulário
    const [formulario, setFormulario] = useState(null);

    // Estado de carregamento
    const [loading, setLoading] = useState(true);

    

    useEffect(() => {
        // Simula uma chamada a API para buscar o formulário
        const fetchFormulario = async () => {
            setLoading(true);
            // Aqui você deve fazer a chamada real para o seu backend
            const response = await new Promise((resolve) => {
                setTimeout(() => {
                    resolve(formulario_exemplo.find((f) => f.id === parseInt(id_form)));
                }, 1000);
            });

            setLoading(false);
            setFormulario(response);
        };

        fetchFormulario();
    }, [id_form]);

    if (loading) return <LoadingGen mensagem="Carregando formulário..." />;

    // Mapeia valores iniciais a partir da pendência (quando existir)
    const initialValues = {
        paciente: pendencia?.["Paciente"] || "",
        // outros campos podem ser mapeados conforme o formulário
    };

    // Renderiza os campos dinamicamente
    return (
    <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">{formulario.titulo}</h1>

        {pendencia && (
            <div className="mb-4 p-4 border rounded-lg bg-purple-50 text-purple-800">
                <h2 className="font-semibold mb-2">Informações da Pendência</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><strong>Paciente:</strong> {pendencia["Paciente"]}</p>
                    <p><strong>Data:</strong> {pendencia["Data"]}</p>
                    <p><strong>Horário:</strong> {pendencia["Início"]} até {pendencia["Fim"]}</p>
                    <p><strong>AgendamentoID:</strong> {pendencia["AgendamentoID"]}</p>
                </div>
            </div>
        )}

        <form className="flex flex-col gap-4">
            {formulario.campos.map((campo) => (
                <CampoDinamico key={campo.id} campo={campo} initialValues={initialValues} />
            ))}

            <button
                type="submit"
                className="bg-blue-600 text-white rounded-lg px-4 py-2"
            >
                Enviar
            </button>
        </form>

        <Link
            to="/forms-terapeuta/tela-inicial"
            state={{ reopenModal: true }}
            className="mt-4 inline-block text-blue-500 underline"
        >
            Voltar para a tela inicial
        </Link>
    </div>
    );
};

export default FormularioGenerico;
