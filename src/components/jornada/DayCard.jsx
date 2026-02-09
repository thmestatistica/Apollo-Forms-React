import React from "react";
import AppointmentItem from "./AppointmentItem.jsx";

const DayCard = React.memo(({ grupo }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="p-4 border-b border-gray-100 pb-2">
            <h3 className="font-bold text-lg text-gray-800">{grupo.label}</h3>
            <span className="text-xs text-gray-500">{grupo.itens.length} agendamento(s)</span>
        </div>
        <div className="p-4 bg-[#f9fafb] flex-1 flex flex-col gap-3">
            {grupo.itens.map((ag) => (
                <AppointmentItem key={ag.id} ag={ag} />
            ))}
        </div>
    </div>
));

export default DayCard;
