import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  Crown, 
  ShieldCheck, 
  MessageSquare, 
  Search, 
  Clock,
  Sparkles
} from 'lucide-react';
import type { Guest } from '../../types/hotel';

interface GuestTimelineProps {
  guests: Guest[];
  onOpenWhatsApp: (guest: Guest) => void;
}

export const GuestTimeline: React.FC<GuestTimelineProps> = ({
  guests,
  onOpenWhatsApp
}) => {
  const [selectedGuestId, setSelectedGuestId] = useState<string>(guests[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.phone.includes(searchQuery)
  );

  const currentGuest = guests.find(g => g.id === selectedGuestId) || guests[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            Guest 360° Profile & Timeline
          </h2>
          <p className="text-xs text-stone-500">Receptionist immediately knows lifetime value, room preference, complaints, invoices & notes.</p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Search guest by name / phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF8F5] text-xs text-stone-900 pl-9 pr-3 py-2 rounded-xl border border-[#E5DFD3] focus:outline-none focus:border-[#C4A482] placeholder:text-stone-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-sm space-y-2 max-h-[70vh] overflow-y-auto">
          <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider block mb-2">Guest Directory ({filteredGuests.length})</span>
          {filteredGuests.map(guest => {
            const isSelected = guest.id === currentGuest?.id;
            return (
              <div 
                key={guest.id}
                onClick={() => setSelectedGuestId(guest.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all duration-150 flex items-center justify-between ${
                  isSelected ? 'bg-[#FAF8F5] border border-[#DDD6C8] shadow-sm' : 'hover:bg-[#FAF8F5] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-800 font-bold text-sm flex items-center justify-center border border-amber-500/20">
                    {guest.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
                      {guest.name}
                      {guest.isVIP && <span className="text-[9px] bg-amber-500/20 text-amber-800 px-1 rounded border border-amber-500/30">VIP</span>}
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono">{guest.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-semibold text-emerald-700">₹{guest.totalSpent.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-stone-500">{guest.visits} Stays</div>
                </div>
              </div>
            );
          })}
        </div>

        {currentGuest && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 bg-white rounded-2xl border border-[#E5DFD3] shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-900 font-extrabold text-xl flex items-center justify-center border border-amber-500/30 shadow-inner">
                    {currentGuest.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-stone-900 tracking-tight">{currentGuest.name}</h3>
                      {currentGuest.isVIP && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 text-[10px] font-mono border border-amber-500/30 flex items-center gap-1">
                          <Crown className="w-3 h-3 text-amber-700" /> VIP Guest
                        </span>
                      )}
                      {currentGuest.aadhaarVerified && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-mono border border-emerald-500/30 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" /> Aadhaar Verified
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-stone-400" /> {currentGuest.phone}</span>
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-stone-400" /> {currentGuest.email}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => onOpenWhatsApp(currentGuest)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> WhatsApp Hub
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
                  <span className="text-[10px] text-stone-500 block">Total Stays</span>
                  <span className="text-sm font-bold text-stone-900 font-mono">{currentGuest.visits} Times</span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
                  <span className="text-[10px] text-stone-500 block">Lifetime Revenue</span>
                  <span className="text-sm font-bold text-emerald-700 font-mono">₹{currentGuest.totalSpent.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
                  <span className="text-[10px] text-stone-500 block">Preferred Room</span>
                  <span className="text-xs font-semibold text-stone-800">{currentGuest.preferredRoomType}</span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E5DFD3]">
                  <span className="text-[10px] text-stone-500 block">Pending Balance</span>
                  <span className={`text-sm font-bold font-mono ${currentGuest.pendingBalance > 0 ? 'text-red-600' : 'text-stone-500'}`}>
                    ₹{currentGuest.pendingBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3] space-y-1">
                <span className="text-[11px] font-semibold text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" /> Staff Internal Notes & Preferences:
                </span>
                <p className="text-xs text-stone-700 italic">{currentGuest.notes || 'No special complaints recorded. Always pays via UPI.'}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-sm space-y-4">
              <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Stay & Activity History</h4>
              <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E5DFD3]">
                <div className="flex items-start gap-4 relative pl-8">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 flex items-center justify-center absolute left-0 text-xs">
                    ✓
                  </div>
                  <div className="p-3 bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl w-full">
                    <div className="flex items-center justify-between text-xs text-stone-900 font-semibold">
                      <span>Stay in Executive Suite (Room 101)</span>
                      <span className="text-[10px] text-stone-500 font-mono">24 Jul 2026</span>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-1">Paid ₹4,200 via UPI • Instant GST Invoice INV-2026-0891 issued</div>
                  </div>
                </div>

                <div className="flex items-start gap-4 relative pl-8">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30 flex items-center justify-center absolute left-0 text-xs">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div className="p-3 bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl w-full">
                    <div className="flex items-center justify-between text-xs text-stone-900 font-semibold">
                      <span>Previous Stay in Deluxe Ocean View</span>
                      <span className="text-[10px] text-stone-500 font-mono">12 Jun 2026</span>
                    </div>
                    <div className="text-[11px] text-stone-600 mt-1">Guest gave 5-star Google review via automated WhatsApp link</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
