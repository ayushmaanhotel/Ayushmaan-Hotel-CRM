import { 
  LayoutDashboard, 
  Grid3X3, 
  Users, 
  IndianRupee, 
  Sparkles, 
  Settings, 
  Brush,
  BarChart3,
  ShieldCheck,
  TrendingUp,
  Command
} from 'lucide-react';
import type { UserRole } from '../../hooks/useHotelStore';

export type ActiveTab = 'front-desk' | 'rooms' | 'guests' | 'finance' | 'pnl' | 'operations' | 'owner-analytics' | 'admin-scopes' | 'ai-assistant' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openCmdK: () => void;
  occupancyRate: number;
  todayRevenue: number;
  pendingPaymentCount: number;
  activeRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openCmdK,
  occupancyRate,
  todayRevenue,
  pendingPaymentCount,
  activeRole
}) => {
  const navItems = [
    { id: 'front-desk', label: 'Front Desk', icon: LayoutDashboard, badge: 'Heart' },
    { id: 'rooms', label: 'Rooms Board', icon: Grid3X3, badge: `${occupancyRate}%` },
    { id: 'guests', label: 'Guests 360°', icon: Users },
    { id: 'finance', label: 'Finance & UPI', icon: IndianRupee, badge: pendingPaymentCount > 0 ? `${pendingPaymentCount} Pending` : undefined },
    { id: 'pnl', label: 'P&L & Expenses', icon: TrendingUp, highlight: true },
    { id: 'operations', label: 'Housekeeping', icon: Brush },
    { id: 'owner-analytics', label: 'Owner Insights', icon: BarChart3, highlight: true },
    { id: 'admin-scopes', label: 'Staff Scopes Admin', icon: ShieldCheck, highlight: true },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles, highlight: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="hidden md:flex w-64 h-screen bg-[#FAF8F5]/95 backdrop-blur-xl flex-col justify-between border-r border-[#E5DFD3] sticky top-0 z-30 select-none shrink-0">
      <div>
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/favicon.png" alt="Ayushmaan Invoice" className="w-9 h-9 rounded-xl object-cover shadow-sm shrink-0" />
            <div>
              <h1 className="font-bold text-sm tracking-tight text-stone-900 flex items-center gap-1.5">
                Ayushmaan <span className="text-xs font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-md border border-indigo-200">Invoice</span>
              </h1>
              <p className="text-[11px] text-stone-500 font-medium">GST Billing & P&L Engine</p>
            </div>
          </div>
        </div>

        <div className="px-3 pt-3">
          <button 
            onClick={openCmdK}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-[#E5DFD3] text-xs text-stone-600 transition-colors group shadow-2xs"
          >
            <span className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-stone-400 group-hover:text-indigo-600 transition-colors" />
              <span>Ask AI / Quick Search</span>
            </span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-stone-100 text-stone-600 rounded border border-stone-200">⌘K</kbd>
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive 
                    ? 'bg-white text-stone-900 shadow-xs border border-[#DDD6C8] font-bold' 
                    : item.highlight 
                      ? 'text-indigo-700 hover:bg-indigo-50/70 hover:text-indigo-900' 
                      : 'text-stone-600 hover:bg-stone-100/80 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : item.highlight ? 'text-indigo-600' : 'text-stone-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                    isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-[#E5DFD3]">
        <div className="p-3 rounded-2xl bg-white border border-[#E5DFD3] shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-stone-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Grand Heritage Inn
            </span>
            <span className="text-[10px] font-mono text-stone-500 uppercase">{activeRole}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#E5DFD3]">
              <span className="text-[10px] text-stone-500 block">Today's Rev</span>
              <span className="text-xs font-bold text-emerald-700 font-mono">₹{todayRevenue.toLocaleString('en-IN')}</span>
            </div>
            <div className="bg-[#FAF8F5] p-2 rounded-xl border border-[#E5DFD3]">
              <span className="text-[10px] text-stone-500 block">Occupancy</span>
              <span className="text-xs font-bold text-indigo-700 font-mono">{occupancyRate}%</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
