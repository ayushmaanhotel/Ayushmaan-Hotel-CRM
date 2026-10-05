import React, { useMemo } from 'react';
import {
  BedDouble,
  LogOut,
  Sparkles,
  Phone,
  Bell,
  ShieldCheck,
  Clock
} from 'lucide-react';
import type { Room, Guest } from '../../types/hotel';
import type { HotelConfig } from '../../types/hotel';
import { RealUPIQRCode } from '../payment/RealUPIQRCode';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/primitives';

/* ============================================================
   GUEST PORTAL — what the guest sees when the hotel grants
   them the "Guest Portal" scope. Deliberately simple and warm:
   their stay, their bill, one-tap service requests. No admin
   chrome, no revenue data, no staff tools.
   ============================================================ */

interface GuestPortalModuleProps {
  rooms: Room[];
  guests: Guest[];
  hotelConfig: HotelConfig;
}

export const GuestPortalModule: React.FC<GuestPortalModuleProps> = ({ rooms, guests, hotelConfig }) => {
  const { toast } = useToast();

  // Resolve the "current" in-house guest for this demo device.
  const { myRoom, myGuest } = useMemo(() => {
    const occupied = rooms.filter(r => r.status === 'occupied' && r.currentGuest);
    const pending = occupied.find(r => (r.currentGuest?.pendingBalance ?? 0) > 0);
    const chosen = pending ?? occupied[0];
    return {
      myRoom: chosen,
      myGuest: chosen?.currentGuest ?? guests[0]
    };
  }, [rooms, guests]);

  const pendingBalance = myGuest?.pendingBalance ?? 0;

  const requestService = (label: string, eta: string) => {
    toast('success', `${label} requested`, `Housekeeping has been notified. Expected in about ${eta}.`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Welcome header */}
      <div className="surface-hero rounded-2xl p-5 md:p-6">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-gold-700 uppercase">Guest Portal</div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-stone-900 mt-1">
              Namaste, {myGuest?.name.split(' ')[0] ?? 'Guest'} 🙏
            </h1>
            <p className="text-xs text-stone-600 mt-1.5">
              Everything about your stay at {hotelConfig.merchantName} — in one calm place.
            </p>
          </div>
          {myGuest?.isVIP && (
            <span className="px-2.5 py-1 rounded-full bg-gold-100 text-gold-800 border border-gold-300 text-[10px] font-bold uppercase tracking-wide">
              VIP Stay
            </span>
          )}
        </div>
      </div>

      {/* Stay summary */}
      <div className="surface-panel rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-stone-900">Your Stay</h2>
          <span className="text-[10px] font-mono text-stone-400 uppercase">In House</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-ivory-100 p-3 rounded-xl border border-stone-200/80">
            <BedDouble className="w-4 h-4 text-maroon-600 mb-1.5" />
            <span className="text-[10px] text-stone-500 block">Room</span>
            <span className="text-sm font-bold text-stone-900">{myRoom ? `${myRoom.number} · ${myRoom.type}` : '—'}</span>
          </div>
          <div className="bg-ivory-100 p-3 rounded-xl border border-stone-200/80">
            <LogOut className="w-4 h-4 text-maroon-600 mb-1.5" />
            <span className="text-[10px] text-stone-500 block">Check-out</span>
            <span className="text-sm font-bold text-stone-900">{myRoom?.checkOutTime ?? 'On departure'}</span>
          </div>
          <div className="bg-ivory-100 p-3 rounded-xl border border-stone-200/80">
            <Clock className="w-4 h-4 text-maroon-600 mb-1.5" />
            <span className="text-[10px] text-stone-500 block">Until 11:00 AM</span>
            <span className="text-sm font-bold text-stone-900">Late till 12 PM</span>
          </div>
          <div className={`p-3 rounded-xl border ${pendingBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <span className="text-[10px] text-stone-500 block">Pending</span>
            <span className={`text-sm font-extrabold font-mono ${pendingBalance > 0 ? 'text-red-700' : 'text-emerald-700'}`}>₹{pendingBalance.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Pay pending balance */}
      {pendingBalance > 0 && myRoom && (
        <div className="surface-panel rounded-2xl p-5 space-y-3">
          <h2 className="font-display text-lg font-semibold text-stone-900">Settle Your Bill</h2>
          <p className="text-xs text-stone-500">Scan or tap with any UPI app — GPay, PhonePe, Paytm or BHIM. Receipt lands on WhatsApp instantly.</p>
          <RealUPIQRCode
            upiVpa={hotelConfig.upiVpa}
            merchantName={hotelConfig.merchantName}
            amount={pendingBalance}
            bookingRef={`STAY-${myRoom.number}`}
          />
        </div>
      )}

      {/* Service requests */}
      <div className="surface-panel rounded-2xl p-5 space-y-4">
        <h2 className="font-display text-lg font-semibold text-stone-900">One-tap Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="secondary" className="justify-start" onClick={() => requestService('Housekeeping', '20 mins')}>
            <Sparkles className="w-4 h-4 text-maroon-600" /> Clean my room
          </Button>
          <Button variant="secondary" className="justify-start" onClick={() => requestService('Towels & amenities', '15 mins')}>
            <Bell className="w-4 h-4 text-maroon-600" /> Extra towels
          </Button>
          <Button variant="secondary" className="justify-start" onClick={() => toast('info', 'Front desk dialled', 'Reception is ringing you back in a moment.')}>
            <Phone className="w-4 h-4 text-maroon-600" /> Call front desk
          </Button>
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-center gap-2 text-[11px] text-stone-400 px-1">
        <ShieldCheck className="w-3.5 h-3.5" />
        You are viewing the guest portal. Staff tools and hotel accounts are not accessible in this mode.
      </div>
    </div>
  );
};
