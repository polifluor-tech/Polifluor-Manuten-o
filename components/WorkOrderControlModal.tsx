import React, { useState, useEffect, useMemo } from 'react';
import { WorkOrder, Equipment, MaintenanceStatus, MaintenanceType, TaskDetail, SparePart, CorrectiveCategory } from '../types';
import { CloseIcon, PlusIcon, DeleteIcon, CheckCircleIcon, WrenchIcon, UsersIcon, ShoppingCartIcon } from './icons';

interface WorkOrderControlModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (order: WorkOrder) => Promise<void>;
    existingOrder: WorkOrder | null;
    equipmentData: Equipment[];
    inventoryData: SparePart[];
    nextOSNumber: string;
    maintainers: string[];
    requesters: string[];
}

export const WorkOrderControlModal: React.FC<WorkOrderControlModalProps> = ({ 
    isOpen, onClose, onSave, existingOrder, equipmentData, inventoryData, maintainers, requesters 
}) => {
    const [order, setOrder] = useState<WorkOrder | null>(null);
    const [locationDisplay, setLocationDisplay] = useState('');
    const [newTaskAction, setNewTaskAction] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (existingOrder) {
            setOrder(existingOrder);
        } else {
            setOrder({
                id: '',
                equipmentId: '',
                type: MaintenanceType.Corrective,
                status: MaintenanceStatus.Scheduled,
                scheduledDate: new Date().toISOString().slice(0, 10),
                description: '',
                checklist: [],
                manHours: [],
                materialsUsed: [],
                purchaseRequests: [],
            });
        }
    }, [existingOrder, isOpen]);

    const selectedEquipment = useMemo(() => 
        equipmentData.find(e => e.id === order?.equipmentId), 
    [equipmentData, order?.equipmentId]);

    const equipmentId = order?.equipmentId;
    const observations = order?.observations;

    useEffect(() => {
        // Lógica aprimorada de Localização:
        // 1. Se for um ativo real (não o genérico), SEMPRE mostra a localização do cadastro.
        if (selectedEquipment && selectedEquipment.id !== 'ATIVO_PREDIAL_GENERICO') {
            setLocationDisplay(selectedEquipment.location || 'Não especificado');
        } 
        // 2. Se for o ativo genérico (Predial/Outros), usa as observações como local (ou pede definição)
        else if (equipmentId === 'ATIVO_PREDIAL_GENERICO') {
            setLocationDisplay(observations || 'Definir na descrição');
        } 
        // 3. Reset
        else {
            setLocationDisplay('');
        }
    }, [equipmentId, selectedEquipment, observations]);

    if (!isOpen || !order) return null;

    const handleFieldChange = (field: keyof WorkOrder, value: any) => {
        setOrder(prev => prev ? { ...prev, [field]: value } : null);
    };

    const handleAddTask = () => {
        if (!newTaskAction.trim() || !order) return;
        const newTask: TaskDetail = { action: newTaskAction.trim(), checked: false };
        const updatedChecklist = [...(order.checklist || []), newTask];
        handleFieldChange('checklist', updatedChecklist);
        setNewTaskAction('');
    };

    const handleRemoveTask = (index: number) => {
        if (!order || !order.checklist) return;
        const updatedChecklist = order.checklist.filter((_, i) => i !== index);
        handleFieldChange('checklist', updatedChecklist);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (order) {
            setIsSaving(true);
            await onSave(order);
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {existingOrder ? `Editar O.S. #${order.id}` : 'Nova Ordem de Serviço'}
                    </h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"><CloseIcon className="w-6 h-6" /></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Equipamento</label>
                            <select value={order.equipmentId} onChange={e => handleFieldChange('equipmentId', e.target.value)} required className="mt-1 w-full form-input">
                                <option value="">Selecione...</option>
                                <option value="ATIVO_PREDIAL_GENERICO">ATIVO PREDIAL / GENÉRICO</option>
                                {equipmentData.map(e => <option key={e.id} value={e.id}>{e.id} - {e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Localização</label>
                            <input type="text" value={locationDisplay} disabled className="mt-1 w-full form-input bg-gray-100 dark:bg-gray-700" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tipo</label>
                            <select value={order.type} onChange={e => handleFieldChange('type', e.target.value)} className="mt-1 w-full form-input">
                                {Object.values(MaintenanceType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                            <select value={order.status} onChange={e => handleFieldChange('status', e.target.value)} className="mt-1 w-full form-input">
                                {Object.values(MaintenanceStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data Programada</label>
                            <input type="date" value={order.scheduledDate ? order.scheduledDate.slice(0, 10) : ''} onChange={e => handleFieldChange('scheduledDate', e.target.value)} required className="mt-1 w-full form-input" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
                        <input type="text" value={order.description} onChange={e => handleFieldChange('description', e.target.value)} required className="mt-1 w-full form-input" placeholder="Descreva o serviço a ser realizado" />
                    </div>

                    {/* Checklist Section */}
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <ClipboardListIcon className="w-4 h-4"/> Checklist de Tarefas
                            </h3>
                        </div>
                        <div className="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                value={newTaskAction}
                                onChange={(e) => setNewTaskAction(e.target.value)}
                                placeholder="Adicionar nova tarefa..."
                                className="flex-1 form-input text-sm"
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                            />
                            <button type="button" onClick={handleAddTask} className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><PlusIcon className="w-5 h-5" /></button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {(order.checklist || []).map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600">
                                    <input 
                                        type="checkbox" 
                                        checked={item.checked} 
                                        onChange={() => {
                                            const newChecklist = [...(order.checklist || [])];
                                            newChecklist[index].checked = !newChecklist[index].checked;
                                            handleFieldChange('checklist', newChecklist);
                                        }}
                                        className="w-4 h-4 text-blue-600 rounded" 
                                    />
                                    <span className={`flex-1 text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-300'}`}>{item.action}</span>
                                    <button type="button" onClick={() => handleRemoveTask(index)} className="text-gray-400 hover:text-red-500"><DeleteIcon className="w-4 h-4" /></button>
                                </div>
                            ))}
                            {(order.checklist || []).length === 0 && <p className="text-xs text-gray-400 text-center py-2">Nenhuma tarefa.</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observações</label>
                        <textarea value={order.observations || ''} onChange={e => handleFieldChange('observations', e.target.value)} rows={3} className="mt-1 w-full form-input"></textarea>
                    </div>
                </div>

                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-b-lg gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? 'Salvando...' : <><CheckCircleIcon className="w-4 h-4"/> Salvar O.S.</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Simple Icon component for the checklist section if not imported
const ClipboardListIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
  </svg>
);