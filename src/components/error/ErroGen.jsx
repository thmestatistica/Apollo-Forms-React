import React from 'react'

function ErroGen({ error }) {
  return (
    <div
    className={`transition-all duration-500 ease-in-out overflow-hidden ${
        error ? "max-h-32 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
    }`}
    >
    <p className="bg-red-600/30 p-4 rounded-md text-red-800">{error}</p>
    </div>
  )
}

export default ErroGen