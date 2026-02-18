// reports/reportGenerator.ts
import { Equipment, WorkOrder, SparePart, EquipmentType, MaintenanceType, MaintenanceStatus, CorrectiveCategory, PurchaseRequest } from '../types';
import { addPdfHeader, addPdfFooter } from './pdfUtils';
import { MAINTENANCE_TYPE_CONFIG, MONTHS } from '../constants';

declare const window: any;

const getJsPDF = () => {
    if (typeof window.jspdf === 'undefined' || typeof (window.jspdf as any).jsPDF === 'undefined') {
        console.error("JSPDF library not found on window object.");
        alert('ERRO CRÍTICO: A biblioteca principal de PDF (jspdf) não foi carregada.');
        return null;
    }
    const doc = new (window.jspdf as any).jsPDF();
    if (typeof (doc as any).autoTable !== 'function') {
        console.error("JSPDF-AutoTable plugin not found on jsPDF instance.");
        alert('ERRO CRÍTICO: O plugin de tabelas (jspdf-autotable) não foi carregado corretamente.');
        return null;
    }
    return doc;
};

// HELPER CRÍTICO: Comparação de datas segura (Ignora horas ou inclui dia inteiro)
const isWithinRange = (dateStr: string, startStr: string, endStr: string): boolean => {
    if (!dateStr) return false;
    
    // CORREÇÃO DE FUSO HORÁRIO: Constrói a data alvo a partir de suas partes para evitar que o fuso horário a altere para o dia anterior.
    const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
    const target = new Date(year, month - 1, day);

    const start = new Date(startStr);
    start.setHours(0, 0, 0, 0); // Início do dia inicial
    
    const end = new Date(endStr);
    end.setHours(23, 59, 59, 999); // Fim absoluto do dia final
    
    return target >= start && target <= end;
};

const commonTableStyles = {
    headStyles: { fillColor: '#1E293B', textColor: '#FFFFFF', fontStyle: 'bold', valign: 'middle' },
    styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1, lineColor: '#DDDDDD', valign: 'middle' },
    alternateRowStyles: { fillColor: '#F8FAFC' },
    columnStyles: { 0: { fontStyle: 'bold' } }
};

export const generateKpiReport = (title: string, reportData: any[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, title, dateRange);
    
    // Proteção contra dados vazios ou NaN e formatação
    const tableBody = reportData.map(d => [
        d.equipmentId || 'N/A', 
        d.equipmentName || 'Desconhecido', 
        (d.mtbf === null || d.mtbf === undefined) ? '---' : d.mtbf.toFixed(1), 
        (isNaN(d.mttr) ? '0.0' : d.mttr.toFixed(1)),
        (isNaN(d.availability) ? '100%' : d.availability.toFixed(1) + '%'), 
        (isNaN(d.globalAvailability) ? '100%' : d.globalAvailability.toFixed(1) + '%'), 
        d.totalFailures || 0,
    ]);
    
    (doc as any).autoTable({ 
        startY: 50, 
        head: [['Ativo', 'Nome', 'MTBF (h)', 'MTTR (h)', 'Disp. Inerente', 'Disp. Operacional', 'Falhas']], 
        body: tableBody, 
        ...commonTableStyles,
        columnStyles: { 
            0: { fontStyle: 'bold', cellWidth: 25 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' }
        }
    });
    addPdfFooter(doc);
    doc.save(`${title.replace(/ /g, '_')}.pdf`);
};

export const generateMaterialsReport = (workOrders: WorkOrder[], inventoryData: SparePart[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Consumo e Compras de Materiais por O.S.', dateRange);

    // Unifica TODOS os eventos de material (consumo de estoque e compras) de TODAS as ordens de serviço
    const allMaterialEvents = workOrders.flatMap(wo => {
        const stockItems = (wo.materialsUsed || []).map(mat => ({
            wo: wo,
            type: 'stock' as const,
            eventDate: wo.scheduledDate,
            item: mat
        }));
        // CORREÇÃO: Usa requisitionDate se arrivalDate não existir (para itens pendentes aparecerem no mês solicitado)
        const purchasedItems = (wo.purchaseRequests || []).map(req => ({
            wo: wo,
            type: 'purchase' as const,
            eventDate: req.arrivalDate || req.requisitionDate,
            item: req
        }));
        return [...stockItems, ...purchasedItems];
    });

    // --- SEÇÃO 1: Filtra e prepara itens INDUSTRIAIS ---
    const tableBodyIndustrial = allMaterialEvents
        .filter(event => {
            if (event.wo.type === MaintenanceType.Predial) return false;
            // Verifica data
            if (!event.eventDate || !isWithinRange(event.eventDate, dateRange.start, dateRange.end)) return false;
            
            if (event.type === 'stock') return event.item.partId && (event.item as { quantity: number }).quantity > 0;
            // CORREÇÃO: Permite qualquer status de compra (Pendente, Comprado, Entregue)
            if (event.type === 'purchase') return true; 
            return false;
        })
        .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
        .map(event => {
            const { wo, eventDate } = event;
            const dateStr = new Date(eventDate!).toLocaleDateString('pt-BR');
            if (event.type === 'stock') {
                const stockItem = event.item as { partId: string; quantity: number };
                const part = inventoryData.find(p => p.id === stockItem.partId);
                return [wo.id, dateStr, wo.equipmentId, part?.name || `Cód: ${stockItem.partId}`, stockItem.quantity, part?.unit || 'UN'];
            } else { // purchase
                const purchaseItem = event.item as PurchaseRequest;
                // Adiciona o status ao nome do item se não for entregue
                const statusSuffix = purchaseItem.status !== 'Entregue' ? ` [${purchaseItem.status.toUpperCase()}]` : '';
                return [wo.id, dateStr, wo.equipmentId, purchaseItem.itemDescription + statusSuffix, purchaseItem.quantity, 'UN'];
            }
        });

    // --- SEÇÃO 2: Filtra e prepara itens PREDIAIS ---
    const tableBodyPredial = allMaterialEvents
        .filter(event => {
            if (event.wo.type !== MaintenanceType.Predial) return false;
            if (event.type !== 'purchase') return false; // Predial só tem compras
            if (!event.eventDate || !isWithinRange(event.eventDate, dateRange.start, dateRange.end)) return false;
            return true; // Aceita qualquer status
        })
        .sort((a, b) => new Date(a.eventDate!).getTime() - new Date(b.eventDate!).getTime())
        .map(event => {
            const { wo, eventDate } = event;
            const dateStr = new Date(eventDate!).toLocaleDateString('pt-BR');
            const purchaseItem = event.item as PurchaseRequest;
            const statusSuffix = purchaseItem.status !== 'Entregue' ? ` [${purchaseItem.status.toUpperCase()}]` : '';
            return [wo.id, dateStr, wo.equipmentId, purchaseItem.itemDescription + statusSuffix, purchaseItem.quantity, 'UN'];
        });

    // --- Lógica de renderização do PDF ---
    let finalY = 50;

    if (tableBodyIndustrial.length === 0 && tableBodyPredial.length === 0) {
        doc.text("Nenhum material consumido ou solicitado no período selecionado.", 14, 60);
    } else {
        if (tableBodyIndustrial.length > 0) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1E293B');
            doc.text("CONSUMO E COMPRAS - INDUSTRIAL (Preventivas/Corretivas)", 14, finalY);
            finalY += 2;
            (doc as any).autoTable({
                startY: finalY,
                head: [['O.S.', 'Data', 'Equipamento', 'Descrição do Item', 'Qtd.', 'Un.']],
                body: tableBodyIndustrial,
                ...commonTableStyles
            });
            finalY = (doc as any).lastAutoTable.finalY;
        }

        if (tableBodyPredial.length > 0) {
            finalY += 15;
            if (finalY > 250) {
                doc.addPage();
                addPdfHeader(doc, 'Consumo e Compras de Materiais por O.S.', dateRange);
                finalY = 50;
            }
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor('#1E293B');
            doc.text("COMPRAS - PREDIAL", 14, finalY);
            finalY += 2;
             (doc as any).autoTable({
                startY: finalY,
                head: [['O.S.', 'Data', 'Equipamento', 'Descrição do Item', 'Qtd.', 'Un.']],
                body: tableBodyPredial,
                ...commonTableStyles
            });
        }
    }

    addPdfFooter(doc);
    doc.save('Relatorio_Materiais_Compras_OS.pdf');
};


export const generateInventoryReport = (inventoryData: SparePart[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Relatório de Estoque Atual (FO-044)', dateRange);
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("* Posição atual do estoque (Snapshot) no momento da emissão.", 14, 48);

    const tableBody = inventoryData.map(p => {
        const status = p.currentStock < p.minStock ? 'CRÍTICO' : (p.currentStock === p.minStock ? 'ALERTA' : 'OK');
        return [
            p.id, 
            p.name, 
            p.location, 
            p.currentStock, 
            p.minStock, 
            status
        ];
    });
    
    (doc as any).autoTable({ 
        startY: 50, 
        head: [['Cód.', 'Descrição', 'Local', 'Atual', 'Mínimo', 'Status']], 
        body: tableBody, 
        ...commonTableStyles,
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 5) {
                if (data.cell.raw === 'CRÍTICO') {
                    data.cell.styles.textColor = [220, 38, 38]; // Red
                    data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.raw === 'ALERTA') {
                    data.cell.styles.textColor = [234, 179, 8]; // Yellow
                } else {
                    data.cell.styles.textColor = [22, 163, 74]; // Green
                }
            }
        }
    });
    addPdfFooter(doc);
    doc.save('Relatorio_Estoque_Atual.pdf');
};

export const generateOsVolumeReport = (workOrders: WorkOrder[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Volume de Ordens de Serviço', dateRange);
    
    const filtered = workOrders.filter(wo => isWithinRange(wo.scheduledDate, dateRange.start, dateRange.end));
    
    const openCount = filtered.filter(wo => [MaintenanceStatus.Scheduled, MaintenanceStatus.InField, MaintenanceStatus.Delayed, MaintenanceStatus.WaitingParts].includes(wo.status)).length;
    const closedCount = filtered.filter(wo => wo.status === MaintenanceStatus.Executed).length;
    const deactivatedCount = filtered.filter(wo => wo.status === MaintenanceStatus.Deactivated).length;
    
    const correctiveCount = filtered.filter(wo => wo.type === MaintenanceType.Corrective || wo.type === MaintenanceType.Predial).length;
    const preventiveCount = filtered.filter(wo => wo.type === MaintenanceType.Preventive || wo.type === MaintenanceType.RevisaoPeriodica).length;
    const predictiveCount = filtered.filter(wo => wo.type === MaintenanceType.Predictive).length;

    (doc as any).autoTable({ 
        startY: 50, 
        head: [['Indicador de Volume', 'Quantidade', '% do Total']], 
        body: [
            ['Total de O.S. no Período', filtered.length, '100%'],
            ['', '', ''], // Spacer
            ['Abertas (Pendentes)', openCount, ((openCount/filtered.length)*100).toFixed(1) + '%'],
            ['Fechadas (Executadas)', closedCount, ((closedCount/filtered.length)*100).toFixed(1) + '%'],
            ['Desativadas/Canceladas', deactivatedCount, ((deactivatedCount/filtered.length)*100).toFixed(1) + '%'],
            ['', '', ''], // Spacer
            ['Preventivas', preventiveCount, ((preventiveCount/filtered.length)*100).toFixed(1) + '%'],
            ['Corretivas', correctiveCount, ((correctiveCount/filtered.length)*100).toFixed(1) + '%'],
            ['Preditivas', predictiveCount, ((predictiveCount/filtered.length)*100).toFixed(1) + '%'],
        ], 
        ...commonTableStyles,
        theme: 'grid'
    });
    addPdfFooter(doc);
    doc.save('Volume_Ordens_Servico.pdf');
};

export const generateChecklistReport = (workOrders: WorkOrder[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Relatório de Checklists das Ordens de Serviço', dateRange);
    
    const filtered = workOrders.filter(wo => 
        wo.checklist && 
        wo.checklist.length > 0 && 
        isWithinRange(wo.scheduledDate, dateRange.start, dateRange.end)
    );
    
    let finalY = 50;
    
    if (filtered.length === 0) {
        doc.text("Nenhum checklist registrado no período.", 14, 60);
    }

    filtered.forEach(wo => {
        if (finalY > 250) { doc.addPage(); addPdfHeader(doc, 'Relatório de Checklists das Ordens de Serviço', dateRange); finalY = 50; }
        
        doc.setFillColor(240, 240, 240);
        doc.rect(14, finalY, doc.internal.pageSize.getWidth() - 28, 7, 'F');
        doc.setFontSize(9); 
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text(`OS #${wo.id} | ${wo.equipmentId} | ${new Date(wo.scheduledDate).toLocaleDateString('pt-BR')}`, 16, finalY + 5);
        
        finalY += 8;
        const checklistBody = wo.checklist!.map(item => [item.action, item.checked ? 'OK' : 'Pendente']);
        
        (doc as any).autoTable({ 
            startY: finalY, 
            head: [['Tarefa do Checklist', 'Status']], 
            body: checklistBody, 
            ...commonTableStyles,
            headStyles: { fillColor: '#475569', textColor: '#FFFFFF', fontStyle: 'bold' },
            columnStyles: { 1: { cellWidth: 30, halign: 'center' } },
            margin: { left: 14, right: 14 }
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    });
    addPdfFooter(doc);
    doc.save('Relatorio_Checklists.pdf');
};

export const generateEquipmentListReport = (equipmentData: Equipment[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Cadastro Geral de Equipamentos (Ativos)', dateRange);
    
    const tableBody = equipmentData.map(eq => [
        eq.id, 
        eq.name, 
        eq.location, 
        eq.isCritical ? 'SIM' : 'NÃO', 
        eq.status
    ]);
    
    (doc as any).autoTable({ 
        startY: 50, 
        head: [['Cód.', 'Nome', 'Localização', 'Crítico?', 'Status']], 
        body: tableBody, 
        ...commonTableStyles,
        didParseCell: function(data: any) {
            if (data.section === 'body' && data.column.index === 3 && data.cell.raw === 'SIM') {
                data.cell.styles.textColor = [220, 38, 38];
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });
    addPdfFooter(doc);
    doc.save('Cadastro_Equipamentos.pdf');
};

export const generateEquipmentTypesReport = (equipmentData: Equipment[], equipmentTypes: EquipmentType[], dateRange: { start: string, end: string }) => {
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Relatório de Ativos por Tipo/Família', dateRange);
    
    const dataForTable = equipmentTypes.map(type => ({ 
        description: type.description, 
        count: equipmentData.filter(eq => eq.typeId === type.id).length 
    })).filter(item => item.count > 0).sort((a, b) => b.count - a.count);
    
    const tableBody = dataForTable.map(item => [item.description, item.count]);
    const totalAssets = dataForTable.reduce((sum, item) => sum + item.count, 0);
    
    (doc as any).autoTable({ 
        startY: 50, 
        head: [['TIPO / FAMÍLIA DO EQUIPAMENTO', 'QUANTIDADE TOTAL']], 
        body: tableBody, 
        foot: [['TOTAL GERAL DE ATIVOS', totalAssets]], 
        footStyles: { fillColor: '#1E293B', textColor: '#FFFFFF', fontStyle: 'bold' }, 
        ...commonTableStyles 
    });
    addPdfFooter(doc);
    doc.save('Relatorio_Tipos_Equipamento.pdf');
};

export const generateExecutiveSummaryReport = (data: { equipmentData: Equipment[], workOrders: WorkOrder[], inventoryData: SparePart[], dateRange: { start: string, end: string }}) => {
    const { workOrders, inventoryData, dateRange } = data;
    const doc = getJsPDF();
    if (!doc) return;
    addPdfHeader(doc, 'Resumo Executivo Gerencial', dateRange);
    let finalY = 50;
    
    // CORREÇÃO: Uso do helper isWithinRange
    const filteredWO = workOrders.filter(wo => isWithinRange(wo.scheduledDate, dateRange.start, dateRange.end));
    
    const addSectionTitle = (title: string) => { 
        if (finalY > 250) { doc.addPage(); finalY = 20; } 
        doc.setFontSize(11); 
        doc.setFont('helvetica', 'bold'); 
        doc.setTextColor('#1E293B'); 
        doc.text(title, 14, finalY); 
        finalY += 6; 
    };
    
    // KPI Calc
    const failures = filteredWO.filter(wo => 
        (wo.type === MaintenanceType.Corrective || wo.type === MaintenanceType.Predial) && 
        wo.status === MaintenanceStatus.Executed
    );
    const totalFailures = failures.length;
    
    addSectionTitle('1. Indicadores Chave de Performance');
    (doc as any).autoTable({ 
        startY: finalY, 
        body: [
            ['Total de Falhas Corretivas (Executadas)', totalFailures], 
            ['Total de Ordens Emitidas (Prog. + Exec.)', filteredWO.length],
            ['Taxa de Execução', filteredWO.length > 0 ? ((filteredWO.filter(w=>w.status === 'Executado').length / filteredWO.length) * 100).toFixed(1) + '%' : '0%']
        ], 
        theme: 'grid', 
        ...commonTableStyles, 
        bodyStyles: { fontStyle: 'bold' } 
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    addSectionTitle('2. Análise de Ordens de Serviço');
    const osByType = Object.values(MaintenanceType).map(type => ({ 
        type, 
        count: filteredWO.filter(wo => wo.type === type).length 
    })).filter(item => item.count > 0);
    
    (doc as any).autoTable({ 
        startY: finalY, 
        head: [['Natureza da O.S.', 'Quantidade']], 
        body: osByType.map(item => [item.type, item.count]), 
        ...commonTableStyles 
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    addSectionTitle('3. Situação do Almoxarifado');
    const criticalItems = inventoryData.filter(p => p.currentStock < p.minStock);
    (doc as any).autoTable({ 
        startY: finalY, 
        body: [
            ['Itens com Saldo Crítico', criticalItems.length], 
            ['Total de SKUs Cadastrados', inventoryData.length]
        ], 
        theme: 'grid', 
        ...commonTableStyles, 
        bodyStyles: { fontStyle: 'bold' } 
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    if (criticalItems.length > 0) {
        if (finalY > 230) { doc.addPage(); finalY = 50; }
        doc.setFontSize(9); doc.text('Top 10 Itens Críticos:', 14, finalY); finalY += 6;
        (doc as any).autoTable({ 
            startY: finalY, 
            head: [['Cód.', 'Descrição', 'Saldo Atual', 'Saldo Mínimo']], 
            body: criticalItems.slice(0, 10).map(p => [p.id, p.name, p.currentStock, p.minStock]), 
            ...commonTableStyles, 
            styles: { ...commonTableStyles.styles, fontSize: 7 } 
        });
    }
    addPdfFooter(doc);
    doc.save('Resumo_Executivo.pdf');
};

export const generateScheduleReport = (
    scheduleData: { equipment: Equipment; monthlyTasks: WorkOrder[][] }[],
    year: number
) => {
    const doc = getJsPDF();
    if (!doc) return;

    // Landscape Mode
    const landscapeDoc = new (window.jspdf as any).jsPDF({ orientation: 'landscape', format: 'a4' });
    
    addPdfHeader(landscapeDoc, `Cronograma Mestre de Manutenção - ${year}`, { start: `${year}-01-01`, end: `${year}-12-31` });

    const columns = [
        { header: 'EQUIPAMENTO', dataKey: 'equipment' },
        ...MONTHS.map((m, i) => ({ header: m.substring(0, 3).toUpperCase(), dataKey: i.toString() }))
    ];

    const body = scheduleData.map(row => {
        const rowData: any = { equipment: row.equipment.name };
        row.monthlyTasks.forEach((tasks, monthIndex) => {
            const types = Array.from(new Set(tasks.map(t => t.type)));
            rowData[monthIndex.toString()] = { content: '', customData: types }; 
        });
        return rowData;
    });

    (landscapeDoc as any).autoTable({
        startY: 50,
        columns: columns,
        body: body,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, lineColor: '#DDDDDD', lineWidth: 0.1, valign: 'middle', halign: 'center', minCellHeight: 12 },
        headStyles: { fillColor: '#1E293B', textColor: '#FFFFFF', fontStyle: 'bold', halign: 'center' },
        columnStyles: { equipment: { halign: 'left', fontStyle: 'bold', cellWidth: 70 } },
        didDrawCell: (data: any) => {
            if (data.section === 'body' && data.column.dataKey !== 'equipment') {
                const types = data.cell.raw?.customData as MaintenanceType[];
                if (Array.isArray(types) && types.length > 0) {
                    const cell = data.cell;
                    const radius = 2.5;
                    const gap = 2;
                    const totalWidth = (types.length * (radius * 2)) + ((types.length - 1) * gap);
                    let startX = (cell.x + cell.width / 2) - (totalWidth / 2) + radius;
                    const yCenter = cell.y + cell.height / 2;

                    types.forEach((type, index) => {
                        const config = MAINTENANCE_TYPE_CONFIG[type];
                        if (config && config.hex) {
                            landscapeDoc.setFillColor(config.hex);
                            landscapeDoc.circle(startX + (index * (radius * 2 + gap)), yCenter, radius, 'F');
                        }
                    });
                }
            }
        }
    });

    // Legenda no rodapé da página
    const legendY = landscapeDoc.internal.pageSize.getHeight() - 25;
    let legendX = 14;
    landscapeDoc.setFontSize(8);
    landscapeDoc.setFont('helvetica', 'bold');
    landscapeDoc.text("LEGENDA:", legendX, legendY);
    legendX += 20;

    Object.values(MAINTENANCE_TYPE_CONFIG).forEach(config => {
        if(config.hex) {
            landscapeDoc.setFillColor(config.hex);
            landscapeDoc.circle(legendX, legendY - 1, 2, 'F');
            landscapeDoc.setTextColor(50);
            landscapeDoc.text(config.label, legendX + 4, legendY);
            legendX += 4 + landscapeDoc.getTextWidth(config.label) + 10;
        }
    });

    addPdfFooter(landscapeDoc);
    landscapeDoc.save(`Cronograma_${year}.pdf`);
};