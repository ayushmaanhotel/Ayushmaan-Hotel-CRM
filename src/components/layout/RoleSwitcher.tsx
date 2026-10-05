import React, { useState } from 'react';
import { 
  Crown, 
  Briefcase, 
  UserCheck, 
  Brush, 
  User, 
  Share2,
  Lock,
  ChevronDown
} from 'lucide-react';
import type { UserRole } from '../../hooks/useHotelStore';
import type { StaffAccount } from '../../types/hotel';

interface RoleSwitcherProps {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  currentStaff: StaffAccount | null;
  onOpenShareModal: () => void;
  onOpenStaffLoginModal: () => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  activeRole,
  setActiveRole,
  currentStaff,
  onOpenShareModal,
  onOpenStaffLoginModal
}) => {
  const [isMobileRoleMenuOpen, setIsMobileRoleMenuOpen] = useState(false);

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'owner', label: 'Owner View', icon: Crown, color: 'text-amber-800 bg-amber-50 border-amber-300' },
    { id: 'manager', label: 'Manager View', icon: Briefcase, color: 'text-indigo-800 bg-indigo-50 border-indigo-300' },
    { id: 'receptionist', label: 'Reception Desk', icon: UserCheck, color: 'text-sky-800 bg-sky-50 border-sky-300' },
    { id: 'housekeeper', label: 'Cleaner App', icon: Brush, color: 'text-emerald-800 bg-emerald-50 border-emerald-300' },
    { id: 'guest', label: 'Guest Portal', icon: User, color: 'text-stone-800 bg-stone-100 border-stone-300' },
  ];

  const currentRoleObj = roles.find(r => r.id === activeRole) || roles[0];
  const CurrentRoleIcon = currentRoleObj.icon;

  return (
    <div className="bg-[#FAF8F5]/95 border-b border-[#E5DFD3] px-3 sm:px-4 pt-[max(env(safe-area-inset-top,0px),10px)] pb-2.5 sticky top-0 z-40 backdrop-blur-xl">
      {/* Mobile Top App Bar */}
      <div className="flex md:hidden items-center justify-between gap-2">
        <div className="flex items-center gap-2 relative">
          <img src="/favicon.png" alt="Ayushmaan Invoice" className="w-8 h-8 rounded-xl object-cover shadow-sm shrink-0" />

          <div className="relative">
            <button
              onClick={() => setIsMobileRoleMenuOpen(!isMobileRoleMenuOpen)}
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${currentRoleObj.color}`}
            >
              <CurrentRoleIcon className="w-3.5 h-3.5" />
              <span className="truncate max-w-[110px]">{currentRoleObj.label}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isMobileRoleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Mobile Role Switcher Dropdown */}
            {isMobileRoleMenuOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 bg-stone-900/30 backdrop-blur-xs" 
                  onClick={() => setIsMobileRoleMenuOpen(false)} 
                />
                <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-[#E5DFD3] rounded-2xl shadow-xl p-1.5 z-50 space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                    Switch Active Role
                  </div>
                  {roles.map(r => {
                    const Icon = r.icon;
                    const isActive = activeRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => {
                          setActiveRole(r.id);
                          setIsMobileRoleMenuOpen(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all ${
                          isActive 
                            ? `${r.color} font-bold shadow-xs border` 
                            : 'text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{r.label}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {currentStaff && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-[#E5DFD3] text-[11px] text-stone-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-stone-900">{currentStaff.name.split(' ')[0]}</span>
            </div>
          )}

          <button 
            onClick={onOpenStaffLoginModal}
            className="p-2 sm:px-2.5 sm:py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300 flex items-center gap-1 transition-all active:scale-95 shadow-2xs"
            title="Staff PIN Login"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">PIN</span>
          </button>

          <button 
            onClick={onOpenShareModal}
            className="p-2 sm:px-2.5 sm:py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1 transition-all active:scale-95"
            title="Grant Access"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
        </div>
      </div>

      {/* Desktop Top Bar (>= md) */}
      <div className="hidden md:flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Active Scope Role:</span>
          <div className="flex items-center gap-1 bg-[#F2ECE1] p-1 rounded-xl border border-[#E5DFD3]">
            {roles.map(r => {
              const Icon = r.icon;
              const isActive = activeRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setActiveRole(r.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                    isActive 
                      ? `${r.color} font-semibold shadow-xs border` 
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentStaff && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-[#E5DFD3] text-xs text-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-stone-900">{currentStaff.name.split(' ')[0]}</span>
              <span className="text-[10px] font-mono text-stone-500">({currentStaff.id})</span>
            </div>
          )}

          <button 
            onClick={onOpenStaffLoginModal}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300 flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Staff PIN Login</span>
          </button>

          <button 
            onClick={onOpenShareModal}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Grant Access</span>
          </button>
        </div>
      </div>
    </div>
  );
};
