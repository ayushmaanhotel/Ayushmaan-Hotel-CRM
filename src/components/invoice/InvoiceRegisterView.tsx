import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  Download, 
  FileText, 
  Printer, 
  Send, 
  RotateCcw, 
  Plus, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  X,
  Settings
} from 'lucide-react';
import { getDb } from '../../db/schema';
import { DexieInvoiceRepo } from '../../db/repos/invoiceRepo';
import { SettingsRepo } from '../../db/repos/settingsRepo';
import { cancelInvoice } from '../../services/invoiceService';
import { renderInvoicePdf } from '../../services/pdf/renderPdf';
import { shareInvoicePdf } from '../../services/share';
import { formatINR } from '../../domain/money';
import { PremiumInvoiceModal } from '../finance/PremiumInvoiceModal';
import { useHotelStore } from '../../hooks/useHotelStore';
import { domainInvoiceToVectorInvoice } from '../../lib/invoiceAdapter';
import type { Invoice } from '../../domain/invoice.types';

interface InvoiceRegisterViewProps {
  onOpenNewInvoice: () => void;
  onOpenBrandingSettings?: () => void;
}

export const InvoiceRegisterView: React.FC<InvoiceRegisterViewProps> = ({
  onOpenNewInvoice,
  onOpenBrandingSettings,
}) => {
  const { hotelConfig, invoiceConfig } = useHotelStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'issued' | 'cancelled'>('all');
  
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const db = getDb();
      const repo = new DexieInvoiceRepo(db);
      const list = await repo.list({ query: searchQuery });
      setInvoices(list);
    } catch (e) {
      console.error(e);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv);
  };

  const handleQuickShare = async (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setStatusMsg({ type: 'success', text: `Preparing WhatsApp PDF for ${inv.number}...` });
      const { blob } = await renderInvoicePdf(inv);
      await shareInvoicePdf({ invoice: inv, pdfBlob: blob });
      setStatusMsg({ type: 'success', text: `Invoice ${inv.number} shared ✔` });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Share failed: ' + err.message });
    }
  };

  const handleQuickPrint = async (inv: Invoice, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedInvoice(inv);
  };

  const handleExecuteCancel = async () => {
    if (!cancelModalInvoice || !cancelReason.trim()) return;
    try {
      const db = getDb();
      const invoiceRepo = new DexieInvoiceRepo(db);
      const settingsRepo = new SettingsRepo(db);
      const device = await settingsRepo.getDevice();

      await cancelInvoice(invoiceRepo, {
        invoiceId: cancelModalInvoice.id,
        reason: cancelReason.trim(),
        device,
        createdBy: 'FRONT_DESK',
      });

      setStatusMsg({ type: 'success', text: `Invoice ${cancelModalInvoice.number} cancelled. Reversing credit note issued!` });
      setCancelModalInvoice(null);
      setCancelReason('');
      await loadInvoices();
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Cancel failed: ' + e.message });
    }
  };

  const exportCsv = () => {
    const headers = [
      'Type',
      'Invoice No',
      'Date',
      'Guest Name',
      'Phone',
      'GSTIN',
      'Room',
      'Taxable Value',
      'CGST',
      'SGST',
      'IGST',
      'Grand Total',
      'Status',
    ];

    const rows = invoices.map((inv) => [
      inv.docType,
      inv.number,
      inv.issuedAt.slice(0, 10),
      `"${inv.buyer.name.replace(/"/g, '""')}"`,
      inv.buyer.phone || '',
      inv.buyer.gstin || '',
      inv.stay?.roomNo || '',
      (inv.totals.taxable / 100).toFixed(2),
      (inv.totals.cgst / 100).toFixed(2),
      (inv.totals.sgst / 100).toFixed(2),
      (inv.totals.igst / 100).toFixed(2),
      (inv.totals.grandTotal / 100).toFixed(2),
      inv.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GST_Tax_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredInvoices = invoices.filter((i) => {
    if (statusFilter === 'issued') return i.status === 'issued';
    if (statusFilter === 'cancelled') return i.status === 'cancelled';
    return true;
  });

  const totalInvoicedPaise = invoices
    .filter((i) => i.docType === 'invoice' && i.status === 'issued')
    .reduce((acc, i) => acc + i.totals.grandTotal, 0);

  const totalGstPaise = invoices
    .filter((i) => i.docType === 'invoice' && i.status === 'issued')
    .reduce((acc, i) => acc + i.totals.cgst + i.totals.sgst + i.totals.igst, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5DFD3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-300 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              OFFLINE BILLING READY
            </span>
            <span className="text-xs text-stone-500">CBIC GST 2.0 Compliant</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">
            GST Invoices Register (बिलिंग रजिस्टर)
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Sequential statutory series, instant vector PDF & 1-tap WhatsApp sharing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenBrandingSettings && (
            <button
              onClick={onOpenBrandingSettings}
              className="p-2.5 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
              title="Branding & GST Settings"
            >
              <Settings className="w-4 h-4 text-stone-500" />
              <span className="hidden sm:inline">Settings</span>
            </button>
          )}

          <button
            onClick={onOpenNewInvoice}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + New GST Bill (नया बिल)
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
            : 'bg-red-50 border-red-300 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="p-1 hover:text-stone-900 text-stone-500">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="p-3 sm:p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-1">
          <span className="text-[10px] text-stone-500 block font-medium">Total Invoiced (कुल बिक्री)</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-emerald-700">
            {formatINR(totalInvoicedPaise)}
          </span>
          <span className="text-[10px] text-stone-500 block">
            {invoices.filter((i) => i.status === 'issued').length} Active Bills
          </span>
        </div>

        <div className="p-3 sm:p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-1">
          <span className="text-[10px] text-stone-500 block font-medium">GST Collected (कर राशि)</span>
          <span className="text-lg sm:text-xl font-bold font-mono text-indigo-700">
            {formatINR(totalGstPaise)}
          </span>
          <span className="text-[10px] text-stone-500 block">
            CGST + SGST + IGST
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-3 sm:p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-stone-500 block font-medium">Accountant Ledger</span>
            <span className="text-xs font-bold text-stone-800 mt-0.5 block">CA / Tax Audit File</span>
          </div>
          <button
            onClick={exportCsv}
            className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by invoice number, guest name, phone..."
            className="w-full bg-white border border-[#E5DFD3] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 outline-none focus:border-indigo-600 transition-colors shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#F2ECE1] p-1 rounded-2xl border border-[#E5DFD3] shrink-0">
          {(['all', 'issued', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${
                statusFilter === tab
                  ? 'bg-indigo-600 text-white font-bold shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {tab === 'all' ? 'All' : tab === 'issued' ? 'Issued' : 'Cancelled'}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E5DFD3] shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 text-stone-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-stone-900">No invoices found</h3>
            <p className="text-xs text-stone-600 max-w-sm mx-auto">
              Generate your first luxury GST invoice with Lord Ganesha arch, Devanagari typography and dynamic UPI QR code.
            </p>
          </div>
          <button
            onClick={onOpenNewInvoice}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" /> + Create New GST Bill
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredInvoices.map((inv) => {
            const isCancelled = inv.status === 'cancelled';
            const isCreditNote = inv.docType === 'credit-note';

            return (
              <div
                key={inv.id}
                onClick={() => handleSelectInvoice(inv)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isCancelled
                    ? 'bg-stone-100/70 border-stone-200 opacity-60'
                    : isCreditNote
                      ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400 shadow-2xs'
                      : 'bg-white border-[#E5DFD3] hover:border-stone-400 shadow-xs'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                    isCreditNote 
                      ? 'bg-amber-100 border border-amber-300 text-amber-800' 
                      : 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                  }`}>
                    {isCreditNote ? 'CN' : 'GST'}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-900 tracking-wide">
                        {inv.number}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-semibold border ${
                        isCancelled
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : isCreditNote
                            ? 'bg-amber-50 border-amber-200 text-amber-800'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="text-xs text-stone-800 font-medium truncate mt-0.5">
                      {inv.buyer.name}
                      {inv.stay?.roomNo && (
                        <span className="text-stone-500 font-normal"> • Room {inv.stay.roomNo}</span>
                      )}
                    </div>

                    <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-2 mt-0.5">
                      <span>{inv.issuedAt.slice(0, 10)}</span>
                      <span>•</span>
                      <span>{inv.lines.length} items</span>
                      {inv.buyer.phone && (
                        <>
                          <span>•</span>
                          <span>{inv.buyer.phone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5DFD3]">
                  <div className="text-left sm:text-right">
                    <div className="font-mono font-bold text-base text-stone-900">
                      {formatINR(inv.totals.grandTotal)}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      GST: {formatINR(inv.totals.cgst + inv.totals.sgst + inv.totals.igst)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* WhatsApp Button */}
                    <button
                      onClick={(e) => handleQuickShare(inv, e)}
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 transition-all active:scale-95"
                      title="Share PDF to WhatsApp"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>

                    {/* Print Button */}
                    <button
                      onClick={(e) => handleQuickPrint(inv, e)}
                      className="p-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 transition-all active:scale-95 shadow-2xs"
                      title="Print Invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* View Button */}
                    <button
                      onClick={() => handleSelectInvoice(inv)}
                      className="p-2 rounded-xl bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 transition-all active:scale-95 shadow-2xs"
                      title="View Bill"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* Cancel Button */}
                    {!isCancelled && !isCreditNote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCancelModalInvoice(inv);
                        }}
                        className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-all active:scale-95"
                        title="Cancel & Issue Credit Note"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bill Preview Modal (High-Fidelity Vector PDF + Beige Aesthetic) */}
      {selectedInvoice && (
        <PremiumInvoiceModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoice={domainInvoiceToVectorInvoice(selectedInvoice, hotelConfig)}
          hotelConfig={hotelConfig}
          invoiceConfig={invoiceConfig}
        />
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#DDD6C8] rounded-2xl p-5 space-y-4 shadow-xl">
            <h4 className="text-sm font-bold text-stone-900">Cancel Invoice & Issue Credit Note?</h4>
            <p className="text-xs text-stone-600">
              Under GST rules, invoice <span className="font-mono text-indigo-700 font-semibold">{cancelModalInvoice.number}</span> will be reversed by an official Credit Note.
            </p>

            <div className="space-y-3">
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason (e.g. Guest checkout date change)"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:border-red-500"
              />

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCancelModalInvoice(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleExecuteCancel}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl"
                >
                  Confirm Cancellation
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
