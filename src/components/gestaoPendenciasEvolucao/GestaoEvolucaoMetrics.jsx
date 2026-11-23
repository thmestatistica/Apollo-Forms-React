import React from 'react'
import IconCard from '../common/IconCard'
import { FaExclamationTriangle } from 'react-icons/fa'
import { FaClock, FaFire, FaPerson } from 'react-icons/fa6'

function GestaoEvolucaoMetrics({ resumo }) {
    return (
        <div className='grid md:grid-cols-4 sm:grid-cols-1 gap-3'>
            <IconCard
                text="Total de Pendências"
                value={resumo.totalPendencias}
                icon={FaExclamationTriangle}
                color='orange'
            />
            <IconCard
                text="Profissionais com Pendências"
                value={resumo.profissionaisComPendencias}
                icon={FaPerson}
            />
            <IconCard
                text="Profissional com Mais Pendências Criticas"
                value={resumo.topCritica}
                icon={FaFire}
                color='red'
            />
            <IconCard
                text="Pendência Crítica Mais Antiga"
                value={resumo.criticaMaisAntiga}
                icon={FaClock}
                color='rose'
            />
        </div>
    )
}

export default GestaoEvolucaoMetrics