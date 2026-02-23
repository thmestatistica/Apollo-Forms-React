import { formatarData } from "../../utils/format/formatar_utils.js";
import TimeCell from "./TimeCell.jsx";

const AgendaTable = ({ displayedDays, timeSlots, agByDateAndHour, CardComponent, isMobile }) => {
    return (
        <div className="flex-1 overflow-auto rounded-xl border border-gray-200 shadow-inner bg-gray-50">
            <div 
                className="grid min-w-full" 
                style={{gridTemplateColumns: `80px repeat(${displayedDays.length}, minmax(200px, 1fr))`}}
            >
                {/* Cabeçalho Fixo */}
                <TimeCell header />
                {displayedDays.map((d, idx) => (
                    <div key={idx} className="sticky top-0 z-10 border-b border-r last:border-r-0 border-gray-300 bg-apollo-200 text-apollo-100 font-bold p-3 text-center shadow-sm">
                        {formatarData(d.toISOString())}
                    </div>
                ))}

                {/* Linhas de Horário */}
                {timeSlots.map((h) => (
                    <div key={`row-${h}`} className="contents group">
                        {/* Coluna de Hora */}
                        <TimeCell hour={h} />
                        {/* Colunas dos Dias */}
                        {displayedDays.map((d, idx) => {
                            const key = d.toISOString().split("T")[0];
                            const matches = agByDateAndHour[key]?.[h] || [];
                            return (
                                <div key={`${key}-${h}-${idx}`} className="border-b border-r last:border-r-0 border-gray-200 p-2 min-h-20 bg-white group-hover:bg-gray-50/50 transition-colors align-top">
                                    {matches.length > 0 && (
                                        <CardComponent agendamentos={matches} isMobile={isMobile} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AgendaTable;
