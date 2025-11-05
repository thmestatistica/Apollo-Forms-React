import { Outlet } from 'react-router-dom'
import { FormProvider } from '../../context/form/FormProvider'

function FormsTerapeuta() {
  return (
    <FormProvider>
        <Outlet />
    </FormProvider>
  )
}

export default FormsTerapeuta