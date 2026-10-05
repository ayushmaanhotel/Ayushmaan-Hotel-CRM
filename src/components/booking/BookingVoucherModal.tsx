import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Printer, MessageSquare, Building, ShieldCheck } from 'lucide-react';
import type { Room } from '../../types/hotel';
import { generateQrDataUrl } from '../../services/qr';

interface BookingVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInvoice?: () => void;
  bookingData: {
    bookingRef: string;
    room: Room;
    guestName: string;
    phone: string;
    nights: number;
    paymentMode: string;
    totalAmount: number;
    invoiceId?: string;
  } | null;
}

export const BookingVoucherModal: React.FC<BookingVoucherModalProps> = ({
  isOpen,
  onClose,
  onOpenInvoice,
  bookingData
}) => {
  const [tokenQrUrl, setTokenQrUrl] = useState<string>('');

  useEffect(() => {
    if (bookingData?.bookingRef) {
      generateQrDataUrl(`HOTEL-CHECKIN:${bookingData.bookingRef}:${bookingData.room.number}`, { width: 140 })
        .then(setTokenQrUrl)
        .catch(console.error);
    }
  }, [bookingData?.bookingRef, bookingData?.room?.number]);

  if (!isOpen || !bookingData) return null;

  const whatsappMessage = `Namaste ${bookingData.guestName} Ji! 🙏 Your booking at Grand Heritage Inn is CONFIRMED!\n\n📋 Booking Ref: ${bookingData.bookingRef}\n🏨 Room: ${bookingData.room.number} (${bookingData.room.type})\n🌙 Stay: ${bookingData.nights} Night(s)\n💰 Total Tariff Paid: ₹${bookingData.totalAmount.toLocaleString('en-IN')}\n\n📍 Navigate in Google Maps: https://maps.google.com/?q=Grand+Heritage+Inn`;

  const whatsappUrl = `https://wa.me/${bookingData.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#F8F5EE] border border-[#DDD6C8] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Digital Booking Confirmation Voucher</h3>
              <p className="text-[11px] text-stone-500 font-mono">{bookingData.bookingRef}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 bg-[#F8F5EE]">
          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-stone-900 text-xs">Grand Heritage Inn</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[10px] border border-emerald-200 font-semibold">
                CONFIRMED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5DFD3]">
              <div>
                <span className="text-[10px] text-stone-500 block font-medium">Guest Name</span>
                <span className="text-xs font-bold text-stone-900">{bookingData.guestName}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block font-medium">Phone</span>
                <span className="text-xs font-mono text-stone-700">{bookingData.phone}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block font-medium">Assigned Room</span>
                <span className="text-xs font-mono font-bold text-indigo-700">Room {bookingData.room.number}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block font-medium">Total Tariff</span>
                <span className="text-xs font-mono font-bold text-emerald-700">₹{bookingData.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#E5DFD3] flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[10px] text-stone-500 block font-mono">Digital Check-in Token</span>
                <span className="text-[9px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Ready at Front Desk
                </span>
              </div>
              <div className="w-12 h-12 bg-white p-1 rounded-lg border border-stone-200 flex items-center justify-center overflow-hidden shadow-2xs">
                {tokenQrUrl ? (
                  <img src={tokenQrUrl} alt="Check-in QR" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-stone-100 animate-pulse rounded" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-[#E5DFD3] flex flex-col gap-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-2 text-center"
          >
            <MessageSquare className="w-4 h-4" /> Send Confirmation on WhatsApp
          </a>

          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="w-1/2 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-stone-600" /> Print Voucher
            </button>
            <button 
              onClick={onClose}
              className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm"
            >
              Done
            </button>
          </div>

          {onOpenInvoice && bookingData.invoiceId && (
            <button
              onClick={onOpenInvoice}
              className="w-full py-2.5 bg-zinc-950 hover:bg-zinc-800 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" /> View Premium GST Tax Invoice (PDF)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
