import React from 'react';
import { X, Printer, Send, Building } from 'lucide-react';
import type { Transaction } from '../../types/hotel';

interface GSTInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const GSTInvoiceModal: React.FC<GSTInvoiceModalProps> = ({
  isOpen,
  onClose,
  transaction
}) => {
  if (!isOpen || !transaction) return null;

  const baseAmount = Math.round(transaction.amount / 1.12);
  const gstAmount = transaction.amount - baseAmount;
  const sgst = Math.round(gstAmount / 2);
  const cgst = gstAmount - sgst;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#F8F5EE] border border-[#DDD6C8] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-[#E5DFD3] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-amber-800" />
            <div>
              <h3 className="text-sm font-bold text-stone-900">GST Tax Invoice (Official)</h3>
              <p className="text-[11px] text-stone-500 font-mono">{transaction.gstInvoiceNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 bg-white font-sans text-xs">
          <div className="flex justify-between border-b border-[#E5DFD3] pb-4">
            <div>
              <h4 className="font-bold text-stone-900 text-sm">Grand Heritage Inn Hotel</h4>
              <p className="text-stone-500">GSTIN: 27AABCG1234H1Z5</p>
              <p className="text-stone-500">SAC Code: 996311 (Hotel Lodging)</p>
              <p className="text-stone-500">Beach Road, Bandra, Mumbai 400050</p>
            </div>
            <div className="text-right space-y-1">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] border border-emerald-200 font-semibold">
                PAID VIA {transaction.type}
              </span>
              <p className="text-stone-500">Date: {transaction.date}</p>
              <p className="text-stone-500">Time: {transaction.time}</p>
            </div>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3]">
            <span className="text-[10px] text-stone-500 font-semibold uppercase block">Billed To:</span>
            <div className="font-bold text-stone-900 text-sm mt-0.5">{transaction.guestName}</div>
            <div className="text-stone-600">Room Number: {transaction.roomNumber}</div>
          </div>

          <div className="border border-[#E5DFD3] rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E5DFD3] text-[11px] font-semibold text-stone-600">
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Base Tariff</th>
                  <th className="p-2.5 text-right">CGST (6%)</th>
                  <th className="p-2.5 text-right">SGST (6%)</th>
                  <th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5DFD3] text-stone-800">
                <tr>
                  <td className="p-2.5">Hotel Room Accommodation (Room {transaction.roomNumber})</td>
                  <td className="p-2.5 text-right font-mono">₹{baseAmount.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right font-mono">₹{cgst.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right font-mono">₹{sgst.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right font-mono font-bold text-stone-900">₹{transaction.amount.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <span className="text-emerald-900 font-semibold">Grand Total (Incl. GST):</span>
            <span className="text-lg font-bold font-mono text-emerald-800">₹{transaction.amount.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div className="p-4 bg-[#FAF8F5] border-t border-[#E5DFD3] flex items-center justify-between">
          <button 
            onClick={() => alert("Sending PDF Invoice to WhatsApp...")}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" /> Send PDF on WhatsApp
          </button>
          <div className="flex gap-2">
            <button 
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-[#E5DFD3] rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" /> Print Invoice
            </button>
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
