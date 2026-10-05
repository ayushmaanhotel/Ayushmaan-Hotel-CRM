import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';
import type { StaffAccount } from '../../types/hotel';

interface StaffLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffAccounts: StaffAccount[];
  onLoginSuccess: (staff: StaffAccount) => void;
}

export const StaffLoginModal: React.FC<StaffLoginModalProps> = ({
  isOpen,
  onClose,
  staffAccounts,
  onLoginSuccess
}) => {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      setErrorMsg(null);
      if (next.length === 4) {
        verifyPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verifyPin = (pin: string) => {
    const match = staffAccounts.find(s => s.pin === pin && s.active);
    if (match) {
      onLoginSuccess(match);
      setPinInput('');
      setErrorMsg(null);
      onClose();
    } else {
      setErrorMsg('Invalid Staff PIN. Try 1111 (Cleaner), 2222 (Receptionist), or 9999 (Admin).');
      setPinInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#F8F5EE] border border-[#DDD6C8] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-stone-900">Staff Scope Login</span>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 text-center space-y-4 bg-[#F8F5EE]">
          <div>
            <h3 className="text-sm font-bold text-stone-900">Enter 4-Digit Staff PIN</h3>
            <p className="text-[11px] text-stone-600 mt-0.5">Enforces active staff scopes across Ayushmaan OS</p>
          </div>

          <div className="flex justify-center items-center gap-3 py-2">
            {[0, 1, 2, 3].map((idx) => (
              <div 
                key={idx}
                className={`w-4 h-4 rounded-full border transition-all ${
                  pinInput.length > idx 
                    ? 'bg-indigo-600 border-indigo-500 shadow-sm' 
                    : 'bg-stone-200 border-stone-300'
                }`}
              ></div>
            ))}
          </div>

          {errorMsg && (
            <div className="text-[10px] text-red-700 font-mono bg-red-50 p-2 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5 max-w-[220px] mx-auto pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="w-14 h-14 rounded-2xl bg-white hover:bg-stone-50 active:scale-95 border border-stone-200 text-stone-900 font-mono text-lg font-bold transition-all shadow-2xs"
              >
                {num}
              </button>
            ))}
            <button 
              onClick={handleDelete}
              className="w-14 h-14 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono text-xs font-semibold flex items-center justify-center border border-stone-200"
            >
              DEL
            </button>
            <button 
              onClick={() => handleKeyPress('0')}
              className="w-14 h-14 rounded-2xl bg-white hover:bg-stone-50 active:scale-95 border border-stone-200 text-stone-900 font-mono text-lg font-bold transition-all shadow-2xs"
            >
              0
            </button>
            <div className="w-14 h-14 flex items-center justify-center text-[10px] font-mono text-stone-400">
              PIN
            </div>
          </div>

          <div className="p-2.5 bg-white rounded-xl border border-[#E5DFD3] text-[10px] text-stone-600 text-left font-mono space-y-0.5 shadow-2xs">
            <div>💡 Default Test PINs:</div>
            <div>• Housekeeper: <span className="text-emerald-700 font-bold">1111</span></div>
            <div>• Receptionist: <span className="text-sky-700 font-bold">2222</span></div>
            <div>• Owner / Admin: <span className="text-amber-800 font-bold">9999</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
