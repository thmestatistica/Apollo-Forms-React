import { FaEraser, FaPlus } from 'react-icons/fa'
import { HiMiniSparkles } from 'react-icons/hi2'
import Select from '../../Select'
import CampoData from './CampoData'
import { especialidadesOptions } from '../../../../utils/gestao/gestaoPendenciasUtils'

export default function PainelAdicionarEscalas({
    modelosOptions,
    modeloSelecionado,
    onChangeModelo,
    especialidadeTodas,
    onChangeEspecialidadeTodas,
    dataTodas,
    onChangeDataTodas,
    onAplicarTodas,
    onLimpar,
    onSalvarModelo,
    totalEscalas
}) {
    const opcoesModelos = modelosOptions.map(m => ({ value: `modelo:${m.value}`, label: m.label }))

    return (
        <section className="md:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-5 md:overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
                <HiMiniSparkles className="text-indigo-500 text-xl shrink-0" />
                <div>
                    <h2 className="font-semibold text-slate-800">Adicionar escalas</h2>
                    <p className="text-xs text-slate-500">
                        Escolha um modelo ou adicione escalas manualmente.
                    </p>
                </div>
            </div>

            <Select
                label="Começar por um modelo"
                options={opcoesModelos}
                value={modeloSelecionado}
                onChange={onChangeModelo}
            />

            <div className="w-full border-gray-200 my-5 border" />

            <div className="mt-3 space-y-3">
                <Select
                    label="Especialidade"
                    options={especialidadesOptions}
                    value={especialidadeTodas}
                    onChange={onChangeEspecialidadeTodas}
                    textClassName="block text-xs font-semibold text-slate-500 mb-1"
                />

                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Data de lançamento
                    </label>
                    <CampoData value={dataTodas} onChange={onChangeDataTodas} />
                </div>

                <button
                    type="button"
                    onClick={onAplicarTodas}
                    disabled={totalEscalas === 0 || (!dataTodas && !especialidadeTodas)}
                    className="w-full h-11 px-5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-medium flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Aplicar a todas as escalas
                </button>
            </div>

            <div className="w-full border-gray-200 my-5 border" />

            <div className="flex flex-col gap-3">
                <button
                    type="button"
                    onClick={onLimpar}
                    disabled={totalEscalas === 0}
                    className="w-full h-11 px-5 rounded-xl text-white bg-rose-500 hover:bg-rose-400 duration-300 font-medium flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <FaEraser />
                    Limpar escalas
                </button>

                <button
                    type="button"
                    onClick={onSalvarModelo}
                    className="w-full h-11 px-5 rounded-xl bg-linear-to-r from-indigo-500 to-emerald-600 text-white font-medium flex items-center justify-center gap-2 transition shadow-sm"
                >
                    <FaPlus />
                    Salvar seleção atual como modelo
                </button>
                <span className="w-full text-center text-slate-500 font-light">
                    {totalEscalas} escalas selecionadas
                </span>
            </div>
        </section>
    )
}