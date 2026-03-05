import { Outlet, useLocation } from 'react-router-dom'
import { FormProvider } from '../../context/form/FormProvider'
import Navbar from '../../components/common/Navbar'

function FormsTerapeuta() {
  const location = useLocation();
  const isFormPage = location.pathname.includes('/formulario/') && !location.pathname.includes('visualizar-formulario');

  return (
    <FormProvider>
      <div className="flex flex-col min-h-screen bg-linear-to-tr from-apollo-300 to-apollo-400">
        <Navbar />
        <main className={`flex-1 transition-all duration-300 ${!isFormPage ? 'pt-16' : ''}`}>
             <Outlet />
        </main>
      </div>
    </FormProvider>
  )
}

export default FormsTerapeuta