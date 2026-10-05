import React, { useState } from 'react';
import { 
  X, 
  User, 
  Phone, 
  IndianRupee, 
  CheckCircle2, 
  Sparkles, 
  QrCode, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { Room, Guest, HotelConfig } from '../../types/hotel';
import { MOCK_GUESTS } from '../../data/mockData';
import { RealUPIQRCode } from '../payment/RealUPIQRCode';

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRoom?: Room;
  rooms: Room[];
  hotelConfig: HotelConfig;
  onCompleteBooking: (bookingDetails: any) => void;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  selectedRoom,
  rooms,
  hotelConfig,
  onCompleteBooking
}) => {
  const [step, setStep] = useState<number>(1);
  const [chosenRoomId, setChosenRoomId] = useState<string>(selectedRoom?.id || rooms.find(r => r.status === 'vacant')?.id || '');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [autoGuest, setAutoGuest] = useState<Guest | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [nights, setNights] = useState<number>(1);
  const [paymentMode, setPaymentMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentRoom = rooms.find(r => r.id === chosenRoomId) || selectedRoom || rooms[0];
  const totalTariff = (currentRoom?.pricePerNight || 3000) * nights;

  const handlePhoneChange = (val: string) => {
    setPhoneInput(val);
    const match = MOCK_GUESTS.find(g => g.phone.includes(val) || val.includes('98765'));
    if (match && val.length >= 5) {
      setAutoGuest(match);
      setGuestName(match.name);
    } else {
      setAutoGuest(null);
    }
  };

  const handleFinishBooking = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onCompleteBooking({
        room: currentRoom,
        guestName: autoGuest ? autoGuest.name : guestName || 'Walk-in Guest',
        phone: phoneInput || '+91 98000 00000',
        nights,
        paymentMode,
        totalAmount: totalTariff
      });
      setIsSuccess(false);
      setStep(1);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#F8F5EE] border border-[#DDD6C8] rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 tracking-tight">30-Second Quick Booking Flow</h3>
              <p className="text-[11px] text-stone-600">Search room → Enter phone → Collect UPI → Done</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900">Booking Confirmed!</h3>
              <p className="text-xs text-stone-600 mt-1">Room {currentRoom?.number} assigned to {guestName || 'Guest'}.</p>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-mono">
              ✓ Real Merchant UPI Payment QR generated & Digital Voucher ready!
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-3 gap-2">
              <div className={`h-1.5 rounded-full ${step >= 1 ? 'bg-indigo-600' : 'bg-stone-300'}`}></div>
              <div className={`h-1.5 rounded-full ${step >= 2 ? 'bg-indigo-600' : 'bg-stone-300'}`}></div>
              <div className={`h-1.5 rounded-full ${step >= 3 ? 'bg-indigo-600' : 'bg-stone-300'}`}></div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700 block">Select Available Room</label>
                  <select 
                    value={chosenRoomId} 
                    onChange={(e) => setChosenRoomId(e.target.value)}
                    className="w-full bg-[#FAF8F5] text-xs text-stone-900 p-3 rounded-xl border border-stone-300 focus:outline-none focus:bg-white focus:border-indigo-500"
                  >
                    {rooms.filter(r => r.status === 'vacant').map(r => (
                      <option key={r.id} value={r.id}>
                        Room {r.number} - {r.type} (₹{r.pricePerNight}/night)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700 block">Nights Stay</label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 5, 7].map(n => (
                      <button
                        key={n}
                        onClick={() => setNights(n)}
                        className={`flex-1 py-2 text-xs font-mono rounded-xl border transition-colors ${
                          nights === n ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs' : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
                        }`}
                      >
                        {n} {n === 1 ? 'Night' : 'Nights'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#E5DFD3] flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium">Total Room Tariff:</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">₹{totalTariff.toLocaleString('en-IN')}</span>
                </div>

                <button 
                  onClick={() => setStep(2)}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm"
                >
                  Continue to Guest Info <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700 block">Enter Guest Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input 
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={phoneInput}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full bg-[#FAF8F5] text-sm text-stone-900 pl-9 pr-3 py-2.5 rounded-xl border border-stone-300 focus:outline-none focus:bg-white focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-stone-500">Type 98765 to auto-fetch VIP profile: Rajesh Sharma</span>
                </div>

                {autoGuest ? (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-indigo-600" />
                        {autoGuest.name}
                      </span>
                      {autoGuest.isVIP && <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded border border-amber-300">VIP</span>}
                    </div>
                    <div className="text-[11px] text-stone-600">{autoGuest.visits} Past Stays • Total Spent: ₹{autoGuest.totalSpent.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Aadhaar Verified
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-stone-700 block">Guest Full Name</label>
                    <input 
                      type="text"
                      placeholder="Enter guest name"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-[#FAF8F5] text-xs text-stone-900 p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs rounded-xl border border-stone-300 font-semibold"
                  >
                    Back
                  </button>
                  <button 
                    onClick={() => setStep(3)}
                    className="w-2/3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-sm"
                  >
                    Proceed to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-stone-700 block">Select Payment Mode</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setPaymentMode('UPI')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMode === 'UPI' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-emerald-600 mb-1" />
                      <div className="text-xs font-bold">Real Merchant UPI</div>
                      <div className="text-[10px] text-stone-500">{hotelConfig.upiVpa}</div>
                    </button>

                    <button 
                      onClick={() => setPaymentMode('Cash')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMode === 'Cash' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <IndianRupee className="w-4 h-4 text-amber-600 mb-1" />
                      <div className="text-xs font-bold">Cash</div>
                      <div className="text-[10px] text-stone-500">Counter receipt</div>
                    </button>

                    <button 
                      onClick={() => setPaymentMode('Card')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        paymentMode === 'Card' ? 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-1 ring-indigo-500/20 shadow-xs' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <CreditCardIcon className="w-4 h-4 text-sky-600 mb-1" />
                      <div className="text-xs font-bold">Card / POS</div>
                      <div className="text-[10px] text-stone-500">Swipe terminal</div>
                    </button>
                  </div>
                </div>

                {/* Real Scannable UPI Engine */}
                {paymentMode === 'UPI' && (
                  <RealUPIQRCode 
                    upiVpa={hotelConfig.upiVpa}
                    merchantName={hotelConfig.merchantName}
                    amount={totalTariff}
                    bookingRef={`AYU-${Date.now().toString().slice(-4)}`}
                  />
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => setStep(2)}
                    className="w-1/3 py-2.5 bg-white hover:bg-stone-50 text-stone-700 text-xs rounded-xl border border-stone-300 font-semibold"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleFinishBooking}
                    className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Confirm & Issue Key (30s)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
