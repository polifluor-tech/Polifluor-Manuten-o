import React, { useState, useEffect } from 'react';
// FIX: Add missing imports for AssetCategory and HomeIcon
import { Equipment, EquipmentType, MaintenancePlan, AssetCategory } from '../types';
import { CloseIcon, TargetIcon, WrenchIcon, HomeIcon } from './icons';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (equipment: Equipment) => void;
  existingEquipment: Equipment | null;
  equipmentTypes: EquipmentType[];
  maintenancePlans: MaintenancePlan[];
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({ isOpen, onClose, onSave, existingEquipment, equipmentTypes, maintenancePlans }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<AssetCategory>(AssetCategory.Industrial);
  const [status, setStatus] = useState<'Ativo' | 'Inativo' | 'Desativado'>('Ativo');
  const [model, setModel] = useState('');
  const [yearOfManufacture, setYearOfManufacture] = useState('');
  const [isCritical, setIsCritical] = useState(false);
  const [preservationNotes, setPreservationNotes] = useState('');
  const [customerSpecificRequirements, setCustomerSpecificRequirements] = useState('');
  const [customPlanId, setCustomPlanId] = useState('');
  const [typeId, setTypeId] = useState('');

  // Filtra apenas tipos ativos para novos cadastros, mas mantém o atual se estiver editando (mesmo se inativo)
  const activeTypes = equipmentTypes.filter(t => t.active !== false || (existingEquipment && t.id === existingEquipment.typeId));

  useEffect(() => {
    if (existingEquipment) {
      setId(existingEquipment.id);
      setName(existingEquipment.name);
      setLocation(existingEquipment.location || '');
      setCategory(existingEquipment.category || AssetCategory.Industrial);
      setStatus(existingEquipment.status || 'Ativo');
      setModel(existingEquipment.model || '');
      setYearOfManufacture(String(existingEquipment.yearOfManufacture || ''));
      setIsCritical(existingEquipment.isCritical || false);
      setPreservationNotes(existingEquipment.preservationNotes || '');
      setCustomerSpecificRequirements(existingEquipment.customerSpecificRequirements || '');
      setCustomPlanId(existingEquipment.customPlanId || '');
      setTypeId(existingEquipment.typeId || '');
    } else {
      setId('');
      setName('');
      setLocation('');
      setCategory(AssetCategory.Industrial);
      setStatus('Ativo');
      setModel('');
      setYearOfManufacture('');
      setIsCritical(false);
      setPreservationNotes('');
      setCustomerSpecificRequirements('');
      setCustomPlanId('');
      setTypeId('');
    }
  }, [existingEquipment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // FIX: Correctly construct the equipment data object for saving
    const equipmentData: Equipment = {
        // Spread existing to preserve fields not on the form
        ...(existingEquipment || {}),
        id, 
        name, 
        typeId, // Use typeId from state
        location, 
        category, 
        status, 
        model, 
        yearOfManufacture,
        isCritical: isCritical, 
        preservationNotes, 
        customerSpecificRequirements,
        customPlanId: customPlanId || undefined,
    };
    onSave(equipmentData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <CloseIcon className="w-5 h-5"/>
        </button>

        <div className="mb-6">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Ficha do Ativo</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Configuração Técnica e Criticidade</p>
        </div>

        <div className="space-y-5">
            {/* ZONA DE CATEGORIA E CRITICIDADE */}
            <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border-2 transition-all flex flex-col gap-2 ${category === AssetCategory.Facility ? 'border-emerald-200 bg-emerald-50/30' : 'border-blue-200 bg-blue-50/30'}`}>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Tipo de Ativo</label>
                    <div className="flex gap-2">
                        <button 
                            type="button" 
                            onClick={() => setCategory(AssetCategory.Industrial)}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-md transition-all ${category === AssetCategory.Industrial ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400'}`}
                        >
                            <WrenchIcon className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase">Industrial</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={() => setCategory(AssetCategory.Facility)}
                            className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-md transition-all ${category === AssetCategory.Facility ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-slate-400'}`}
                        >
                            <HomeIcon className="w-4 h-4" />
                            <span className="text-[9px] font-black uppercase">Predial</span>
                        </button>
                    </div>
                </div>

                <div className={`p-4 rounded-lg border-2 transition-all flex flex-col justify-center items-center gap-2 ${isCritical ? 'border-orange-500 bg-orange-50/50' : 'border-gray-100 bg-gray-50'}`}>
                    <p className={`text-[10px] font-black uppercase ${isCritical ? 'text-orange-800' : 'text-gray-500'}`}>Equipamento Chave?</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                    </label>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Cód. Identificação</label>
                    <input type="text" value={id} onChange={e => setId(e.target.value)} required disabled={!!existingEquipment} className="form-input font-bold disabled:opacity-50" placeholder="Ex: PH-15" />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nome / Descrição</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required className="form-input font-bold" placeholder="Ex: Prensa Hidráulica" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Família / Tipo</label>
                    <select value={typeId} onChange={e => setTypeId(e.target.value)} required className="form-input text-xs font-bold">
                        <option value="">Selecione...</option>
                        {activeTypes.map(t => <option key={t.id} value={t.id}>{t.description}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Localização</label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="form-input text-xs" placeholder="Ex: Galpão A" />
                </div>
            </div>

            <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Vincular Plano de Manutenção</label>
                <select value={customPlanId} onChange={e => setCustomPlanId(e.target.value)} className="form-input text-xs border-blue-100 bg-blue-50/30">
                    <option value="">Automático pelo Tipo</option>
                    {maintenancePlans.map(p => <option key={p.id} value={p.id}>{p.description} ({p.frequency}m)</option>)}
                </select>
            </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg font-bold text-xs text-gray-400 hover:text-gray-600 uppercase transition-all">Descartar</button>
          <button type="submit" className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-lg transition-all uppercase tracking-wider">Salvar Ativo</button>
        </div>
      </form>
    </div>
  );
};