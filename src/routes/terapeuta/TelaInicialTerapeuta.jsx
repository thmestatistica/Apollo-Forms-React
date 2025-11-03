import InfoGen from "../../components/info/InfoGen";

function TelaInicialTerapeuta() {

  const agendamentos = [];

  return (
    <div className='flex flex-col items-center justify-center h-screen gap-8'>
        <div className='w-screen xl:w-13/14 h-13/14 flex flex-col gap-12 xl:bg-linear-to-tr from-apollo-300 to-apollo-400 rounded-lg p-4 xl:shadow-lg items-center'>
            <div className='bg-white h-full rounded-xl grid md:grid-cols-2 grid-rows-5 grid-cols-1 gap-10 xl:shadow-md justify-center items-start w-full md:p-10 p-5'>
                <h1 className='font-extrabold text-4xl md:text-left md:col-span-2 col-span-1 row-span-1 text-center'>🧑‍⚕️ Painel do Terapeuta</h1>
                
                {/* Area de Visualização dos agendamentos */}
                <div className="flex flex-col gap-4 col-span-1 md:row-span-3">
                  <h2>📅 Agendamentos</h2>
                  {/* Caso não haja agendamentos */}
                  {agendamentos.length === 0 ? (
                    <InfoGen message="📑 Nenhum agendamento para hoje." />
                  ) : (
                    // Caso haja agendamentos, listar aqui
                    <ul>
                      {agendamentos.map((agendamento, index) => (
                        <li key={index} className='border-b border-gray-200 py-2'>
                          {agendamento.hora} - {agendamento.paciente}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Area de Evoluções Pendentes*/}
                <div className="flex flex-col gap-4 col-span-1 md:row-span-3">
                  <h2>📝 Evoluções/Avaliações Pendentes</h2>
                  {/* Caso não haja evoluções pendentes */}
                  <InfoGen message="✅ Todas as evoluções estão atualizadas." />
                </div>

                {/* Area de Navegação */}
            </div>
      </div>
    </div>
  )
}

export default TelaInicialTerapeuta