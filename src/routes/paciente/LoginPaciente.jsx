// Importações necessárias
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { cpfMask } from '../../utils/mask/cpfMask';
import { Link, Navigate } from 'react-router-dom';
import ErroGen from '../../components/info/ErroGen';
import SucessGen from '../../components/info/SucessGen';

const LoginPaciente = () => {
    const { login } = useAuth();

    // Estados
    const [cpf, setCPF] = useState('');
    const [error, setError] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [loading, setLoading] = useState(false);

    // Aplica a máscara
    const handleCPFChange = (e) => {
        const maskedCPF = cpfMask(e.target.value);
        setCPF(maskedCPF);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Limpa estados
        setError('');
        setSucesso('');

        // 2. Remove máscara para validação
        const cpfSemMascara = cpf.replace(/\D/g, ''); 

        // 3. Validação local
        if (cpfSemMascara.length !== 11) {
            setError('Por favor, digite um CPF válido (11 números).');
            return;
        }

        // 4. Inicia Loading
        setLoading(true);

        try {
            // Simulação de delay de rede para UX (já que é um mock)
            await new Promise(resolve => setTimeout(resolve, 800));

            // --- LÓGICA MOCKADA ---
            if (cpfSemMascara === '12345678909') {
                setSucesso('Acesso autorizado! Redirecionando...');
                
                // Chama o login do contexto
                await login({ id: 102, cpf: cpfSemMascara, name: 'Paciente Teste' }, 'paciente');
                
                // O redirecionamento acontece via contexto/rotas
            } else {
                setError('CPF não encontrado ou não cadastrado.');
            }
        } catch (err) {
            console.error("Erro crítico:", err);
            setError('Erro de conexão. Tente novamente.');
        } finally {
            // Destrava o botão (se não tiver redirecionado ainda)
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex justify-center items-center bg-linear-to-tr from-apollo-300 to-apollo-400 p-4'>
            
            {/* Card Principal - Estilo "Vidro/Clean" */}
            <div className='
                bg-white w-full max-w-lg rounded-3xl shadow-2xl 
                flex flex-col justify-center items-center gap-8 
                p-8 md:p-12 animate-fade-in-up
            '>
                
                {/* Cabeçalho */}
                <div className="flex flex-col items-center gap-2">
                    <div className="text-5xl mb-2">🏃‍♂️</div>
                    <h1 className='font-extrabold text-4xl text-center text-gray-800 tracking-tight'>
                        Área do Paciente
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Digite seu CPF para acessar seus dados</p>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-col gap-6 w-full'>
                    
                    {/* Input CPF */}
                    <div className='flex flex-col gap-2 group'>
                        <label className='font-bold text-sm text-gray-600 ml-1 uppercase tracking-wide group-focus-within:text-emerald-500 transition-colors'>
                            CPF
                        </label>
                        <input 
                            placeholder="000.000.000-00" 
                            value={cpf} 
                            onChange={handleCPFChange} 
                            maxLength="14"
                            disabled={loading}
                            className='
                                w-full bg-gray-50 text-gray-800 font-medium text-lg
                                border-2 border-gray-100 rounded-xl p-4 
                                focus:bg-white focus:border-apollo-400 focus:ring-4 focus:ring-apollo-100 
                                outline-none transition-all duration-300
                                placeholder-gray-300 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed
                            '
                        />
                    </div>

                    {/* Área de Feedback */}
                    <div className="min-h-6">
                        {error && <ErroGen error={error} />}
                        {sucesso && <SucessGen sucesso={sucesso} />}
                    </div>

                    {/* Botão de Ação "Profissa" */}
                    <button 
                        type="submit" 
                        disabled={loading}
                        className='
                            w-full bg-emerald-500 text-white font-bold text-lg py-4 rounded-xl
                            shadow-lg shadow-emerald-500/30
                            hover:bg-emerald-700 hover:-translate-y-1 hover:shadow-emerald-700/50
                            active:scale-95 active:shadow-sm
                            disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                            transition-all duration-300 ease-out mt-2
                            flex items-center justify-center gap-2 cursor-pointer
                        '
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Verificando...
                            </>
                        ) : (
                            <>Acessar <span>→</span></>
                        )}
                    </button>
                </form>

                {/* Link Voltar */}
                <Link 
                    to='/' 
                    className='
                        text-gray-400 font-semibold text-sm 
                        hover:text-emerald-500 hover:underline hover:underline-offset-4 
                        transition-colors duration-200 flex items-center gap-1
                    '
                >
                    <span>←</span> Voltar para a página inicial
                </Link>
            </div>
        </div>
    );
};

export default LoginPaciente;