import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Shield, Share2, Crown, UserCheck, Brush } from 'lucide-react';
import type { UserRole } from '../../hooks/useHotelStore';

interface ShareAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
}

export const ShareAccessModal: React.FC<ShareAccessModalProps> = ({
  isOpen,
  onClose,
  currentRole: _currentRole
}) => {
  const [selectedRoleToShare, setSelectedRoleToShare] = useState<UserRole>('receptionist');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const accessUrl = `http://127.0.0.1:3000/?role=${selectedRoleToShare}&hotelId=grand-heritage`;

  const handleCopy = () => {
    navigator.clipboard.writeText(accessUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#F8F5EE] border border-[#DDD6C8] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">Grant Staff & Guest Access</h3>
              <p className="text-[11px] text-stone-600">Share role-specific access links & QR codes without password headaches</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 block">Select Access Role to Grant</label>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setSelectedRoleToShare('receptionist')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3.5 transition-all ${
                  selectedRoleToShare === 'receptionist' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-sky-600" />
                <div>
                  <div className="text-xs font-bold">Reception Desk</div>
                  <div className="text-[10px] text-stone-500">Walk-ins, billing & check-in</div>
                </div>
              </button>

              <button 
                onClick={() => setSelectedRoleToShare('housekeeper')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3.5 transition-all ${
                  selectedRoleToShare === 'housekeeper' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Brush className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-bold">Housekeeper / Cleaner</div>
                  <div className="text-[10px] text-stone-500">Mobile cleaning checklist</div>
                </div>
              </button>

              <button 
                onClick={() => setSelectedRoleToShare('owner')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3.5 transition-all ${
                  selectedRoleToShare === 'owner' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="text-xs font-bold">Owner Access</div>
                  <div className="text-[10px] text-stone-500">Fill rates, RevPAR & financials</div>
                </div>
              </button>

              <button 
                onClick={() => setSelectedRoleToShare('guest')}
                className={`p-3 rounded-xl border text-left flex items-center gap-3.5 transition-all ${
                  selectedRoleToShare === 'guest' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                <Shield className="w-4 h-4 text-stone-500" />
                <div>
                  <div className="text-xs font-bold">Guest Portal Link</div>
                  <div className="text-[10px] text-stone-500">Self check-in & digital key</div>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-700 block">Shareable Access URL</label>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-[#E5DFD3] shadow-xs">
              <input 
                type="text" 
                readOnly 
                value={accessUrl}
                className="w-full bg-transparent text-xs text-indigo-700 font-mono focus:outline-none px-2 font-medium"
              />
              <button 
                onClick={handleCopy}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-white rounded-xl border border-[#E5DFD3] shadow-xs flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-stone-900">Mobile QR Code Access</div>
              <div className="text-[10px] text-stone-500">Scan with phone camera for direct mobile login</div>
            </div>
            <div className="w-14 h-14 bg-stone-50 border border-stone-200 p-1 rounded-lg flex items-center justify-center">
              <QrCode className="w-12 h-12 text-stone-800" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-[#E5DFD3] flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold border border-stone-300 shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
