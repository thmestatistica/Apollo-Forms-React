import React from 'react';
import DashboardCard from "./DashboardCard.jsx";

const ResumoSessoesSection = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="animate-fade-in-up delay-100">
      <h2 className="font-bold text-xl mb-4 text-gray-700 flex items-center gap-2">
        📊 Resumo de Sessões
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="contents *:hover:-translate-y-1 *:transition-transform *:duration-300 *:cursor-default">
          <DashboardCard title="Armeo" value={stats.ARM} color="bg-blue-500" />
          <DashboardCard title="C-Mill" value={stats.CML} color="bg-green-500" />
          <DashboardCard title="Lokomat" value={stats.LKM} color="bg-red-500" />
          <DashboardCard title="Kratos" value={stats.KTS} color="bg-purple-500" />
          <DashboardCard title="TMS" value={stats.TMS} color="bg-yellow-500" />
        </div>
      </div>
    </div>
  );
};

export default ResumoSessoesSection;
