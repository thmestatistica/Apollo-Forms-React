// Importando Imagens
import logo from '../assets/logo_apollo.png'

// Importando Componentes
import HomeListItem from '../components/home/HomeListItem'
import LinkLogin from '../components/home/LinkLogin'

function HomeForms() {
  return (
    <>
    <div className='flex flex-col items-center justify-center h-screen gap-8'>
        <div className='w-screen md:w-3/4 xl:w-1/2 flex flex-col gap-12 xl:bg-linear-to-tr from-apollo-300 to-apollo-400 rounded-lg p-4 xl:shadow-lg items-center'>
          <div className='bg-white p-4 rounded-xl flex flex-col gap-10 xl:shadow-md justify-center items-center'>
            <img src={logo} alt='Logo da Apollo' className='w-1/2 h-auto md:block hidden'/>
            <div className='flex flex-col gap-3 border-b-apollo-200'>
              {/* Título */}
              <h1 className='font-extrabold text-4xl text-center'>🚀 Apollo Forms</h1>
              {/* Textos */}
              <div className='flex flex-col gap-5 border-b border-apollo-200 pb-10'>
                <p className='text-md text-center'>
                  Sistema médico desenvolvido para registrar e acompanhar <strong>avaliações clínicas</strong>, <strong>evoluções</strong> e <strong>questionários de pacientes</strong> em reabilitação.
                </p>
                <p className='text-center font-bold text-xl'>Com o <strong>Apollo Forms</strong>, profissionais da saúde podem:</p>
                <ul className='list-inside text-md grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <HomeListItem text="🧑‍⚕️ Gerenciar sua lista de pacientes" />
                  <HomeListItem text="📋 Preencher formulários clínicos por especialidade" />
                  <HomeListItem text="🗂️ Consultar histórico de atendimento" />
                  <HomeListItem text="🧠 Integrar dados clínicos com inteligência analítica" />
                </ul>
              </div>
            </div>
            {/* Seleção de Perfil */}
            <div className='flex flex-col gap-10'>
              <h2 className='text-xl font-bold text-center'>Selecione seu perfil para continuar:</h2>
              <div className='flex flex-col md:flex-row md:gap-20 gap-5 justify-evenly'>
                <LinkLogin to='/login/medico' text='👨‍⚕️ Sou Médico'/>
                <LinkLogin to='/login/paciente' text='🧑 Sou Paciente'/>
              </div>
            </div>
          </div>
        </div>
    </div>
    </>
  )
}

export default HomeForms