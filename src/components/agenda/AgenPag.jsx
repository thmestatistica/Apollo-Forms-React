/**
 * Componente: AgenPag
 * ------------------------
 * Exibe uma lista de agendamentos agrupados por paciente,
 * com suporte à paginação fixa na parte inferior da tela.
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
import PaginationButtons from "./PaginationButtons.jsx";

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

  /**
   * Agrupa os agendamentos por nome do paciente.
   * Exemplo de saída:
   * {
   *   "Maria Silva": [agendamento1, agendamento2],
   *   "João Souza": [agendamento3]
   * }
   */
  const agendamentosAgrupados = agendamentos.reduce((acc, ag) => {
    const nome = ag.paciente.nome;
    if (!acc[nome]) acc[nome] = []; // Cria um array para o paciente caso não exista ainda.
    acc[nome].push(ag); // Adiciona o agendamento ao grupo correspondente.
    return acc;
  }, {});

  // Extrai apenas os nomes dos pacientes (chaves do objeto agrupado)
  const nomesPacientes = Object.keys(agendamentosAgrupados);

  // Define a quantidade máxima de pacientes exibidos por página
  const itensPorPagina = 3;

  // Calcula o número total de páginas com base na quantidade de pacientes
  const totalPaginas = Math.ceil(nomesPacientes.length / itensPorPagina);

  // Calcula os índices de início e fim para fatiar o array de pacientes conforme a página atual
  const indexInicio = (currentPage - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;

  // Retorna apenas os pacientes que devem ser exibidos na página atual
  const pacientesPaginados = nomesPacientes.slice(indexInicio, indexFim);

  // Verifica se há necessidade de exibir a barra de paginação (mais de 3 pacientes)
  const pagination = nomesPacientes.length > itensPorPagina;

  return (
    <div className="flex flex-col w-full max-w-full mx-auto border border-gray-200 rounded-lg shadow-sm bg-white min-h-[500px] relative">
      {/* 
        Conteúdo principal:
        - Envia os dados agrupados e os pacientes da página atual para o componente AgenCard.
        - O AgenCard será responsável por renderizar cada bloco de agendamentos.
      */}
      <AgenCard
        agendamentosAgrupados={agendamentosAgrupados}
        pacientesPaginados={pacientesPaginados}
      />

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
            onPrev={() => setCurrentPage((prev) => prev - 1)}
            onNext={() => setCurrentPage((prev) => prev + 1)}
        />
      )}
    </div>
  );
};

export default AgenPag;
