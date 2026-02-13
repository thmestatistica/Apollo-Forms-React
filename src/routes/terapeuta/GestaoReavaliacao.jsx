import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GestaoReavaliacaoHeader from '../../components/gestaoReavaliacao/GestaoReavaliacaoHeader';
import GerenciarTab from '../../components/gestaoReavaliacao/GerenciarTab';
import MetodoTab from '../../components/gestaoReavaliacao/MetodoTab';
import NavegadorTab from '../../components/gestaoReavaliacao/NavegadorTab';

// --- LISTA DE IDs PERMITIDOS ---
// Base global para permissões: quem está aqui vê todas as abas.
// ProfissionalId's que não estão nessa lista não verão nada, a menos que sejam incluídos nas listas específicas de cada aba.
const IDS_PERMITIDOS = [8, 17, 43, 41];

// --- CONTROLE GLOBAL DE VISIBILIDADE POR ABA ---
// Ajuste estas listas para permitir/ocultar abas específicas.
const PERMITIDOS_GERADOR = IDS_PERMITIDOS.concat([13, 15, 40]); // Exemplo: só quem tem ID 13 além dos IDs globais pode acessar a aba de geração.
const PERMITIDOS_ADMIN = IDS_PERMITIDOS.concat([13, 15, 40]); 
const PERMITIDOS_METODO = IDS_PERMITIDOS;
const PERMITIDOS_NAVEGADOR = IDS_PERMITIDOS;

const GestaoReavaliacao = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const gestaoFromState = Boolean(location.state?.gestaoOnly);
    const allowedIdsFromState = Array.isArray(location.state?.allowedPatientIds)
        ? location.state.allowedPatientIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
        : [];

    const [activeTab, setActiveTab] = useState('gestao');
    const [accessMode, setAccessMode] = useState(gestaoFromState ? 'gestao' : 'full');
    const [allowedPatientIds, setAllowedPatientIds] = useState(() => new Set(gestaoFromState ? allowedIdsFromState : []));
    const [dataManual, setDataManual] = useState('');

    useEffect(() => {
        const gestaoOnly = Boolean(location.state?.gestaoOnly);
        const ids = Array.isArray(location.state?.allowedPatientIds) ? location.state.allowedPatientIds : [];
        if (gestaoOnly) {
            setAccessMode('gestao');
            setAllowedPatientIds(new Set(ids.map((id) => Number(id)).filter((idNum) => !Number.isNaN(idNum))));
            setActiveTab('gestao');
        } else {
            setAccessMode('full');
            setAllowedPatientIds(new Set());
        }
    }, [location.state]);

    const canSeeTab = useCallback((tabKey) => {
        if (accessMode === 'gestao') return tabKey === 'gestao';
        const profissionalId = Number(user?.profissionalId);
        if (!profissionalId) return false;
        if (IDS_PERMITIDOS.includes(profissionalId)) return true;
        if (tabKey === 'gestao') return PERMITIDOS_GERADOR.includes(profissionalId) || PERMITIDOS_ADMIN.includes(profissionalId);
        if (tabKey === 'metodo') return PERMITIDOS_METODO.includes(profissionalId);
        if (tabKey === 'navegador') return PERMITIDOS_NAVEGADOR.includes(profissionalId);
        return false;
    }, [accessMode, user]);

    useEffect(() => {
        const ordemTabs = ['gestao', 'metodo', 'navegador'];
        if (!canSeeTab(activeTab)) {
            const primeiraPermitida = ordemTabs.find((tab) => canSeeTab(tab));
            if (primeiraPermitida) setActiveTab(primeiraPermitida);
        }
    }, [activeTab, canSeeTab]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-100">
            <div className="w-screen min-h-screen flex flex-col gap-12 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-4 p-2 xl:shadow-lg items-center">
                <div className="bg-white h-full rounded-2xl w-full md:p-10 p-5 overflow-y-auto max-w-7xl xl:shadow-2xl pb-20">
                    <GestaoReavaliacaoHeader
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        canSeeTab={canSeeTab}
                        onBack={() => navigate('/forms-terapeuta/tela-inicial')}
                    />

                    {activeTab === 'gestao' && (
                        <GerenciarTab
                            accessMode={accessMode}
                            allowedPatientIds={allowedPatientIds}
                            dataManual={dataManual}
                            setDataManual={setDataManual}
                        />
                    )}

                    {activeTab === 'metodo' && <MetodoTab dataManual={dataManual} />}

                    {activeTab === 'navegador' && <NavegadorTab />}
                </div>
            </div>
        </div>
    );
};

export default GestaoReavaliacao;