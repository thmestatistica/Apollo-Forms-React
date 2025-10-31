import React from 'react'
import { useAuth } from '../../hooks/useAuth';

function TelaInicialPaciente() {
  const { logout } = useAuth();

  return (
    <div>
      <h1>Tela Inicial Paciente</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default TelaInicialPaciente