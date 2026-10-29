import React, { useEffect, useState } from 'react'
import { FaPencil, FaX } from 'react-icons/fa6'
import { Modal } from '../../modal/Modal'
import { FaPlus, FaTrash } from 'react-icons/fa'
import Select from '../Select'
import useForms from '../../../hooks/useForms'

const MODELOS_DISPONIVEIS = {
	"Condicionamento Físico": [79, 99, 77, 78, 80, 50],
	"Enfermagem": [27, 17, 72],
	"Fisioterapia": [1, 116, 101, 100, 74, 73, 69, 67, 66, 65, 54, 53, 51, 48, 47, 46, 33, 26, 25, 23, 19, 18, 9, 7],
	"Fonoaudiologia": [49, 59, 56, 55, 16, 3, 115, 62, 20, 119, 41, 37, 36, 102, 103, 81, 106, 112, 113, 75, 114, 68, 28, 60],
	"Nutrição": [43, 40, 39],
	"Psicologia": [44, 97, 31, 29, 98, 15, 5, 45],
	"Terapia Ocupacional": [63, 35, 32, 34, 118, 117, 104, 30, 64, 38, 61]
}

function LancarPendencias({ open, onClose }) {

	const [modeloSelecionado, setModeloSelecionado] = useState("")
	const [pendencias, setPendencias] = useState([])

	const {
        listaFormularios,
        formulariosOptions,
        loadingLista,
        fetchFormularios,
        reload
    } = useForms();

	useEffect(() => { fetchFormularios(); }, [fetchFormularios]);

	const opcoesModelos = Object.keys(MODELOS_DISPONIVEIS).map((categoria) => ({
		value: categoria,
		label: categoria
	}))

	const handleChangeModelo = (e) => {
		const categoria = e?.target?.value ?? e?.value ?? e

		setModeloSelecionado(categoria)

		if (!categoria) {
			setPendencias([])
			return
		}

		const ids = MODELOS_DISPONIVEIS[categoria] ?? []
		setPendencias(
			ids.map((id) => ({
				escalaId: id,
				especialidade: categoria,
				dataLancamento: ""
			}))
		)
	}

	const handleChangePendencia = (escalaId, campo, valor) => {
		setPendencias((atual) =>
			atual.map((p) =>
				p.escalaId === escalaId ? { ...p, [campo]: valor } : p
			)
		)
	}

	return (
		<Modal isOpen={open} onClose={onClose} bare>
			<div className='grid'>
				<h1 className='font-bold text-xl text-white bg-linear-to-r from-blue-700 to-purple-300 w-full p-6 rounded-t-xl border-b border-indigo-200 flex gap-3 items-center'><FaPlus />Adicionar</h1>
				<div className='flex flex-col bg-white sm:w-xl md:w-6xl rounded-b-xl p-6'>
					<div className='grid md:grid-cols-2 sm:grid-cols-1 gap-3 mx-4'>
						<Select label="Começar por um modelo" options={opcoesModelos} value={modeloSelecionado} onChange={handleChangeModelo} />
						<div className='w-full flex items-end justify-end'>
							<button className='flex items-center py-3 px-6 rounded-xl text-white gap-3 justify-end bg-linear-to-r from-emerald-400 via-teal-600 to-emerald-400 duration-500 transition-all bg-size-[200%_auto] bg-left hover:bg-right'>
								<FaPlus />
								Adicionar escala manualmente
							</button>
						</div>
						<table className="col-span-2 overflow-hidden rounded-xl">
							<thead>
								<tr className="bg-linear-to-r from-blue-700 to-purple-300 text-white text-left">
									<th className="py-3 px-3">Escala</th>
									<th className="py-3 pr-3">Especialidade</th>
									<th className="py-3 pr-3">Data de lançamento</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{pendencias.map((p) => (
									<tr key={p.escalaId} className='border-b border-slate-200 even:bg-indigo-50/60'>
										<td className='p-3 capitalize'>{formulariosOptions.find((f) => f.value === p.escalaId)?.label.toLowerCase() ?? `Escala #${p.escalaId}`}</td>
										<td className='py-3'>{p.especialidade}</td>
										<td className='py-3'>
											<input
												type="date"
												value={p.dataLancamento}
												onChange={(e) =>
													handleChangePendencia(p.escalaId, 'dataLancamento', e.target.value)
												}
											/>
										</td>
										<td className='bg-linear-to-r from white to-red-50 flex py-2 justify-center w-fix'><button className='p-2 bg-linear-to-r bg-size-[200%_auto] from-red-300 via-rose-400 to-red-300 rounded-xl group hover:bg-right duration-500'><FaTrash className='w-4 h-4 text-white group-hover:-translate-y-0.5 transition-all duration-150' /></button></td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className='flex gap-3 mt-3 justify-end'>
						<button className="bg-linear-to-r from-blue-700 via-purple-400 to-blue-700 bg-size-[200%_auto] bg-left text-white w-fit py-2 px-5 rounded-xl transition-all duration-500 hover:bg-right hover:-translate-y-1 hover:shadow-xl">
							Aplicar pendências
						</button>
						<button className="bg-linear-to-r from-purple-300 via-rose-300 to-purple-300 bg-size-[200%_auto] bg-left text-white w-fit py-2 px-5 rounded-xl transition-all duration-500 hover:bg-right hover:-translate-y-1 hover:shadow-xl">
							Descartar alterações
						</button>
					</div>
				</div>
			</div>
		</Modal>
	)
}

export default LancarPendencias