// Importações necessárias
// createContext para criar o contexto
// useState e useEffect para gerenciar estado e efeitos colaterais
// useNavigate para navegação programática
// contexto: significa um estado global acessível em qualquer componente filho
import { createContext} from 'react';

// Criação do contexto de autenticação
export const AuthContext = createContext(null);
