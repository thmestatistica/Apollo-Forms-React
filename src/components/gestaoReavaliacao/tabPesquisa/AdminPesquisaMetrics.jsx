import { useEffect, useMemo, useState } from 'react';
import { FaBookmark, FaBookOpen, FaCheck, FaNotEqual, FaPen, FaClock } from "react-icons/fa";
import IconCard from '../../common/IconCard';

const getProximoMinuto = () => {
    const d = new Date();
    d.setSeconds(0, 0);
    return d.getTime() + 60_000;
};

function AdminPesquisaMetrics({ dadosFiltrados = [] }) {

    const [proximoMinuto, setProximoMinuto] = useState(getProximoMinuto);

    useEffect(() => {
        const id = setInterval(() => setProximoMinuto(getProximoMinuto()), 15_000);
        return () => clearInterval(id);
    }, []);

    const metrics = useMemo(() => {
        const abertas = dadosFiltrados.filter((d) => d.status === "ABERTA");

        const isFutura = (d) => {
            if (!d.data_referencia) return false;
            return new Date(d.data_referencia).getTime() >= proximoMinuto;
        };

        const futura = abertas.filter(isFutura).length;

        return {
            total: dadosFiltrados.length,
            aberta: abertas.length - futura,   // abertas até este minuto
            futura,                            // abertas do próximo minuto em diante
            concluida: dadosFiltrados.filter((d) => d.status === "CONCLUIDA").length,
            nao_aplica: dadosFiltrados.filter((d) => d.status === "NAO_APLICA").length,
            aplicado_nao_lancado: dadosFiltrados.filter((d) => d.status === "APLICADO_NAO_LANCADO").length,
        };
    }, [dadosFiltrados, proximoMinuto]);

    return (
        <div className='w-full grid md:grid-cols-6 sm:grid-cols-1 gap-3 px-4 pb-4'>
            <IconCard icon={FaBookmark} text="Total de Pendencias" value={metrics.total} color="purple" />
            <IconCard icon={FaBookOpen} text="Pendencias Abertas" value={metrics.aberta} color="orange" />
            <IconCard icon={FaClock} text="Pendencias Futuras" value={metrics.futura} color="yellow" />
            <IconCard icon={FaCheck} text="Pendencias Concluídas" value={metrics.concluida} color="green" />
            <IconCard icon={FaNotEqual} text="Não se aplicam" value={metrics.nao_aplica} color="red" />
            <IconCard icon={FaPen} text="Aplicadas não lançadas" value={metrics.aplicado_nao_lancado} color="blue" />
        </div>
    )
}

export default AdminPesquisaMetrics