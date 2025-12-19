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
import LoginTerapeuta from './routes/terapeuta/LoginTerapeuta.jsx'
import LoginPaciente from './routes/paciente/LoginPaciente.jsx'

// Componentes de Forms (Protegidos)
import FormsTerapeuta from './routes/terapeuta/FormsTerapeuta.jsx'
import PacienteForms from './routes/paciente/PacienteForms.jsx'

// Componentes de Telas Iniciais (Protegidos)
import TelaInicialTerapeuta from './routes/terapeuta/TelaInicialTerapeuta.jsx'
import TelaInicialPaciente from './routes/paciente/TelaInicialPaciente.jsx'
import FormularioGenerico from './routes/forms/FormGen.jsx'
import EditarFormulario from './routes/terapeuta/EditarFormulario.jsx'
import EditTela from './routes/terapeuta/EditTela.jsx'

// --- Configuração simples das Rotas com createBrowserRouter ---
const router = createBrowserRouter([
  {
    element: <App />,
    path: '/',
    errorElement: <Error/>,
    children: [
        // Rotas Públicas (acessíveis sem login)
        { element: <HomeForms/>, path: '/' },

        // Rotas de Login Específicas
        { element: <LoginTerapeuta/>, path: '/login/terapeuta'},  
        { element: <LoginPaciente/>, path: '/login/paciente'},

        // --- 1. Rota de Layout Protegida para TERAPEUTAS ---
        // Usa o ProtectedRoute para checar o role 'terapeuta'
        {
            element: <ProtectedRoute allowedRoles={['terapeuta']}/>,
            children: [
                // O FormsTerapeuta é o elemento pai, e usa <Outlet>
                {
                    element: <FormsTerapeuta />,
                    path: '/forms-terapeuta',
                    children: [
                        { 
                            element: <TelaInicialTerapeuta />, 
                            path: 'tela-inicial' 
                        },
                        {
                            element: <FormularioGenerico />,
                            path: 'formulario/:tipo_form/:id_form' // Rota dinâmica baseada no id
                        },
                        {
                            element: <EditarFormulario />,
                            path: 'editar-formulario',
                        },
                        {
                            element: <EditTela />,
                            path: "editar-formulario/:id_form"
                        }
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
                    path: '/forms-paciente',
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