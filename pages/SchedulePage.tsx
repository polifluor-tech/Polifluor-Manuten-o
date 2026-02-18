
import React, { useState, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useAppContext } from '../contexts/AppContext';
import { MONTHS, MAINTENANCE_TYPE_CONFIG } from '../constants';
import { 
    ChevronLeftIcon, ChevronRightIcon, DownloadIcon, CloseIcon, SearchIcon, TargetIcon,
} from '../components/icons';
import { WorkOrder, Equipment, MaintenanceStatus } from '../types';
import { Legend } from '../components/Legend';
import { generateScheduleReport } from '../reports/reportGenerator';
import { useDebounce } from '../hooks/useDebounce';
import { ScheduleCell } from '../components/ScheduleCell';

interface MonthOrdersModalProps {
    isOpen: boolean;
    onClose: () => void;
    orders: WorkOrder[];
    equipmentName: string;
    monthName: string;
}

const MonthOrdersModal: React.FC<MonthOrdersModalProps> = ({ isOpen, onClose, orders, equipmentName, monthName }) => {
    const { setIsOSModalOpen, setEditingOrder } = useAppContext();
    if (!isOpen) return null;

    const handleOpenOrder = (order: WorkOrder) => {
        setEditingOrder(order);
        setIsOSModalOpen(true);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{equipmentName}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase">Manutenções em {monthName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><CloseIcon className="w-5 h-5" /></button>
                    </div>
                </div>
                <div className="space-y-2 p-6 max-h-80 overflow-y-auto custom-scrollbar">
                    {orders.map(order => (
                        <div key={order.id} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-sm text-slate-700">#{order.id} - <span className="font-medium">{order.type}</span></p>
                                <p className="text-xs text-slate-500 italic truncate max-w-sm">"{order.description}"</p>
                            </div>
                            <button onClick={() => handleOpenOrder(order)} className="text-xs font-black text-blue-600 hover:underline uppercase opacity-0 group-hover:opacity-100 transition-opacity">Detalhes</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};


export const SchedulePage: React.FC = () => {
    const { workOrders, equipmentData, equipmentTypes } = useDataContext();
    const [viewYear, setViewYear] = useState(2026);
    const [filterEqType, setFilterEqType] = useState<string>('all');
    const [filterCritical, setFilterCritical] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean, orders: WorkOrder[], equipmentName: string, monthName: string }>({ isOpen: false, orders: [], equipmentName: '', monthName: '' });

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredAndScheduledData = useMemo(() => {
        const filteredEquipment = equipmentData
            .filter(eq => (filterEqType === 'all' || eq.typeId === filterEqType))
            .filter(eq => !filterCritical || eq.isCritical)
            .filter(eq => (eq.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) || eq.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase())));

        const relevantOrders = workOrders.filter(order =>
            new Date(order.scheduledDate).getFullYear() === viewYear
        );

        return filteredEquipment.map(eq => {
            const monthlyTasks: WorkOrder[][] = Array.from({ length: 12 }, () => []);
            
            relevantOrders.forEach(order => {
                if (order.equipmentId === eq.id) {
                    const monthIndex = new Date(order.scheduledDate).getMonth();
                    monthlyTasks[monthIndex].push(order);
                }
            });

            return { equipment: eq, monthlyTasks };
        });
    }, [equipmentData, workOrders, viewYear, filterEqType, filterCritical, debouncedSearchTerm]);

    const handleExportPdf = () => {
        const reportData = filteredAndScheduledData.map(item => ({
            equipment: item.equipment,
            monthlyTasks: item.monthlyTasks,
        }));
        generateScheduleReport(reportData, viewYear);
    };

    return (
        <div className="flex flex-col h-full space-y-4 animate-fade-in">
            {/* Toolbar Estruturado */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 flex flex-col gap-4">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <h1 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Cronograma Mestre</h1>
                    
                    <div className="flex items-center gap-3">
                        <button onClick={handleExportPdf} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm text-xs uppercase tracking-widest">
                            <DownloadIcon className="w-4 h-4"/> Exportar PDF
                        </button>

                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-gray-900 p-1 rounded-xl">
                            <button onClick={() => setViewYear(y => y - 1)} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700"><ChevronLeftIcon className="w-5 h-5 text-slate-500"/></button>
                            <span className="font-black text-lg text-slate-800 dark:text-white w-24 text-center">{viewYear}</span>
                            <button onClick={() => setViewYear(y => y + 1)} className="p-2 rounded-lg hover:bg-white dark:hover:bg-gray-700"><ChevronRightIcon className="w-5 h-5 text-slate-500"/></button>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative md:col-span-1">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"/>
                        <input type="text" placeholder="Buscar por ativo..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full form-input pl-12 h-11 bg-slate-50 dark:bg-gray-900 border-none rounded-xl"/>
                    </div>
                    <select value={filterEqType} onChange={e => setFilterEqType(e.target.value)} className="form-input font-bold text-sm h-11 bg-slate-50 dark:bg-gray-900 border-none rounded-xl">
                        <option value="all">Todas as Famílias</option>
                        {equipmentTypes.map(type => <option key={type.id} value={type.id}>{type.description}</option>)}
                    </select>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-900 p-1 rounded-xl">
                        <button onClick={() => setFilterCritical(false)} className={`flex-1 h-full text-center px-4 py-2 text-xs font-black uppercase rounded-lg ${!filterCritical ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-slate-400'}`}>Todos</button>
                        <button onClick={() => setFilterCritical(true)} className={`flex-1 h-full text-center px-4 py-2 text-xs font-black uppercase rounded-lg flex items-center justify-center gap-1 ${filterCritical ? 'bg-white dark:bg-gray-700 text-orange-600 shadow-sm' : 'text-slate-400'}`}><TargetIcon className="w-3 h-3"/> Críticos</button>
                    </div>
                </div>
                 <div className="pt-4 border-t border-slate-100 dark:border-gray-700">
                    <Legend />
                 </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-slate-100 dark:border-gray-700 overflow-auto custom-scrollbar">
                <div className="min-w-[1200px]">
                    <div className="grid grid-cols-[300px_repeat(12,_1fr)] sticky top-0 bg-slate-900 z-10">
                        <div className="p-4 border-b border-r border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest sticky left-0 bg-slate-900">Máquina \ Mês</div>
                        {MONTHS.map(month => (
                            <div key={month} className="p-4 text-center border-b border-r border-slate-800 text-[10px] font-black text-slate-400 uppercase">{month.substring(0, 3)}</div>
                        ))}
                    </div>
                    {filteredAndScheduledData.map(({ equipment, monthlyTasks }) => (
                        <div key={equipment.id} className="grid grid-cols-[300px_repeat(12,_1fr)] group hover:bg-slate-50/50 dark:hover:bg-blue-900/10 border-b border-slate-100 dark:border-gray-800">
                            <div className="p-4 truncate sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-slate-50/50 dark:group-hover:bg-blue-900/10 border-r border-slate-100 dark:border-gray-800">
                                <p className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    {equipment.isCritical && (
                                        <span title="Ativo Crítico" className="flex-shrink-0 flex">
                                            <TargetIcon className="w-4 h-4 text-orange-500"/>
                                        </span>
                                    )}
                                    {equipment.name}
                                </p>
                                <p className="text-xs text-slate-400 font-mono">{equipment.id}</p>
                            </div>
                            {monthlyTasks.map((orders, monthIndex) => (
                               <div key={monthIndex} className="border-r border-slate-100 dark:border-gray-800 flex items-center justify-center p-1">
                                    <ScheduleCell 
                                        orders={orders}
                                        onClick={() => orders.length > 0 && setModalInfo({ isOpen: true, orders, equipmentName: equipment.name, monthName: MONTHS[monthIndex] })}
                                    />
                                </div>
                            ))}
                        </div>
                    ))}
                     {filteredAndScheduledData.length === 0 && (
                        <div className="p-20 text-center text-slate-400 font-bold">Nenhum equipamento encontrado com os filtros aplicados.</div>
                     )}
                </div>
            </div>

            {modalInfo.isOpen && <MonthOrdersModal {...modalInfo} onClose={() => setModalInfo(prev => ({ ...prev, isOpen: false }))} />}
        </div>
    );
};
