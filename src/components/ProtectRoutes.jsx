// Importa o hook de autenticação e componentes do React Router
import { useAuth } from '../hooks/useAuth';
// Importa componentes para navegação e roteamento
// Navigate: componente para redirecionamento
// Outlet: componente que renderiza a rota filha correspondente
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ allowedRoles }) => {

    // Obtém o estado de autenticação e informações do usuário
    const { isAuthenticated, user } = useAuth();

    // Verifica se o usuário está autenticado
    if (!isAuthenticated) {
        // Não autenticado: redireciona para a página de login
        return <Navigate to="/" replace />;
    }

    // Verifica se há restrição de roles e se o usuário tem a role correta
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Autenticado, mas com role incorreta: redireciona para o painel apropriado ou uma página de erro
        const redirectPath = user.role === 'terapeuta' ? '/terapeuta/dashboard' : '/paciente/dashboard';
        return <Navigate to={redirectPath} replace />;
    }

    // Autenticado e com role correta: renderiza o conteúdo da rota
    return <Outlet />;
};