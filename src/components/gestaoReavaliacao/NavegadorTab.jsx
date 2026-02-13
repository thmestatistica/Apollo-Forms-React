import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  ArrowPathIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { listar_profissionais } from '../../api/profissionais/profissionais_utils';
import { buscar_todas_pendencias } from '../../api/pendencias/pendencias_utils';
import { atribuir_profissional_paciente } from '../../api/navegador/navegador_utils';
import { INCLUIR_TESTES_GESTAO, isNomeIgnorado } from '../../utils/gestao/gestaoReavaliacaoUtils';

const NavegadorTab = () => {
  const [profissionaisNavegador, setProfissionaisNavegador] = useState([]);
  const [pacientesPendenciasNavegador, setPacientesPendenciasNavegador] = useState([]);
  const [vinculosNavegador, setVinculosNavegador] = useState(new Map());
  const [loadingNavegador, setLoadingNavegador] = useState(false);
  const [erroNavegador, setErroNavegador] = useState('');
  const [profissionalSelecionado, setProfissionalSelecionado] = useState({});
  const [buscaNavegador, setBuscaNavegador] = useState('');
  const [filtroNavegador, setFiltroNavegador] = useState('TODOS');
  const [paginaNavegador, setPaginaNavegador] = useState(1);
  const ITENS_POR_PAGINA_NAVEGADOR = 12;

  const normalizarProfissionais = useCallback((dados) => {
    const lista = Array.isArray(dados?.profissionais) ? dados.profissionais : Array.isArray(dados) ? dados : [];
    return lista
      .map((item) => {
        const base = item['usuario'];
        const id = item['id'];
        const nome = base['nome'];
        return id != null ? { id: Number(id), nome: String(nome ?? '').trim() } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
  }, []);

  const carregarNavegador = useCallback(async () => {
    setLoadingNavegador(true);
    setErroNavegador('');
    try {
      const [resProfissionais, resPendencias] = await Promise.all([listar_profissionais(), buscar_todas_pendencias({})]);

      const profissionais = normalizarProfissionais(resProfissionais);
      const pendenciasLista = Array.isArray(resPendencias) ? resPendencias : [];

      const mapaProfissionais = new Map(profissionais.map((prof) => [Number(prof.id), prof.nome]));
      const mapaPendencias = new Map();

      pendenciasLista.forEach((item) => {
        const pacienteId = item?.paciente?.id ?? item?.pacienteId;
        const pacienteNome = item?.paciente?.nome ?? item?.pacienteNome;
        if (pacienteId == null || !pacienteNome || isNomeIgnorado(pacienteNome, INCLUIR_TESTES_GESTAO)) return;
        const key = Number(pacienteId);
        if (!mapaPendencias.has(key)) {
          mapaPendencias.set(key, {
            pacienteId: key,
            pacienteNome: String(pacienteNome).trim(),
            profissionais: []
          });
        }

        const profissionalId = item?.profissionalId ?? item?.profissional_id;
        if (profissionalId != null) {
          const nomeProfissional =
            item?.profissional?.nome ??
            item?.profissional?.usuario?.nome ??
            mapaProfissionais.get(Number(profissionalId)) ??
            '';
          const profissionaisAtual = mapaPendencias.get(key).profissionais;
          const jaExiste = profissionaisAtual.some((prof) => Number(prof.id) === Number(profissionalId));
          if (!jaExiste) {
            profissionaisAtual.push({
              id: Number(profissionalId),
              nome: String(nomeProfissional || '').trim()
            });
          }
        }
      });

      const pacientesPendencias = Array.from(mapaPendencias.values())
        .map((item) => ({ id: item.pacienteId, nome: item.pacienteNome }))
        .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));

      setProfissionaisNavegador(profissionais);
      setVinculosNavegador(mapaPendencias);
      setPacientesPendenciasNavegador(pacientesPendencias);
    } catch (err) {
      console.error(err);
      setErroNavegador('Não foi possível carregar dados do navegador.');
    } finally {
      setLoadingNavegador(false);
    }
  }, [normalizarProfissionais]);

  useEffect(() => {
    carregarNavegador();
  }, [carregarNavegador]);

  const pacientesNavegadorUnificados = useMemo(() => {
    return pacientesPendenciasNavegador
      .map((item) => {
        const vinculo = vinculosNavegador.get(Number(item.id));
        const possuiNavegador = (vinculo?.profissionais ?? []).length > 0;
        return {
          ...item,
          possuiNavegador
        };
      })
      .sort((a, b) => {
        if (a.possuiNavegador !== b.possuiNavegador) return a.possuiNavegador ? -1 : 1;
        return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
      });
  }, [pacientesPendenciasNavegador, vinculosNavegador]);

  const pacientesNavegadorFiltrados = useMemo(() => {
    const termo = String(buscaNavegador || '').toLowerCase().trim();
    return pacientesNavegadorUnificados.filter((item) => {
      const nomeMatch = String(item.nome || '').toLowerCase().includes(termo);
      if (!nomeMatch) return false;
      if (filtroNavegador === 'COM') return item.possuiNavegador;
      if (filtroNavegador === 'SEM') return !item.possuiNavegador;
      return true;
    });
  }, [pacientesNavegadorUnificados, buscaNavegador, filtroNavegador]);

  const totalSemNavegador = useMemo(() => {
    return pacientesPendenciasNavegador.filter((item) => {
      const vinculo = vinculosNavegador.get(Number(item.id));
      return (vinculo?.profissionais ?? []).length === 0;
    }).length;
  }, [pacientesPendenciasNavegador, vinculosNavegador]);

  const totalComNavegador = useMemo(() => {
    return pacientesPendenciasNavegador.length - totalSemNavegador;
  }, [pacientesPendenciasNavegador.length, totalSemNavegador]);

  const totalPaginasNavegador = Math.max(1, Math.ceil(pacientesNavegadorFiltrados.length / ITENS_POR_PAGINA_NAVEGADOR));
  const pacientesNavegadorPaginados = useMemo(() => {
    const inicio = (paginaNavegador - 1) * ITENS_POR_PAGINA_NAVEGADOR;
    return pacientesNavegadorFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA_NAVEGADOR);
  }, [pacientesNavegadorFiltrados, paginaNavegador]);

  useEffect(() => {
    setPaginaNavegador(1);
  }, [buscaNavegador, filtroNavegador, pacientesNavegadorFiltrados.length]);

  const atribuirProfissional = useCallback(
    async (pacienteId) => {
      const profissionalId = profissionalSelecionado[pacienteId];
      if (!profissionalId) {
        await Swal.fire({
          icon: 'warning',
          title: 'Selecione um profissional',
          text: 'Escolha um profissional para associar ao paciente.'
        });
        return;
      }

      try {
        await atribuir_profissional_paciente(pacienteId, profissionalId);
        await Swal.fire({ icon: 'success', title: 'Associação concluída!', timer: 1500, showConfirmButton: false });
        carregarNavegador();
      } catch (err) {
        console.error(err);
        Swal.fire('Erro', 'Não foi possível associar o profissional.', 'error');
      }
    },
    [profissionalSelecionado, carregarNavegador]
  );

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden w-full animate-fade-in flex flex-col">
      <div className="bg-sky-50/50 p-6 border-b border-sky-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-sky-800 font-bold flex items-center gap-2 text-xl">
            <MagnifyingGlassIcon className="w-6 h-6" /> Navegador
          </h2>
          <p className="text-sky-600 text-sm mt-1">Pacientes sem navegador e vínculo de profissionais.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={carregarNavegador}
            className="p-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600 active:scale-95 transition-all shadow-md"
          >
            <ArrowPathIcon className={`w-5 h-5 ${loadingNavegador ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="relative">
        {loadingNavegador && (
          <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-sky-500"></div>
              <span className="text-sky-600 font-bold text-sm uppercase tracking-wide">Carregando dados...</span>
            </div>
          </div>
        )}

        <div className="p-6">
          {erroNavegador && (
            <div className="mb-4 bg-red-50 border border-red-100 text-red-700 text-sm rounded-lg p-3">{erroNavegador}</div>
          )}

          <div className="grid sm:grid-cols-3 gap-3 mb-6">
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <div className="text-xs text-sky-500 font-bold uppercase">Total pacientes</div>
              <div className="text-2xl font-extrabold text-sky-700">{pacientesNavegadorUnificados.length}</div>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="text-xs text-emerald-500 font-bold uppercase">Com navegador</div>
              <div className="text-2xl font-extrabold text-emerald-700">{totalComNavegador}</div>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
              <div className="text-xs text-rose-500 font-bold uppercase">Sem navegador</div>
              <div className="text-2xl font-extrabold text-rose-700">{totalSemNavegador}</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center mb-4">
            <div className="relative w-full sm:max-w-md">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3.5 text-sky-400" />
              <input
                type="text"
                placeholder="Buscar paciente..."
                value={buscaNavegador}
                onChange={(e) => setBuscaNavegador(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border-2 border-sky-100 rounded-xl focus:border-sky-400 outline-none text-sm text-sky-900 placeholder-sky-300 font-medium bg-white transition-all"
              />
            </div>
            <select
              className="appearance-none p-2.5 pl-4 pr-10 border-2 border-sky-100 rounded-xl text-sm outline-none bg-white text-sky-900 cursor-pointer hover:border-sky-300 focus:border-sky-400 font-bold transition-all w-full sm:w-56"
              value={filtroNavegador}
              onChange={(e) => setFiltroNavegador(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="COM">Com navegador</option>
              <option value="SEM">Sem navegador</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-sky-50 text-sky-700 text-xs uppercase font-bold tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">Profissionais vinculados</th>
                  <th className="px-4 py-3 text-center">Atribuir profissional</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {pacientesNavegadorFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-4 py-10 text-center text-slate-400 italic">
                      Nenhum paciente encontrado.
                    </td>
                  </tr>
                ) : (
                  pacientesNavegadorPaginados.map((paciente) => {
                    const vinculo = vinculosNavegador.get(Number(paciente.id));
                    const profissionais = vinculo?.profissionais ?? [];

                    return (
                      <tr key={paciente.id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-700">{paciente.nome}</td>
                        <td className="px-4 py-3">
                          {profissionais.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">Sem profissionais vinculados</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {profissionais.map((prof) => (
                                <span key={`${paciente.id}-${prof.id}`} className="text-xs font-bold text-sky-700 bg-sky-100 px-2 py-1 rounded-full">
                                  {prof.nome}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <select
                              className="min-w-[220px] appearance-none bg-white border-2 border-sky-100 text-slate-700 text-sm font-bold rounded-xl py-2 pl-3 pr-8 cursor-pointer outline-none focus:border-sky-400 hover:border-sky-200 transition-all shadow-sm"
                              value={profissionalSelecionado[paciente.id] || ''}
                              onChange={(e) =>
                                setProfissionalSelecionado((prev) => ({
                                  ...prev,
                                  [paciente.id]: e.target.value
                                }))
                              }
                            >
                              <option value="">Selecione...</option>
                              {profissionaisNavegador.map((prof) => (
                                <option key={prof.id} value={prof.id}>
                                  {prof.nome}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => atribuirProfissional(paciente.id)}
                              className="px-4 py-2 rounded-xl bg-sky-600 text-white font-bold text-sm hover:bg-sky-700 active:scale-95 transition-all shadow-md"
                            >
                              {paciente.possuiNavegador ? 'Atualizar' : 'Vincular'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {pacientesNavegadorFiltrados.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold text-gray-600 bg-gray-50 px-4 py-2 rounded-xl border border-gray-100">
              <span className="hidden sm:inline">Pág. {paginaNavegador} de {totalPaginasNavegador}</span>
              <div className="flex gap-1">
                <button
                  disabled={paginaNavegador === 1}
                  onClick={() => setPaginaNavegador(1)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronDoubleLeftIcon className="w-4 h-4" />
                </button>
                <button
                  disabled={paginaNavegador === 1}
                  onClick={() => setPaginaNavegador((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={totalPaginasNavegador}
                  value={paginaNavegador}
                  onChange={(e) => {
                    let val = Number(e.target.value);
                    if (val < 1) val = 1;
                    if (val > totalPaginasNavegador) val = totalPaginasNavegador;
                    setPaginaNavegador(val);
                  }}
                  className="w-12 text-center border border-gray-300 rounded-md focus:border-sky-400 outline-none bg-white py-0.5"
                />
                <button
                  disabled={paginaNavegador === totalPaginasNavegador}
                  onClick={() => setPaginaNavegador((p) => Math.min(totalPaginasNavegador, p + 1))}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
                <button
                  disabled={paginaNavegador === totalPaginasNavegador}
                  onClick={() => setPaginaNavegador(totalPaginasNavegador)}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600 disabled:opacity-30 transition-colors"
                >
                  <ChevronDoubleRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavegadorTab;
