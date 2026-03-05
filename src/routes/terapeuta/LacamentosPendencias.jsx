import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Abas
import PendenciasExistentesAba from "../../components/lancamentos_pendencias/PendenciasExistentesAba";
import CriarPendenciaAba from "../../components/lancamentos_pendencias/CriarPendenciaAba";

function LacamentosPendencias() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pendencias");

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
        <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
            <div className="bg-white w-full min-h-[85dvh] rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
                
                {/* Cabeçalho Geral */}
                <div className="flex flex-col gap-6 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-3 w-full border-b border-gray-100 pb-3">
                        <div>
                            <h1 className="font-extrabold text-2xl md:text-3xl text-gray-800 tracking-tight">Lançamentos de Pendências</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Gerencie pendências aplicadas ou crie novos lançamentos retroativos.
                            </p>
                        </div>
                        <button
                            onClick={() => navigate("/forms-terapeuta/tela-inicial")}
                            className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold py-1.5 px-4 rounded-lg shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2 text-sm"
                        >
                            Voltar
                        </button>
                    </div>

                    {/* Navegação de Abas */}
                    <div className="flex p-1 space-x-1 bg-gray-100/80 rounded-xl max-w-md">
                        <button
                            className={`w-full py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                                activeTab === "pendencias"
                                ? "bg-white text-apollo-400 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                            onClick={() => setActiveTab("pendencias")}
                        >
                            📋 Pendências Existentes
                        </button>
                        <button
                            className={`w-full py-2.5 text-sm font-bold rounded-lg transition-all duration-200 ${
                                activeTab === "nova"
                                ? "bg-white text-apollo-400 shadow-sm ring-1 ring-black/5"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                            }`}
                            onClick={() => setActiveTab("nova")}
                        >
                            ➕ Nova Pendência Retroativa
                        </button>
                    </div>
                </div>

                {/* Conteúdo da Aba Ativa */}
                <div className="flex-1 transition-all duration-300 ease-in-out">
                    {activeTab === "pendencias" ? (
                        <PendenciasExistentesAba />
                    ) : (
                        <CriarPendenciaAba />
                    )}
                </div>

            </div>
        </div>
    </div>
  );
}

export default LacamentosPendencias;
