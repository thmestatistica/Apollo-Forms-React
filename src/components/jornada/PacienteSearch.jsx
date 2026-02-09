import React from 'react';
import SearchableSelect from "./SearchableSelect.jsx";

const PacienteSearch = ({ pacientes, onSelect }) => (
  <div className="w-full mb-10">
    <label className="block font-bold text-sm text-gray-500 tracking-wide uppercase mb-3 ml-1">Selecione o Paciente</label>
    <div className="relative z-10 hover:scale-[1.005] transition-transform duration-300">
      <SearchableSelect options={pacientes} onSelect={onSelect} placeholder="Digite o nome do paciente..." />
    </div>
  </div>
);

export default PacienteSearch;
