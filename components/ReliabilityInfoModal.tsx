
import React from 'react';
import { CloseIcon } from './icons';

interface ReliabilityInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Definition: React.FC<{ term: string; children: React.ReactNode }> = ({ term, children }) => (
    <div className="py-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
        <h4 className="font-black text-sm uppercase tracking-wider text-gray-800 dark:text-white">{term}</h4>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

export const ReliabilityInfoModal: React.FC<ReliabilityInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-3xl m-4 relative border border-gray-200 dark:border-gray-600 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
            <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1 uppercase tracking-tight">Indicadores de Confiabilidade</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Definições e Fórmulas Usadas no Sistema</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
              <CloseIcon className="w-5 h-5"/>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <Definition term="Disponibilidade Inerente">
                <p><strong>O que é?</strong> É a disponibilidade "ideal" do equipamento. Mede o percentual de tempo que a máquina estaria disponível se considerarmos apenas as paradas por **quebras inesperadas (corretivas)**.</p>
                <p><strong>Por que é útil?</strong> Mostra a confiabilidade real do ativo, ignorando o tempo gasto em manutenções planejadas (preventivas, melhorias). Um valor alto aqui significa que a máquina quebra pouco.</p>
                <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-slate-200 dark:border-gray-700">
                    <p className="text-[10px] font-black uppercase text-slate-400">Fórmula na Aplicação:</p>
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400 block mt-1">Disponibilidade = ((Horas Disponíveis Totais - Horas de Parada Corretiva) / Horas Disponíveis Totais) * 100</code>
                </div>
            </Definition>

            <Definition term="Disponibilidade Operacional">
                <p><strong>O que é?</strong> É a disponibilidade "real" do chão de fábrica. Mede o percentual de tempo que a máquina esteve efetivamente disponível para produzir, considerando **TODAS as paradas de manutenção**, planejadas ou não.</p>
                <p><strong>Por que é útil?</strong> Reflete o impacto total da manutenção na produção. Um valor baixo pode indicar que a máquina quebra muito ou que as manutenções planejadas são muito demoradas.</p>
                <div className="p-3 bg-slate-50 dark:bg-gray-900/50 rounded-lg border border-slate-200 dark:border-gray-700">
                    <p className="text-[10px] font-black uppercase text-slate-400">Fórmula na Aplicação:</p>
                    <code className="text-xs font-mono text-blue-600 dark:text-blue-400 block mt-1">Disponibilidade = ((Horas Disponíveis Totais - Horas de Parada TOTAIS) / Horas Disponíveis Totais) * 100</code>
                </div>
            </Definition>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-100 dark:border-gray-700 bg-slate-50/50">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-blue-600 text-white font-black text-xs uppercase shadow-md hover:bg-blue-700 transition-colors">
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
