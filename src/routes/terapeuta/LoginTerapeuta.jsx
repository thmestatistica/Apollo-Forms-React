// Importações necessárias
import React, { useState } from 'react';
// Importando o hook de autenticação
import { useAuth } from '../../hooks/useAuth';
// Importando o Link do react-router-dom para navegação
import { Link } from 'react-router-dom';
// Importando a função de requisição de login  (API)
import { listarTerapeutas } from '../../utils/terapeutas/terapeutasUtils';

const LoginTerapeuta = () => {
    // Acessa a função de login do AuthContext
    const { login } = useAuth();

    // Estados para armazenar os valores dos inputs
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); // Limpa erros anteriores

        const terapeutas = await listarTerapeutas();

        terapeutas.forEach(terapeuta => {
            if (terapeuta.username === username && terapeuta.password === password) {
              login({ id: terapeuta.id, username }, 'terapeuta');
            } else {
              setError('Credenciais inválidas. Tente novamente.');
            }
        });
    };

    return (
        <>
        <div className='flex flex-col items-center justify-center h-screen gap-8'>
            <div className='w-screen md:w-3/4 xl:w-1/2 h-3/4 flex flex-col gap-12 xl:bg-linear-to-tr from-apollo-300 to-apollo-400 rounded-lg p-4 xl:shadow-lg items-center'>
                <div className='bg-white h-full rounded-xl flex flex-col gap-10 xl:shadow-md justify-center items-center w-full p-10'>
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
                        {error && <p className='text-red-500'>{error}</p>}
                        <button type="submit" className='bg-apollo-500 text-white p-2 rounded-md font-bold hover:bg-apollo-600 transition-colors duration-300 cursor-pointer'>Entrar</button>
                    </form>

                    <Link to='/' className='text-apollo-200 hover:underline hover:underline-offset-4'>← Voltar para a página inicial</Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default LoginTerapeuta;