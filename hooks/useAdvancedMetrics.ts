import { useCallback } from 'react';
import { Equipment, MaintenanceStatus, MaintenanceType, WorkOrder, ReliabilityMetrics, AssetCategory } from '../types';
import { MONTHS } from '../constants';

const MTTR_CRITICAL_TARGET = 1.0; 

export interface MonthlyMetric extends ReliabilityMetrics {
    monthName: string;
    monthIndex: number;
    status: 'OK' | 'ALERTA';
}

export interface AdvancedReportData extends ReliabilityMetrics {
    equipmentId: string;
    equipmentName: string;
    isCritical: boolean;
    monthlyHistory: MonthlyMetric[];
    complianceStatus: 'Aprovado' | 'Reprovado';
    globalAvailability: number;
    totalPlannedHours: number;
    totalDowntimeHours: number;
    totalGrossHours: number;
}

export const useAdvancedMetrics = () => {
    const calculateAvailableHoursInPeriod = (start: Date, end: Date): number => {
        let totalHours = 0;
        const current = new Date(start);
        // Loop through each day in the date range
        while (current <= end) {
            const dayOfWeek = current.getDay(); // Sunday = 0, ..., Saturday = 6
            if (dayOfWeek >= 1 && dayOfWeek <= 4) { // Monday to Thursday
                totalHours += 9;
            } else if (dayOfWeek === 5) { // Friday
                totalHours += 8;
            }
            // No hours for Saturday (6) or Sunday (0)
            current.setDate(current.getDate() + 1);
        }
        return totalHours;
    };

    const calculateMetrics = useCallback((
        equipmentData: Equipment[], 
        workOrders: WorkOrder[], 
        selectedIds: string[], 
        startDateStr: string, 
        endDateStr: string,
        filterCriticidade: 'Criticos' | 'Nao-Criticos' = 'Criticos'
    ): AdvancedReportData[] => {
        
        // CORREÇÃO DE FUSO HORÁRIO: Constrói a data localmente para evitar erros de timezone
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const start = new Date(startYear, startMonth - 1, startDay);

        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        const end = new Date(endYear, endMonth - 1, endDay);
        end.setHours(23, 59, 59, 999); // Garante que o dia final seja incluído completamente

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];

        return equipmentData
            .filter(eq => {
                if (!selectedIds.includes(eq.id)) return false;
                if (filterCriticidade === 'Criticos') return eq.isCritical;
                if (filterCriticidade === 'Nao-Criticos') return !eq.isCritical;
                return true;
            })
            .map(equipment => {
                const monthlyData = Array(12).fill(null).map(() => ({ 
                    failures: 0, 
                    correctiveDowntime: 0,
                    totalDowntime: 0,
                    plannedDowntime: 0
                }));
                
                // CÁLCULO MENSAL (PARA GRÁFICO ANUAL) - Considera o ano inteiro
                workOrders
                    .filter(wo => wo.equipmentId === equipment.id && wo.status === MaintenanceStatus.Executed && new Date(wo.scheduledDate).getFullYear() === start.getFullYear())
                    .forEach(wo => {
                        const mIdx = new Date(wo.scheduledDate).getMonth();
                        // Se houver data de fim e inicio real, calcula a duração real. Se não, usa 1 hora padrão.
                        let duration = 1;
                        if (wo.endDate && wo.startDateExecution) {
                             duration = (new Date(wo.endDate).getTime() - new Date(wo.startDateExecution).getTime()) / 3600000;
                        }
                        
                        monthlyData[mIdx].totalDowntime += duration;
                        
                        if (wo.type === MaintenanceType.Corrective || wo.type === MaintenanceType.Predial) {
                            monthlyData[mIdx].failures += 1;
                            monthlyData[mIdx].correctiveDowntime += duration;
                        } else if ([MaintenanceType.Preventive, MaintenanceType.RevisaoPeriodica, MaintenanceType.Predictive, MaintenanceType.Overhaul].includes(wo.type)) {
                            monthlyData[mIdx].plannedDowntime += duration;
                        }
                    });

                const monthlyHistory = MONTHS.map((name, idx) => {
                    const stats = monthlyData[idx];
                    const firstDayOfMonth = new Date(start.getFullYear(), idx, 1);
                    const lastDayOfMonth = new Date(start.getFullYear(), idx + 1, 0);
                    const grossHours = calculateAvailableHoursInPeriod(firstDayOfMonth, lastDayOfMonth);
                    
                    const mttr = stats.failures > 0 ? stats.correctiveDowntime / stats.failures : 0;
                    const uptime = Math.max(0, grossHours - stats.correctiveDowntime);
                    // Se não houve falha, MTBF é teoricamente o tempo total disponível
                    const mtbf = stats.failures > 0 ? uptime / stats.failures : uptime; 
                    const availability = grossHours > 0 ? (uptime / grossHours) * 100 : 100;
                    
                    return { monthName: name, monthIndex: idx, mtbf, mttr, availability, totalFailures: stats.failures, totalCorrectiveHours: stats.correctiveDowntime, status: mttr <= MTTR_CRITICAL_TARGET ? 'OK' : 'ALERTA' } as MonthlyMetric;
                });

                // CÁLCULO DO PERÍODO FILTRADO (PARA OS CARDS)
                const relevantWorkOrders = workOrders.filter(wo => {
                    // CORREÇÃO DE FUSO HORÁRIO: Não precisa converter a data da WO, a comparação direta com 'start' e 'end' já está correta.
                    const woDate = new Date(wo.scheduledDate);
                    return wo.equipmentId === equipment.id &&
                           wo.status === MaintenanceStatus.Executed &&
                           woDate >= start &&
                           woDate <= end;
                });

                let totalCorrectiveHours = 0;
                let totalDowntimeHours = 0;
                let totalPlannedHours = 0;
                let totalFailures = 0;

                relevantWorkOrders.forEach(wo => {
                    let duration = 1;
                    if (wo.endDate && wo.startDateExecution) {
                         duration = (new Date(wo.endDate).getTime() - new Date(wo.startDateExecution).getTime()) / 3600000;
                    }

                    totalDowntimeHours += duration;
                    if (wo.type === MaintenanceType.Corrective || wo.type === MaintenanceType.Predial) {
                        totalFailures += 1;
                        totalCorrectiveHours += duration;
                    } else if ([MaintenanceType.Preventive, MaintenanceType.RevisaoPeriodica, MaintenanceType.Predictive, MaintenanceType.Overhaul].includes(wo.type)) {
                        totalPlannedHours += duration;
                    }
                });
                
                const totalGross = calculateAvailableHoursInPeriod(start, end);
                const totalUptime = Math.max(0, totalGross - totalCorrectiveHours);
                const totalOperationalUptime = Math.max(0, totalGross - totalDowntimeHours);

                return {
                    equipmentId: equipment.id,
                    equipmentName: equipment.name,
                    isCritical: !!equipment.isCritical,
                    mttr: totalFailures > 0 ? totalCorrectiveHours / totalFailures : 0,
                    mtbf: totalFailures > 0 ? totalUptime / totalFailures : totalUptime,
                    availability: totalGross > 0 ? (totalUptime / totalGross) * 100 : 100,
                    globalAvailability: totalGross > 0 ? (totalOperationalUptime / totalGross) * 100 : 100,
                    totalFailures,
                    totalCorrectiveHours,
                    totalPlannedHours,
                    monthlyHistory,
                    complianceStatus: (totalFailures > 0 ? totalCorrectiveHours / totalFailures : 0) <= MTTR_CRITICAL_TARGET ? 'Aprovado' : 'Reprovado',
                    totalDowntimeHours,
                    totalGrossHours: totalGross,
                };
            });
    }, []);

    return calculateMetrics;
};