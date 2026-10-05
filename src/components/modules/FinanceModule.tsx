import React, { useState } from 'react';
import { 
  QrCode, 
  CreditCard, 
  Wallet, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Receipt,
  Settings,
  Check
} from 'lucide-react';
import type { Transaction, HotelConfig } from '../../types/hotel';
import type { Invoice } from '../../types/invoice';
import { InvoiceRegister } from '../finance/InvoiceRegister';

interface FinanceModuleProps {
  transactions: Transaction[];
  todayRevenue: number;
  hotelConfig: HotelConfig;
  onUpdateHotelConfig: (config: Partial<HotelConfig>) => void;
  onOpenGSTModal: (tx: Transaction) => void;
  invoices: Invoice[];
  onNewBill: () => void;
  onOpenInvoice: (inv: Invoice) => void;
  onDuplicateInvoice: (inv: Invoice) => void;
  onRecordPayment: (inv: Invoice, amount: number, mode: 'UPI' | 'Cash' | 'Card') => void;
  onCancelInvoice: (inv: Invoice, reason: string) => void;
  onExportBackup: () => void;
  onOpenInvoiceRegistry?: () => void;
  onOpenBrandingSettings?: () => void;
  onOpenNewInvoice?: () => void;
}

export const FinanceModule: React.FC<FinanceModuleProps> = ({
  transactions,
  todayRevenue,
  hotelConfig,
  onUpdateHotelConfig,
  onOpenGSTModal,
  invoices,
  onNewBill,
  onOpenInvoice,
  onDuplicateInvoice,
  onRecordPayment,
  onCancelInvoice,
  onExportBackup,
  onOpenInvoiceRegistry,
  onOpenBrandingSettings,
  onOpenNewInvoice
}) => {
  const [upiVpaInput, setUpiVpaInput] = useState(hotelConfig.upiVpa);
  const [merchantInput, setMerchantInput] = useState(hotelConfig.merchantName);
  const [isSaved, setIsSaved] = useState(false);

  const upiTotal = transactions.filter(t => t.type === 'UPI').reduce((acc, t) => acc + t.amount, 0);
  const cashTotal = transactions.filter(t => t.type === 'Cash').reduce((acc, t) => acc + t.amount, 0);
  const cardTotal = transactions.filter(t => t.type === 'Card').reduce((acc, t) => acc + t.amount, 0);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHotelConfig({
      upiVpa: upiVpaInput,
      merchantName: merchantInput
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            Finance & Merchant UPI Cockpit
          </h2>
          <p className="text-xs text-stone-500">Zero accounting complexity. Immediate breakdown of Cash, UPI, Card, GST Invoices & Expenses.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenBrandingSettings && (
            <button 
              type="button"
              onClick={onOpenBrandingSettings}
              className="px-3 py-2 bg-white hover:bg-[#FAF8F5] text-stone-700 text-xs font-semibold rounded-xl border border-[#E5DFD3] flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-amber-700" /> Hotel Branding & Slabs
            </button>
          )}

          {onOpenInvoiceRegistry && (
            <button 
              type="button"
              onClick={onOpenInvoiceRegistry}
              className="px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#F5EFEB] text-stone-800 text-xs font-semibold rounded-xl border border-[#DDD6C8] flex items-center gap-2 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-amber-800" /> GST Tax Register & CSV
            </button>
          )}

          {onOpenNewInvoice && (
            <button 
              type="button"
              onClick={onOpenNewInvoice}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-colors"
            >
              <FileText className="w-4 h-4" /> + New GST Invoice
            </button>
          )}
        </div>
      </div>

      {/* Hotel Real UPI VPA Config Card */}
      <form onSubmit={handleSaveConfig} className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center justify-center shrink-0">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-stone-900">Hotel Real Merchant UPI Configuration</h3>
            <p className="text-[11px] text-stone-500">Generated QR codes will route instant payments directly to this VPA ID.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="text" 
            value={upiVpaInput}
            onChange={(e) => setUpiVpaInput(e.target.value)}
            placeholder="e.g. hotel@upi"
            className="bg-[#FAF8F5] text-xs text-stone-900 font-mono px-3 py-2 rounded-xl border border-[#E5DFD3] focus:outline-none focus:border-[#C4A482] w-44"
          />
          <input 
            type="text" 
            value={merchantInput}
            onChange={(e) => setMerchantInput(e.target.value)}
            placeholder="Merchant Legal Name"
            className="bg-[#FAF8F5] text-xs text-stone-900 px-3 py-2 rounded-xl border border-[#E5DFD3] focus:outline-none focus:border-[#C4A482] w-48"
          />
          <button 
            type="submit"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
          >
            {isSaved ? <Check className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
            {isSaved ? 'Saved VPA!' : 'Save VPA'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Today's Total Revenue</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-stone-900">₹{todayRevenue.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500 block font-medium">100% Reconciled for today</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5"><QrCode className="w-4 h-4 text-emerald-600" /> UPI Collections</span>
            <span className="text-[10px] font-mono bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#E5DFD3]">VPA: {hotelConfig.upiVpa}</span>
          </div>
          <div className="text-xl font-bold font-mono text-stone-900">₹{upiTotal.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500">PhonePe / Google Pay QR</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5"><Wallet className="w-4 h-4 text-amber-700" /> Cash Counter</span>
          </div>
          <div className="text-xl font-bold font-mono text-stone-900">₹{cashTotal.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500">In Reception Cash Drawer</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5DFD3] shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-stone-600 font-medium">
            <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-sky-600" /> Card / POS</span>
          </div>
          <div className="text-xl font-bold font-mono text-stone-900">₹{cardTotal.toLocaleString('en-IN')}</div>
          <span className="text-[10px] text-stone-500">Swipe Terminal</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600" />
            Today's GST Transactions & Receipts
          </h3>
          <span className="text-xs text-stone-500 font-mono">GST slabs 0% / 5% / 18% (post Sep-2025)</span>
        </div>

        <div className="space-y-2">
          {transactions.map(tx => (
            <div 
              key={tx.id}
              className="p-3.5 bg-[#FAF8F5] hover:bg-[#F5EFEB] border border-[#E5DFD3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center border ${
                  tx.type === 'UPI' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  tx.type === 'Cash' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-sky-100 text-sky-800 border-sky-200'
                }`}>
                  {tx.type}
                </div>
                <div>
                  <div className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                    {tx.guestName}
                    <span className="text-[10px] font-mono text-stone-500">Room {tx.roomNumber}</span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    Invoice: {tx.gstInvoiceNumber} • {tx.time}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-emerald-700">₹{tx.amount.toLocaleString('en-IN')}</div>
                  <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Paid & Settled
                  </div>
                </div>

                <button 
                  onClick={() => onOpenGSTModal(tx)}
                  className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-[#E5DFD3] text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-800" /> Tax Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <InvoiceRegister
        invoices={invoices}
        onNew={onNewBill}
        onOpen={onOpenInvoice}
        onDuplicate={onDuplicateInvoice}
        onRecordPayment={onRecordPayment}
        onCancel={onCancelInvoice}
        onExport={onExportBackup}
      />
    </div>
  );
};
