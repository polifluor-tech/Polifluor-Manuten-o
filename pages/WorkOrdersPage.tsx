import React, { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { useDataContext } from '../contexts/DataContext';
import { useAppContext } from '../contexts/AppContext';
import { MaintenanceStatus, MaintenanceType, WorkOrder } from '../types';
import { 
    PlusIcon, ExclamationTriangleIcon, WrenchIcon, ClipboardListIcon, 
    ArrowRightIcon, SearchIcon, TargetIcon
} from '../components/icons';
import { MAINTENANCE_TYPE_CONFIG } from '../constants';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useDebounce } from '../hooks/useDebounce';

type SortOption = 'date_asc' | 'date_desc' | 'id_asc' | 'id_desc';

export const WorkOrdersPage: React.FC = () => {
    const { workOrders, equipmentData, handleWorkOrderDelete, showToast } = useDataContext();
    const { setIsOSModalOpen, setEditingOrder, userRole, requestAdminPassword } = useAppContext();
    
    // CONFIGURAÇÃO PADRÃO: ID CRESCENTE (0001, 0002...) - "COMEÇAR DO 01"
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('Pendentes'); 
    const [filterType, setFilterType] = useState<string>('Todos'); 
    const [sortBy, setSortBy] = useState<SortOption>('id_asc'); 
    const [deletingOrder, setDeletingOrder] = useState<WorkOrder | null>(null);

    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const equipmentMap = useMemo(() => new Map(equipmentData.map(eq => [eq.id, eq])), [equipmentData]);
    
    const stats = useMemo(() => {
        const total = workOrders.length;
        return { total };
    }, [workOrders]);

    const filteredAndSortedOrders = useMemo(() => {
        let result = workOrders;

        if (filterStatus === 'Pendentes') {
            result = result.filter(o => [MaintenanceStatus.Scheduled, MaintenanceStatus.InField, MaintenanceStatus.Delayed, MaintenanceStatus.WaitingParts].includes(o.status));
        } else if (filterStatus === 'Executadas') {
            result = result.filter(o => o.status === MaintenanceStatus.Executed);
        } else if (filterStatus === 'Atrasadas') {
            result = result.filter(o => o.status === MaintenanceStatus.Delayed);
        }

        if (filterType !== 'Todos') {
            result = result.filter(o => o.type === filterType);
        }

        if (debouncedSearchTerm) {
            const term = debouncedSearchTerm.toLowerCase();
            result = result.filter(order => {
                const eq = equipmentMap.get(order.equipmentId);
                return (
                    order.id.toLowerCase().includes(term) ||
                    order.equipmentId.toLowerCase().includes(term) ||
                    (eq?.name || '').toLowerCase().includes(term) ||
                    (order.description || '').toLowerCase().includes(term)
                );
            });
        }

        return result.sort((a, b) => {
            if (sortBy === 'date_asc') {
                return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
            } else if (sortBy === 'date_desc') {
                return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
            } else if (sortBy === 'id_asc') {
                return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
            } else if (sortBy === 'id_desc') {
                return b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' });
            }
            return 0;
        });
    }, [workOrders, filterStatus, filterType, debouncedSearchTerm, sortBy, equipmentMap]);

    const handleOpenOrder = (order: WorkOrder) => {
        setEditingOrder(order);
        setIsOSModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <Header 
                title="Gestão de Ordens de Serviço" 
                subtitle={`${stats.total} Ordens Registradas no Sistema`}
                actions={
                    <button 
                        onClick={() => { setEditingOrder(null); setIsOSModalOpen(true); }} 
                        className="px-6 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 text-xs uppercase tracking-widest"
                    >
                        <PlusIcon className="w-5 h-5"/> Nova O.S.
                    </button>
                }
            />

            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-slate-200 dark:border-gray-700 shadow-sm flex flex-col xl:flex-row gap-4 items-center sticky top-0 z-10">
                <div className="flex bg-slate-100 dark:bg-gray-700 p-1 rounded-xl w-full xl:w-auto overflow-x-auto">
                    {['Pendentes', 'Executadas', 'Atrasadas', 'Todos'].map(opt => (
                        <button
                            key={opt}
                            onClick={() => setFilterStatus(opt)}
                            className={`flex-1 xl:flex-none px-6 py-2 text-xs font-black uppercase rounded-lg transition-all whitespace-nowrap ${
                                filterStatus === opt 
                                ? 'bg-white dark:bg-gray-600 text-blue-600 shadow-sm ring-1 ring-black/5' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>

                <div className="h-8 w-px bg-slate-200 hidden xl:block"></div>

                <div className="relative w-full md:w-48">
                    <label className="absolute -top-2 left-3 bg-white dark:bg-gray-800 px-1 text-[9px] font-black text-slate-400 uppercase">Natureza</label>
                    <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full form-input h-11 font-bold text-xs bg-transparent border-slate-200 focus:border-blue-500 cursor-pointer uppercase"
                    >
                        <option value="Todos">Todas as Naturezas</option>
                        <option value={MaintenanceType.Preventive}>Preventiva</option>
                        <option value={MaintenanceType.Corrective}>Corretiva</option>
                        <option value={MaintenanceType.Predictive}>Preditiva</option>
                        <option value={MaintenanceType.Predial}>Predial</option>
                        <option value={MaintenanceType.Melhoria}>Melhoria</option>
                    </select>
                </div>

                <div className="relative w-full md:w-64">
                    <label className="absolute -top-2 left-3 bg-white dark:bg-gray-800 px-1 text-[9px] font-black text-slate-400 uppercase">Organizar Lista</label>
                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className="w-full form-input h-11 font-bold text-xs bg-transparent border-slate-200 focus:border-blue-500 cursor-pointer uppercase"
                    >
                        <option value="id_asc">🔢 Sequência: Crescente (Antigas)</option>
                        <option value="id_desc">🔢 Sequência: Decrescente (Novas)</option>
                        <option value="date_asc">📅 Data: Mais Próxima (Urgentes)</option>
                        <option value="date_desc">📅 Data: Mais Distante (Futuras)</option>
                    </select>
                </div>

                <div className="relative flex-1 w-full">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar O.S. (Número, Máquina, Descrição)..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 h-11 rounded-xl border-slate-200 form-input font-bold text-sm focus:border-blue-500"
                    />
                </div>
            </div>

            <div className="space-y-3">
                {filteredAndSortedOrders.length > 0 ? filteredAndSortedOrders.map(order => {
                    const eq = equipmentMap.get(order.equipmentId);
                    const config = MAINTENANCE_TYPE_CONFIG[order.type] || { color: 'bg-slate-500', textColor: 'text-white' };
                    const isDelayed = order.status === MaintenanceStatus.Delayed;
                    const dateObj = new Date(order.scheduledDate);
                    const isToday = new Date().toDateString() === dateObj.toDateString();

                    return (
                        <div 
                            key={order.id} 
                            onClick={() => handleOpenOrder(order)}
                            className={`group bg-white dark:bg-gray-800 p-4 rounded-2xl border-l-[6px] shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col md:flex-row items-center gap-4 relative overflow-hidden
                                ${isDelayed ? 'border-l-rose-500' : (order.status === 'Executado' ? 'border-l-emerald-500 opacity-80 hover:opacity-100' : 'border-l-blue-500')}
                            `}
                        >
                            {isDelayed && <div className="absolute top-0 right-0 p-1 bg-rose-100 rounded-bl-xl"><ExclamationTriangleIcon className="w-4 h-4 text-rose-500"/></div>}

                            <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[160px]">
                                <div className="flex flex-col items-center justify-center bg-slate-100 dark:bg-gray-700 w-16 h-16 rounded-2xl border border-slate-200 dark:border-gray-600">
                                    <span className="text-[10px] font-black text-slate-400 uppercase">OS</span>
                                    <span className="text-lg font-black text-slate-800 dark:text-white tracking-tighter">#{order.id}</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Programação</p>
                                    <p className={`text-base font-black ${isDelayed ? 'text-rose-600' : (isToday ? 'text-blue-600' : 'text-slate-700')}`}>
                                        {dateObj.toLocaleDateString('pt-BR')}
                                    </p>
                                    {isToday && <span className="inline-block mt-1 text-[8px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded uppercase tracking-wider">É Hoje!</span>}
                                </div>
                            </div>

                            <div className="w-px h-10 bg-slate-100 hidden md:block"></div>

                            <div className="flex-1 min-w-0 w-full">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide ${config.color} ${config.textColor}`}>
                                        {order.type}
                                    </span>
                                    <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase truncate flex items-center gap-2">
                                        {eq ? eq.name : order.equipmentId}
                                        {eq?.isCritical && <span title="Crítico"><TargetIcon className="w-3 h-3 text-orange-500" /></span>}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 font-medium truncate italic pr-4">
                                    "{order.description}"
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                                        <WrenchIcon className="w-3 h-3"/> {eq?.location || 'Local N/A'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border ${
                                    order.status === 'Executado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 
                                    order.status === 'Atrasado' ? 'bg-rose-50 border-rose-200 text-rose-700' : 
                                    'bg-white border-slate-200 text-slate-600'
                                }`}>
                                    {order.status}
                                </span>
                                
                                <div className="p-2 bg-slate-100 rounded-full text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                    <ArrowRightIcon className="w-4 h-4"/>
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="py-20 text-center bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-gray-700">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <ClipboardListIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-slate-400 uppercase">Tudo Limpo!</h3>
                        <p className="text-xs text-slate-400 mt-1">Nenhuma ordem encontrada com os filtros atuais.</p>
                    </div>
                )}
            </div>

            {deletingOrder && (
                <ConfirmationModal 
                    isOpen={!!deletingOrder}
                    onClose={() => setDeletingOrder(null)}
                    onConfirm={async () => {
                        if (!deletingOrder) return;
                        const success = await handleWorkOrderDelete(deletingOrder.id);
                        if (success) setDeletingOrder(null);
                    }}
                    title="Excluir Ordem de Serviço"
                    message={`Confirma exclusão da O.S. #${deletingOrder.id}?`}
                />
            )}
        </div>
    );
};
