import React, { useState, useEffect, useMemo } from 'react';
import { WorkOrder, Equipment, SparePart, MaintenanceStatus, MaintenanceType, TaskDetail, CorrectiveCategory, ManHourEntry, PurchaseRequest } from '../types';
import { 
    CloseIcon, 
    CheckCircleIcon, 
    ClipboardListIcon, 
    ExclamationTriangleIcon, 
    PlusIcon, 
    DeleteIcon, 
    UploadIcon, 
    ShieldCheckIcon, 
    ClockIcon, 
    ShoppingCartIcon,
    DocumentTextIcon, 
    WrenchIcon,
    LightBulbIcon,
    BellAlertIcon,
    ArrowPathIcon
} from './icons';
import { useDataContext } from '../contexts/DataContext';
import { useAppContext } from '../contexts/AppContext'; 
import { ConfirmationModal } from './ConfirmationModal'; 

interface WorkOrderControlModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: WorkOrder) => void;
    existingOrder: WorkOrder | null;
    equipmentData: Equipment[];
    inventoryData: SparePart[];
    nextOSNumber: string; 
    maintainers: string[];
    requesters: string[];
}

type Tab = 'summary' | 'checklist' | 'resources' | 'approval';

export const WorkOrderControlModal: React.FC<WorkOrderControlModalProps> = ({ isOpen, onClose, existingOrder, equipmentData, inventoryData, maintainers, requesters }) => {
    const { handleUnifiedSave, handleWorkOrderDelete, showToast } = useDataContext();
    const { userRole, requestAdminPassword, currentUser } = useAppContext();
    const [activeTab, setActiveTab] = useState<Tab>('summary');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Core Fields
    const [id, setId] = useState('');
    const [equipmentId, setEquipmentId] = useState('');
    const [type, setType] = useState<MaintenanceType>(MaintenanceType.Corrective);
    const [status, setStatus] = useState<MaintenanceStatus>(MaintenanceStatus.Scheduled);
    
    // Dates
    const [scheduledDate, setScheduledDate] = useState(''); 
    const [startDateExecution, setStartDateExecution] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [description, setDescription] = useState('');
    const [requester, setRequester] = useState('');
    const [observations, setObservations] = useState('');
    const [locationDisplay, setLocationDisplay] = useState('');
    
    // Approval
    const [isApproved, setIsApproved] = useState(false); 

    // Checklist
    const [checklist, setChecklist] = useState<TaskDetail[]>([]);
    
    // Corrective/Specific Fields
    const [rootCause, setRootCause] = useState('');
    const [correctiveCategory, setCorrectiveCategory] = useState<CorrectiveCategory | undefined>(undefined);
    const [machineStopped, setMachineStopped] = useState(false);
    
    const [runtimeHours, setRuntimeHours] = useState('');
    const [leadTimeAlert, setLeadTimeAlert] = useState(false);

    // Resources
    const [manHours, setManHours] = useState<ManHourEntry[]>([]);
    const [materialsUsed, setMaterialsUsed] = useState<{ partId: string; quantity: number }[]>([]);
    const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
    
    // New Purchase Request Input
    const [newPurchaseItem, setNewPurchaseItem] = useState('');
    const [newPurchaseQty, setNewPurchaseQty] = useState(1);
    
    // PDF Report
    const [reportPdf, setReportPdf] = useState<string | null>(null);
    const [pdfFileName, setPdfFileName] = useState<string>('');

    const selectedEquipment = useMemo(() => equipmentData.find(e => e.id === equipmentId), [equipmentId, equipmentData]);
    const isCorrective = type === MaintenanceType.Corrective || type === MaintenanceType.Predial;
    const displayName = equipmentId === 'ATIVO_PREDIAL_GENERICO' ? 'Ativo/Passivo Predial' : selectedEquipment?.name || 'Selecione o Ativo';
    
    const isAdmin = userRole === 'admin';
    const canDelete = userRole === 'admin'; 

    useEffect(() => {
        if (isOpen) {
            if (existingOrder) {
                setId(existingOrder.id);
                setEquipmentId(existingOrder.equipmentId);
                setType(existingOrder.type);
                setStatus(existingOrder.status);
                setScheduledDate(existingOrder.scheduledDate ? existingOrder.scheduledDate.slice(0, 10) : '');
                setStartDateExecution((existingOrder as any).startDateExecution ? (existingOrder as any).startDateExecution.slice(0,16) : '');
                setEndDate(existingOrder.endDate ? existingOrder.endDate.slice(0,16) : '');
                setDescription(existingOrder.description || '');
                setRequester(existingOrder.requester || '');
                setObservations(existingOrder.observations || '');
                setChecklist(existingOrder.checklist || []);
                setRuntimeHours(existingOrder.miscNotes?.match(/Horímetro: (\d+)/)?.[1] || '');
                setRootCause(existingOrder.rootCause || '');
                setCorrectiveCategory(existingOrder.correctiveCategory || undefined);
                setMachineStopped(existingOrder.machineStopped || false);
                setIsApproved((existingOrder as any).isApproved || false); 
                setManHours(existingOrder.manHours || []);
                setMaterialsUsed(existingOrder.materialsUsed || []);
                setPurchaseRequests(existingOrder.purchaseRequests || []);
                setReportPdf(existingOrder.reportPdfBase64 || null);
                if(existingOrder.reportPdfBase64) setPdfFileName(`Relatorio_${existingOrder.id}.pdf`);
                else setPdfFileName('');
            } else {
                setId(''); 
                const today = new Date().toISOString().slice(0, 10);
                setScheduledDate(today);
                setStartDateExecution('');
                setType(MaintenanceType.Corrective); 
                setStatus(MaintenanceStatus.Scheduled);
                setEquipmentId('');
                setDescription('');
                setRequester('');
                setChecklist([]);
                setEndDate('');
                setManHours([]);
                setMaterialsUsed([]);
                setPurchaseRequests([]);
                setObservations('');
                setMachineStopped(false);
                setIsApproved(false);
                setRuntimeHours('');
                setCorrectiveCategory(undefined);
                setReportPdf(null);
                setPdfFileName('');
            }
        }
    }, [existingOrder, isOpen]);

    useEffect(() => {
        if (type === MaintenanceType.Predial || equipmentId === 'ATIVO_PREDIAL_GENERICO') {
            setLocationDisplay(observations || 'Não especificado');
        } else if (selectedEquipment) {
            setLocationDisplay(selectedEquipment.location || 'Não especificado');
        } else {
            setLocationDisplay('');
        }
    }, [equipmentId, selectedEquipment, type, observations]);

    const handleChecklistItemToggle = (indexToToggle: number) => {
        setChecklist(prev => prev.map((item, index) => 
            index === indexToToggle ? { ...item, checked: !item.checked } : item
        ));
    };

    const handleAddPurchaseRequest = () => {
        if (!newPurchaseItem) return;
        const newReq: PurchaseRequest = {
            id: `REQ-${id || 'NOVA'}-${purchaseRequests.length + 1}`,
            itemDescription: newPurchaseItem,
            quantity: newPurchaseQty,
            requester: 'Manutenção',
            requisitionDate: new Date().toISOString(),
            status: 'Pendente'
        };
        setPurchaseRequests([...purchaseRequests, newReq]);
        setNewPurchaseItem('');
        setNewPurchaseQty(1);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target?.result as string;
                setReportPdf(base64.split(',')[1]); 
                setPdfFileName(file.name);
            };
            reader.readAsDataURL(file);
        } else {
            showToast("Por favor, selecione um arquivo .pdf", "warning");
        }
    };

    const handleSave = async (forceStatus?: MaintenanceStatus) => {
        setIsSaving(true);
        try {
            const targetStatus = forceStatus || status;

            if (!equipmentId || !description || !requester) { 
                showToast('Preencha os campos obrigatórios (*)', 'warning'); 
                setActiveTab('summary');
                return; 
            }

            if (targetStatus === MaintenanceStatus.Executed && userRole === 'gestor') {
                if (!reportPdf) {
                    showToast("OBRIGATÓRIO PARA GESTOR: Anexe o Relatório Técnico/OS Digitalizada na aba 'Recursos' para finalizar.", "error");
                    setActiveTab('resources');
                    return;
                }
            }

            // AUTO-FILL: Se finalizar e não tiver horas, adiciona o usuário atual
            let finalManHours = [...manHours];
            if (targetStatus === MaintenanceStatus.Executed && finalManHours.length === 0 && currentUser) {
                // Calcula duração
                let autoDuration = 1; // Padrão
                if (startDateExecution && endDate) {
                    const start = new Date(startDateExecution);
                    const end = (endDate) ? new Date(endDate) : new Date();
                    const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    if (diff > 0) autoDuration = parseFloat(diff.toFixed(2));
                }
                
                // Tenta achar um nome compatível na lista de mantenedores, senão usa o nome do usuário
                const maintainerName = maintainers.find(m => m.toUpperCase().includes(currentUser.username.toUpperCase())) || currentUser.name;
                
                finalManHours.push({
                    maintainer: maintainerName,
                    hours: autoDuration
                });
                
                showToast(`Horas atribuídas automaticamente para: ${maintainerName} (${autoDuration}h)`, 'info');
            }

            let finalPurchaseRequests = [...purchaseRequests];
            let autoResolvedNote = '';

            if (targetStatus === MaintenanceStatus.Executed) {
                const pendingReqs = finalPurchaseRequests.filter(r => r.status !== 'Entregue');
                if (pendingReqs.length > 0) {
                    finalPurchaseRequests = finalPurchaseRequests.map(r => ({
                        ...r,
                        status: 'Entregue',
                        arrivalDate: new Date().toISOString()
                    }));
                    autoResolvedNote = `\n[SISTEMA]: ${pendingReqs.length} item(ns) de compra baixados automaticamente na conclusão.`;
                }
            }

            const notes = (runtimeHours ? `Horímetro: ${runtimeHours}h\n` : '') + 
                          (leadTimeAlert ? '[ALERTA 30 DIAS ATIVADO]\n' : '') +
                          autoResolvedNote;
            
            const order: any = {
                id, equipmentId, type, status: targetStatus,
                equipments: selectedEquipment || null,
                scheduledDate: scheduledDate, 
                startDateExecution: startDateExecution || undefined, 
                endDate: targetStatus === MaintenanceStatus.Executed ? (endDate || new Date().toISOString().slice(0, 16)) : undefined,
                description, checklist,
                rootCause: isCorrective ? rootCause : undefined,
                correctiveCategory: isCorrective ? correctiveCategory : undefined,
                machineStopped,
                isApproved, 
                requester,
                manHours: finalManHours,
                materialsUsed,
                purchaseRequests: finalPurchaseRequests,
                observations,
                miscNotes: notes.trim(),
                reportPdfBase64: reportPdf || undefined,
            };

            const success = await handleUnifiedSave(order);
            if (success) {
                onClose();
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => {
        if (!existingOrder) return;
        if (userRole === 'admin') {
            requestAdminPassword(() => setIsDeleteModalOpen(true));
        } else {
            showToast("Ação não permitida. Apenas Administradores podem excluir registros.", "error");
        }
    };

    const handleConfirmDelete = async () => {
        if (!existingOrder) return;
        const success = await handleWorkOrderDelete(existingOrder.id);
        if (success) {
            setIsDeleteModalOpen(false);
            onClose();
        }
    };

    const navSteps = [
        { id: 'summary', label: '1. Dados Gerais', icon: <DocumentTextIcon className="w-4 h-4" />, colorClass: 'border-blue-600 text-blue-700 bg-blue-50' },
        { id: 'checklist', label: '2. Checklist', icon: <ClipboardListIcon className="w-4 h-4" />, colorClass: 'border-purple-600 text-purple-700 bg-purple-50' },
        { id: 'resources', label: '3. Recursos (Anexos)', icon: <WrenchIcon className="w-4 h-4" />, colorClass: 'border-emerald-600 text-emerald-700 bg-emerald-50' },
        { id: 'approval', label: '4. Aprovação', icon: <ShieldCheckIcon className="w-4 h-4" />, colorClass: 'border-orange-500 text-orange-700 bg-orange-50' },
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-5xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-fade-in border border-slate-200">
                
                {/* Header */}
                <div className={`px-8 py-5 text-white flex justify-between items-center transition-colors ${machineStopped ? 'bg-rose-700' : isCorrective ? 'bg-slate-800' : 'bg-blue-700'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                           {machineStopped ? <ExclamationTriangleIcon className="w-6 h-6 animate-pulse"/> : <ClipboardListIcon className="w-6 h-6" />}
                        </div>
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Protocolo de Manutenção</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black">{id ? `#${id}` : 'NOVA (Automático)'}</span>
                                <span className="text-white/50">|</span>
                                <span className="text-lg font-bold">{displayName}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><CloseIcon className="w-6 h-6"/></button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex bg-white border-b border-slate-200 shadow-sm">
                    {navSteps.map((step) => {
                        const isActive = activeTab === step.id;
                        return (
                            <button
                                key={step.id}
                                onClick={() => setActiveTab(step.id as Tab)}
                                className={`flex-1 flex items-center justify-center gap-2 py-4 px-2 text-xs font-black uppercase border-b-4 transition-all duration-200 
                                    ${isActive ? step.colorClass : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                            >
                                <span className={`${isActive ? '' : 'opacity-70 grayscale'}`}>{step.icon}</span>
                                <span>{step.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex-1 overflow-y-auto p-8 bg-white">
                    {activeTab === 'summary' && (
                        <div className="space-y-6">
                             <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${machineStopped ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                                <span className="text-[10px] font-black uppercase text-slate-500">Máquina Parada (Urgência Crítica)?</span>
                                <input type="checkbox" checked={machineStopped} onChange={() => setMachineStopped(!machineStopped)} className="w-6 h-6 text-rose-600 rounded" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Ativo *</label>
                                            <select 
                                                value={equipmentId} 
                                                onChange={e => setEquipmentId(e.target.value)} 
                                                disabled={!!id} 
                                                className="w-full form-input h-12 font-bold bg-slate-50"
                                            >
                                                <option value="">Selecione...</option>
                                                {equipmentData.map(eq => <option key={eq.id} value={eq.id}>{eq.id} - {eq.name}</option>)}
                                                <option value="ATIVO_PREDIAL_GENERICO">Outros / Predial</option>
                                            </select>
                                        </div>
                                         <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Localização</label>
                                            <input type="text" value={locationDisplay} readOnly className="w-full form-input h-12 font-bold bg-slate-50" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Tipo de Manutenção</label>
                                            {isAdmin ? (
                                                <select value={type} onChange={e => setType(e.target.value as MaintenanceType)} className="w-full form-input h-12 font-bold">
                                                    {Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            ) : (
                                                <input type="text" value={type} readOnly className="w-full form-input h-12 font-bold bg-slate-100 text-slate-500" title="Apenas administradores podem criar Preventivas/Preditivas." />
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Data Programada</label>
                                            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full form-input h-12 font-bold" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Horímetro Atual (h)</label>
                                            <input type="number" value={runtimeHours} onChange={e => setRuntimeHours(e.target.value)} placeholder="Ex: 69" className="w-full form-input h-12 font-black text-blue-600" />
                                        </div>
                                        <div className="flex items-center gap-2 mt-6">
                                            <input type="checkbox" checked={leadTimeAlert} onChange={e => setLeadTimeAlert(e.target.checked)} className="w-5 h-5 text-blue-600 rounded" />
                                            <span className="text-[9px] font-black uppercase text-slate-500">Aviso 30 dias antes</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-slate-400">Descrição Técnica (O que foi feito?) *</label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full h-32 form-input font-bold" placeholder="Ex: Troca de óleo diesel, filtros..."></textarea>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Solicitante *</label>
                                            <select value={requester} onChange={e => setRequester(e.target.value)} className="w-full form-input h-12">
                                                <option value="">Selecione...</option>
                                                {requesters.map(r => <option key={r} value={r}>{r}</option>)}
                                            </select>
                                        </div>
                                        {isCorrective && (
                                            <div>
                                                <label className="text-[10px] font-black uppercase text-slate-400">Categoria da Falha</label>
                                                <select value={correctiveCategory || ''} onChange={e => setCorrectiveCategory(e.target.value as CorrectiveCategory)} className="w-full form-input h-12 font-bold">
                                                    <option value="">Selecione a Categoria</option>
                                                    {Object.values(CorrectiveCategory).map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'checklist' && (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-[10px] font-black uppercase text-slate-400">Roteiro de Execução</h3>
                            {checklist.length > 0 ? (
                                <div className="space-y-3">
                                    {checklist.map((item, index) => {
                                        // LOGICA DE DESTAQUE INTELIGENTE
                                        const isAlert = item.action.toUpperCase().includes('ALERTA') || item.action.toUpperCase().includes('TERCEIRO') || item.action.toUpperCase().includes('SEGURANÇA');
                                        
                                        return (
                                            <label key={index} className={`flex items-start p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                isAlert 
                                                ? 'bg-amber-50 border-amber-200 hover:border-amber-300' 
                                                : 'bg-slate-50 border-slate-100 hover:border-blue-200'
                                            } has-[:checked]:bg-emerald-50 has-[:checked]:border-emerald-200`}>
                                                <input
                                                    type="checkbox"
                                                    checked={item.checked || false}
                                                    onChange={() => handleChecklistItemToggle(index)}
                                                    className={`w-5 h-5 mt-0.5 rounded flex-shrink-0 ${isAlert ? 'text-amber-600 focus:ring-amber-500' : 'text-blue-600 focus:ring-blue-500'}`}
                                                />
                                                <div className="ml-4 flex-1">
                                                    <div className="flex items-center gap-2">
                                                        {isAlert && <BellAlertIcon className="w-4 h-4 text-amber-600 animate-pulse" />}
                                                        <span className={`text-sm font-bold ${item.checked ? 'text-slate-800 line-through opacity-70' : (isAlert ? 'text-amber-800 uppercase' : 'text-slate-700')}`}>
                                                            {item.action}
                                                        </span>
                                                    </div>
                                                    {item.materials && (
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            <span className="font-bold">Material:</span> {item.materials}
                                                        </p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                                    <ClipboardListIcon className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                                    <p className="text-slate-400 font-bold">Nenhum checklist definido para esta O.S.</p>
                                    <p className="text-xs text-slate-400 mt-1">Checklists são herdados de Planos de Manutenção Preventiva.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'resources' && (
                        <div className="space-y-6 animate-fade-in">
                             <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
                                <h3 className="text-[10px] font-black uppercase text-blue-700 mb-4 flex items-center gap-2">
                                    <UploadIcon className="w-4 h-4"/> Documentação Anexa (Obrigatório para Gestor)
                                </h3>
                                <div className="flex items-center gap-4">
                                    <label className="flex-1 cursor-pointer group">
                                        <div className="flex items-center justify-center w-full h-12 border-2 border-dashed border-blue-300 rounded-xl bg-white group-hover:bg-blue-50 transition-colors">
                                            <span className="text-xs font-bold text-blue-500 uppercase flex items-center gap-2">
                                                <UploadIcon className="w-4 h-4"/> {pdfFileName || 'Selecionar PDF Assinado...'}
                                            </span>
                                        </div>
                                        <input type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
                                    </label>
                                    {reportPdf && <CheckCircleIcon className="w-6 h-6 text-emerald-500" />}
                                </div>
                                <p className="text-[9px] text-blue-400 mt-2 font-bold uppercase">* O arquivo deve conter a assinatura do técnico e do responsável da área.</p>
                             </div>

                             <div className="bg-orange-50 p-6 rounded-2xl border border-orange-200">
                                <h3 className="text-[10px] font-black uppercase text-orange-700 mb-4 flex items-center gap-2">
                                    <ShoppingCartIcon className="w-4 h-4"/> Solicitação de Compras (Externo)
                                </h3>
                                {purchaseRequests.map((req, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-100 mb-2">
                                        <span className="text-xs font-bold text-slate-700">{req.quantity}x {req.itemDescription}</span>
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={req.status} 
                                                onChange={(e) => {
                                                    const newReqs = [...purchaseRequests];
                                                    newReqs[idx].status = e.target.value as any;
                                                    setPurchaseRequests(newReqs);
                                                }}
                                                className="text-[9px] font-black uppercase px-2 py-1 rounded border-none bg-orange-100 text-orange-700"
                                            >
                                                <option value="Pendente">Pendente</option>
                                                <option value="Comprado">Comprado</option>
                                                <option value="Entregue">Entregue</option>
                                            </select>
                                            <button onClick={() => setPurchaseRequests(purchaseRequests.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600"><DeleteIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex gap-2 mt-3">
                                    <input type="text" placeholder="Item" value={newPurchaseItem} onChange={e => setNewPurchaseItem(e.target.value)} className="flex-1 form-input h-10 text-xs" />
                                    <input type="number" value={newPurchaseQty} onChange={e => setNewPurchaseQty(Number(e.target.value))} className="w-20 form-input h-10 text-xs" />
                                    <button type="button" onClick={handleAddPurchaseRequest} className="px-4 bg-orange-600 text-white rounded-lg font-bold text-xs uppercase hover:bg-orange-700">Adicionar</button>
                                </div>
                             </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4">Peças Utilizadas (Consumo Automático)</h3>
                                {materialsUsed.map((mat, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <select value={mat.partId} onChange={e => {
                                            const newL = [...materialsUsed];
                                            newL[idx].partId = e.target.value;
                                            setMaterialsUsed(newL);
                                        }} className="flex-1 form-input text-xs font-bold">
                                            <option value="">Selecione a Peça...</option>
                                            {inventoryData.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        <input type="number" value={mat.quantity} onChange={e => {
                                            const newL = [...materialsUsed];
                                            newL[idx].quantity = Number(e.target.value);
                                            setMaterialsUsed(newL);
                                        }} className="w-24 form-input text-xs font-bold" />
                                        <button onClick={() => setMaterialsUsed(materialsUsed.filter((_, i) => i !== idx))} className="p-2 text-rose-500"><DeleteIcon /></button>
                                    </div>
                                ))}
                                <button onClick={() => setMaterialsUsed([...materialsUsed, { partId: '', quantity: 1 }])} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 mt-2">
                                    <PlusIcon className="w-3 h-3"/> Adicionar Item
                                </button>
                            </div>

                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <h3 className="text-[10px] font-black uppercase text-slate-400 mb-4">Horas-Homem (Apontamento)</h3>
                                {manHours.map((mh, idx) => (
                                    <div key={idx} className="flex gap-2 mb-2">
                                        <select value={mh.maintainer} onChange={e => {
                                            const newL = [...manHours];
                                            newL[idx].maintainer = e.target.value;
                                            setManHours(newL);
                                        }} className="flex-1 form-input text-xs font-bold">
                                            <option value="">Selecione o Técnico...</option>
                                            {maintainers.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                        <input type="number" value={mh.hours} onChange={e => {
                                            const newL = [...manHours];
                                            newL[idx].hours = Number(e.target.value);
                                            setManHours(newL);
                                        }} className="w-24 form-input text-xs font-bold" placeholder="HH" />
                                        <button onClick={() => setManHours(manHours.filter((_, i) => i !== idx))} className="p-2 text-rose-500"><DeleteIcon /></button>
                                    </div>
                                ))}
                                <button onClick={() => setManHours([...manHours, { maintainer: '', hours: 1 }])} className="text-[10px] font-black text-blue-600 uppercase flex items-center gap-1 mt-2">
                                    <PlusIcon className="w-3 h-3"/> Adicionar Apontamento
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400">Status Atual</label>
                                    <select value={status} onChange={e => setStatus(e.target.value as MaintenanceStatus)} className="w-full form-input h-12">
                                        {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400">Data de Término Real</label>
                                    <input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full form-input h-12" />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'approval' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Observações do Gestor / Pendências</label>
                                <textarea 
                                    value={observations} 
                                    onChange={e => setObservations(e.target.value)} 
                                    className="w-full h-32 form-input font-bold"
                                    placeholder="Registre aqui feedbacks de checklist ou pendências para diretoria..."
                                ></textarea>
                            </div>
                            <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                                <h3 className="text-sm font-black uppercase text-orange-700 mb-4 flex items-center gap-2">
                                    <ShieldCheckIcon className="w-5 h-5"/> Aprovação do Gestor
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <input 
                                            type="checkbox" 
                                            id="approved" 
                                            checked={isApproved} 
                                            onChange={(e) => setIsApproved(e.target.checked)}
                                            className="w-6 h-6 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                        />
                                        <label htmlFor="approved" className="text-sm font-bold text-gray-700">
                                            Atesto que o serviço foi realizado conforme os padrões de qualidade e segurança.
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Início Real da Execução</label>
                                            <input 
                                                type="datetime-local" 
                                                value={startDateExecution} 
                                                onChange={e => setStartDateExecution(e.target.value)} 
                                                className="w-full form-input h-12 font-bold" 
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase text-slate-400">Fim Real da Execução</label>
                                            <input 
                                                type="datetime-local" 
                                                value={endDate} 
                                                onChange={e => setEndDate(e.target.value)} 
                                                className="w-full form-input h-12 font-bold" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div>
                        {existingOrder && canDelete && (
                            <button 
                                onClick={handleDeleteClick} 
                                className="px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-colors"
                            >
                                <DeleteIcon className="w-4 h-4"/> Excluir O.S.
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button onClick={onClose} disabled={isSaving} className="px-6 py-3 font-bold text-slate-400 uppercase text-xs tracking-widest">Cancelar</button>
                        <button onClick={() => handleSave()} disabled={isSaving} className="w-48 flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-blue-700 disabled:bg-blue-400">
                            {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : 'Salvar Alterações'}
                        </button>
                        <button onClick={() => handleSave(MaintenanceStatus.Executed)} disabled={isSaving} className="w-56 flex items-center justify-center gap-2 px-10 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs uppercase shadow-lg hover:bg-emerald-700 disabled:bg-emerald-400">
                            {isSaving ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <CheckCircleIcon className="w-4 h-4" />}
                            Finalizar Manutenção
                        </button>
                    </div>
                </div>
            </div>

            {isDeleteModalOpen && existingOrder && (
                <ConfirmationModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleConfirmDelete}
                    title="Excluir Ordem de Serviço"
                    message={`Tem certeza que deseja mover a O.S. #${existingOrder.id} para a lixeira?`}
                />
            )}
        </div>
    );
};
