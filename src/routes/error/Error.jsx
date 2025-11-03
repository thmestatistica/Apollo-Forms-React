import React from 'react';
// import { Link } from 'react-router-dom'; // Removido para corrigir o erro de contexto do router

function Error() {
  return (
    <div className='flex flex-col items-center justify-center h-screen gap-8 bg-gray-50'>
      {/* Container principal que imita a página de login */}
      <div className='w-screen md:w-3/4 xl:w-1/2 h-3/4 flex flex-col gap-12 xl:bg-linear-to-tr from-apollo-300 to-apollo-400 rounded-lg p-4 xl:shadow-lg items-center'>
        
        {/* Cartão branco interno */}
        <div className='bg-white h-full rounded-xl flex flex-col gap-8 xl:shadow-md justify-center items-center w-full p-10 text-center'>
          
          {/* Conteúdo do Erro */}
          <div className='flex flex-col gap-4 items-center'>
            <h1 className='font-extrabold text-8xl md:text-9xl text-apollo-500'>
              404
            </h1>
            <h2 className='font-bold text-2xl md:text-3xl text-gray-800'>
              Página Não Encontrada
            </h2>
            <p className='text-gray-600 max-w-sm'>
              Desculpe, não conseguimos encontrar a página que você está procurando. Ela pode ter sido removida ou o link está quebrado.
            </p>
          </div>

          {/* Botão para voltar à inicial.
            Trocado de <Link> para <a> para evitar o erro "Cannot destructure property 'basename' of 'React10.useContext(...)'"
            que ocorre quando o componente é renderizado fora de um <BrowserRouter>.
          */}
          <a 
            href='/' 
            className='bg-apollo-500 text-white p-3 rounded-md font-bold hover:bg-apollo-600 transition-colors duration-300 cursor-pointer px-6'
          >
            Voltar para a Página Inicial
          </a>
          
        </div>
      </div>
    </div>
  );
}

export default Error;

