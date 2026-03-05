import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Swal from "sweetalert2";

import { Modal } from "../modal/Modal";
import SingleSelect from "../input/SingleSelect";

import { useAuth } from "../../hooks/useAuth";

import { listar_escalas } from "../../api/forms/forms_utils";
import { criar_pendencia_manual, carregar_pendencias_filtro } from "../../api/pendencias/pendencias_utils";
import { buscar_paciente_por_id } from "../../api/pacientes/pacientes_utils";

/**
 * Componente: CriarPendenciaModal
 * Descrição: Modal para criação manual de pendências (formulários a preencher) para um paciente.
 * 
 * Funcionalidades:
 * - Listagem de escalas disponíveis filtrados por especialidade do usuário.
 * - Sugestão inteligente de data de referência baseada em pendências anteriores.
 * - Alerta de boas práticas ao abrir.
 * - Captura automática da especialidade do usuário logado.
 * - Busca do Diagnóstico Macro do paciente selecionado.
 * - Validação e submissão dos dados para criar uma nova pendência "ABERTA".
 */
const CriarPendenciaModal = ({ isOpen, onClose, pacienteId, pacienteNome }) => {
  const { user } = useAuth();
  
  // Estado para armazenar a lista de escalas carregadas da API
  const [escalas, setEscalas] = useState([]);
  
  // Formulário selecionado pelo usuário no Select
  const [selectedForm, setSelectedForm] = useState(null);
  
  // Data de referência da pendência (padrão: hoje)
  const [dataReferencia, setDataReferencia] = useState(new Date().toISOString().split("T")[0]);
  
  // Aviso sobre a data selecionada/sugerida
  const [avisoData, setAvisoData] = useState(null);
  
  // Dados contextuais do paciente
  const [diagnosticoMacro, setDiagnosticoMacro] = useState(null);
  
  // Estados de controle de UI
  const [loading, setLoading] = useState(false);
  const [loadingForms, setLoadingForms] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState(null);

  // Calcula a especialidade do usuário para exibir e salvar no contexto da pendência
  // Prioriza array -> string direta -> objeto profissional -> fallback
  const userEspecialidade = useMemo(() => {
    return Array.isArray(user?.especialidade) 
      ? user.especialidade[0] 
      : (user?.especialidade || user?.profissional?.especialidade || "Não identificada");
  }, [user]);

  /**
   * Efeito: Alerta inicial ao abrir o modal
   */
  useEffect(() => {
    if (isOpen) {
      Swal.fire({
        title: "Atenção",
        text: "OBS: Para multiplas emissão de pendências consulte a(o) terapeuta de sua especialidade com acesso ao método apollo.",
        icon: "info",
        confirmButtonColor: "#8b5cf6",
      });
    }
  }, [isOpen]);

  /**
   * Efeito responsável por carregar os dados iniciais quando o modal é aberto.
   * Carrega a lista de escalas filtradas por especialidade e dados do paciente.
   */
  useEffect(() => {
    if (!isOpen) return;

    const carregarDados = async () => {
      setInitialLoading(true);
      // 1. Carregar Escalas filtradas por especialidade
      try {
        setLoadingForms(true);
        // Se especialidade não identificada, busca todas ou trata conforme regra.
        // Assumindo que o back aceita sem filtro ou filtro vazio.
        const filtros = userEspecialidade !== "Não identificada" ? { especialidade: userEspecialidade } : {};
        
        const data = await listar_escalas(filtros);
        
        if (Array.isArray(data)) {
          // Filtra escalas que tenham ID de formulário válido
          const validas = data.filter(s => s.formularioId);

          // Ordena a lista alfabeticamente
          validas.sort((a, b) => {
            const nomeA = (a.nomeEscala || a.titulo || "").toLowerCase();
            const nomeB = (b.nomeEscala || b.titulo || "").toLowerCase();
            return nomeA.localeCompare(nomeB);
          });
          setEscalas(validas);
        }
      } catch (err) {
        console.error("Erro ao carregar escalas:", err);
        setError("Erro ao carregar lista de escalas.");
      } finally {
        setLoadingForms(false);
      }

      // 2. Carregar detalhes do paciente e verificar pendências para sugestão de data
      if (pacienteId) {
        try {
          // Busca paciente para Diagnostico Macro
          const p = await buscar_paciente_por_id(pacienteId);
          if (p && p.diagnosticoMacro) {
            const dm = p.diagnosticoMacro;
            setDiagnosticoMacro(Array.isArray(dm) ? dm[0] : dm);
          }

          // Busca pendências para lógica de data
          const pendencias = await carregar_pendencias_filtro({ pacienteId });
          
          if (pendencias && pendencias.length > 0) {
            // Ordena por data_referencia (decrescente) para pegar a mais futura/recente
            // Se data_referencia for nula, usa criadaEm
            const sorted = pendencias.sort((a, b) => {
              const dA = new Date(a.data_referencia || a.criadaEm);
              const dB = new Date(b.data_referencia || b.criadaEm);
              return dB - dA;
            });
            
            const ultimaPendencia = sorted[0];
            const dataUltima = new Date(ultimaPendencia.data_referencia || ultimaPendencia.criadaEm);
            const hoje = new Date();
            
            // Zera horas para comparação de datas apenas
            hoje.setHours(0,0,0,0);
            const dataUltimaSemHora = new Date(dataUltima);
            dataUltimaSemHora.setHours(0,0,0,0);

            if (dataUltimaSemHora > hoje) {
              // Data futura: Sugerir essa data
              setDataReferencia(dataUltima.toISOString().split("T")[0]);
              setAvisoData(null);
            } else {
              // Data passada: Sugerir a passada e avisar
              const dataStr = dataUltima.toISOString().split("T")[0];
              setDataReferencia(dataStr);
              setAvisoData(`Atenção: A última data registrada (${dataStr}) é anterior ou igual a hoje. Verifique se deseja realmente usar esta data.`);
            }
          } else {
            // Nenhuma pendência registrada
            const msgAviso = "Aviso, colocar fora de datas já registradas poderá redisparar várias escalas do método apollo para várias especialidades. Antes de avançar nesta opção confirma essa escolha com o navegador do paciente ou gerente.";
            setAvisoData(msgAviso);
            // Mantém data de hoje como sugestão
            setDataReferencia(new Date().toISOString().split("T")[0]);
          }

        } catch (err) {
          console.error("Erro ao carregar dados do paciente/pendências:", err);
        }
      }
      setInitialLoading(false);
    };

    carregarDados();
  }, [isOpen, pacienteId, userEspecialidade]);

  /**
   * Transforma a lista de escalas em opções compatíveis com o componente SingleSelect.
   */
  const selectOptions = useMemo(() => {
    return escalas.map((s) => ({
      value: s.formularioId,
      label: s.nomeEscala || `Escala ${s.formularioId}`
    }));
  }, [escalas]);

  /**
   * Função de envio do formulário.
   */
  const handleSave = async () => {
    if (!selectedForm || !pacienteId || !dataReferencia) {
      setError("Preencha todos os campos.");
      return;
    }

    // Monta o HTML do alerta com os avisos acumulados
    let alertHtml = `
      <div style="text-align: left; font-size: 0.95rem; line-height: 1.5;">
        <p>Deseja criar uma pendência de <b>${selectedForm.label}</b> para <b>${pacienteNome}</b>?</p>
        <p style="margin-top: 10px;"><b>Data referência:</b> <span style="color:#d97706">${dataReferencia}</span></p>
    `;

    // 1. Aviso de Data (se houver)
    if (avisoData) {
      alertHtml += `
        <div style="margin-top: 15px; padding: 10px; background-color: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e; font-size: 0.85rem;">
          ⚠️ ${avisoData}
        </div>
      `;
    }

    // 2. Aviso estático de multiplas emissões
    alertHtml += `
        <div style="margin-top: 10px; font-size: 0.8rem; color: #6b7280; font-style: italic;">
          OBS: Para multiplas emissão de pendências consulte a(o) terapeuta de sua especialidade com acesso ao método apollo.
        </div>
      </div>
    `;

    // Confirmação visual
    const { isConfirmed } = await Swal.fire({
      title: "Confirmar criação?",
      html: alertHtml,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#8b5cf6",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sim, criar",
      cancelButtonText: "Cancelar",
    });

    if (!isConfirmed) return;

    setLoading(true);
    setError(null);

    try {
      // Ajusta data referência para meio-dia UTC
      const dataRefIso = new Date(dataReferencia + "T12:00:00.000Z").toISOString();
      const agora = new Date().toISOString();

      const payload = {
        pacienteId: Number(pacienteId),
        formularioId: Number(selectedForm.value),
        agendamentoId: null,
        status: "ABERTA",
        criadaEm: agora,
        resolvidaEm: null,
        data_referencia: dataRefIso,
        especialidade: userEspecialidade, // Usa a especialidade do usuário
        diagnosticoMacro: diagnosticoMacro
      };

      console.log("Payload enviado:", payload);

      const result = await criar_pendencia_manual(payload);

      if (result.ok) {
        await Swal.fire({
          icon: "success",
          title: "Pendência criada!",
          text: "A pendência foi criada com sucesso e já está disponível.",
          timer: 2000,
          showConfirmButton: false,
        });
        onClose(); 
        window.location.reload(); 
      } else {
        const msg = result.error?.response?.data?.error || "Erro ao criar pendência.";
        setError(msg);
        Swal.fire("Erro", msg, "error");
      }
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao salvar.");
      Swal.fire("Erro", "Erro inesperado ao salvar.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {initialLoading ? (
        <div className="space-y-6 animate-pulse p-1">
          {/* Header Skeleton */}
          <div className="space-y-2">
            <div className="h-7 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>

          {/* Context Box Skeleton */}
          <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
             <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
             </div>
             <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
             </div>
             <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
             </div>
          </div>

          {/* Form Fields Skeleton */}
          <div className="space-y-4">
             <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-10 bg-gray-100 rounded-xl border border-gray-200"></div>
             </div>
             <div className="space-y-1">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-100 rounded-xl border border-gray-200"></div>
             </div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
             <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
             <div className="h-10 w-36 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">➕ Criar Pendência Pontual</h2>
          <p className="text-gray-600">
            Adicione uma pendência de formulário manualmente para <span className="font-semibold text-apollo-500">{pacienteNome}</span>.
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
            {error}
          </div>
        )}

        {/* Resumo do Contexto */}
        <div className="bg-apollo-200/10 border border-apollo-200/20 p-4 rounded-xl space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-apollo-800">Paciente:</span>
            <span className="font-semibold text-apollo-800">{pacienteNome}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-apollo-800">Diagnóstico Macro:</span>
            <span className="font-semibold text-apollo-800 text-right">
              {diagnosticoMacro || <span className="text-gray-400 italic">Buscando...</span>}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-apollo-800">Especialidade (Filtro):</span>
            <span className="font-semibold text-apollo-600">{userEspecialidade}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              Formulário / Escala
            </label>
            <SingleSelect
              options={selectOptions}
              value={selectedForm}
              onChange={(opt) => setSelectedForm(opt)}
              placeholder={loadingForms ? "Carregando escalas..." : "Selecione uma escala"}
              isClearable={true}
              noOptionsMessage={() => "Nenhuma escala encontrada para sua especialidade."}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-medium text-sm">
              Data de Referência
            </label>
            <input
              type="date"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-gray-800 text-sm placeholder-gray-400 shadow-sm outline-none transition-all duration-200 focus:border-apollo-200 focus:ring-2 focus:ring-apollo-200/30 hover:border-apollo-200"
              value={dataReferencia}
              onChange={(e) => setDataReferencia(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !selectedForm}
            className="px-4 py-2 bg-apollo-500 text-white font-medium rounded-lg hover:bg-apollo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : (
              "Criar Pendência"
            )}
          </button>
        </div>
      </div>
      )}
    </Modal>
  );
};

CriarPendenciaModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  pacienteId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  pacienteNome: PropTypes.string,
};

export default CriarPendenciaModal;
