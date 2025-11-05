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
import AgenCard from "./AgenCard.jsx"; // Componente filho responsável por renderizar os cartões individuais.
import PaginationButtons from "../pagination/PaginationButtons.jsx";

/**
 * Componente funcional principal
 * Utiliza React Hooks e renderização condicional para exibir agendamentos paginados.
 */
const AgenPag = ({ agendamentos = [] }) => {
  /**
   * Estado que controla a página atual da listagem.
   * Inicia em 1 por padrão.
   */
  const [currentPage, setCurrentPage] = useState(1);

  // Ordena todos os agendamentos por horário de início (mais antigos primeiro)
  const agendamentosOrdenados = [...agendamentos].sort((a, b) => {
    const ta = a?.inicio ? new Date(a.inicio).getTime() : Number.POSITIVE_INFINITY;
    const tb = b?.inicio ? new Date(b.inicio).getTime() : Number.POSITIVE_INFINITY;
    return ta - tb;
  });

  // Configuração de paginação: quantidade de agendamentos por página
  const itensPorPagina = 3;
  const totalPaginas = Math.ceil(agendamentosOrdenados.length / itensPorPagina) || 1;

  // Índices para fatiar a lista de agendamentos conforme a página atual
  const indexInicio = (currentPage - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;

  // Agendamentos a exibir na página atual
  const agendamentosPaginados = agendamentosOrdenados.slice(indexInicio, indexFim);

  // Exibir paginação somente se houver mais itens que cabem em uma página
  const pagination = agendamentosOrdenados.length > itensPorPagina;

  return (
    <div className="flex flex-col w-full max-w-full mx-auto border border-gray-200 rounded-lg shadow-sm bg-white min-h-[500px] relative">
      {/* 
        Conteúdo principal:
        - Envia os dados agrupados e os pacientes da página atual para o componente AgenCard.
        - O AgenCard será responsável por renderizar cada bloco de agendamentos.
      */}
      <AgenCard agendamentosPaginados={agendamentosPaginados} />

      {/* 
        Paginação fixa:
        - Fica ancorada ao final do container (position: absolute bottom-0).
        - Exibe botões para avançar e retroceder páginas.
        - Desativa os botões quando o usuário está na primeira ou última página.
      */}
      {pagination && (
        <PaginationButtons
            currentPage={currentPage}
            totalPages={totalPaginas}
            onPrev={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setCurrentPage((prev) => Math.min(totalPaginas, prev + 1))}
        />
      )}
    </div>
  );
};

export default AgenPag;
