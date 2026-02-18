
import React, { useState, useEffect, useMemo } from 'react';
import { useDataContext } from '../contexts/DataContext';
import { useAdvancedMetrics } from '../hooks/useAdvancedMetrics';
import { 
    DownloadIcon, 
    ChartIcon, 
    WrenchIcon, 
    PackageIcon, 
    ClipboardListIcon,
    TargetIcon,
    ExclamationTriangleIcon,
    DocumentTextIcon
} from '../components/icons';
import { 
    generateKpiReport,
    generateMaterialsReport,
    generateInventoryReport,
    generateOsVolumeReport,
    generateChecklistReport,
    generateEquipmentListReport,
    generateEquipmentTypesReport,
    generateExecutiveSummaryReport
} from '../reports/reportGenerator';
import { MONTHS } from '../constants';

interface ReportCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    isLoading: boolean;
}

const ReportCard: React.FC<ReportCardProps> = ({ icon, title, description, onClick, isLoading }) => (
    <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-gray-700/50 flex flex-col justify-between transition-all hover:shadow-xl hover:-translate-y-1 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-60">
        <div>
            <div className="flex items-start gap-4">
                <div className="bg-slate-100 dark:bg-gray-900/50 text-slate-700 dark:text-slate-300 p-3 rounded-xl border border-slate-200 dark:border-gray-700">{icon}</div>
                <div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{description}</p>
                </div>
            </div>
        </div>
        <div className="mt-6 text-center">
            <button 
                onClick={onClick}
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 shadow-lg hover:shadow-xl disabled:shadow-md"
            >
                {isLoading ? 'Gerando...' : 'Gerar PDF'}
            </button>
        </div>
    </div>
);

export const ReportsPage: React.FC = () => {
    const { equipmentData, workOrders, inventoryData, equipmentTypes } = useDataContext();
    const calculateMetrics = useAdvancedMetrics();
    const [isLoading, setIsLoading] = useState<string | null>(null);
    
    // Estado do filtro (Default: Ano)
    const [selectedPeriod, setSelectedPeriod] = useState<'Ano' | number>('Ano');
    
    // O dateRange é calculado via useMemo para garantir reatividade imediata
    const dateRange = useMemo(() => {
        const year = 2026;
        if (selectedPeriod === 'Ano') {
            return { start: `${year}-01-01`, end: `${year}-12-31` };
        } else {
            const month = selectedPeriod; // 0-indexed (0 = Jan)
            const startDate = new Date(year, month, 1);
            const endDate = new Date(year, month + 1, 0); // Último dia do mês

            const formatDate = (d: Date) => {
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };
            
            return {
                start: formatDate(startDate),
                end: formatDate(endDate)
            };
        }
    }, [selectedPeriod]);

    const handleGenerateReport = async (reportId: string, generator: () => void) => {
        setIsLoading(reportId);
        // Pequeno delay para permitir que a UI atualize (spinner)
        await new Promise(resolve => setTimeout(resolve, 50)); 
        try {
            generator();
        } catch (error) {
            console.error(`Falha ao gerar o relatório ${reportId}:`, error);
            alert(`Ocorreu um erro ao gerar o relatório: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setIsLoading(null);
        }
    };
    
    const reports = [
        { id: 'resumo_executivo', icon: <DocumentTextIcon className="w-6 h-6"/>, title: "Resumo Executivo", description: "Um compilado de uma página com os principais indicadores de gestão.", action: () => {
            generateExecutiveSummaryReport({ equipmentData, workOrders, inventoryData, dateRange });
        }},
        { id: 'kpi_criticos', icon: <TargetIcon className="w-6 h-6"/>, title: "KPIs: Ativos Críticos", description: "MTBF, MTTR e Disponibilidade para equipamentos Classe A.", action: () => {
            // Passa explicitamente o range calculado
            const data = calculateMetrics(equipmentData, workOrders, equipmentData.map(e=>e.id), dateRange.start, dateRange.end, 'Criticos');
            generateKpiReport('KPIs de Ativos Críticos', data, dateRange);
        }},
        { id: 'kpi_nao_criticos', icon: <WrenchIcon className="w-6 h-6"/>, title: "KPIs: Ativos Não-Críticos", description: "Métricas de performance para equipamentos de Classes B e C.", action: () => {
            const data = calculateMetrics(equipmentData, workOrders, equipmentData.map(e=>e.id), dateRange.start, dateRange.end, 'Nao-Criticos');
            generateKpiReport('KPIs de Ativos Não-Críticos', data, dateRange);
        }},
        { id: 'os_materiais', icon: <PackageIcon className="w-6 h-6"/>, title: "Itens por O.S.", description: "Detalhamento de peças e quantidades vinculados a cada O.S.", action: () => generateMaterialsReport(workOrders, inventoryData, dateRange) },
        { id: 'estoque_atual', icon: <PackageIcon className="w-6 h-6"/>, title: "Estoque Atual", description: "Relatório de itens contabilizados no inventário (FO-044).", action: () => generateInventoryReport(inventoryData, dateRange) },
        { id: 'os_volume', icon: <ClipboardListIcon className="w-6 h-6"/>, title: "Volume de O.S.", description: "Quantitativo de ordens abertas vs. fechadas no período.", action: () => generateOsVolumeReport(workOrders, dateRange) },
        { id: 'os_checklists', icon: <ClipboardListIcon className="w-6 h-6"/>, title: "Checklists de O.S.", description: "Relatório detalhado das tarefas e conferências de cada O.S.", action: () => generateChecklistReport(workOrders, dateRange) },
        { id: 'lista_ativos', icon: <PackageIcon className="w-6 h-6"/>, title: "Cadastro de Ativos", description: "Lista completa de todos os equipamentos cadastrados no sistema.", action: () => generateEquipmentListReport(equipmentData, dateRange) },
        { id: 'tipos_ativos', icon: <PackageIcon className="w-6 h-6"/>, title: "Ativos por Tipo", description: "Agrupamento de equipamentos por categoria (família).", action: () => generateEquipmentTypesReport(equipmentData, equipmentTypes, dateRange) },
    ];


    return (
        <div className="space-y-6">
            <div className="mb-8 pb-4 border-b-2 border-slate-200 dark:border-gray-700 relative">
                <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    Central Estratégica de Relatórios <span className="text-[#D32F2F]">POLIFLUOR</span>
                </h1>
                <div className="absolute bottom-[-2px] left-0 h-1 w-32 bg-gradient-to-r from-[#D32F2F] to-blue-900"></div>
            </div>
            
            {/* NOVO FILTRO ESTILIZADO E CORRIGIDO */}
            <div className="bg-white/50 dark:bg-gray-800/50 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700 backdrop-blur-sm sticky top-4 z-30">
                <div className="flex flex-col sm:flex-row items-center gap-4 p-2">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Período de Análise:</span>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                            {selectedPeriod === 'Ano' ? 'Ano Completo (2026)' : MONTHS[selectedPeriod]}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1 w-full overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setSelectedPeriod('Ano')}
                            className={`flex-shrink-0 px-6 py-2 rounded-lg text-sm font-black transition-all h-10 ${
                                selectedPeriod === 'Ano' 
                                ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                                : 'bg-white dark:bg-gray-900 text-slate-500 hover:bg-slate-100 border border-slate-200 dark:border-gray-700'
                            }`}
                        >
                            ANO 2026
                        </button>
                        <div className="h-8 w-px bg-slate-300 mx-2"></div>
                        {MONTHS.map((month, idx) => (
                            <button
                                key={month}
                                onClick={() => setSelectedPeriod(idx)}
                                className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-[10px] font-black transition-all ${
                                    selectedPeriod === idx 
                                    ? 'bg-blue-600 text-white shadow-lg transform scale-110' 
                                    : 'bg-white dark:bg-gray-900 text-slate-400 hover:bg-slate-100 border border-slate-200 dark:border-gray-700'
                                }`}
                            >
                                {month.substring(0, 3).toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {reports.map(report => (
                    <ReportCard 
                        key={report.id}
                        {...report}
                        isLoading={isLoading === report.id}
                        onClick={() => handleGenerateReport(report.id, report.action)}
                    />
                ))}
            </div>
        </div>
    );
};
