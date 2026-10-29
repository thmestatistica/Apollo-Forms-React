import { useMemo } from 'react';
import { FaBookmark, FaBookOpen, FaCheck, FaNotEqual, FaPen } from "react-icons/fa";
import IconCard from '../../common/IconCard';

function AdminPesquisaMetrics({ dadosFiltrados = [] }) {

    const metrics = useMemo(() => {
        return {
            total: dadosFiltrados.length,
            aberta: dadosFiltrados.filter((dado) => dado.status === "ABERTA").length,
            concluida: dadosFiltrados.filter((dado) => dado.status === "CONCLUIDA").length,
            nao_aplica: dadosFiltrados.filter((dado) => dado.status === "NAO_APLICA").length,
            aplicado_nao_lancado: dadosFiltrados.filter((dado) => dado.status === "APLICADO_NAO_LANCADO").length
        }
    })

    return (
        <div className='w-full grid grid-cols-5 gap-3 px-4 pb-4'>
            <IconCard icon={FaBookmark} text="Total de Pendencias" value={metrics?.total} color="purple"/>
            <IconCard icon={FaBookOpen} text="Pendencias Abertas" value={metrics?.aberta} color="orange"/>
            <IconCard icon={FaCheck} text="Pendencias Concluídas" value={metrics?.concluida} color="green"/>
            <IconCard icon={FaNotEqual} text="Não se aplicam" value={metrics?.nao_aplica} color="red"/>
            <IconCard icon={FaPen} text="Aplicadas não lançadas" value={metrics?.aplicado_nao_lancado} color="blue"/>
        </div>
    )
}

export default AdminPesquisaMetrics