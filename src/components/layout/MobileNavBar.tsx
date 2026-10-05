import React from 'react';
import { FileText, TrendingUp, Grid3X3, Settings } from 'lucide-react';
import type { ActiveTab } from './Sidebar';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenQuickBooking: () => void;
  pendingPaymentCount?: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const tabs = [
    {
      id: 'finance' as ActiveTab,
      labelEn: 'Bills',
      labelHi: 'बिल',
      icon: FileText,
    },
    {
      id: 'pnl' as ActiveTab,
      labelEn: 'P&L',
      labelHi: 'मुनाफा',
      icon: TrendingUp,
    },
    {
      id: 'front-desk' as ActiveTab,
      labelEn: 'Rooms',
      labelHi: 'कमरे',
      icon: Grid3X3,
    },
    {
      id: 'settings' as ActiveTab,
      labelEn: 'Settings',
      labelHi: 'सेटिंग्स',
      icon: Settings,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-2xl border-t border-[#E5DFD3] px-3 pt-2 pb-[max(env(safe-area-inset-bottom,8px),10px)] flex items-center justify-around md:hidden shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id || (tab.id === 'finance' && activeTab === 'finance');

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive
                ? 'text-indigo-600 font-bold'
                : 'text-stone-500 hover:text-stone-900 font-medium'
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${
              isActive ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-500/30' : ''
            }`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-sans">
              {tab.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
};
