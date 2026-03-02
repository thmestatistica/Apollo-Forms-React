
function VazioGen({ message = "Nenhum dado encontrado", subMessage = "Não há informações disponíveis para exibir." }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-500 font-medium">{message}</p>
        <p className="text-sm text-gray-400 mt-1">{subMessage}</p>
    </div>
  )
}

export default VazioGen