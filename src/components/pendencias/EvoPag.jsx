/**
 * Componente: EvoPag
 * ------------------------
 * Exibe uma lista de evoluções ou avaliações pendentes classificadas por nível.
 * Utiliza paginação simples e ordenação cronológica (do mais antigo para o mais recente).
 *
 * @component
 * @example
 * // Exemplo de uso:
 * const pendencias = [
 *   { id: 1, nome: "Maria", tipo: "Evolução", _ordem: "2025-11-01T10:00:00Z" },
 *   { id: 2, nome: "João", tipo: "Avaliação", _ordem: "2025-11-03T15:00:00Z" }
 * ];
 *
 * <EvoPag pendenciasLista={pendencias} />
 *
 * @param {{ pendenciasLista: Array }} props
 * @description
 * - `pendenciasLista`: lista de objetos representando evoluções ou avaliações pendentes.
 * Cada item deve conter ao menos `id` e, opcionalmente, o campo `_ordem` (data de referência).
 */

import { useEffect, useState, useCallback } from "react";
import { classificarPendencias } from "../../utils/classificar/classificarPendencias";

// Componentes filhos
import PaginationButtons from "../pagination/PaginationButtons.jsx";
import InfoGen from "../info/InfoGen.jsx";
import EvoCard from "./EvoCard.jsx";

/**
 * Componente funcional principal.
 * Utiliza React Hooks para controle de estado, paginação e processamento assíncrono de dados.
 */
const EvoPag = ({ pendenciasLista = [] }) => {
  /**
   * Estado: armazena as pendências classificadas e processadas.
   * @type {Array}
   */
  const [pendencias, setPendencias] = useState([]);

  /**
   * Estado: controla o número da página atual.
   * Inicia na página 1 por padrão.
   */
  const [currentPage, setCurrentPage] = useState(1);

  /**
   * Função assíncrona responsável por buscar os dados de um agendamento específico.
   * Aqui ela está apenas simulando a busca local, mas pode ser adaptada para chamadas ao backend.
   *
   * @param {number|string} id - Identificador do agendamento a ser carregado.
   * @returns {Object|null} - O objeto do agendamento encontrado ou `null` se não existir.
   */
  const carregarAgendamento = useCallback(
    async (id) => {
      // Procura o agendamento na lista recebida
      const encontrado = pendenciasLista.find((item) => item.id === id);
      return encontrado || null;
    },
    [pendenciasLista] // Atualiza a função apenas se a lista for modificada
  );

  /**
   * Efeito: executado sempre que a lista de pendências muda.
   * Classifica as pendências por nível de prioridade (via util `classificarPendencias`)
   * e atualiza o estado local.
   */
  useEffect(() => {
    const processarPendencias = async () => {
      // Classificação das pendências (pode envolver lógica de prioridade, status, etc.)
      const resultado = await classificarPendencias(
        pendenciasLista.map((p) => p.id),
        carregarAgendamento
      );

      setPendencias(resultado);
      setCurrentPage(1); // Retorna para a primeira página sempre que os dados mudarem
    };

    processarPendencias();
  }, [pendenciasLista, carregarAgendamento]);

  /**
   * Ordena as pendências da mais antiga para a mais recente.
   * Se o campo `_ordem` não existir, o item é enviado para o final da lista.
   */
  const pendenciasOrdenadas = [...pendencias].sort((a, b) => {
    const da = a?._ordem ? new Date(a._ordem).getTime() : Number.POSITIVE_INFINITY;
    const db = b?._ordem ? new Date(b._ordem).getTime() : Number.POSITIVE_INFINITY;
    return da - db; // ordem crescente (mais antigo primeiro)
  });

  /**
   * Configuração da paginação
   */
  const itensPorPagina = 3; // Quantidade máxima de registros por página
  const totalPaginas = Math.ceil(pendenciasOrdenadas.length / itensPorPagina) || 1;

  // Índices de corte da lista conforme a página atual
  const indexInicio = (currentPage - 1) * itensPorPagina;
  const indexFim = indexInicio + itensPorPagina;

  // Extrai apenas as pendências correspondentes à página atual
  const paginaAtual = pendenciasOrdenadas.slice(indexInicio, indexFim);

  // Determina se a paginação deve ser exibida (se houver mais de 3 registros)
  const mostrarPaginacao = pendenciasOrdenadas.length > itensPorPagina;

  return (
    <div className="flex flex-col w-full max-w-full mx-auto border border-gray-200 rounded-lg shadow-sm bg-white min-h-[500px] relative p-4">
      {/* 
        Caso não existam pendências, exibe uma mensagem informativa amigável.
        Caso contrário, renderiza o componente EvoCard com a página atual.
      */}
      {pendenciasOrdenadas.length === 0 ? (
        <InfoGen message="🗒️ Nenhuma evolução ou avaliação pendente." />
      ) : (
        <EvoCard paginaAtual={paginaAtual} />
      )}

      {/* 
        Se houver mais de 3 pendências, exibe os botões de navegação.
        PaginationButtons recebe funções de avanço e retrocesso, além do estado atual.
      */}
      {mostrarPaginacao && (
        <PaginationButtons
          currentPage={currentPage}
          totalPages={totalPaginas}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPaginas, p + 1))}
        />
      )}
    </div>
  );
};

export default EvoPag;
