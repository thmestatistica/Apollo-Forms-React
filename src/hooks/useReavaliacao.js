import { useState, useEffect } from 'react';
import api from '../api/axiosInstance'; // Import Default (funciona sem alterar seu axiosInstance)
import { v4 as uuidv4 } from 'uuid';
import Swal from 'sweetalert2';

export const useReavaliacao = () => {
  const [pacientes, setPacientes] = useState([]);
  const [escalas, setEscalas] = useState([]);
  const [rascunhos, setRascunhos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingPacientes, setLoadingPacientes] = useState(true);

  // 1. Carregar dados iniciais (Pacientes Ativos e Escalas)
  useEffect(() => {
    const carregarDados = async () => {
      setLoadingPacientes(true);
      try {
        const [resPac, resEsc] = await Promise.all([
          api.get('/pacientes'),
          api.get('/escalas')
        ]);
        
        // Filtra apenas pacientes ativos
        const ativos = resPac.data.filter(p => p.ativo === true);
        
        // Ordena por nome para facilitar busca
        ativos.sort((a, b) => a.nome.localeCompare(b.nome));
        
        setPacientes(ativos);
        setEscalas(resEsc.data);
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setLoadingPacientes(false);
      }
    };
    carregarDados();
  }, []);

  // 2. Inteligência: Analisa Histórico e Cruza Dados
  const gerarSugestoes = async (pacienteId, dataManual) => {
    setLoading(true);
    try {
      const [resPac, resHist] = await Promise.all([
        api.get(`/pacientes/${pacienteId}`),
        api.get(`/pacientes/pacientes/${pacienteId}/historico`)
      ]);

      const paciente = resPac.data;
      // Garante que o histórico venha ordenado do mais recente para o mais antigo (se a API já não mandar)
      const historico = (resHist.data.agendamentos || []).sort((a, b) => b.id - a.id);

      const dataAlvo = dataManual || paciente.data_referencia || new Date().toISOString().split('T')[0];

      // 🗺️ MAPA: Especialidade -> ID do Último Agendamento
      // Ex: { "Fisioterapia": 502, "Psicologia": 490 }
      const mapSpecToId = {};

      const addSpec = (valor, idAgendamento) => {
        if (!valor) return;
        const processar = (v) => {
            const specNome = String(v).trim();
            // Só salva se ainda não tivermos um ID (como ordenamos por ID decrescente, o primeiro é o último/mais recente)
            if (!mapSpecToId[specNome]) {
                mapSpecToId[specNome] = idAgendamento;
            }
        };

        if (Array.isArray(valor)) valor.forEach(processar);
        else processar(valor);
      };

      historico.forEach(ag => {
        const status = ag.presenca ? String(ag.presenca).toLowerCase() : '';
        const presente = ['presente', 'realizada', 'confirmado', 'ok', 'compareceu'].includes(status);
        
        if (presente) {
          if (ag.slot) addSpec(ag.slot.especialidade, ag.id);
          if (ag.profissional) addSpec(ag.profissional.especialidade, ag.id);
        } else {
          // console.log(`Agendamento ID ${ag.id} não foi marcado como presente (status: ${status}). Ignorando para sugestões.`);
        }
      });

      // console.log("Specs detectadas (com IDs):", mapSpecToId);

      let diagOriginal = paciente.diagnosticoMacro;
      if (Array.isArray(diagOriginal) && diagOriginal.length > 0) diagOriginal = diagOriginal[0];

      if (!diagOriginal) {
        alert(`Paciente ${paciente.nome} não tem Diagnóstico Macro.`);
        return;
      }

      const DIAG_MAP = { "Doenças Degenerativas": "AVC" };
      const diagsParaTestar = [diagOriginal];
      if (DIAG_MAP[diagOriginal]) diagsParaTestar.push(DIAG_MAP[diagOriginal]);

      // D) Cruza Dados
      const novasSugestoes = [];
      
      // Pega as chaves do mapa (as especialidades encontradas)
      const specsEncontradas = Object.keys(mapSpecToId);

      escalas.forEach(esc => {
        let listaDiagsEscala = esc.listaDiagnosticos;
        if (typeof listaDiagsEscala === 'string') listaDiagsEscala = listaDiagsEscala.split(',').map(s => s.trim());

        const bateDiag = listaDiagsEscala.some(dEscala => diagsParaTestar.includes(dEscala));
        
        if (bateDiag) {
          let listaSpecsEscala = esc.especialidade;
          if (typeof listaSpecsEscala === 'string') listaSpecsEscala = listaSpecsEscala.split(',').map(s => s.trim());

          listaSpecsEscala.forEach(espEscala => {
            // Verifica se essa especialidade está no nosso mapa
            if (specsEncontradas.some(s => s === espEscala)) {
              
              // 💎 AQUI ESTÁ O SEGREDO: Pegamos o ID guardado no mapa
              const idDoAgendamento = mapSpecToId[espEscala];

              novasSugestoes.push({
                tempId: uuidv4(),
                pacienteId: paciente.id,
                nomePaciente: paciente.nome,
                formularioId: esc.formularioId,
                nomeEscala: esc.nomeEscala,
                diagnosticoMacro: diagOriginal,
                especialidade: espEscala,
                agendamentoId: idDoAgendamento,
                dataReferencia: dataAlvo,
                status: 'ABERTA'
              });
            }
          });
        }
      });

      if (specsEncontradas.length === 0) {
        alert(`Nenhuma especialidade encontrada no histórico do paciente. Verifique se há agendamentos com presença marcada de alguma especi.`);
      } else if (novasSugestoes.length === 0) {
        alert(`Não foram encontradas escalas compatíveis. Verifique o diagnóstico ou histórico do paciente.`);
      } else {
        setRascunhos(prev => [...prev, ...novasSugestoes]);
      }

    } catch (error) {
      console.error("Erro na análise:", error);
      alert("Erro ao buscar histórico.");
    } finally {
      setLoading(false);
    }
  };

  const avaliarPossiveisSugestoesPaciente = async (pacienteId, dataManual) => {
    try {
      const [resPac, resHist] = await Promise.all([
        api.get(`/pacientes/${pacienteId}`),
        api.get(`/pacientes/pacientes/${pacienteId}/historico`)
      ]);

      const paciente = resPac.data;
      const historico = (resHist.data.agendamentos || []).sort((a, b) => b.id - a.id);
      const dataAlvo = dataManual || paciente.data_referencia || new Date().toISOString().split('T')[0];

      const mapSpecToId = {};

      const addSpec = (valor, idAgendamento) => {
        if (!valor) return;
        const processar = (v) => {
          const specNome = String(v).trim();
          if (!mapSpecToId[specNome]) {
            mapSpecToId[specNome] = idAgendamento;
          }
        };

        if (Array.isArray(valor)) valor.forEach(processar);
        else processar(valor);
      };

      historico.forEach(ag => {
        const status = ag.presenca ? String(ag.presenca).toLowerCase() : '';
        const presente = ['presente', 'realizada', 'confirmado', 'ok', 'compareceu'].includes(status);

        if (presente) {
          if (ag.slot) addSpec(ag.slot.especialidade, ag.id);
          if (ag.profissional) addSpec(ag.profissional.especialidade, ag.id);
        }
      });

      let diagOriginal = paciente.diagnosticoMacro;
      if (Array.isArray(diagOriginal) && diagOriginal.length > 0) diagOriginal = diagOriginal[0];

      if (!diagOriginal) {
        return { status: 'sem_diagnostico', motivo: 'Sem diagnóstico', sugestoes: 0, diagnosticoMacro: null };
      }

      const DIAG_MAP = { "Doenças Degenerativas": "AVC" };
      const diagsParaTestar = [diagOriginal];
      if (DIAG_MAP[diagOriginal]) diagsParaTestar.push(DIAG_MAP[diagOriginal]);

      const novasSugestoes = [];
      const specsEncontradas = Object.keys(mapSpecToId);

      escalas.forEach(esc => {
        let listaDiagsEscala = esc.listaDiagnosticos;
        if (typeof listaDiagsEscala === 'string') listaDiagsEscala = listaDiagsEscala.split(',').map(s => s.trim());

        const bateDiag = listaDiagsEscala.some(dEscala => diagsParaTestar.includes(dEscala));

        if (bateDiag) {
          let listaSpecsEscala = esc.especialidade;
          if (typeof listaSpecsEscala === 'string') listaSpecsEscala = listaSpecsEscala.split(',').map(s => s.trim());

          listaSpecsEscala.forEach(espEscala => {
            if (specsEncontradas.some(s => s === espEscala)) {
              const idDoAgendamento = mapSpecToId[espEscala];

              novasSugestoes.push({
                tempId: uuidv4(),
                pacienteId: paciente.id,
                nomePaciente: paciente.nome,
                formularioId: esc.formularioId,
                nomeEscala: esc.nomeEscala,
                diagnosticoMacro: diagOriginal,
                especialidade: espEscala,
                agendamentoId: idDoAgendamento,
                dataReferencia: dataAlvo,
                status: 'ABERTA'
              });
            }
          });
        }
      });

      if (novasSugestoes.length === 0) {
        if (diagOriginal === null || diagOriginal === undefined || diagOriginal === ''  ) {
          return { status: 'sem_diagnostico', motivo: 'Sem diagnóstico', sugestoes: 0, diagnosticoMacro: diagOriginal };

        } else if (specsEncontradas.length === 0) {
          return { status: 'sem_presenca', motivo: 'Agendamento Sem Presença', sugestoes: 0, diagnosticoMacro: diagOriginal };
        }
        return { status: 'sem_sugestoes', motivo: 'Sem sugestões', sugestoes: 0, diagnosticoMacro: diagOriginal };
      }

      return { status: 'com_sugestoes', motivo: '', sugestoes: novasSugestoes.length, diagnosticoMacro: diagOriginal };
    } catch (error) {
      console.error("Erro na análise:", error);
      return { status: 'sem_dados', motivo: 'Falha na análise', sugestoes: 0, diagnosticoMacro: null };
    }
  };

  // Funções de Tabela
  const atualizarRascunho = (tempId, campo, valor) => {
    setRascunhos(prev => prev.map(item => 
      item.tempId === tempId ? { ...item, [campo]: valor } : item
    ));
  };

  const removerRascunho = (tempId) => {
    setRascunhos(prev => prev.filter(item => item.tempId !== tempId));
  };

// Substitua a função salvarNoBanco por esta:
  const salvarNoBanco = async () => {
    if (rascunhos.length === 0) return false;
    setLoading(true);
    let sucessos = 0;
    let jaExistentes = 0;
    let erros = 0;

    try {
      const promises = rascunhos.map(draft => {
        // Prepara data ISO (ajustada para meio-dia para evitar fuso horário)
        let dataIso = null;
        if (draft.dataReferencia) {
            dataIso = new Date(draft.dataReferencia + "T12:00:00.000Z").toISOString();
        }
        const agora = new Date().toISOString();

        const payload = {
          pacienteId: Number(draft.pacienteId),
          formularioId: Number(draft.formularioId),
          agendamentoId: draft.agendamentoId ? Number(draft.agendamentoId) : null,
          diagnosticoMacro: draft.diagnosticoMacro,
          especialidade: draft.especialidade,
          status: 'ABERTA',
          criadaEm: agora,
          resolvidaEm: null,
          data_referencia: dataIso 
        };

        return api.post('/pendencias', payload)
          .then(() => ({ status: 'sucesso' }))
          .catch((err) => {
             const msg = err.response?.data?.error || "";
             if (msg.includes("já existente") || msg.includes("already exists")) return { status: 'existente' };
             console.error(`Erro Form ${draft.formularioId}:`, err.response?.data);
             return { status: 'erro' };
          });
      });

      const resultados = await Promise.all(promises);
      
      resultados.forEach(res => {
          if (res.status === 'sucesso') sucessos++;
          else if (res.status === 'existente') jaExistentes++;
          else erros++;
      });

      // ✅ SUCESSO: Usa SweetAlert e LIMPA A LISTA
      if (erros === 0) {
        await Swal.fire({
          icon: 'success',
          title: 'Sucesso!',
          html: `<b>${sucessos}</b> pendências foram agendadas.<br/>${jaExistentes > 0 ? `<small>(${jaExistentes} já existiam)</small>` : ''}`,
          confirmButtonColor: '#0f766e',
          timer: 2000
        });
        setRascunhos([]); // <--- AQUI LIMPA AS ESCALAS DA TELA
        return true; 
      } else {
        // ⚠️ ERRO PARCIAL
        await Swal.fire({
          icon: 'warning',
          title: 'Concluído com Alertas',
          html: `${sucessos} enviadas.<br/><b>${erros} falharam.</b> Verifique o console.`,
          confirmButtonColor: '#d97706'
        });
        return false;
      }

    } catch (error) {
      console.error("Erro fatal:", error);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Falha de conexão com o servidor.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    pacientes,
    rascunhos,
    loading,
    gerarSugestoes,
    avaliarPossiveisSugestoesPaciente,
    atualizarRascunho,
    removerRascunho,
    salvarNoBanco,
    setRascunhos,
    loadingPacientes
  };
};