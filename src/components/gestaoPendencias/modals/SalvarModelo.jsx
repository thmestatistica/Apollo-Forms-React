import React, { useState } from 'react'
import { Modal } from '../../modal/Modal'
import AdaptiveInput from '../../input/AdaptiveInput'
import TabelaGen from '../tabela/TabelaGen'
import { FaClipboardList, FaCube, FaPlus, FaTimes } from 'react-icons/fa'
import { criar_modelo, adicionar_formularios_ao_modelo } from '../../../api/forms/modelos_utils'
import usePopup from '../../../hooks/usePopup'
import Popup from '../../common/Popup'

const columns = [
    {
        key: 'nomeFormulario',
        header: 'Escala',
        render: (row) => row.nomeFormulario,
        cellClassName: 'capitalize',
    },
    {
        key: 'especialidade',
        header: 'Especialidade',
        render: (row) => row.especialidade,
    },
]

function SalvarModelo({ open, onClose, escalas = [], onSuccess }) {
    const [payload, setPayload] = useState({ nome_modelo: '', observacao_modelo: '' })
    const [salvando, setSalvando] = useState(false)
    const [erro, setErro] = useState('')
    const popup = usePopup()

    const handleChange = (campo) => (valor) =>
        setPayload((prev) => ({ ...prev, [campo]: valor }))

    const resetar = () => {
        setPayload({ nome_modelo: '', observacao_modelo: '' })
        setErro('')
    }

    const handleClose = () => {
        resetar()
        onClose()
    }

    const handleSubmit = async (e) => {
        e?.preventDefault()
        if (salvando) return

        const nome = payload.nome_modelo.trim()
        if (!nome) {
            setErro('Informe o nome do modelo.')
            return
        }
        if (escalas.length === 0) {
            setErro('Selecione ao menos uma escala.')
            return
        }

        setErro('')
        setSalvando(true)

        const modelo = await criar_modelo({
            nome_modelo: nome,
            observacao_modelo: payload.observacao_modelo.trim() || null,
            formularios: escalas.map((escala) => ({
                formulario_id: escala.escalaId,
                especialidade_associada: escala.especialidade,
            })),
        })
        
        if (!modelo) {
            setSalvando(false)
            setErro('Não foi possível salvar o modelo. Tente novamente.')
            popup.error('Erro ao salvar modelo!')
            return
        }
        onSuccess?.(modelo)
        setSalvando(false)
        popup.success({
            title: "Salvo com sucesso",
            text: "Modelo salvo com sucesso!"
        })
        handleClose()
    }

    return (
        <>
        <Modal isOpen={open} onClose={handleClose} bare>
            <div className='max-w-7xl grid grid-cols-6 gap-6'>
                <div className='flex flex-col col-span-2 grow'>
                    <div className="shrink-0 bg-linear-to-r rounded-t-xl from-blue-700 via-indigo-600 to-purple-500 px-4 sm:px-6 py-5 text-white h-fit">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="p-3 bg-white/15 rounded-xl shrink-0">
                                    <FaCube className="w-7 h-7" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-lg sm:text-xl font-bold">
                                        Criação de modelos
                                    </h1>
                                    <p className="text-sm text-white/80 mt-1">
                                        Crie modelos de escalas.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-lg hover:bg-white/20 transition shrink-0"
                            >
                                <FaTimes />
                            </button>
                        </div>
                    </div>
                    <div className='bg-white p-6 rounded-b-xl flex flex-col gap-3 h-full'>
                        <div>
                            <span className="font-semibold text-slate-500">Nome do modelo</span>
                            <AdaptiveInput
                                value={payload.nome_modelo}
                                onChange={handleChange('nome_modelo')}
                                ariaLabel="Nome do modelo"
                                placeholder="Nomeie o modelo..."
                            />
                        </div>

                        <div>
                            <span className="font-semibold text-slate-500">Descrição do modelo</span>
                            <AdaptiveInput
                                multiline
                                rows={3}
                                value={payload.observacao_modelo}
                                onChange={handleChange('observacao_modelo')}
                                ariaLabel="Descrição do modelo"
                                placeholder="Descreva o modelo..."
                            />
                        </div>

                        {erro && (
                            <p className="text-sm text-rose-600 font-medium">{erro}</p>
                        )}

                        <div className='grid grid-cols-2 gap-3 h-full content-end'>
                            <button onClick={handleSubmit} disabled={salvando} className='disabled:opacity-60 disabled:cursor-not-allowed flex items-center h-fit justify-center gap-2 rounded-md p-2 text-white font-bold md:col-span-1 sm:col-span-2 bg-linear-to-r from-teal-500 via-emerald-300 to-teal-500 bg-size-[200%_auto] bg-left hover:bg-right transition-all duration-500'>
                                <FaPlus /> Salvar modelo
                            </button>
                            <button onClick={handleClose} disabled={salvando} className='disabled:opacity-60 disabled:cursor-not-allowed flex items-center h-fit justify-center gap-2 rounded-md p-2 text-white font-bold md:col-span-1 sm:col-span-2 bg-linear-to-r from-rose-500 via-purple-300 to-rose-500 bg-size-[200%_auto] bg-left hover:bg-right transition-all duration-500'>
                                <FaTimes /> Descartar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="w-full h-fit grid col-span-4 px-6 max-h-150 overflow-y-auto rounded-xl">
                    <TabelaGen
                        columns={columns}
                        data={escalas}
                        className="col-span-1 bg-white m-0"
                    />
                </div>
            </div>
        </Modal>
        <Popup {...popup.props} />
        </>
    )
}

export default SalvarModelo