import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GestaoPendenciasHeader from '../../components/gestaoPendencias/GestaoPendenciasHeader';
import GerenciarTab from '../../components/gestaoReavaliacao/GerenciarTab';
import InativacaoTab from '../../components/gestaoReavaliacao/InativacaoTab';
import MetodoTab from '../../components/gestaoReavaliacao/MetodoTab';
import NavegadorTab from '../../components/gestaoReavaliacao/NavegadorTab';
import { useAuth } from '../../hooks/useAuth';
import ListagemPendencias from '../../components/gestaoPendencias/ListagemPendencias';

// --- LISTA DE IDs PERMITIDOS ---
// Base global para permissões: quem está aqui vê todas as abas.
// ProfissionalId's que não estão nessa lista não verão nada, a menos que sejam incluídos nas listas específicas de cada aba.
const IDS_PERMITIDOS = [8, 17, 43, 41];

// --- CONTROLE GLOBAL DE VISIBILIDADE POR ABA ---
// Ajuste estas listas para permitir/ocultar abas específicas.
const PERMITIDOS_GERADOR = IDS_PERMITIDOS.concat([13, 15, 40]); // Exemplo: só quem tem ID 13 além dos IDs globais pode acessar a aba de geração.
const PERMITIDOS_ADMIN = IDS_PERMITIDOS.concat([13, 15, 40]);
const PERMITIDOS_METODO = IDS_PERMITIDOS.concat([15]);
const PERMITIDOS_NAVEGADOR = IDS_PERMITIDOS;
const PERMITIDOS_INATIVACAO = IDS_PERMITIDOS;

const GestaoPendencias = () => {
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
        if (tabKey === 'lancamento') return PERMITIDOS_GERADOR.includes(profissionalId) || PERMITIDOS_ADMIN.includes(profissionalId);
        return false;
    }, [accessMode, user]);

    useEffect(() => {
        const ordemTabs = ['gestao', 'lancamento'];
        if (!canSeeTab(activeTab)) {
            const primeiraPermitida = ordemTabs.find((tab) => canSeeTab(tab));
            if (primeiraPermitida) setActiveTab(primeiraPermitida);
        }
    }, [activeTab, canSeeTab]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 bg-gray-50">
            <div className="w-full min-h-screen flex flex-col md:gap-8 gap-4 bg-linear-to-tr from-apollo-300 to-apollo-400 md:p-6 p-2 items-center">
                <div className="bg-white w-full h-full rounded-2xl shadow-xl flex flex-col md:p-8 p-4">
                    <GestaoPendenciasHeader
                        activeTab={activeTab}
                        onTabChange={setActiveTab}
                        canSeeTab={canSeeTab}
                        onBack={() => navigate('/forms-terapeuta/tela-inicial')}
                    />

                    <ListagemPendencias />
                </div>
            </div>
        </div>
    );
};

export default GestaoPendencias;