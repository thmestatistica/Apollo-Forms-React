import { Outlet, useLocation } from 'react-router-dom'
import { FormProvider } from '../../context/form/FormProvider'
import Navbar from '../../components/common/Navbar'

function FormsMedicoParceiro() {
  const location = useLocation();

  return (
    <FormProvider>
      <div className="flex flex-col min-h-screen bg-linear-to-tr from-apollo-300 to-apollo-400">
        <main className={`flex-1 transition-all duration-300`}>
             <Outlet />
        </main>
      </div>
    </FormProvider>
  )
}

export default FormsMedicoParceiro