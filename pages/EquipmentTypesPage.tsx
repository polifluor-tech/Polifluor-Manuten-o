import React, { useState, useMemo } from 'react';
import { Header } from '../components/Header';
import { EquipmentType } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, CheckCircleIcon, ExclamationTriangleIcon } from '../components/icons';
import { EquipmentTypeModal } from '../components/EquipmentTypeModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { useDataContext } from '../contexts/DataContext';
import { useDebounce } from '../hooks/useDebounce';

export const EquipmentTypesPage: React.FC = () => {
    // FIX: Destructure missing properties from context
    const { equipmentTypes, handleEquipmentTypeSave, handleEquipmentTypeDelete, handleEquipmentTypeToggleStatus, equipmentData, showToast } = useDataContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<EquipmentType | null>(null);
    const [deletingType, setDeletingType] = useState<EquipmentType | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const filteredEquipmentTypes = useMemo(() => {
        const lowercasedTerm = debouncedSearchTerm.toLowerCase();
        if (!lowercasedTerm) {
            return equipmentTypes;
        }
        return equipmentTypes.filter(type =>
            type.description.toLowerCase().includes(lowercasedTerm)
        );
    }, [equipmentTypes, debouncedSearchTerm]);


    const openModal = (type: EquipmentType | null = null) => {
        setEditingType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setEditingType(null);
        setIsModalOpen(false);
    };

    const handleSave = async (type: EquipmentType) => {
        let typeToSave = type;
        if (!editingType) {
            const newId = type.description.toUpperCase().replace(/\s+/g, '_');
            if (equipmentTypes.some(t => t.id === newId)) {
                alert(`Erro: O ID gerado "${newId}" já existe.`);
                return;
            }
            typeToSave = { ...type, id: newId, active: true };
        }
        
        const success = await handleEquipmentTypeSave(typeToSave);
        if (success) {
            showToast("Tipo de equipamento salvo!", "success");
            closeModal();
        }
    };
    
    const handleDelete = async () => {
        if (!deletingType) return;
        const success = await handleEquipmentTypeDelete(deletingType.id);
        if (success) {
            showToast("Tipo excluído com sucesso", "info");
            setDeletingType(null);
        }
    };
    
    const handleDeleteClick = (type: EquipmentType) => {
        // FIX: Access 'typeId' property to check if type is in use
        const isInUse = equipmentData.some(eq => eq.typeId === type.id);
        if (isInUse) {
            alert(`Não é possível excluir o tipo "${type.description}" pois ele está sendo utilizado por um ou mais equipamentos.`);
            return;
        }
        setDeletingType(type);
    };

    const handleToggleStatus = (type: EquipmentType) => {
        const isInUse = equipmentData.some(eq => eq.typeId === type.id);
        if (type.active && isInUse) {
            alert("Não é possível desativar um tipo que está vinculado a equipamentos ativos.");
            return;
        }
        handleEquipmentTypeToggleStatus(type.id, !!type.active);
    };

    return (
        <>
            <Header
                title="Cadastro de Tipo de Equipamentos"
                subtitle="Gerencie os tipos de equipamentos utilizados no sistema."
                actions={
                    <button onClick={() => openModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors text-sm">
                        <PlusIcon />
                        Adicionar Tipo
                    </button>
                }
            />

            <div className="mt-4">
                 <input
                    type="text"
                    placeholder="Buscar por descrição..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/2 form-input"
                />
            </div>

            <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Descrição</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredEquipmentTypes.length > 0 ? (
                            filteredEquipmentTypes.map(type => {
                                const isInUse = equipmentData.some(eq => eq.typeId === type.id);
                                const isActive = type.active !== false; // Default to true

                                return (
                                    <tr key={type.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            {type.description}
                                            {isInUse && (
                                                <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                                                    Em uso
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {isActive ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <div className="flex items-center justify-center space-x-2">
                                                
                                                <button 
                                                    onClick={() => handleToggleStatus(type)}
                                                    className={`px-3 py-1 text-xs font-bold rounded uppercase transition-colors ${
                                                        isActive 
                                                        ? (isInUse ? 'text-gray-300 cursor-not-allowed' : 'text-orange-500 hover:bg-orange-50')
                                                        : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                    title={isActive && isInUse ? "Tipo em uso não pode ser desativado" : (isActive ? "Desativar Tipo" : "Reativar Tipo")}
                                                    disabled={isActive && isInUse}
                                                >
                                                    {isActive ? 'Desativar' : 'Reativar'}
                                                </button>

                                                <div className="w-px h-4 bg-gray-300 mx-2"></div>

                                                <button onClick={() => openModal(type)} className="p-2 text-gray-500 hover:text-blue-500" title="Editar"><EditIcon /></button>
                                                <button onClick={() => handleDeleteClick(type)} className="p-2 text-gray-500 hover:text-red-500" title="Excluir"><DeleteIcon /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                             <tr>
                                <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                    {searchTerm 
                                        ? `Nenhum resultado para "${searchTerm}"`
                                        : "Nenhum tipo de equipamento cadastrado."
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <EquipmentTypeModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    onSave={handleSave}
                    existingType={editingType}
                />
            )}

            {deletingType && (
                <ConfirmationModal
                    isOpen={!!deletingType}
                    onClose={() => setDeletingType(null)}
                    onConfirm={handleDelete}
                    title="Confirmar Exclusão"
                    message={`Tem certeza que deseja excluir o tipo "${deletingType.description}"?`}
                />
            )}
        </>
    );
};