import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useAuth } from "../../hooks/useAuth";
import InfoGen from "../../components/info/InfoGen";
import LoadingGen from "../../components/info/LoadingGen";
import { abreviarNome, formatarData, formatarHora } from "../../utils/format/formatar_utils";
import { buscar_pendencias_profissional_status } from "../../api/pendencias/pendencias_utils";

const STATUS_ALVO = "APLICADO_NAO_LANCADO";

const getDataPendencia = (pendencia) =>
  pendencia?.createdAt ??
  pendencia?.criadaEm ??
  pendencia?.data_referencia ??
  pendencia?.dataReferencia ??
  pendencia?.resolvidaEm ??
  null;

const normalizarPendencia = (item) => {
  console.log(item)
  const pacienteNome =
    item?.paciente?.nome ??
    item?.pacienteNome ??
    item?.paciente?.pacienteNome ??
    "Paciente";

  const formularioId =
    item?.formularioId ??
    item?.formulario?.id ??
    item?.formulario?.formularioId ??
    null;

  const formularioNome =
    item?.formulario?.nomeEscala ??
    item?.formulario?.nome ??
    item?.label ??
    `Escala ${formularioId ?? ""}`.trim();

  const fallbackId =
    item?.id ??
    item?.pendenciaId ??
    item?.formularioId ??
    item?.agendamentoId ??
    `${pacienteNome}-${formularioId ?? ""}`.trim();

  return {
    id: fallbackId,
    pacienteNome,
    formularioId,
    formularioNome,
    pacienteId: item?.pacienteId ?? item?.paciente?.id ?? null,
    agendamentoId: item?.agendamentoId ?? item?.agendamento?.id ?? null,
    especialidade: item?.especialidade ?? item?.profissionalEspecialidade ?? null,
    status: item?.status ?? STATUS_ALVO,
    data: getDataPendencia(item),
    raw: item,
  };
};

function LacamentosPendencias() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [pendencias, setPendencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [filtroPaciente, setFiltroPaciente] = useState("TODOS");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const PAGE_SIZE = 8;

  const carregarPendencias = useCallback(async () => {
    const profissionalId = user?.profissionalId ?? user?.id ?? user?.usuarioId;
    if (!profissionalId) {
      setPendencias([]);
      setErro("Perfil sem identificacao profissional.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErro(null);
    try {
      const lista = await buscar_pendencias_profissional_status(profissionalId, [STATUS_ALVO]);
      setPendencias(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error("Erro ao carregar pendencias:", err);
      setErro("Falha ao carregar pendencias aplicadas.");
      setPendencias([]);
    } finally {
      setLoading(false);
    }
  }, [user?.profissionalId, user?.id, user?.usuarioId]);

  useEffect(() => {
    carregarPendencias();
  }, [carregarPendencias]);

  useEffect(() => {
    const { formSuccess, formTitulo, refreshPendencias } = location.state || {};
    const run = async () => {
      if (formSuccess) {
        await Swal.fire({
          icon: "success",
          title: "Lancamento concluido!",
          text: formTitulo ? `${formTitulo} foi salvo corretamente.` : "As respostas foram salvas corretamente.",
          confirmButtonColor: "#7C3AED",
        });
      }

      if (formSuccess || refreshPendencias) {
        await carregarPendencias();
        navigate(location.pathname, { replace: true, state: {} });
      }
    };

    run();
  }, [location.state, location.pathname, navigate, carregarPendencias]);

  const pendenciasOrdenadas = useMemo(() => {
    const normalizadas = (pendencias || []).map(normalizarPendencia);
    return normalizadas.sort((a, b) => {
      const da = a?.data ? new Date(a.data).getTime() : Number.POSITIVE_INFINITY;
      const db = b?.data ? new Date(b.data).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [pendencias]);

  const listaPacientes = useMemo(() => {
    const nomes = pendenciasOrdenadas
      .map((item) => item.pacienteNome)
      .filter(Boolean)
      .map((nome) => String(nome).trim())
      .filter((nome) => nome.length > 0);

    return Array.from(new Set(nomes)).sort((a, b) => a.localeCompare(b));
  }, [pendenciasOrdenadas]);

  const pendenciasFiltradas = useMemo(() => {
    if (filtroPaciente === "TODOS") return pendenciasOrdenadas;
    return pendenciasOrdenadas.filter((item) => item.pacienteNome === filtroPaciente);
  }, [pendenciasOrdenadas, filtroPaciente]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroPaciente, pendenciasFiltradas.length]);

  const totalPaginas = Math.max(1, Math.ceil(pendenciasFiltradas.length / PAGE_SIZE));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaSegura - 1) * PAGE_SIZE;
  const pendenciasPaginadas = pendenciasFiltradas.slice(inicio, inicio + PAGE_SIZE);

  const handleAbrirFormulario = (item) => {
    if (!item.formularioId) {
      Swal.fire({
        icon: "error",
        title: "Formulário indisponível",
        text: "Não foi possível identificar o formulário desta pendência.",
      });
      return;
    }

    const pendenciaParaFormulario = {
      Paciente: item.pacienteNome,
      PacienteID: item.pacienteId ?? null,
      AgendamentoID: item.agendamentoId ?? null,
      ProfissionalEspecialidade: item.especialidade ?? null,
      Data: item.data ? formatarData(item.data) : "—",
    };

    navigate(`/forms-terapeuta/formulario/escala/${item.formularioId}`, {
      state: {
        pendencia: pendenciaParaFormulario,
        pendenciaEscala: item.raw,
        formTitulo: item.formularioNome,
        returnTo: "/forms-terapeuta/lancamentos-pendencias",
        refreshPendencias: true,
      },
    });
  };

  if (loading) return <LoadingGen mensagem="Carregando pendencias aplicadas..." />;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8">
      <div className="w-screen min-h-screen flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
        <div className="bg-white h-full rounded-3xl w-full md:p-10 p-5 overflow-y-auto max-w-6xl xl:shadow-2xl pb-16">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col gap-2 w-full">
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                  <h1 className="font-extrabold text-3xl text-gray-800">Lançamentos de Pendências</h1>
                  <button
                    onClick={() => navigate("/forms-terapeuta/tela-inicial")}
                    className="bg-red-600 border border-apollo-100 text-apollo-100 hover:bg-apollo-50 font-bold py-2 px-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Voltar ao painel
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Pendências marcadas como aplicadas, mas não lançada
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    {pendenciasFiltradas.length} pendencias
                  </span>
                  <span className="px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                    Pagina {paginaSegura} de {totalPaginas}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full sm:max-w-xs">
              <label className="text-xs font-semibold text-gray-500">Filtrar por paciente</label>
              <select
                value={filtroPaciente}
                onChange={(event) => setFiltroPaciente(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-apollo-200/40"
              >
                <option value="TODOS">Todos os pacientes</option>
                {listaPacientes.map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {erro && <InfoGen message={erro} />}

          {!erro && pendenciasFiltradas.length === 0 && (
            <InfoGen message="Nenhuma pendencia aplicada para lancamento." />
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {pendenciasPaginadas.map((item) => {
              const dataLabel = item.data ? `${formatarData(item.data)} ${formatarHora(item.data)}` : "—";
              const pacienteLabel = item.pacienteNome ? abreviarNome(String(item.pacienteNome), 2) : "Paciente";
              console.log(item)
              return (
                <div
                  key={item.id}
                  className="bg-white border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold text-gray-800">{pacienteLabel}</h2>
                        <span className="text-xs font-bold px-3 py-1 rounded-full border border-amber-200 bg-amber-50 text-amber-800">
                          Aplicado, nao lancado
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>
                          <strong>Escala:</strong> {item.formularioNome}
                        </div>
                        <div>
                          <strong>Data:</strong> {dataLabel}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAbrirFormulario(item)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl shadow-sm hover:shadow-md transition-all"
                      >
                        Lancar agora
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {pendenciasFiltradas.length > PAGE_SIZE && (
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500">
                Mostrando {inicio + 1} - {Math.min(inicio + PAGE_SIZE, pendenciasFiltradas.length)} de {pendenciasFiltradas.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                  disabled={paginaSegura === 1}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600">
                  {paginaSegura} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                  disabled={paginaSegura === totalPaginas}
                  className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Proxima
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LacamentosPendencias;