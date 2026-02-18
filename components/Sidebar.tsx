

import React, { useMemo } from 'react';
import { Page, MaintenanceStatus, UserRole } from '../types';
import { useAppContext } from '../contexts/AppContext';
import { useDataContext } from '../contexts/DataContext';
import {
    SettingsIcon, UsersIcon, InventoryIcon, PackageIcon, ClipboardListIcon,
    ScheduleIcon, HomeIcon, ChartIcon, ShieldCheckIcon,
    WrenchIcon, InfoIcon, DocumentTextIcon, ShoppingCartIcon, RefreshIcon,
    TargetIcon, ChevronRightIcon, ChevronLeftIcon, DownloadIcon, SecurityIcon
} from './icons';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    page: Page;
    badge?: number;
    badgeType?: 'notification' | 'info';
}

const NavItem: React.FC<{
    item: NavItemProps;
    onClick: (page: Page) => void;
    isActive: boolean;
    isCollapsed: boolean;
}> = ({ item, onClick, isActive, isCollapsed }) => {
    
    // VISUAL: Se estiver ativo, fundo vermelho escuro e texto branco. Impossível não ver.
    const activeClass = isActive 
        ? 'bg-[#D32F2F] text-white shadow-md transform scale-[1.02]' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900';

    const iconClass = isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600';

    return (
        <li className="relative group px-2">
            <button
                onClick={() => onClick(item.page)}
                className={`flex items-center w-full p-3 mb-1 transition-all duration-200 rounded-xl
                ${activeClass}
                ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
                <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    {React.isValidElement(item.icon) && React.cloneElement(item.icon as React.ReactElement<any>, { 
                        className: `w-5 h-5 ${iconClass}` 
                    })}
                </div>

                {!isCollapsed && (
                    <span className="ml-3 text-xs font-black tracking-tight truncate flex-1 text-left uppercase">
                        {item.label}
                    </span>
                )}

                {/* Badges */}
                {!isCollapsed && item.badge && item.badge > 0 && (
                    <span className={`ml-auto text-[9px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-[#D32F2F]' : (item.badgeType === 'notification' ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-600')
                    }`}>
                        {item.badge}
                    </span>
                )}
            </button>
        </li>
    );
};

const SectionHeader: React.FC<{ title: string; isCollapsed: boolean }> = ({ title, isCollapsed }) => {
    if (isCollapsed) return <div className="h-px bg-slate-200 my-4 mx-4"></div>;
    return (
        <h3 className="px-5 mt-6 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-70">
            {title}
        </h3>
    );
};

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle, onCloseMobile }) => {
    const { currentPage, setCurrentPage, userRole } = useAppContext();
    const { workOrders, equipmentData, equipmentTypes, inventoryData } = useDataContext();

    const handleNav = (page: Page) => {
        setCurrentPage(page);
        if (window.innerWidth < 768) onCloseMobile();
    };

    const menuItems = useMemo((): Record<string, NavItemProps[]> => {
        const delayedCount = workOrders.filter(o => o.status === MaintenanceStatus.Delayed).length;
        
        const allItems: Record<string, NavItemProps[]> = {
            geral: [
                { icon: <HomeIcon />, label: "Visão Geral", page: "home" },
                { icon: <ChartIcon />, label: "Dashboard KPI", page: "dashboard" },
            ],
            operacoes: [
                { icon: <ClipboardListIcon />, label: "Ordens Serviço", page: "work_orders", badge: delayedCount, badgeType: 'notification' },
                { icon: <TargetIcon />, label: "Planejamento", page: "planning" },
                { icon: <ScheduleIcon />, label: "Cronograma", page: "schedule" },
                { icon: <PackageIcon />, label: "Ativos", page: "equipment" },
                { icon: <WrenchIcon />, label: "Tipos Ativos", page: "equipment_types" },
            ],
            recursos: [
                { icon: <InventoryIcon />, label: "Almoxarifado", page: "inventory" },
                { icon: <ShoppingCartIcon />, label: "Compras", page: "purchasing" },
            ],
            qualidade: [
                { icon: <ShieldCheckIcon />, label: "Auditoria IATF", page: "quality" },
                { icon: <WrenchIcon />, label: "Histórico", page: "history" },
                { icon: <DownloadIcon />, label: "Relatórios", page: "reports" },
            ],
            sistema: [
                { icon: <SettingsIcon />, label: "Configurações", page: "settings" },
                { icon: <DocumentTextIcon />, label: "Impressão", page: "documentation" },
                { icon: <SecurityIcon />, label: "Auditoria / Log", page: "activity_log" },
                { icon: <InfoIcon />, label: "Sobre", page: "information" },
            ]
        };
        return allItems;
    }, [workOrders, equipmentData, equipmentTypes, inventoryData]);

    const roleBasedMenu = useMemo(() => {
        const { geral, operacoes, recursos, qualidade, sistema } = menuItems;
        // Lógica de perfil simplificada para não poluir o código aqui
        if (userRole === 'admin') return [
            { title: 'Principal', items: geral },
            { title: 'Operacional', items: operacoes },
            { title: 'Recursos', items: recursos },
            { title: 'Gestão', items: qualidade },
            { title: 'Admin', items: sistema },
        ];
        return [
             { title: 'Menu', items: [...geral, operacoes[0], operacoes[2], ...recursos, ...qualidade, sistema[2]] }
        ];
    }, [userRole, menuItems]);

    return (
        <aside className={`flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <div className={`flex items-center h-20 border-b border-slate-100 ${isCollapsed ? 'justify-center' : 'px-6'}`}>
                <div className="w-8 h-8 bg-[#D32F2F] rounded-md flex items-center justify-center text-white shadow-md flex-shrink-0">
                    <span className="font-black italic text-[10px]">PF</span>
                </div>
                {!isCollapsed && (
                    <div className="ml-3">
                        <h1 className="text-lg font-black text-slate-900 leading-none tracking-tighter italic">POLIFLUOR</h1>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SGMI 2.0</p>
                    </div>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                {roleBasedMenu.map(section => (
                    <div key={section.title}>
                        <SectionHeader title={section.title} isCollapsed={isCollapsed} />
                        <ul className="space-y-1">
                            {section.items.map(item => (
                                <NavItem 
                                    key={item.page}
                                    item={item}
                                    onClick={handleNav}
                                    isActive={currentPage === item.page}
                                    isCollapsed={isCollapsed}
                                />
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button 
                    onClick={onToggle}
                    className="flex items-center justify-center w-full py-3 bg-slate-50 text-slate-400 hover:text-[#D32F2F] hover:bg-red-50 rounded-xl transition-colors"
                >
                    {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
            </div>
        </aside>
    );
};