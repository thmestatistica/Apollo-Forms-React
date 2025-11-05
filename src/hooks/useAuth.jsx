// Importa o hook useContext do React
// useContext permite acessar o contexto criado
import { useContext } from 'react';
// Importa o contexto de autenticação
import { AuthContext } from '../context/auth/AuthContext'; 


// Hook personalizado para acessar o contexto de autenticação
// Hook: função especial em React que permite "ligar" recursos de estado e ciclo de vida a componentes funcionais
export const useAuth = () => {
    // Retorna o valor do contexto de autenticação
    return useContext(AuthContext);
};