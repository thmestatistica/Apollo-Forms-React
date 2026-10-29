import React, { useState, useEffect, useMemo } from 'react';
import { useAdminPacientes } from '../../hooks/useAdminPacientes';
import { useAdminPendencias } from '../../hooks/useAdminPendencias';
import { FaBan, FaCalendar, FaClock, FaPlus } from 'react-icons/fa';
import GestaoSectionCard from '../gestaoReavaliacao/shared/GestaoSectionCard';
import AdminPesquisaCard from '../gestaoReavaliacao/tabPesquisa/AdminPesquisaCard';
import AdminPesquisaMetrics from '../gestaoReavaliacao/tabPesquisa/AdminPesquisaMetrics';
import useForms from '../../hooks/useForms';
import LancarPendencias from './modals/LancarPendencias';
import TabPendenciasEscala from './tabs/TabPendenciasEscala';
import { FaRotate, FaSheetPlastic, FaX } from 'react-icons/fa6';
import TabPendenciasAvReav from './tabs/TabPendenciasAvReav';
import useAgendamentos from '../../hooks/useAgendamentos';
import useProfissionais from '../../hooks/useProfissionais';
import TabRegistrosRecentes from './tabs/TabRegistrosRecentes';
import TabAgendamentosFuturos from './tabs/TabAgendamentosFuturos';

const TABS_PENDENCIAS = [
    { id: 'escala', label: 'Pendências de escala', icon: FaSheetPlastic },
    { id: 'avaliacao', label: 'Pendências de avaliação', icon: FaRotate },
    { id: 'registro', label: 'Registros recentes', icon: FaClock },
    { id: 'agendamentos', label: 'Proximos agendamentos', icon: FaCalendar },
];

const ListagemPendencias = ({ accessMode, allowedPatientIds }) => {
    const [selectedPacienteId, setSelectedPacienteId] = useState('');
    const [isLancarModalOpen, setIsLancarModalOpen] = useState(false);
    const [abaAtiva, setAbaAtiva] = useState('escala');

    const { pacientesDisponiveis,
        loadingPacientes,
        carregarPacientesAdmin,
        answeredLast,
        loadingAnsweredLast,
        carregarUltimasRespostas
    } = useAdminPacientes({
        accessMode,
        allowedPatientIds,
        selectedPacienteId,
        setSelectedPacienteId,
    });

    const {
        dadosFiltrados,
        loadingAdmin,
        editados,
        setEditados,
        filtros,
        setFiltros,
        carregarDadosAdmin,
    } = useAdminPendencias({
        selectedPacienteId,
        accessMode,
        allowedPatientIds,
    });

    const { profissionaisOptions, presencasList, presencasMap, fetchProfissionais, loadingLista } = useProfissionais();

    const { agendamentos, agendamentosIdsList, loadingAgendamentos, fetchAgendamentos, reload } = useAgendamentos(selectedPacienteId);

    const { formulariosOptions, fetchFormularios } = useForms();

    useEffect(() => { fetchProfissionais(); }, [fetchProfissionais]);
    useEffect(() => { fetchAgendamentos(); }, [fetchAgendamentos]);
    useEffect(() => { fetchFormularios(); }, [fetchFormularios]);

    const agendamentosFiltrados = useMemo(() => {
        const idsProfissional = new Set(presencasList.map((p) => p.id));
        return agendamentos.filter((ag) => idsProfissional.has(ag.id));
    }, [agendamentos, presencasList]);

    return (
        <div className="flex flex-col">
            <AdminPesquisaCard
                selectedPacienteId={selectedPacienteId}
                setSelectedPacienteId={setSelectedPacienteId}
                editados={editados}
                setEditados={setEditados}
                carregarDadosAdmin={carregarDadosAdmin}
                loadingAdmin={loadingAdmin}
                loadingPacientes={loadingPacientes}
                pacientesDisponiveis={pacientesDisponiveis}
                filtros={filtros}
                setFiltros={setFiltros}
            />

            {!selectedPacienteId ? (
                <div className="w-full mt-6 bg-linear-to-r from-teal-500/20 to-orange-300/20 border border-blue-400/50 border-dashed rounded-md text-center py-3 font-semibold text-teal-900/50">
                    <p>Selecione um paciente primeiro</p>
                </div>
            ) : (
                <div className='flex flex-col mt-4'>
                    {abaAtiva && (
                        <AdminPesquisaMetrics dadosFiltrados={dadosFiltrados} />
                    )}
                    <GestaoSectionCard
                        showBtn
                        btnDisabled={abaAtiva !== 'escala' && abaAtiva !== 'avaliacao'}
                        btnLabel={abaAtiva === 'escala' || abaAtiva === 'avaliacao' ? "Lançar novas pendências" : ""}
                        btnIcon={abaAtiva === 'escala' || abaAtiva === 'avaliacao' ? FaPlus : FaBan}
                        onBtnClick={() => setIsLancarModalOpen(true)}
                        tabs={TABS_PENDENCIAS}
                        activeTab={abaAtiva}
                        onTabChange={setAbaAtiva}
                        tabsStyle="bg-linear-to-r from-blue-100 via-teal-50 to-white"
                    >
                        {abaAtiva === 'escala' && (
                            <TabPendenciasEscala
                                dadosFiltrados={dadosFiltrados}
                                selectedPacienteId={selectedPacienteId}
                                filtros={filtros}
                                carregarDadosAdmin={carregarDadosAdmin}
                                formulariosOptions={formulariosOptions}
                            />
                        )}

                        {abaAtiva === 'avaliacao' && (
                            <TabPendenciasAvReav
                                selectedPacienteId={selectedPacienteId}
                                dadosAgendamentos={agendamentosFiltrados}
                            />
                        )}

                        {abaAtiva === 'registro' && (
                            <TabRegistrosRecentes
                                selectedPacienteId={selectedPacienteId}
                                dadosSessoes={answeredLast}
                                profissionaisOptions={profissionaisOptions}
                            />
                        )}

                        {abaAtiva === 'agendamentos' && (
                            <TabAgendamentosFuturos 
                                selectedPacienteId={selectedPacienteId}
                                dadosAgendamentos={agendamentos}
                            />
                        )}
                    </GestaoSectionCard>
                </div>
            )}

            <LancarPendencias
                open={isLancarModalOpen}
                onClose={() => setIsLancarModalOpen(false)}
            />
        </div>
    );
};

export default ListagemPendencias;