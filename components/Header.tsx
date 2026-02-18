import React from 'react';

interface HeaderProps {
    title: string;
    subtitle: string;
    actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between sm:items-center pb-2 gap-4">
      <div>
        <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">{subtitle}</p>
      </div>
       {actions && <div className="flex-shrink-0">{actions}</div>}
    </header>
  );
};