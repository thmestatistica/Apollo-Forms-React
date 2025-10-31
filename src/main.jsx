// Importando dependencias
import { StrictMode } from 'react' // Modo Estrito do React
import { createRoot } from 'react-dom/client' // Novo método de criação de root no React 18+
import { createBrowserRouter, RouterProvider } from 'react-router-dom' // React Router
// Importando CSS
import './index.css'

// Importando componentes
// **Componente Root agora envolve o AuthProvider**
import App from './App.jsx'
import Error from './routes/error/Error.jsx'
import HomeForms from './routes/HomeForms.jsx'

// Importando ProtectedRoute para rotas protegidas
import { ProtectedRoute } from './components/auth/ProtectRoutes.jsx'

// Componentes de Login (Públicos)
import LoginMedico from './routes/medico/LoginMedico.jsx'
import LoginPaciente from './routes/paciente/LoginPaciente.jsx'

// Componentes de Forms (Protegidos)
import FormsMedico from './routes/medico/Formsmedico.jsx'
import PacienteForms from './routes/paciente/PacienteForms.jsx'

// Componentes de Telas Iniciais (Protegidos)
import TelaInicialMedico from './routes/medico/TelaInicialMedico.jsx'
import TelaInicialPaciente from './routes/paciente/TelaInicialPaciente.jsx'

// --- Configuração simples das Rotas com createBrowserRouter ---
// Removi temporariamente as rotas protegidas (componentes referenciados
// não estavam importados/implementados e causavam erros em tempo de execução).
const router = createBrowserRouter([
  {
    element: <App />,
    path: '/',
    errorElement: <Error/>,
    children: [
        // Rotas Públicas (acessíveis sem login)
        { element: <HomeForms/>, path: '/' },

        // Rotas de Login Específicas
        { element: <LoginMedico/>, path: '/login/medico'},  
        { element: <LoginPaciente/>, path: '/login/paciente'},

        // --- 1. Rota de Layout Protegida para MÉDICOS ---
        // Usa o ProtectedRoute para checar o role 'medico'
        {
            element: <ProtectedRoute allowedRoles={['medico']}/>,
            children: [
                // O FormsMedico é o elemento pai, e usa <Outlet>
                {
                    element: <FormsMedico />,
                    path: '/forms-medico',
                    children: [
                        { element: <TelaInicialMedico />, path: 'tela-inicial' },
                    ]
                }
            ]
        },

        // --- 2. Rota de Layout Protegida para PACIENTE ---
        // Usa o ProtectedRoute para checar o role 'paciente'
        {
            element: <ProtectedRoute allowedRoles={['paciente']}/>,
            children: [
                {
                    element: <PacienteForms />,
                    path: '/forms-pacientes',
                    children: [
                        { element: <TelaInicialPaciente />, path: 'tela-inicial' },
                    ]
                }
            ]
        },
        
    ]
}])

// Renderizando a aplicação com o RouterProvider
// Renderizando a aplicação com o RouterProvider
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} /> 
  </StrictMode>,
)