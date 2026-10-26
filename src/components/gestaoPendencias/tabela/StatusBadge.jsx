import { twMerge } from "tailwind-merge";
import { mapStatus } from "../../../utils/gestao/gestaoPendenciasUtils";

const statusStyle = {
    APLICADO_NAO_LANCADO: { pill: 'bg-blue-50 text-blue-800 border-blue-200', dot: 'bg-blue-500' },
    CONCLUIDA: { pill: 'bg-green-50 text-green-800 border-green-200', dot: 'bg-green-500' },
    ABERTA: { pill: 'bg-orange-50 text-orange-800 border-orange-200', dot: 'bg-orange-500' },
    NAO_APLICA: { pill: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
};

const StatusBadge = ({ status }) => {
    const style = statusStyle[status] ?? statusStyle.NAO_APLICA;
    return (
        <span
            className={twMerge(
                'inline-flex w-fit items-center gap-2 rounded-full border px-3 py-0.5 text-sm font-medium shadow-md',
                style.pill
            )}
        >
            <span className={twMerge('h-2 w-2 rounded-full', style.dot)} aria-hidden="true" />
            {mapStatus[status] ?? status}
        </span>
    );
};

export default StatusBadge