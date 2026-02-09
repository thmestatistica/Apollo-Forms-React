import React from "react";

const DashboardCard = React.memo(({ title, value, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col items-center justify-center transition-transform hover:scale-105 cursor-pointer h-full">
        <div className={`w-full h-1 ${color} rounded-full mb-3 opacity-80`}></div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1 text-center">{title.replace("Sessões de ", "")}</span>
        <span className={`text-4xl font-extrabold ${color.replace("bg-", "text-")}`}>{value}</span>
    </div>
));

export default DashboardCard;
