import React from 'react';
import {
  LayoutDashboard,
  Users,
  Store,
  Briefcase,
  TrendingUp,
} from 'lucide-react';
import { TabKey, UserRole } from '../types';

interface TabsNavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  userRole: UserRole;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onSelectTab,
  userRole,
}) => {
  const isDirektur = userRole === 'direktur';

  const tabs: { key: TabKey; label: string; icon: React.ElementType; hidden?: boolean }[] = [
    {
      key: 'executive',
      label: 'Ringkasan Eksekutif',
      icon: LayoutDashboard,
    },
    {
      key: 'am',
      label: 'Kinerja per AM',
      icon: Users,
      hidden: !isDirektur, // Hidden for AM
    },
    {
      key: 'bo',
      label: 'Kinerja per Cabang (BO)',
      icon: Store,
    },
    {
      key: 'principal',
      label: 'Kinerja per Principal',
      icon: Briefcase,
    },
    {
      key: 'rankings',
      label: 'Peringkat & Analisis',
      icon: TrendingUp,
      hidden: !isDirektur, // Hidden for AM
    },
  ];

  return (
    <div className="border-b border-slate-200 bg-white px-4 sm:px-6">
      <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5">
        {tabs
          .filter((t) => !t.hidden)
          .map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => onSelectTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
      </nav>
    </div>
  );
};
