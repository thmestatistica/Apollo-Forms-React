import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import AdminTab from '../../components/gestaoReavaliacao/AdminTab';
import GerarTab from '../../components/gestaoReavaliacao/GerarTab';
import GestaoReavaliacaoHeader from '../../components/gestaoReavaliacao/GestaoReavaliacaoHeader';
import MetodoTab from '../../components/gestaoReavaliacao/MetodoTab';
import NavegadorTab from '../../components/gestaoReavaliacao/NavegadorTab';
import { 
  TrashIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const DIAGNOSTICO_OPCOES = [
  "AVC", "Doença de Parkinson", "TCE", "Dor Crônica", 
  "Doenças Degenerativas", "Lesão Medular", "Doença Oncológica", 
  "Paralisia Cerebral", "Neuropatia", "Distonia", "Ortopedia", "Outros"
];

const ITENS_POR_PAGINA = 50; 

// --- LISTA DE IDs PERMITIDOS ---
// Base global para permissões: quem está aqui vê todas as abas.
// ProfissionalId's que não estão nessa lista não verão nada, a menos que sejam incluídos nas listas específicas de cada aba.
const IDS_PERMITIDOS = [8, 43, 17];

// --- CONTROLE GLOBAL DE VISIBILIDADE POR ABA ---
// Ajuste estas listas para permitir/ocultar abas específicas.
const PERMITIDOS_GERADOR = IDS_PERMITIDOS.concat([13, 15, 40, 41]); // Exemplo: só quem tem ID 13 além dos IDs globais pode acessar a aba de geração.
const PERMITIDOS_ADMIN = IDS_PERMITIDOS.concat([13, 15, 40, 41]); 
const PERMITIDOS_METODO = IDS_PERMITIDOS;
const PERMITIDOS_NAVEGADOR = IDS_PERMITIDOS.concat([41]);

// === SUB-COMPONENTE DE LINHA ===
// Linha editável da tabela Admin.
const AdminRow = React.memo(({ row, estaEditado, onSave, onDelete, onChange }) => {
    const dataInputValue = row.data_referencia ? String(row.data_referencia).slice(0, 10) : '';

    const getStatusColorClass = (status) => {
        switch (status) {
            case 'ABERTA': return 'text-green-700 bg-green-50 border-green-200';
            case 'CONCLUIDA': return 'text-blue-700 bg-blue-50 border-blue-200';
            case 'NAO_APLICA': return 'text-red-700 bg-red-50 border-red-200';
            default: return 'text-slate-700 bg-white border-slate-200';
        }
    };

    return (
        <tr className={`group hover:bg-apollo-50/30 transition-colors border-b border-gray-100 last:border-0 ${estaEditado ? 'bg-yellow-50/50' : ''}`}>
            <td className="p-3 border-r border-gray-100 text-center text-slate-400 text-xs font-mono align-middle">{row.id}</td>
            <td className="p-3 border-r border-gray-100 align-middle">
                <div className="text-sm font-semibold text-slate-700 whitespace-normal wrap-break-word leading-tight max-w-[200px]">
                    {row.paciente?.nome || <span className="text-red-300 italic">Sem Paciente</span>}
                </div>
            </td>
            <td className="p-3 border-r border-gray-100 align-middle">
                 <div className="text-sm text-slate-600 whitespace-normal wrap-break-word leading-tight max-w-[200px]">
                    {row.formulario?.nomeEscala}
                 </div>
            </td>
            <td className="p-1 border-r border-gray-100 align-middle h-full">
                <input type="date" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-apollo-300 rounded text-sm text-slate-600 transition-all"
                    value={dataInputValue} onChange={(e) => onChange(row.id, 'data_referencia', e.target.value)} />
            </td>
            <td className="p-1 border-r border-gray-100 align-middle">
                <input type="text" className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-apollo-300 rounded text-sm text-slate-600 transition-all"
                    value={row.especialidade || ''} onChange={(e) => onChange(row.id, 'especialidade', e.target.value)} />
            </td>
            <td className="p-1 border-r border-gray-100 align-middle">
                <select className="w-full h-full p-2 bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-apollo-300 rounded text-xs text-slate-600 cursor-pointer transition-all"
                    value={row.diagnosticoMacro || ''} onChange={(e) => onChange(row.id, 'diagnosticoMacro', e.target.value)}>
                    <option value="">Selecione...</option>
                    {DIAGNOSTICO_OPCOES.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                </select>
            </td>
            <td className="p-2 border-r border-gray-100 align-middle">
                <div className="h-full w-full flex items-center">
                    <select className={`w-full p-1.5 rounded-lg text-xs font-bold border cursor-pointer outline-none transition-all appearance-none text-center ${getStatusColorClass(row.status)}`}
                        value={row.status || 'ABERTA'} onChange={(e) => onChange(row.id, 'status', e.target.value)}>
                        <option value="ABERTA">ABERTA</option>
                        <option value="CONCLUIDA">CONCLUIDA</option>
                        <option value="NAO_APLICA">NAO APLICA</option>
                    </select>
                </div>
            </td>
            <td className="p-2 text-center align-middle">
                <div className="flex justify-center items-center gap-2 h-full opacity-60 group-hover:opacity-100 transition-opacity">
                    {estaEditado ? (
                        <button onClick={() => onSave(row)} className="text-white bg-green-500 hover:bg-green-600 p-2 rounded-lg shadow-sm animate-pulse transition-all hover:scale-105" title="Salvar alterações desta linha">
                            <CheckCircleIcon className="w-5 h-5" />
                        </button>
                    ) : (
                        <button onClick={() => onDelete(row)} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all hover:scale-105" title="Excluir registro">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
}, (prev, next) => prev.row === next.row && prev.estaEditado === next.estaEditado);


const GestaoReavaliacao = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('gerar');
    const [accessMode, setAccessMode] = useState('full');
    const [allowedPatientIds, setAllowedPatientIds] = useState(new Set());
    const [dataManual, setDataManual] = useState('');

    useEffect(() => {
        const gestaoOnly = Boolean(location.state?.gestaoOnly);
        const ids = Array.isArray(location.state?.allowedPatientIds) ? location.state.allowedPatientIds : [];
        if (gestaoOnly) {
            setAccessMode('gestao');
            setAllowedPatientIds(new Set(ids.map((id) => Number(id))));
            setActiveTab('gerar');
        } else {
            setAccessMode('full');
            setAllowedPatientIds(new Set());
        }
    }, [location.state]);

    const canSeeTab = useCallback((tabKey) => {
        if (accessMode === 'gestao') return tabKey === 'gerar';
        const profissionalId = Number(user?.profissionalId);
        if (!profissionalId) return false;
        if (IDS_PERMITIDOS.includes(profissionalId)) return true;
        if (tabKey === 'gerar') return PERMITIDOS_GERADOR.includes(profissionalId);
        if (tabKey === 'admin') return PERMITIDOS_ADMIN.includes(profissionalId);
        if (tabKey === 'metodo') return PERMITIDOS_METODO.includes(profissionalId);
        if (tabKey === 'navegador') return PERMITIDOS_NAVEGADOR.includes(profissionalId);
        return false;
    }, [accessMode, user]);

    useEffect(() => {
        const ordemTabs = ['gerar', 'admin', 'metodo', 'navegador'];
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
                        accessMode={accessMode}
                        onBack={() => navigate('/forms-terapeuta/tela-inicial')}
                    />

                    {activeTab === 'gerar' && (
                        <GerarTab
                            accessMode={accessMode}
                            allowedPatientIds={allowedPatientIds}
                            dataManual={dataManual}
                            setDataManual={setDataManual}
                        />
                    )}

                    {activeTab === 'admin' && (
                        <AdminTab accessMode={accessMode} allowedPatientIds={allowedPatientIds} />
                    )}

                    {activeTab === 'metodo' && <MetodoTab dataManual={dataManual} />}

                    {activeTab === 'navegador' && <NavegadorTab />}
                </div>
            </div>
        </div>
    );
};

export default GestaoReavaliacao;