
import React, { useMemo, useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { useDataContext } from '../contexts/DataContext';
import { useAdvancedMetrics, AdvancedReportData } from '../hooks/useAdvancedMetrics';
import { MONTHS } from '../constants';
import { useAppContext } from '../contexts/AppContext';
import { 
    TargetIcon, 
    ShieldCheckIcon, 
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ClockIcon,
    WrenchIcon,
    ChartIcon,
    ArrowRightIcon,
    InfoIcon
} from '../components/icons';
import { MaintenanceType, WorkOrder } from '../types';
import { TrendChart } from '../components/TrendChart';
import { ReliabilityInfoModal } from '../components/ReliabilityInfoModal';

type CriticidadeFilter = 'Criticos' | 'Nao-Criticos';

interface DashboardItem extends AdvancedReportData {
    recurrentFailure?: { category: string, count: number };
}

export const DashboardPage: React.FC = () => {
    const { workOrders, equipmentData, logActivity } = useDataContext();
    const { setCurrentPage } = useAppContext();
    const calculate = useAdvancedMetrics();

    const [selectedMonth, setSelectedMonth] = useState<number | 'Ano'>(new Date().getMonth());
    const [filterCrit, setFilterCrit] = useState<CriticidadeFilter>('Criticos');
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    const dashboardData: DashboardItem[] = useMemo(() => {
        const start = selectedMonth === 'Ano' ? '2026-01-01' : `2026-${(Number(selectedMonth) + 1).toString().padStart(2, '0')}-01`;
        const end = selectedMonth === 'Ano' ? '2026-12-31' : `2026-${(Number(selectedMonth) + 1).toString().padStart(2, '0')}-31`;
        
        const ids = equipmentData.map(e => e.id);
        const metrics = calculate(equipmentData, workOrders, ids, start, end, filterCrit);
        
        return metrics.map(metric => {
            const relevantFailures = workOrders.filter(wo => 
                wo.equipmentId === metric.equipmentId &&
                wo.type === MaintenanceType.Corrective &&
                wo.status === 'Executado' &&
                new Date(wo.scheduledDate) >= new Date(start) &&
                new Date(wo.scheduledDate) <= new Date(end) &&
                wo.correctiveCategory
            );

            const categoryCounts = relevantFailures.reduce((acc, wo) => {
                const category = wo.correctiveCategory!;
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const recurrent = Object.entries(categoryCounts).find(([_, count]) => (count as number) >= 3);

            return {
                ...metric,
                recurrentFailure: recurrent ? { category: recurrent[0], count: recurrent[1] as number } : undefined
            };
        });

    }, [equipmentData, workOrders, calculate, selectedMonth, filterCrit]);

    const globalKpis = useMemo(() => {
        if (dashboardData.length === 0) {
            return { mttr: 0, availability: 100, operationalAvailability: 100, failures: 0 };
        }

        const totalGrossHours = dashboardData.reduce((sum, item) => sum + item.totalGrossHours, 0);
        const totalCorrectiveHours = dashboardData.reduce((sum, item) => sum + item.totalCorrectiveHours, 0);
        const totalDowntimeHours = dashboardData.reduce((sum, item) => sum + item.totalDowntimeHours, 0);
        const totalFailures = dashboardData.reduce((sum, item) => sum + item.totalFailures, 0);

        const mttr = totalFailures > 0 ? totalCorrectiveHours / totalFailures : 0;
        
        const inherentUptime = Math.max(0, totalGrossHours - totalCorrectiveHours);
        const availability = totalGrossHours > 0 ? (inherentUptime / totalGrossHours) * 100 : 100;

        const operationalUptime = Math.max(0, totalGrossHours - totalDowntimeHours);
        const operationalAvailability = totalGrossHours > 0 ? (operationalUptime / totalGrossHours) * 100 : 100;
        
        return {
            mttr,
            availability,
            operationalAvailability,
            failures: totalFailures,
        };
    }, [dashboardData]);

    const trendData = useMemo(() => {
        return MONTHS.map((monthName, idx) => {
            let totalGross = 0;
            let totalCorrective = 0;
            dashboardData.forEach(item => {
                const monthMetric = item.monthlyHistory.find(m => m.monthIndex === idx);
                if (monthMetric) {
                    const firstDayOfMonth = new Date(new Date().getFullYear(), idx, 1);
                    const lastDayOfMonth = new Date(new Date().getFullYear(), idx + 1, 0);
                    // This part needs adjustment if we want per-machine hours. For now, let's assume a global MTBF avg.
                }
            });
            
            const monthData = dashboardData.flatMap(d => d.monthlyHistory.filter(h => h.monthIndex === idx));
            const validMtbf = monthData.filter(m => m.mtbf != null).map(m => m.mtbf as number);
            const avgMtbf = validMtbf.length > 0 ? validMtbf.reduce((a, b) => a + b, 0) / validMtbf.length : 0;

            return { label: monthName.substring(0, 3), value: Math.round(avgMtbf) };
        });
    }, [dashboardData]);


    const handleInspectOS = (id: string) => {
        setCurrentPage('work_orders');
    };

    useEffect(() => {
        logActivity({
            action_type: 'VIEW',
            description: `Dashboard filtrado: Mês ${selectedMonth}, Categoria: ${filterCrit}`
        });
    }, [selectedMonth, filterCrit, logActivity]);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <Header 
                title="Termômetro de Confiabilidade" 
                subtitle="Monitoramento tático de ativos. Janela produtiva Seg-Sex (10h/dia)."
                actions={
                    <button onClick={() => setIsInfoModalOpen(true)} className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors">
                        <InfoIcon className="w-4 h-4" />
                        O que são estes KPIs?
                    </button>
                }
            />

            <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 flex flex-wrap items-center gap-2">
                <div className="flex bg-slate-100 dark:bg-gray-900 p-1 rounded-xl">
                    {(['Criticos', 'Nao-Criticos'] as CriticidadeFilter[]).map(f => (
                        <button key={f} onClick={() => setFilterCrit(f)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterCrit === f ? 'bg-white dark:bg-gray-700 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            {f === 'Criticos' ? 'Classe A (Críticos)' : 'Classe B/C'}
                        </button>
                    ))}
                </div>
                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
                <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar pb-1 md:pb-0">
                    <button onClick={() => setSelectedMonth('Ano')} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${selectedMonth === 'Ano' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-gray-900 text-slate-400'}`}>Ano 2026</button>
                    {MONTHS.map((m, idx) => <button key={m} onClick={() => setSelectedMonth(idx)} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${selectedMonth === idx ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-gray-900 text-slate-400 hover:bg-slate-100'}`}>{m.substring(0, 3)}</button>)}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div title="Mede a performance real. Considera TODAS as paradas (Corretiva, Preventiva, Melhoria, etc)." className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disponibilidade Operacional</p><div className="flex items-end gap-2"><span className={`text-3xl font-black ${globalKpis.operationalAvailability >= 99 ? 'text-emerald-600' : 'text-amber-500'}`}>{globalKpis.operationalAvailability.toFixed(2)}%</span><ShieldCheckIcon className="w-5 h-5 text-emerald-500 mb-1" /></div></div>
                    <div title="Mede a confiabilidade. Considera apenas paradas por falhas (Corretiva)." className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Disponibilidade Inerente</p><div className="flex items-end gap-2"><span className={`text-3xl font-black ${globalKpis.availability >= 99 ? 'text-emerald-600' : 'text-amber-500'}`}>{globalKpis.availability.toFixed(2)}%</span></div></div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">MTTR (Médio)</p><div className="flex items-end gap-2"><span className={`text-3xl font-black ${globalKpis.mttr > 1 ? 'text-rose-600' : 'text-emerald-600'}`}>{globalKpis.mttr.toFixed(1)}h</span></div></div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-slate-100 shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total de Falhas</p><div className="flex items-end gap-2"><span className="text-3xl font-black text-slate-800 dark:text-white">{globalKpis.failures}</span><WrenchIcon className="w-5 h-5 text-blue-500 mb-1" /></div></div>
                </div>

                <div className="lg:col-span-1 h-full">
                    <TrendChart 
                        data={trendData} 
                        title="Evolução de Confiabilidade (MTBF Médio)" 
                        color="#3b82f6"
                        targetValue={100}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {dashboardData.map(item => {
                    const isMttrBad = item.mttr > 1.0;
                    return (
                        <div key={item.equipmentId} onClick={() => handleInspectOS(item.equipmentId)} className={`group relative overflow-hidden bg-white dark:bg-gray-800 p-5 rounded-[2rem] border-2 transition-all hover:shadow-xl cursor-pointer ${item.recurrentFailure ? 'border-rose-500 bg-rose-50/20' : (item.isCritical ? 'border-orange-100 bg-orange-50/5' : 'border-slate-50')}`}>
                            {(isMttrBad || item.recurrentFailure) && <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-bl-[3rem] flex items-start justify-end p-3"><ExclamationTriangleIcon className="w-5 h-5 text-rose-500 animate-pulse" /></div>}
                            <div className="flex items-center gap-3 mb-4">
                                <div className={`p-3 rounded-2xl ${item.isCritical ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-500'}`}>{item.isCritical ? <TargetIcon className="w-5 h-5" /> : <ChartIcon className="w-5 h-5" />}</div>
                                <div><h4 className="font-black text-slate-800 dark:text-white uppercase text-sm tracking-tight">{item.equipmentId}</h4><p className="text-[9px] font-bold text-slate-400 uppercase truncate max-w-[120px]">{item.equipmentName}</p></div>
                            </div>
                            {item.recurrentFailure && (
                                <div className="mb-4 p-2 bg-rose-100 rounded-lg text-center">
                                    <p className="text-[9px] font-black text-rose-700 uppercase">Falha Recorrente</p>
                                    <p className="text-[8px] font-bold text-rose-600">{item.recurrentFailure.category} ({item.recurrentFailure.count}x)</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">MTTR (Meta 1h)</p><p className={`text-xl font-black ${isMttrBad ? 'text-rose-600' : 'text-emerald-600'}`}>{item.mttr.toFixed(1)}h</p></div>
                                <div className="space-y-1"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Disp. Inerente</p><p className="text-xl font-black text-slate-800 dark:text-white">{item.availability.toFixed(1)}%</p></div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-50 dark:border-gray-700 flex justify-between items-center">
                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${isMttrBad || item.recurrentFailure ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{isMttrBad || item.recurrentFailure ? 'Status: Crítico' : 'Status: Conforme'}</span>
                                <div className="flex items-center gap-1 text-[8px] font-black text-blue-600 uppercase opacity-0 group-hover:opacity-100 transition-opacity">Ver O.S. <ArrowRightIcon className="w-2 h-2" /></div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {dashboardData.length === 0 && (
                <div className="py-32 text-center bg-white dark:bg-gray-800 rounded-[3rem] border-2 border-dashed border-slate-100">
                    <ChartIcon className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-xl font-black text-slate-400 uppercase">Sem dados no filtro</h3>
                </div>
            )}

            {isInfoModalOpen && <ReliabilityInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />}
        </div>
    );
};