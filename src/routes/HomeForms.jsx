// Importando Imagens
import logo from '../assets/logo_app.png'

// Importando Hooks e Componentes
import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function HomeForms() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  // Redirecionamento se já estiver logado
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = user?.role === 'terapeuta'
        ? '/forms-terapeuta/tela-inicial'
        : '/forms-paciente/tela-inicial'

      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, user?.role, navigate])

  return (
    <>
      <div className='min-h-screen flex justify-center items-center bg-linear-to-tr from-apollo-300 to-apollo-400 p-4'>
        
        {/* Card Principal - Mais compacto para não gerar scroll */}
        <div className='
            bg-white w-full max-w-4xl rounded-3xl shadow-2xl 
            flex flex-col justify-center items-center gap-5 
            p-6 md:p-10 animate-fade-in-up
        '>
          
          {/* --- LOGO (Roxo Original - Levemente menor) --- */}
          <div className='
              w-full bg-apollo-800 rounded-2xl 
              flex justify-center p-4 shadow-lg
              transform hover:scale-[1.01] transition-transform duration-500
          '>
            <img 
                src={logo} 
                alt='Logo da Apollo' 
                className='w-40 md:w-56 h-auto object-contain'
            />
          </div>

          {/* Área de Texto - Mais compacta */}
          <div className='flex flex-col gap-2 text-center max-w-2xl border-b border-gray-100 pb-5 w-full'>
            <h1 className='text-2xl font-extrabold text-gray-800'>
                Bem-vindo ao <span className='text-apollo-200'>Apollo Forms</span>
            </h1>
            
            <p className='text-gray-600 text-base leading-snug'>
              Sistema médico desenvolvido para registrar e acompanhar <strong className='text-apollo-200 underline'>avaliações clínicas</strong>, <strong className='text-apollo-200 underline'>evoluções</strong> e <strong className='text-apollo-200 underline'>questionários</strong> de pacientes.
            </p>
          </div>

          {/* Seleção de Perfil */}
          <div className='flex flex-col gap-4 w-full items-center'>
            <h2 className='text-xs font-bold text-gray-400 uppercase tracking-widest text-center'>
                Selecione seu perfil para continuar
            </h2>
            
            {/* --- BOTÕES CRIATIVOS (Compactados) --- */}
            <div className='flex flex-col md:flex-row gap-4 w-full justify-center items-stretch'>
              
              {/* Opção 1: Terapeuta */}
              <Link 
                to='/login/terapeuta' 
                className='
                  group relative w-full md:w-64
                  bg-white border-2 border-gray-100 rounded-2xl p-4
                  flex flex-col items-center justify-center gap-3 text-center
                  shadow-sm hover:shadow-xl hover:shadow-indigo-200/50
                  hover:border-indigo-500 hover:-translate-y-1
                  transition-all duration-300 cursor-pointer text-decoration-none
                '
              >
                {/* Círculo do Ícone (Menor: w-16 h-16) */}
                <div className='
                    w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-3xl
                    group-hover:bg-indigo-500 group-hover:text-white group-hover:scale-110
                    transition-all duration-300 shadow-inner
                '>
                  👨‍⚕️
                </div>
                
                <div className='flex flex-col gap-0.5'>
                  <span className='font-bold text-lg text-gray-800 group-hover:text-indigo-600 transition-colors'>
                      Sou Terapeuta
                  </span>
                  <span className='text-[10px] text-gray-400 font-medium uppercase tracking-wide group-hover:text-indigo-400'>
                      Acesso Profissional
                  </span>
                </div>

                <div className='opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-500 text-indigo-500 font-bold text-sm'>
                  Entrar →
                </div>
              </Link>

              {/* Opção 2: Paciente */}
              <Link 
                to='/login/paciente' 
                className='
                  group relative w-full md:w-64
                  bg-white border-2 border-gray-100 rounded-2xl p-4
                  flex flex-col items-center justify-center gap-3 text-center
                  shadow-sm hover:shadow-xl hover:shadow-emerald-200/50
                  hover:border-emerald-500 hover:-translate-y-1
                  transition-all duration-300 cursor-pointer text-decoration-none
                '
              >
                {/* Círculo do Ícone (Menor: w-16 h-16) */}
                <div className='
                    w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl
                    group-hover:bg-emerald-500 group-hover:text-white group-hover:scale-110
                    transition-all duration-300 shadow-inner
                '>
                  🧑
                </div>
                
                <div className='flex flex-col gap-0.5'>
                  <span className='font-bold text-lg text-gray-800 group-hover:text-emerald-600 transition-colors'>
                      Sou Paciente
                  </span>
                  <span className='text-[10px] text-gray-400 font-medium uppercase tracking-wide group-hover:text-emerald-400'>
                      Minha Jornada
                  </span>
                </div>

                <div className='opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-500 text-emerald-500 font-bold text-sm'>
                  Acessar →
                </div>
              </Link>

            </div>
          </div>
          
          {/* Footerzinho */}
          <div className="text-gray-300 text-[10px] mt-1 font-medium">© 2026 Apollo Forms</div>

        </div>
      </div>
    </>
  )
}

export default HomeForms