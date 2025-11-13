import React from 'react'

function SucessGen({ sucesso }) {
  return (
    <div
    className={`transition-all duration-500 ease-in-out overflow-hidden ${
        sucesso ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
    }`}
    >
    <p className="bg-green-600/30 p-4 rounded-md text-green-800">{sucesso}</p>
    </div>
  )
}

export default SucessGen