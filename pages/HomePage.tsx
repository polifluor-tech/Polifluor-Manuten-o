


import React, { useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { useDataContext } from '../contexts/DataContext';
import { MaintenanceStatus, MaintenanceType, WorkOrder } from '../types';
import { ClipboardListIcon, ScheduleIcon, ChartIcon, ShieldCheckIcon, ExclamationTriangleIcon, PlusIcon, WrenchIcon, CheckCircleIcon, ClockIcon } from '../components/icons';

const PolifluorLogo = () => (
    <div className="bg-[#D32F2F] text-white px-4 py-2 skew-x-[-10deg] rounded-sm shadow-md inline-block">
        <span className="font-black italic text-2xl tracking-tighter skew-x-[10deg] block">POLIFLUOR</span>
    </div>
);

// Função auxiliar para normalizar strings (ignorar acentos e case)
// Ex: "Sérgio" == "Sergio"
const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

// --- DASHBOARD DO MANUTENCISTA (DARCI / SERGIO) ---
const MaintainerDashboard: React.FC = () => {
    const { currentUser, setEditingOrder, setIsOSModalOpen } = useAppContext();
    const { workOrders, equipmentData } = useDataContext();

    // Filtra tarefas pendentes para o mês atual
    const myPendingTasks = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        return workOrders.filter(o => 
            // Tarefas programadas, atrasadas ou em campo
            (o.status === MaintenanceStatus.Scheduled || o.status === MaintenanceStatus.Delayed || o.status === MaintenanceStatus.InField) &&
            // Preventivas ou Preditivas
            (o.type === MaintenanceType.Preventive || o.type === MaintenanceType.Predictive) &&
            // Data de agendamento neste mês/ano ou atrasada do passado
            new Date(o.scheduledDate) <= new Date(currentYear, currentMonth + 1, 0)
        ).sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
    }, [workOrders]);

    // Estatísticas Pessoais do Mês
    const myStats = useMemo(() => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const userName = currentUser?.name || ''; 
        const normalizedUserName = normalize(userName);

        if (!userName) return { completedCount: 0, hoursWorked: 0 };

        // O.S. Executadas por este usuário neste mês
        const completedByMe = workOrders.filter(o => 
            o.status === MaintenanceStatus.Executed &&
            new Date(o.endDate || '') >= startOfMonth &&
            (o.manHours || []).some(mh => mh.maintainer && normalize(mh.maintainer).includes(normalizedUserName))
        );

        const totalHours = completedByMe.reduce((acc, o) => {
            const myEntry = (o.manHours || []).find(mh => mh.maintainer && normalize(mh.maintainer).includes(normalizedUserName));
            return acc + (myEntry ? (myEntry.hours || 0) : 0);
        }, 0);

        return {
            completedCount: completedByMe.length,
            hoursWorked: totalHours
        };
    }, [workOrders, currentUser]);

    const handleOpenOrder = (order: any) => {
        setEditingOrder(order);
        setIsOSModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 animate-fade-in">
            <header className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
                <div>
                    <PolifluorLogo />
                    <h1 className="text-2xl font-black text-slate-800 mt-4 uppercase tracking-tighter">Painel do Manutencista</h1>
                    <p className="text-sm font-bold text-slate-500 mt-1">Bem-vindo, <span className="text-blue-600">{currentUser?.name}</span></p>
                </div>
                <div className="flex gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O.S. Concluídas (Mês)</p>
                        <p className="text-2xl font-black text-emerald-600">{myStats.completedCount}</p>
                    </div>
                    <div className="text-right pl-4 border-l border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horas Apontadas</p>
                        <p className="text-2xl font-black text-blue-600">{myStats.hoursWorked.toFixed(1)}h</p>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna 1: Pendências Prioritárias */}
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-lg font-black text-slate-700 uppercase flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-orange-500" /> Preventivas Pendentes
                    </h3>
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {myPendingTasks.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircleIcon className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">Tudo em dia! Nenhuma preventiva pendente.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {myPendingTasks.map(task => {
                                    const equip = equipmentData.find(e => e.id === task.equipmentId);
                                    const isDelayed = task.status === MaintenanceStatus.Delayed;
                                    return (
                                        <div key={task.id} onClick={() => handleOpenOrder(task)} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center gap-4 group">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isDelayed ? 'bg-rose-100 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <span className="text-[10px] font-black uppercase">OS</span>
                                                <span className="sr-only">{task.id}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <h4 className="text-sm font-black text-slate-800 uppercase truncate">{equip?.name || task.equipmentId}</h4>
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${isDelayed ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>{task.status}</span>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate">{task.description}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{equip?.location}</p>
                                            </div>
                                            <button className="opacity-0 group-hover:opacity-100 p-2 bg-blue-600 text-white rounded-lg text-xs font-bold uppercase transition-all">
                                                Executar
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Coluna 2: Últimas Criadas / Ações */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-700 uppercase flex items-center gap-2">
                        <WrenchIcon className="w-5 h-5 text-blue-500" /> Ações Rápidas
                    </h3>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <p className="text-xs text-slate-500 mb-4">Precisa registrar uma quebra ou falha inesperada?</p>
                        <button 
                            // Simula o clique no botão do header (solução provisória, ideal seria via context)
                            onClick={() => document.querySelector<HTMLButtonElement>("header button:has(svg)")?.click()}
                            className="w-full py-4 bg-rose-600 text-white font-black rounded-xl uppercase text-xs shadow-lg hover:bg-rose-700 transition-all flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-4 h-4" /> Abrir Corretiva
                        </button>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h4 className="font-black text-xs text-slate-400 uppercase mb-4 tracking-widest">Resumo do Mês</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Preventivas:</span>
                                <span className="font-bold text-slate-800">{myStats.completedCount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-600">Horas Totais:</span>
                                <span className="font-bold text-slate-800">{myStats.hoursWorked.toFixed(1)}h</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CriticalAlerts: React.FC<{ criticalOrders: WorkOrder[], onOpenOrder: (order: WorkOrder) => void }> = ({ criticalOrders, onOpenOrder }) => {
    const { equipmentData } = useDataContext();

    if (criticalOrders.length === 0) {
        return null;
    }

    return (
        <div className="mt-12">
            <h2 className="font-black text-rose-600 uppercase tracking-tight text-lg mb-4">Alertas Críticos (Máquina Parada)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalOrders.map(order => {
                    const equipment = equipmentData.find(e => e.id === order.equipmentId);
                    
                    let displayName = equipment?.name || order.equipmentId;
                    const displayDescription = `OS #${order.id}`;

                    // Lógica para extrair o nome do ativo predial da descrição
                    if (order.equipmentId === 'ATIVO_PREDIAL_GENERICO' && order.description) {
                        const match = order.description.match(/\[Ativo: (.*?)\]/);
                        if (match && match[1]) {
                            displayName = match[1]; // Ex: "SPEED DOME"
                        }
                    }

                    return (
                        <div key={order.id} onClick={() => onOpenOrder(order)} className="bg-rose-50 p-5 rounded-2xl border-2 border-rose-200 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4">
                            <div className="p-3 bg-rose-600 text-white rounded-full animate-pulse">
                                <ExclamationTriangleIcon className="w-6 h-6"/>
                            </div>
                            <div>
                                <p className="font-black text-rose-800 uppercase">{displayName}</p>
                                <p className="text-xs text-rose-600 font-bold">{displayDescription}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// --- HOME PAGE PRINCIPAL (ADMIN/GESTOR) ---
export const HomePage: React.FC = () => {
    const { setCurrentPage, userRole, setEditingOrder, setIsOSModalOpen } = useAppContext();
    const { workOrders } = useDataContext();

    // Se for manutencista, mostra o painel específico
    if (userRole === 'manutencista') {
        return <MaintainerDashboard />;
    }

    // Lógica original para Admin/Gestor
    const stats = useMemo(() => {
        const delayed = workOrders.filter(o => o.status === MaintenanceStatus.Delayed).length;
        const pending = workOrders.filter(o => o.status === MaintenanceStatus.Scheduled).length;
        const critical = workOrders.filter(o => o.machineStopped && o.status !== MaintenanceStatus.Executed);
        return { delayed, pending, critical };
    }, [workOrders]);

    const handleOpenCriticalOrder = (order: WorkOrder) => {
        setEditingOrder(order);
        setIsOSModalOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto p-8 animate-fade-in">
            <header className="mb-12 border-b border-slate-200 pb-8">
                <PolifluorLogo />
                <h1 className="text-4xl font-black text-slate-800 mt-6 uppercase tracking-tighter">Gestão de Manutenção Inteligente</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-2">Conformidade IATF 16949 • Planta Industrial</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div onClick={() => setCurrentPage('work_orders')} className="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-[#D32F2F] hover:shadow-xl transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                        <ClipboardListIcon className="w-10 h-10 text-slate-300" />
                        <span className="text-3xl font-black text-slate-800">{stats.pending}</span>
                    </div>
                    <h3 className="font-black uppercase text-sm mt-4">Ordens Ativas</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Fila de Execução</p>
                </div>

                <div onClick={() => setCurrentPage('work_orders')} className="bg-rose-50 p-6 rounded-2xl shadow-sm border-t-4 border-rose-600 hover:shadow-xl transition-all cursor-pointer">
                    <div className="flex justify-between items-start">
                        <ExclamationTriangleIcon className="w-10 h-10 text-rose-300" />
                        <span className="text-3xl font-black text-rose-600">{stats.delayed}</span>
                    </div>
                    <h3 className="font-black uppercase text-sm mt-4 text-rose-800">Atrasos Críticos</h3>
                    <p className="text-[10px] text-rose-400 font-bold uppercase">Risco de Parada</p>
                </div>

                <div onClick={() => setCurrentPage('quality')} className="bg-slate-900 p-6 rounded-2xl shadow-sm border-t-4 border-emerald-500 hover:shadow-xl transition-all cursor-pointer text-white">
                    <ShieldCheckIcon className="w-10 h-10 text-emerald-500" />
                    <h3 className="font-black uppercase text-sm mt-4">Auditoria IATF</h3>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">Requisitos 8.5.1.5</p>
                </div>
            </div>
            
            <CriticalAlerts criticalOrders={stats.critical} onOpenOrder={handleOpenCriticalOrder} />
        </div>
    );
};