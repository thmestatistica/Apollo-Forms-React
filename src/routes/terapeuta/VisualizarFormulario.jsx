import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Swal from 'sweetalert2'; 

import CampoDinamico from "../../components/form/CampoDinamico.jsx";
import LoadingGen from "../../components/info/LoadingGen.jsx";
import ErroGen from "../../components/info/ErroGen.jsx";

import { formularios } from "../../data/formulario.jsx";
import { carregar_perguntas_form, montarFormularioGenerico, carregar_info_form } from "../../api/forms/forms_utils";
import { useAuth } from "../../hooks/useAuth";

const VisualizarFormulario = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Lógica de Permissão
    const EDITORES_PERMITIDOS = [8, 43, 17, 13, 15, 40];
    const podeEditar = EDITORES_PERMITIDOS.includes(Number(user?.profissionalId));

    const [formulario, setFormulario] = useState(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(null);

    const dummyInitialValues = { paciente: "Paciente Teste (Visualização)" };

    useEffect(() => {
        const fetchFormulario = async () => {
            try {
                setLoading(true);
                setErro(null);
                const [perguntas, info] = await Promise.all([
                    carregar_perguntas_form(Number(id)),
                    carregar_info_form(Number(id))
                ]);

                if (Array.isArray(perguntas) && perguntas.length > 0) {
                    const titulo = info.nome_formulario || `Visualizando Formulário ${id}`;
                    const f = montarFormularioGenerico(id, perguntas, { titulo });
                    setFormulario(f);
                    return;
                }

                const found = formularios.find((f) => Number(f?.id || f?.formularioId) === Number(id));
                if (found) setFormulario(found);
                else throw new Error("Formulário não encontrado.");

            } catch (err) {
                setErro(err?.message || String(err));
            } finally {
                setLoading(false);
            }
        };
        fetchFormulario();
    }, [id]);

    const handleSandboxSubmit = async (e) => {
        e.preventDefault();
        const result = await Swal.fire({
            title: 'Tudo Certo! 🚀',
            text: 'O formulário funciona perfeitamente (Modo Visualização).',
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#9ca3af',
            confirmButtonText: 'Sair',
            cancelButtonText: 'Continuar Testando',
            reverseButtons: true,
        });
        if (result.isConfirmed) navigate(-1);
    };

    // Função para ir para a edição deste formulário
    const handleGoToEdit = () => {
        // Supondo que sua rota de edição seja /forms-terapeuta/editar-formulario/:id
        navigate(`/forms-terapeuta/editar-formulario/${id}`);
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-screen gap-8">
             <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-md"><LoadingGen mensagem="Carregando visualização..." /></div>
             </div>
        </div>
    );

    if (erro) return (
        <div className="flex flex-col items-center justify-center h-screen gap-8">
             <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center justify-center">
                <div className="bg-white p-8 rounded-xl shadow-md flex flex-col items-center">
                    <ErroGen mensagem={erro} />
                    <button onClick={() => navigate(-1)} className="mt-4 bg-red-500 text-white rounded-lg px-6 py-2 hover:bg-red-600 transition font-bold">Voltar</button>
                </div>
             </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-8">
            <div className="w-screen h-full flex flex-col gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
                <div className="bg-white h-full rounded-xl flex flex-col gap-6 xl:shadow-md w-full md:p-8 p-4 overflow-y-auto relative pb-16 max-w-5xl">
                    
                    {/* Header com Navegação Rápida */}
                    <div className="flex flex-col md:flex-row justify-between items-center border-b pb-4 gap-4">
                        <div className="flex items-center gap-3">
                            <h1 className="font-extrabold text-2xl md:text-3xl text-gray-800 line-clamp-1">
                                {formulario.titulo}
                            </h1>
                            <span className="hidden md:inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md border border-gray-200">Visualização</span>
                        </div>
                        
                        <div className="flex gap-2 w-full md:w-auto">
                            {podeEditar && (
                                <button 
                                    onClick={handleGoToEdit}
                                    className="flex-1 md:flex-none bg-apollo-200 hover:bg-apollo-300 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
                                >
                                    ✏️ Editar Formulário
                                </button>
                            )}  

                            <button 
                                onClick={() => navigate('/forms-terapeuta/visualizar-formularios')}
                                className="flex-1 md:flex-none bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200 shadow-sm cursor-pointer"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>

                    <div className="bg-orange-50 border-l-4 border-orange-400 p-3 rounded-r text-orange-800 text-sm">
                        ⚠️ <strong>Modo Leitura:</strong> Teste os campos à vontade. <b>Nenhum dado será salvo.</b>
                    </div>

                    <form onSubmit={handleSandboxSubmit} className="flex flex-col gap-6 w-full mt-2" noValidate>
                        {formulario.campos.map((campo) => (
                            <CampoDinamico key={campo.id} campo={campo} initialValues={dummyInitialValues} />
                        ))}
                        <div className="flex flex-col gap-4 justify-between mt-8 pt-6 border-t border-gray-100">
                            <button type="submit" className="bg-green-600 text-white font-bold rounded-lg px-6 py-3 transition-colors hover:bg-green-700 shadow-sm cursor-pointer w-full md:w-auto md:self-end flex items-center justify-center gap-2">
                                <span>Simular Envio</span>
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default VisualizarFormulario;