// Importações necessárias
import React, { useState } from 'react';
// Importando o hook de autenticação
import { useAuth } from '../../hooks/useAuth';
// Importando o Link do react-router-dom para navegação
import { Link } from 'react-router-dom';
// Importando o componente de exibição de erros
import ErroGen from '../../components/info/ErroGen';
import SucessGen from '../../components/info/SucessGen';

const LoginTerapeuta = () => {
    // Acessa a função de login do AuthContext
    const { login } = useAuth();

    // Estados para armazenar os valores dos inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [sucesso, setSucesso] = useState('');

    // Tipo de usuário para login
    const tipo = "terapeuta";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSucesso('');

        const usuario = { username, password };

        const result = await login(usuario, tipo, { redirect: true, delayMs: 800 });
        if (result.success) {
            setSucesso('Login realizado com sucesso!');
        } else {
            setError('Falha no login. Verifique suas credenciais.');
            console.error('Erro no login do terapeuta:', result.error);
        }
    };


    
    return (
        <>
            <div className='min-h-screen flex justify-center bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-3'>
                <div className='bg-white w-full max-w-4xl rounded-2xl shadow-lg flex flex-col justify-center items-center gap-6 p-6 sm:p-8'>
                    <h1 className='font-extrabold text-4xl text-center'>🔐 Login do Terapeuta</h1>
                    <form onSubmit={handleSubmit} className='flex flex-col gap-10 w-full max-w-md'>
                        <div className='flex flex-col gap-2'>
                            <label className='font-bold text-lg'>Usuário:</label>
                            <input 
                                placeholder="Digite seu usuário" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className='border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-apollo-400'
                            />
                        </div>
                        <div className='flex flex-col gap-2'>
                            <label className='font-bold text-lg'>Senha:</label>
                            <input 
                                type="password"
                                placeholder="Digite sua senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className='border border-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-apollo-400'
                            />
                        </div>
                        {error && <ErroGen error={error} />}
                        {sucesso && <SucessGen sucesso={sucesso} />}
                        <button type="submit" className='bg-apollo-500 text-white p-2 rounded-md font-bold hover:bg-apollo-600 transition-colors duration-300 cursor-pointer'>Entrar</button>
                    </form>

                    <Link to='/' className='text-apollo-200 hover:underline hover:underline-offset-4'>← Voltar para a página inicial</Link>
                </div>
            </div>
        </>
    );
};

export default LoginTerapeuta;