import React from 'react';
import SingleSelect from "../input/SingleSelect.jsx";

const AgendaControls = ({
    pacientes,
    pacienteId,
    setPacienteId,
    FiltroComponent,
    isMobile,
    weekDays,
    displayedDays,
    prevDay,
    nextDay,
    prevWeek,
    nextWeek,
    goToToday
}) => {
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 shrink-0">
            <div className="w-full md:w-64">
                {FiltroComponent ? (
                    <FiltroComponent
                        pacientes={pacientes}
                        pacienteId={pacienteId}
                        setPacienteId={setPacienteId}
                    />
                ) : (
                    <SingleSelect
                        options={pacientes.map(p => ({ value: p.id, label: p.nome }))}
                        value={pacientes.find(p => p.id === pacienteId) ? { value: pacienteId, label: pacientes.find(p => p.id === pacienteId)?.nome } : null}
                        onChange={opt => setPacienteId(opt?.value ?? null)}
                        placeholder="Filtrar Paciente"
                    />
                )}
            </div>
            <div className="font-bold text-gray-700 text-lg">
                {!isMobile ? (
                    <span>📅 {weekDays[0].toLocaleDateString()} <span className="text-gray-400 font-normal mx-2">até</span> {weekDays[4].toLocaleDateString()}</span>
                ) : (
                    <div className="flex items-center justify-center gap-4">
                        <button onClick={prevDay} className="px-3 py-1 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg shadow-sm transition">‹</button>
                        <span>{displayedDays[0].toLocaleDateString()}</span>
                        <button onClick={nextDay} className="px-3 py-1 bg-white hover:bg-gray-200 border border-gray-200 rounded-lg shadow-sm transition">›</button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2 md:gap-4">
                <button onClick={prevWeek} className="px-4 py-2 text-sm bg-apollo-600 text-apollo-100 rounded-lg hover:bg-apollo-700 hover:shadow-md transition-all cursor-pointer font-medium">‹ Anterior</button>
                <button onClick={goToToday} className="px-4 py-2 text-sm bg-apollo-200/50 text-apollo-100 rounded-lg hover:bg-apollo-300 transition-all font-bold">Hoje</button>
                <button onClick={nextWeek} className="px-4 py-2 text-sm bg-apollo-600 text-apollo-100 rounded-lg hover:bg-apollo-700 hover:shadow-md transition-all cursor-pointer font-medium">Próxima ›</button>
            </div>
        </div>
    );
};

export default AgendaControls;
