
import React, { useCallback, useState } from 'react'
import { FaPencil } from 'react-icons/fa6'
import Select from '../Select'
import { Modal } from '../../modal/Modal'
import { FaExclamationTriangle } from 'react-icons/fa'
import { OPCOES_ESPECIALIDADES } from '../../../utils/_geral/commonUtils'
import { STATUS_OPTIONS } from '../../../utils/gestao/gestaoPendenciasUtils'

function AtualizarSelecionados({ open, onClose, selected, onSubmit = () => { }, formulariosOptions }) {

    const [selectedOptions, setSelectedOptions] = useState({})

    const setSelectedValues = useCallback(
        (chave) => (valor) =>
            setSelectedOptions((prev) => ({ ...prev, [chave]: valor })),
        []
    );

    const buildPayload = (options) => {
        const payload = { ...options };

        if (payload.formularioId !== undefined && payload.formularioId !== '') {
            payload.formularioId = Number(payload.formularioId);
        } else {
            delete payload.formularioId;
        }

        return payload;
    };

    return (
        <Modal isOpen={open} onClose={onClose} bare>
            <div className='grid flex-col'>
                <h1 className='font-bold text-xl text-white bg-linear-to-r from-blue-700 to-purple-300 w-full p-6 rounded-t-xl border-b border-indigo-200 flex gap-3 items-center   '><FaPencil />Atualizar todos ({selected.length} selecionado{selected.length === 1 ? '' : 's'})</h1>
                <div className='flex flex-col bg-white sm:w-xl md:w-4xl rounded-b-xl p-6'>
                    <div className='bg-linear-to-r from-orange-300 to-rose-300 p-3 mb-5 rounded-xl flex gap-3 items-center'>
                        <FaExclamationTriangle className='ml-3' />
                        <p>Atenção, as alterações serão aplicadas para todos os formulários selecionados</p>
                    </div>
                    <div className='grid md:grid-cols-2 sm:grid-cols-1 gap-3'>
                        {/*<Select key='formularioId' label="Escala" options={formulariosOptions} value={selectedOptions.formularioId} onChange={setSelectedValues('formularioId')} />*/}
                        <Select key='especialidade' label="Especialidade" options={OPCOES_ESPECIALIDADES} value={selectedOptions.especialidade} onChange={setSelectedValues('especialidade')} />
                        <Select key='status' label="Status" options={STATUS_OPTIONS} value={selectedOptions.status} onChange={setSelectedValues('status')} />
                    </div>
                    <div className='flex gap-3 mt-3 justify-end'>
                        <button onClick={() => onSubmit(selected, buildPayload(selectedOptions))} className="bg-linear-to-r from-blue-700 via-purple-400 to-blue-700 bg-size-[200%_auto] bg-left text-white w-fit py-2 px-5 rounded-xl transition-all duration-500 hover:bg-right hover:-translate-y-1 hover:shadow-xl">
                            Salvar alterações
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

export default AtualizarSelecionados