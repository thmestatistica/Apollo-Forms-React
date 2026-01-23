/**
 * Componente: AgenPag
 * ------------------------
 * Exibe uma lista de agendamentos em cartões individuais (sem agrupamento),
 * ordenados por horário (mais antigos primeiro) e com paginação fixa.
 *
 * @component
 * @example
 * // Exemplo de uso:
 * const agendamentos = [
 *   {
 *     paciente: { nome: "Maria Silva" },
 *     data: "2025-11-04",
 *     hora: "14:00",
 *     equipamento: "Ultrassom"
 *   },
 *   {
 *     paciente: { nome: "João Souza" },
 *     data: "2025-11-04",
 *     hora: "15:00",
 *     equipamento: "Esteira"
 *   }
 * ];
 *
 * <AgenPag agendamentos={agendamentos} />
 *
 * @param {{ agendamentos: Array }} props
 * @description
 * - `agendamentos`: Lista contendo objetos de agendamento.
 * Cada objeto deve conter pelo menos a chave `paciente.nome`.
 */

import { useState } from "react";
import AgenCard from "./AgenCard.jsx";
import PaginationButtons from "../pagination/PaginationButtons.jsx";

const AgenPag = ({ agendamentos = [] }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const agendamentosOrdenados = [...agendamentos].sort((a, b) => {
    const ta = a?.inicio ? new Date(a.inicio).getTime() : Number.POSITIVE_INFINITY;
    const tb = b?.inicio ? new Date(b.inicio).getTime() : Number.POSITIVE_INFINITY;
    return ta - tb;
  });

  const itensPorPagina = 3;
  const totalPaginas = Math.ceil(agendamentosOrdenados.length / itensPorPagina) || 1;
  const indexInicio = (currentPage - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;
  const agendamentosPaginados = agendamentosOrdenados.slice(indexInicio, indexFim);
  const pagination = agendamentosOrdenados.length > itensPorPagina;

  return (
    // Container com altura mínima e posição relativa para ancorar a paginação
    <div className="flex flex-col w-full max-w-full mx-auto border border-gray-200 rounded-lg shadow-sm bg-white min-h-[500px] relative overflow-hidden">
      
      {/* Área de Scroll 
         - h-full: Ocupa a altura toda.
         - overflow-y-auto: Permite rolar.
         - pb-20: O TRUQUE! Adiciona espaço no final para o último card não ficar atrás da paginação.
      */}
      <div className="h-full overflow-y-auto p-4 pb-20 custom-scrollbar">
        <AgenCard agendamentosPaginados={agendamentosPaginados} />
      </div>

      {/* Paginação Fixa no Rodapé
         - absolute bottom-0: Cola no fundo.
         - w-full: Ocupa a largura toda.
         - bg-white/95 + backdrop-blur: Garante que o texto passando por trás não atrapalhe a leitura.
      */}
      {pagination && (
        <div className="absolute bottom-0 left-0 w-full p-3 border-t border-gray-200 bg-white/95 backdrop-blur-sm rounded-b-lg z-10">
          <PaginationButtons
            currentPage={currentPage}
            totalPages={totalPaginas}
            onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setCurrentPage((prev) => Math.min(totalPaginas, prev + 1))}
          />
        </div>
      )}
    </div>
  );
};

export default AgenPag;