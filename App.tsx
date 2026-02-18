


import React, { useState, useMemo } from 'react';
import { useAppContext } from './contexts/AppContext';
import { useDataContext } from './contexts/DataContext';
import { Page, WorkOrder, MaintenanceStatus, MaintenanceType, UserRole } from './types';

// Import Pages
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { PlanningPage } from './pages/PlanningPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { EquipmentTypesPage } from './pages/EquipmentTypesPage';
import { InventoryPage } from './pages/InventoryPage';
import { PurchasingPage } from './pages/PurchasingPage';
import { InventoryLogsPage } from './pages/InventoryLogsPage';
import { QualityPage } from './pages/QualityPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { InformationPage } from './pages/InformationPage';
import { PermissionDenied } from './components/PermissionDenied';
import { SchedulePage } from './pages/SchedulePage';
import { ActivityLogPage } from './pages/ActivityLogPage';

// Import Components
import { Sidebar } from './components/Sidebar';
import { AppHeader } from './components/AppHeader';
import { MaintenancePlanModal } from './components/MaintenancePlanModal';
import { CorrectiveRequestModal } from './components/CorrectiveRequestModal';
import { WorkOrderControlModal } from './components/WorkOrderControlModal';

const pagePermissions: Record<Page, UserRole[]> = {
    home: ['admin', 'gestor', 'manutencista', 'operador'],
    work_orders: ['admin', 'gestor', 'manutencista', 'operador'],
    dashboard: ['admin', 'gestor'],
    planning: ['admin', 'gestor'],
    schedule: ['admin', 'gestor', 'manutencista'],
    equipment: ['admin', 'gestor', 'manutencista'],
    equipment_types: ['admin'],
    inventory: ['admin', 'gestor', 'manutencista'],
    purchasing: ['admin', 'gestor'],
    inventory_logs: ['admin'],
    quality: ['admin', 'gestor'],
    history: ['admin', 'gestor', 'manutencista', 'operador'],
    reports: ['admin', 'gestor'],
    settings: ['admin'],
    documentation: ['admin', 'gestor'],
    information: ['admin', 'gestor', 'manutencista', 'operador'],
    activity_log: ['admin'],
};


const AppContent: React.FC = () => {
    const { 
        currentPage, userRole, handleLogin,
        isOSModalOpen, setIsOSModalOpen, editingOrder,
        isPlanModalOpen, setIsPlanModalOpen, editingPlan
    } = useAppContext();
    
    const { 
        equipmentData, workOrders, handleSaveWorkOrder,
        equipmentTypes, handlePlanSave, showToast, requesters,
        inventoryData, maintainers,
    } = useDataContext();
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isCorrectiveModalOpen, setIsCorrectiveModalOpen] = useState(false);

    if (!userRole) {
        return <LoginPage onLogin={handleLogin} />;
    }

    const renderPage = () => {
        const allowedRoles = pagePermissions[currentPage] || [];
        if (!allowedRoles.includes(userRole)) {
            return <PermissionDenied />;
        }
        
        switch (currentPage) {
            case 'home': return <HomePage />;
            case 'dashboard': return <DashboardPage />;
            case 'work_orders': return <WorkOrdersPage />;
            case 'planning': return <PlanningPage />;
            case 'schedule': return <SchedulePage />;
            case 'equipment': return <EquipmentPage />;
            case 'equipment_types': return <EquipmentTypesPage />;
            case 'inventory': return <InventoryPage />;
            case 'inventory_logs': return <InventoryLogsPage />;
            case 'purchasing': return <PurchasingPage />;
            case 'quality': return <QualityPage />;
            case 'history': return <HistoryPage />;
            case 'reports': return <ReportsPage />;
            case 'settings': return <SettingsPage />;
            case 'documentation': return <DocumentationPage />;
            case 'information': return <InformationPage />;
            case 'activity_log': return <ActivityLogPage />;
            default: return <HomePage />;
        }
    };
    
    const handleSaveOS = async (order: WorkOrder) => {
        const success = await handleSaveWorkOrder(order);
        if (success) {
            // O toast é disparado dentro do DataContext
        }
    }
    
    const handleCreateCorrective = async (data: any) => {
        const newOrder: WorkOrder = {
            id: '', 
            equipmentId: data.equipmentId,
            description: data.description,
            requester: data.requester,
            type: data.type || MaintenanceType.Corrective,
            status: MaintenanceStatus.Scheduled,
            scheduledDate: data.scheduledDate,
            failureDate: data.failureDate,
            correctiveCategory: data.category,
            machineStopped: data.priority === 'Alta',
            observations: data.location,
            externalCompany: data.externalCompany,
            imageBase64: data.imageBase64,
        };
        await handleSaveWorkOrder(newOrder);
        setIsCorrectiveModalOpen(false);
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans dark:bg-gray-900">
            <Sidebar 
              isCollapsed={isSidebarCollapsed}
              onToggle={() => setIsSidebarCollapsed(prev => !prev)}
              onCloseMobile={() => {
                  if (window.innerWidth < 768) setIsSidebarCollapsed(true);
              }}
            />
            <main className="flex-1 flex flex-col overflow-hidden">
                <AppHeader 
                    onToggleSidebar={() => setIsSidebarCollapsed(prev => !prev)} 
                    onOpenCorrectiveRequest={() => setIsCorrectiveModalOpen(true)}
                />
                <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-gray-950">
                    {renderPage()}
                </div>
            </main>

            {isOSModalOpen && (
                <WorkOrderControlModal
                    isOpen={isOSModalOpen}
                    onClose={() => setIsOSModalOpen(false)}
                    onSave={handleSaveOS} 
                    existingOrder={editingOrder}
                    equipmentData={equipmentData}
                    inventoryData={inventoryData}
                    nextOSNumber="" 
                    maintainers={maintainers}
                    requesters={requesters}
                />
            )}

            {isPlanModalOpen && (
                <MaintenancePlanModal
                    isOpen={isPlanModalOpen}
                    onClose={() => setIsPlanModalOpen(false)}
                    onSave={async (plan, applyToAll) => {
                        const success = await handlePlanSave(plan, applyToAll);
                        if (success) {
                            setIsPlanModalOpen(false);
                        }
                    }}
                    existingPlan={editingPlan}
                    equipmentTypes={equipmentTypes}
                    equipmentData={equipmentData}
                />
            )}
            
            {isCorrectiveModalOpen && (
                <CorrectiveRequestModal 
                    isOpen={isCorrectiveModalOpen}
                    onClose={() => setIsCorrectiveModalOpen(false)}
                    onCreate={handleCreateCorrective}
                    equipmentList={equipmentData}
                    requesters={requesters}
                />
            )}
        </div>
    );
};

const App: React.FC = () => <AppContent />;
export default App;