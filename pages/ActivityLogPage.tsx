

import React from 'react';
import { Header } from '../components/Header';
import { useDataContext } from '../contexts/DataContext';
import { ActivityLogEntry } from '../types';
import { PlusIcon, EditIcon, DeleteIcon, SecurityIcon } from '../components/icons';

const ActionIcon: React.FC<{ action: ActivityLogEntry['action'] }> = ({ action }) => {
    switch(action) {
        case 'INSERT': return <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full"><PlusIcon className="w-4 h-4"/></div>;
        case 'UPDATE': return <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><EditIcon className="w-4 h-4"/></div>;
        case 'DELETE': return <div className="p-2 bg-rose-100 text-rose-600 rounded-full"><DeleteIcon className="w-4 h-4"/></div>;
        default: return <div className="p-2 bg-slate-100 text-slate-600 rounded-full"><SecurityIcon className="w-4 h-4"/></div>;
    }
};

export const ActivityLogPage: React.FC = () => {
    const { activityLog, isSyncing } = useDataContext();

    return (
        <div className="space-y-6 animate-fade-in">
            <Header 
                title="Log de Atividades do Sistema"
                subtitle="Auditoria de todas as ações importantes realizadas pelos usuários."
            />

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-slate-100 dark:border-gray-700">
                <div className="p-4 border-b border-slate-100 dark:border-gray-700">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Últimas 200 Ações</h3>
                </div>
                
                <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {isSyncing && activityLog.length === 0 && (
                        <div className="p-12 text-center text-slate-400">Carregando logs...</div>
                    )}

                    {!isSyncing && activityLog.length === 0 && (
                        <div className="p-12 text-center text-slate-400">Nenhuma atividade registrada ainda.</div>
                    )}
                    
                    <ul className="divide-y divide-slate-100 dark:divide-gray-700">
                        {activityLog.map(log => (
                            <li key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-50/50 dark:hover:bg-gray-900/50 transition-colors">
                                <ActionIcon action={log.action} />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                        {log.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1">
                                        <span className="text-[10px] font-bold text-slate-400">
                                            {new Date(log.created_at).toLocaleString('pt-BR')}
                                        </span>
                                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                                            {log.user_email || 'Usuário Desconhecido'}
                                        </span>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};