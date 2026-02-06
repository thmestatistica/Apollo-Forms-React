import React from 'react';
import { calcularIdade } from "../../utils/jornada/stats";

const DadosCadastraisSection = ({ pacienteDetalhes }) => (
  <div
    className="
      group
      bg-white border-2 border-gray-100 rounded-2xl p-8
      shadow-sm hover:shadow-2xl hover:shadow-apollo-200/10
      hover:border-apollo-200/50 hover:-translate-y-1
      transition-all duration-300 ease-out
    "
  >
    <div className="flex items-center gap-3 mb-6">
      <span className="text-2xl p-2 bg-blue-50 rounded-lg group-hover:bg-apollo-100 transition-colors">👤</span>
      <h2 className="font-bold text-2xl text-gray-800 group-hover:text-apollo-600 transition-colors">Dados Cadastrais</h2>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 text-gray-600">
      <div className="space-y-3">
        <p className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-800">Nome:</span> <span>{pacienteDetalhes.nomeFormatado}</span></p>
        <p className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-800">Idade:</span> <span>{calcularIdade(pacienteDetalhes.dataNascimento)} anos</span></p>
        <p className="flex justify-between border-b border-gray-50 pb-2"><span className="font-bold text-gray-800">Período:</span> <span className="px-2 py-0.5 bg-gray-100 rounded text-sm font-mono">{pacienteDetalhes.periodoAvaliacaoSemanas || "—"} semanas</span></p>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-1 border-b border-gray-50 pb-2">
          <span className="font-bold text-gray-800">Diagnóstico Principal:</span>
          <span className="text-sm bg-gray-50 p-2 rounded border border-gray-100 italic">{pacienteDetalhes.diagnosticoPrincipal || "—"}</span>
        </div>
        <div className="flex flex-col gap-1 border-b border-gray-50 pb-2">
          <span className="font-bold text-gray-800">Objetivo Principal:</span>
          <span className="text-sm bg-gray-50 p-2 rounded border border-gray-100 italic">{pacienteDetalhes.objetivoPrincipal || "—"}</span>
        </div>
      </div>
    </div>
  </div>
);

export default DadosCadastraisSection;
