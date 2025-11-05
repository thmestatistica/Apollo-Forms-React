import { Outlet } from "react-router-dom"
import { AuthProvider } from "./context/auth/AuthProvider"

function App() {

  return (
    <>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </>
  )
}

export default App
