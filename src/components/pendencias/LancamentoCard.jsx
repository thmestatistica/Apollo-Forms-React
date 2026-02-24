import { abreviarNome, formatarData, formatarHora } from '../../utils/format/formatar_utils';

function LancamentoCard({ item, handleAbrirFormulario }) {

  const dataRef = item.data_referencia ? `${formatarData(item.data_referencia)}` : "—";
  const dataAplicado = item.data_update ? `${formatarData(item.data_update)} às ${formatarHora(item.data_update)}` : "—";
  const pacienteLabel = item.pacienteNome ? abreviarNome(String(item.pacienteNome), 2) : "Paciente";

  return (
    <div
    key={item.id}
    className="group bg-white border border-gray-200 border-l-4 border-l-apollo-400 rounded-lg p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-full"
    >
        <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-start justify-between gap-1">
                <h2 className="text-base font-bold text-apollo-800 leading-tight line-clamp-1" title={item.pacienteNome}>
                    {pacienteLabel}
                </h2>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 whitespace-nowrap">
                    Aplicado
                </span>
            </div>

            <div className="flex flex-col gap-1 text-xs text-gray-600 mt-1">
                <div className="flex items-start gap-1">
                    <span className="font-semibold text-apollo-200 min-w-[55px]">Escala:</span> 
                    <span className="text-apollo-800 line-clamp-1" title={item.formularioNome}>{item.formularioNome}</span>
                </div>
                <div className="flex items-start gap-1">
                    <span className="font-semibold text-apollo-200 min-w-[55px]">Ref:</span> 
                    <span>{dataRef}</span>
                </div>
            </div>

            <p className="text-[10px] text-gray-500 italic mt-1 line-clamp-1" title={`Registrado em ${dataAplicado}`}>
                Reg: <span className="font-semibold text-apollo-200">{dataAplicado}</span>
            </p>
        </div>

        <div className="mt-1 pt-3 border-t border-gray-100">
            <button
            type="button"
            onClick={() => handleAbrirFormulario(item)}
            className="w-full bg-apollo-400 hover:bg-apollo-300 text-white text-sm font-semibold py-1.5 px-3 rounded-md shadow-sm hover:shadow transition-colors flex items-center justify-center gap-1"
            >
            Lançar agora
            </button>
        </div>
    </div>
  )
}

export default LancamentoCard