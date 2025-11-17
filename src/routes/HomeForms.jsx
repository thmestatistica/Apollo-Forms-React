// Importando Imagens
import logo from '../assets/logo_app.png'

// Importando Componentes
// import HomeListItem from '../components/home/HomeListItem'
import LinkLogin from '../components/home/LinkLogin'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

function HomeForms() {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()

  // Se já estiver autenticado, redireciona para a tela inicial apropriada
  useEffect(() => {
    if (isAuthenticated) {
      const redirectPath = user?.role === 'terapeuta'
        ? '/forms-terapeuta/tela-inicial'
        : '/forms-paciente/tela-inicial'

      // replace: true impede que o usuário volte para a página inicial ao pressionar "voltar"
      navigate(redirectPath, { replace: true })
    }
  }, [isAuthenticated, user?.role, navigate])

  return (
    <>
      <div className='min-h-screen flex justify-center items-center bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-3'>
        <div className='bg-white w-full max-w-4xl min-h-1/2 max-h-min rounded-2xl shadow-lg flex flex-col justify-center items-center gap-6 p-6 sm:p-8'>
          <div className='w-full bg-apollo-800 rounded-2xl flex justify-center p-4 shadow-md'>
            <img src={logo} alt='Logo da Apollo' className='w-3/4 md:w-1/4 h-auto rounded-2xl'/>
          </div>
          <div className='flex flex-col gap-3 border-b-apollo-200'>
            {/* Textos */}
            <div className='flex flex-col gap-5 border-b border-apollo-200 pb-10'>
              <p className='text-md text-center text-xl'>
                Sistema médico desenvolvido para registrar e acompanhar <strong>avaliações clínicas</strong>, <strong>evoluções</strong> e <strong>questionários de pacientes</strong> em reabilitação.
              </p>
              {/* <p className='text-center font-bold text-xl'>Com o <strong>Apollo Forms</strong>, profissionais da saúde podem:</p>
              <ul className='list-inside text-md grid grid-cols-1 md:grid-cols-2 gap-4'>
                <HomeListItem text="🧑‍⚕️ Gerenciar sua lista de pacientes" />
                <HomeListItem text="📋 Preencher formulários clínicos por especialidade" />
                <HomeListItem text="🗂️ Consultar histórico de atendimento" />
                <HomeListItem text="🧠 Integrar dados clínicos com inteligência analítica" />
              </ul> */}
            </div>
          </div>
          {/* Seleção de Perfil */}
          <div className='flex flex-col gap-10'>
            <h2 className='text-xl font-bold text-center'>Selecione seu perfil para continuar:</h2>
            <div className='flex flex-col md:flex-row md:gap-20 gap-5 justify-evenly'>
              <LinkLogin to='/login/terapeuta' text='👨‍⚕️ Sou Terapeuta'/>
              <LinkLogin to='/login/paciente' text='🧑 Sou Paciente'/>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default HomeForms