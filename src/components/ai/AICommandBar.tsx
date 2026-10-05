import React, { useState, useEffect } from 'react';
import { Sparkles, Key, ArrowRight, CornerDownLeft, MessageSquare, FileText, Receipt, TrendingUp } from 'lucide-react';
import type { Room, Guest } from '../../types/hotel';

interface AICommandBarProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  guests: Guest[];
  onSelectAction: (action: string, payload?: any) => void;
}

export const AICommandBar: React.FC<AICommandBarProps> = ({
  isOpen,
  onClose,
  rooms,
  guests,
  onSelectAction
}) => {
  const [query, setQuery] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSearchChange = (val: string) => {
    setQuery(val);
    if (val.toLowerCase().includes('deluxe') || val.toLowerCase().includes('tomorrow')) {
      setAiResult('AI Insights: You have 2 Deluxe Ocean View rooms available tomorrow (Room 102 & Room 201).');
    } else if (val.toLowerCase().includes('pending') || val.toLowerCase().includes('payment')) {
      setAiResult('AI Insights: 1 Guest has pending balance (Vikram Malhotra in Room 201 - ₹1,400 pending).');
    } else if (val.toLowerCase().includes('vip')) {
      setAiResult('AI Insights: 2 VIP guests arriving/checked-in today: Rajesh Sharma & Dr. Sunita Patel.');
    } else if (val.toLowerCase().includes('whatsapp') || val.toLowerCase().includes('invoice')) {
      setAiResult('AI Insights: Ready to send WhatsApp invoice with UPI QR link.');
    } else {
      setAiResult(null);
    }
  };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(query.toLowerCase()) || 
    g.phone.includes(query)
  );

  const filteredRooms = rooms.filter(r => 
    r.number.includes(query) || 
    r.type.toLowerCase().includes(query.toLowerCase()) ||
    r.status.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-start justify-center pt-24 p-4 animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-[#F8F5EE] border border-[#DDD6C8] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[#E5DFD3] bg-white flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-700 animate-pulse" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Ask AI anything or search guest, room 101, pending payments..."
            className="w-full bg-transparent text-sm text-stone-900 focus:outline-none placeholder-stone-400 font-medium"
          />
          <button 
            onClick={onClose}
            className="px-2 py-1 text-xs text-stone-500 hover:text-stone-900 bg-[#FAF8F5] rounded-md border border-[#E5DFD3]"
          >
            ESC
          </button>
        </div>

        {aiResult && (
          <div className="p-3 mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-700" />
              {aiResult}
            </span>
            <button 
              onClick={() => {
                onSelectAction('ai-query', query);
                onClose();
              }}
              className="text-[11px] font-medium bg-amber-800 hover:bg-amber-900 text-white px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-sm"
            >
              Open AI <CornerDownLeft className="w-3 h-3" />
            </button>
          </div>
        )}

        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {!query && (
            <div>
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">Suggested Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { onSelectAction('new-booking'); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-stone-800 transition-colors text-left shadow-sm"
                >
                  <Key className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-stone-900">+ 30s Quick Walk-in</div>
                    <div className="text-[10px] text-stone-500">Direct booking & room assign</div>
                  </div>
                </button>

                <button 
                  onClick={() => { onSelectAction('whatsapp-trigger'); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-stone-800 transition-colors text-left shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-stone-900">WhatsApp Guest Hub</div>
                    <div className="text-[10px] text-stone-500">Send invoices & check-in QR</div>
                  </div>
                </button>

                <button 
                  onClick={() => { onSelectAction('new-invoice'); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-stone-800 transition-colors text-left shadow-sm"
                >
                  <FileText className="w-4 h-4 text-amber-700" />
                  <div>
                    <div className="font-semibold text-stone-900">+ New GST Invoice</div>
                    <div className="text-[10px] text-stone-500">Luxury A4 / WhatsApp PDF</div>
                  </div>
                </button>

                <button 
                  onClick={() => { onSelectAction('invoice-registry'); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-stone-800 transition-colors text-left shadow-sm"
                >
                  <Receipt className="w-4 h-4 text-amber-800" />
                  <div>
                    <div className="font-semibold text-stone-900">Invoice Register & CSV</div>
                    <div className="text-[10px] text-stone-500">Offline Dexie database & tax audit</div>
                  </div>
                </button>

                <button 
                  onClick={() => { onSelectAction('record-expense'); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-stone-800 transition-colors text-left shadow-sm"
                >
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  <div>
                    <div className="font-semibold text-stone-900">+ Record Expense (खर्च)</div>
                    <div className="text-[10px] text-stone-500">10s petty cash & vendor voucher</div>
                  </div>
                </button>

                <button 
                  onClick={() => { onSelectAction('view-pnl'); onClose(); }}
                  className="flex items-center gap-2.5 p-2.5 bg-white hover:bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl text-xs text-stone-800 transition-colors text-left shadow-sm"
                >
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-stone-900">Profit & Loss (P&L) Cockpit</div>
                    <div className="text-[10px] text-stone-500">Daily net margin & drawer check</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {filteredRooms.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">Rooms</span>
              <div className="space-y-1">
                {filteredRooms.slice(0, 3).map(room => (
                  <div 
                    key={room.id}
                    onClick={() => { onSelectAction('view-room', room); onClose(); }}
                    className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                        room.status === 'occupied' ? 'bg-red-100 text-red-700 border border-red-200' :
                        room.status === 'vacant' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        room.status === 'cleaning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-stone-200 text-stone-700'
                      }`}>
                        {room.number}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900">{room.type}</div>
                        <div className="text-[11px] text-stone-500">
                          {room.currentGuest ? `Occupied by ${room.currentGuest.name}` : `Tariff: ₹${room.pricePerNight}/night`}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded-full bg-[#E5DFD3] text-stone-700 font-semibold">
                      {room.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredGuests.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">Guests</span>
              <div className="space-y-1">
                {filteredGuests.slice(0, 3).map(guest => (
                  <div 
                    key={guest.id}
                    onClick={() => { onSelectAction('view-guest', guest); onClose(); }}
                    className="flex items-center justify-between p-2.5 hover:bg-white rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-200">
                        {guest.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                          {guest.name}
                          {guest.isVIP && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 rounded border border-amber-200">VIP</span>}
                        </div>
                        <div className="text-[11px] text-stone-500">{guest.phone} • {guest.visits} visits</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-[#E5DFD3] bg-[#FAF8F5] flex items-center justify-between text-[11px] text-stone-500">
          <span>Tip: Type room number or guest phone for 100ms lookup</span>
          <span>Ayushmaan OS Engine</span>
        </div>
      </div>
    </div>
  );
};
