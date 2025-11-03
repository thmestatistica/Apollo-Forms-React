// Importações necessárias
import React, { useState } from 'react';
// Importando o hook de autenticação
import { useAuth } from '../../hooks/useAuth';
// Importando a função de máscara de CPF
import { cpfMask } from '../../utils/mask/cpfMask';
// Importando o Link do react-router-dom para navegação
import { Link } from 'react-router-dom';


const LoginPaciente = () => {
    // Acessa a função de login do AuthContext
    const { login } = useAuth();

    // Estados para armazenar os valores dos inputs
    const [cpf, setCPF] = useState('');
    const [error, setError] = useState('');

    // Aplica a máscara e atualiza o estado
    const handleCPFChange = (e) => {
        const maskedCPF = cpfMask(e.target.value);
        setCPF(maskedCPF);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // Limpa erros anteriores

        // É crucial remover a máscara antes de enviar ou validar o CPF!
        const cpfSemMascara = cpf.replace(/\D/g, ''); 

        // --- LÓGICA DE AUTENTICAÇÃO MOCKADA (MUITO IMPORTANTE AQUI) ---
        
        // Em um projeto real, você faria uma chamada à API (ex: axios.post('/api/login'))
        // e receberia o token e dados do usuário (incluindo a role) do backend.

        if (cpfSemMascara === '12345678909') {

            // Chama a função login do contexto, passando os dados e a role
            login({ id: 102, cpf: cpfSemMascara, name: 'Paciente Teste' }, 'paciente');
            
            // O contexto já fará o localStorage e o redirecionamento para
            
        } else {
            setError('Credenciais inválidas. Tente novamente.');
        }
    };

    return (
        <>
        <div className='flex flex-col items-center justify-center h-screen gap-8'>
            <div className='w-screen md:w-3/4 xl:w-1/2 h-3/4 flex flex-col gap-12 xl:bg-linear-to-tr from-apollo-300 to-apollo-400 rounded-lg p-4 xl:shadow-lg items-center'>
                <div className='bg-white h-full rounded-xl flex flex-col gap-10 xl:shadow-md justify-center items-center w-full p-10'>
                    <h1 className='font-extrabold text-4xl text-center'>🏃‍♂️ Acesso do Paciente</h1>
                    <form onSubmit={handleSubmit} className='flex flex-col gap-10 w-full max-w-md'>
                        <div className='flex flex-col gap-2'>
                            <label className='font-bold text-lg'>Digite seu CPF:</label>
                            <input 
                                placeholder="EX: 123.456.789-09" 
                                value={cpf} 
                                onChange={handleCPFChange} 
                                className='border border-apollo-300 p-2 rounded-md' 
                                maxLength="14" // Garante que a entrada não exceda o tamanho da máscara
                            />
                        </div>
                        {error && <p className='text-red-500'>{error}</p>}
                        <button type="submit" className='bg-apollo-500 text-white p-2 rounded-md font-bold hover:bg-apollo-600 transition-colors duration-300'>Entrar</button>
                    </form>

                    <Link to='/' className='text-apollo-200 hover:underline hover:underline-offset-4'>← Voltar para a página inicial</Link>
                </div>
            </div>
        </div>
        </>
    );
};

export default LoginPaciente;