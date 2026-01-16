import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Link } from 'react-router-dom';
import ErroGen from '../../components/info/ErroGen';
import SucessGen from '../../components/info/SucessGen';

const LoginTerapeuta = () => {
    const { login } = useAuth();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Estados de feedback
    const [error, setError] = useState('');
    const [sucesso, setSucesso] = useState('');
    const [loading, setLoading] = useState(false);

    const tipo = "terapeuta";

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Limpa mensagens antigas
        setError('');
        setSucesso('');

        const cleanUsername = username.trim();

        // 2. Validação local (Antes de chamar API)
        if (!cleanUsername || !password.trim()) {
            setError('Por favor, preencha usuário e senha.');
            return;
        }

        // 3. Inicia Loading
        setLoading(true);

        try {
            const usuario = { username: cleanUsername, password };
            const result = await login(usuario, tipo, { redirect: true, delayMs: 800 });
            
            if (result.success) {
                setSucesso('Login realizado com sucesso!');
                // Não precisa setLoading(false) aqui pois a página vai mudar
            } else {
                // Erro retornado pela API (Ex: Senha incorreta)
                // Se result.error for objeto, tenta pegar a mensagem, senão usa string padrão
                const msg = result.error?.message || result.error || 'Falha no login. Verifique suas credenciais.';
                setError(msg);
                setLoading(false); // Destrava o botão para tentar de novo
            }
        } catch (err) {
            // Erro Crítico (Ex: Servidor fora do ar)
            console.error("Erro crítico:", err);
            setError('Não foi possível conectar ao servidor.');
            setLoading(false);
        }
    };

    return (
        <div className='min-h-screen flex justify-center items-center bg-linear-to-tr from-apollo-300 to-apollo-400 p-4'>
            
            <div className='
                bg-white w-full max-w-lg rounded-3xl shadow-2xl 
                flex flex-col justify-center items-center gap-8 
                p-8 md:p-12 animate-fade-in-up
            '>
                
                <div className="flex flex-col items-center gap-2">
                    <div className="text-5xl mb-2">🔐</div>
                    <h1 className='font-extrabold text-4xl text-center text-gray-800 tracking-tight'>
                        Área do Terapeuta
                    </h1>
                    <p className="text-gray-400 text-sm font-medium">Insira suas credenciais para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className='flex flex-col gap-6 w-full'>
                    
                    {/* Input Usuário */}
                    <div className='flex flex-col gap-2 group'>
                        <label className='font-bold text-sm text-gray-600 ml-1 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors'>
                            Usuário
                        </label>
                        <input 
                            placeholder="Digite seu usuário..." 
                            value={username}
                            onChange={(e) => setUsername(e.target.value.trim())}
                            disabled={loading}
                            className='
                                w-full bg-gray-50 text-gray-800 font-medium text-lg
                                border-2 border-gray-100 rounded-xl p-4 
                                focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-apollo-100 
                                outline-none transition-all duration-300
                                placeholder-gray-300 disabled:opacity-50 disabled:cursor-not-allowed
                            '
                        />
                    </div>

                    {/* Input Senha */}
                    <div className='flex flex-col gap-2 group'>
                        <label className='font-bold text-sm text-gray-600 ml-1 uppercase tracking-wide group-focus-within:text-indigo-600 transition-colors'>
                            Senha
                        </label>
                        <input 
                            type="password"
                            placeholder="••••••••" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            className='
                                w-full bg-gray-50 text-gray-800 font-medium text-lg
                                border-2 border-gray-100 rounded-xl p-4 
                                focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-apollo-100
                                outline-none transition-all duration-300
                                placeholder-gray-300 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed
                            '
                        />
                    </div>

                    {/* Área de Feedback - Altura fixa para evitar pulo de layout */}
                    <div className="min-h-6">
                        {error && <ErroGen error={error} />} 
                        {sucesso && <SucessGen sucesso={sucesso} />}
                    </div>

                    {/* Botão */}
                    <button 
                        type="submit" 
                        disabled={loading} 
                        className='
                            w-full bg-indigo-600 text-white font-bold text-lg py-4 rounded-xl
                            shadow-lg shadow-indigo-600/30
                            hover:bg-indigo-900 hover:-translate-y-1 hover:shadow-indigo-900/30
                            active:scale-95 active:shadow-sm
                            disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
                            transition-all duration-300 ease-out mt-2
                            flex items-center justify-center gap-2 cursor-pointer
                        '
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                Entrando...
                            </>
                        ) : (
                            <>Entrar <span>→</span></>
                        )}
                    </button>
                </form>

                <Link 
                    to='/' 
                    className='
                        text-gray-400 font-semibold text-sm 
                        hover:text-indigo-600 hover:underline hover:underline-offset-4 
                        transition-colors duration-200 flex items-center gap-1
                    '
                >
                    <span>←</span> Voltar para a página inicial
                </Link>
            </div>
        </div>
    );
};

export default LoginTerapeuta;