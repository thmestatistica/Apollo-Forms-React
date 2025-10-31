import React from 'react'
import { useAuth } from '../../hooks/useAuth'

function TelaInicialTerapeuta() {

  const { logout } = useAuth();

  return (
    <div>
      <h1>Tela Inicial Terapeuta</h1>
      <button onClick={logout}>Logout</button>
    </div>
  )
}

export default TelaInicialTerapeuta