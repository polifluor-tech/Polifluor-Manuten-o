import React, { useState, useMemo, useEffect } from 'react';
import { Equipment, CorrectiveCategory, MaintenanceStatus, MaintenanceType } from '../types';
import { CloseIcon, ClockIcon, ExclamationTriangleIcon, TargetIcon, WrenchIcon, PackageIcon, ShieldCheckIcon, HomeIcon, CheckCircleIcon, DocumentTextIcon, LightBulbIcon, UploadIcon } from './icons';

interface CorrectiveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: any) => void;
    equipmentList: Equipment[];
    requesters: string[];
}

const PREDICAL_RISK_KEYWORDS = ['rachadura', 'infiltração', 'estrutura', 'poste', 'risco de queda'];

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});


export const CorrectiveRequestModal: React.FC<CorrectiveRequestModalProps> = ({
    isOpen, onClose, onCreate, equipmentList, requesters
}) => {
    const [isEmergency, setIsEmergency] = useState(false);
    const [isExternalService, setIsExternalService] = useState(false);
    const [isPredial, setIsPredial] = useState(false);
    const [equipmentId, setEquipmentId] = useState('');
    const [customAsset, setCustomAsset] = useState('');
    const [location, setLocation] = useState('');
    const [locationDisplay, setLocationDisplay] = useState('');
    const [description, setDescription] = useState('');
    const [externalCompany, setExternalCompany] = useState('');
    const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
    const [imagePreview, setImagePreview] = useState<string | undefined>(undefined);
    const [requester, setRequester] = useState('');
    const [category, setCategory] = useState<CorrectiveCategory>(CorrectiveCategory.Mechanical);
    const [failureDateTime, setFailureDateTime] = useState(() => new Date().toISOString().slice(0, 16));
    const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [showRiskSuggestion, setShowRiskSuggestion] = useState(false);
    const [maintenanceType, setMaintenanceType] = useState<MaintenanceType>(MaintenanceType.Corrective);

    const sortedEquipment = useMemo(() => {
        return [...equipmentList].sort((a, b) => a.id.localeCompare(b.id));
    }, [equipmentList]);

    useEffect(() => {
        if (isPredial) {
            setEquipmentId('');
            setLocationDisplay('');
            setMaintenanceType(MaintenanceType.Predial);
            setCategory(CorrectiveCategory.Building);
            const hasRisk = PREDICAL_RISK_KEYWORDS.some(kw => description.toLowerCase().includes(kw));
            setShowRiskSuggestion(hasRisk);
        } else {
            setCustomAsset('');
            setLocation('');
            setMaintenanceType(MaintenanceType.Corrective);
            setCategory(CorrectiveCategory.Mechanical);
            setShowRiskSuggestion(false);
        }
    }, [isPredial, description]);

    useEffect(() => {
        if (!isPredial && equipmentId) {
            const selectedEq = equipmentList.find(eq => eq.id === equipmentId);
            setLocationDisplay(selectedEq?.location || 'Não especificado');
        } else {
            setLocationDisplay('');
        }
    }, [equipmentId, isPredial, equipmentList]);
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImagePreview(URL.createObjectURL(file));
            const base64 = await toBase64(file);
            setImageBase64(base64);
        }
    };


    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const finalId = isPredial ? 'ATIVO_PREDIAL_GENERICO' : equipmentId;
        const finalDescription = isPredial ? `[Ativo: ${customAsset}] ${description}` : description;
        const finalLocation = isPredial ? location : locationDisplay;

        if (!finalId || !finalDescription || !requester || (isPredial && !location)) {
            alert("Por favor, preencha todos os campos obrigatórios (*)");
            return;
        };
        
        const externalTag = isExternalService ? `[SERVIÇO EXTERNO: ${externalCompany || 'N/A'}] ` : '';
        
        onCreate({
            equipmentId: finalId, 
            description: externalTag + finalDescription, 
            requester, 
            priority: isEmergency ? 'Alta' : 'Média', 
            category, 
            failureDate: failureDateTime,
            scheduledDate: scheduledDate,
            type: maintenanceType,
            location: finalLocation,
            externalCompany: isExternalService ? externalCompany : undefined,
            imageBase64: imageBase64,
        });
        onClose();
    };
    
    const applyShortcut = (asset: string, desc: string, loc: string = '') => {
        setIsPredial(true);
        setCustomAsset(asset);
        setDescription(desc);
        setLocation(loc);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-fade-in-up">
                
                <div className={`px-8 py-5 text-white transition-all duration-500 flex justify-between items-center ${isEmergency ? 'bg-rose-700' : 'bg-slate-800'}`}>
                    <div className="flex items-center gap-5">
                        <div className={`p-4 rounded-2xl ${isEmergency ? 'bg-white text-rose-700 animate-pulse' : 'bg-blue-600 text-white'}`}>
                            {isEmergency ? <ExclamationTriangleIcon className="w-7 h-7" /> : <WrenchIcon className="w-7 h-7" />}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter">
                                {isEmergency ? 'Chamado Crítico' : 'Solicitação Corretiva'}
                            </h2>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Vínculo com Processos ISO/IATF</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white/10 rounded-full"><CloseIcon className="w-6 h-6"/></button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto max-h-[80vh] bg-slate-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${isEmergency ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                            <span className="text-[10px] font-black uppercase text-slate-500">Urgência Crítica?</span>
                            <input type="checkbox" checked={isEmergency} onChange={() => setIsEmergency(!isEmergency)} className="w-6 h-6 text-rose-600 rounded" />
                        </div>
                        <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${isExternalService ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-100'}`}>
                            <span className="text-[10px] font-black uppercase text-slate-500">Mão de Obra Externa?</span>
                            <input type="checkbox" checked={isExternalService} onChange={e => setIsExternalService(e.target.checked)} className="w-6 h-6 text-amber-600 rounded" />
                        </div>
                        <div className={`p-4 rounded-xl border-2 flex items-center justify-between ${isPredial ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}>
                            <span className="text-[10px] font-black uppercase text-slate-500">Manutenção Predial?</span>
                            <input type="checkbox" checked={isPredial} onChange={e => setIsPredial(e.target.checked)} className="w-6 h-6 text-green-600 rounded" />
                        </div>
                    </div>

                    {isExternalService && (
                         <div className="animate-fade-in">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Empresa Terceirizada</label>
                            <input type="text" value={externalCompany} onChange={e => setExternalCompany(e.target.value)} placeholder="Nome da empresa contratada" className="w-full h-12 form-input font-bold bg-amber-50 border-amber-200" />
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            {isPredial ? (
                                <>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Ativo Predial *</label>
                                    <input type="text" value={customAsset} onChange={e => setCustomAsset(e.target.value)} required={isPredial} className="w-full h-12 form-input font-black" placeholder="Ex: Telhado Galpão A, Janela" />
                                </>
                            ) : (
                                <>
                                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Equipamento *</label>
                                    <select value={equipmentId} onChange={e => setEquipmentId(e.target.value)} required={!isPredial} className="w-full h-12 form-input font-black">
                                        <option value="">Selecione o Ativo...</option>
                                        {sortedEquipment.map(eq => <option key={eq.id} value={eq.id}>{eq.id} - {eq.name}</option>)}
                                    </select>
                                </>
                            )}
                        </div>
                        <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Localização *</label>
                           {isPredial ? (
                               <input type="text" value={location} onChange={e => setLocation(e.target.value)} required className="w-full h-12 form-input font-bold" placeholder="Ex: Banheiro Executivo" />
                           ) : (
                               <input type="text" value={locationDisplay} readOnly className="w-full h-12 form-input font-bold bg-slate-100" />
                           )}
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Descrição Técnica do Problema *</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} placeholder="Ex: Vazamento no pistão, bico entupido..." className="w-full p-4 form-input font-bold" />
                    </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Anexar Foto do Problema</label>
                            <input type="file" accept="image/*" onChange={handleFileChange} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                        </div>
                         {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-slate-200" />}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Data/Hora da Falha</label>
                            <input type="datetime-local" value={failureDateTime} onChange={e => setFailureDateTime(e.target.value)} className="w-full h-12 form-input font-bold" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Data Programada para Execução</label>
                            <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className="w-full h-12 form-input font-bold" />
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6 bg-slate-100 border-t border-slate-200 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button>
                    <button type="submit" className="px-12 py-4 bg-blue-700 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-blue-800 transition-all">
                        Registrar Solicitação
                    </button>
                </div>
            </form>
        </div>
    );
};
