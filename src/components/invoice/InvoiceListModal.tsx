import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  Search, 
  Download, 
  FileText, 
  Printer, 
  Send, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle,
  Upload
} from 'lucide-react';
import { getDb } from '../../db/schema';
import { DexieInvoiceRepo } from '../../db/repos/invoiceRepo';
import { SettingsRepo } from '../../db/repos/settingsRepo';
import { cancelInvoice } from '../../services/invoiceService';
import { renderInvoicePdf } from '../../services/pdf/renderPdf';
import { shareInvoicePdf, printInvoicePdf } from '../../services/share';
import { exportDatabaseToJson, importDatabaseFromJson, downloadBackupFile } from '../../services/backup';
import { formatINR } from '../../domain/money';
import type { Invoice } from '../../domain/invoice.types';

interface InvoiceListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewInvoice?: () => void;
}

export const InvoiceListModal: React.FC<InvoiceListModalProps> = ({
  isOpen,
  onClose,
  onOpenNewInvoice,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);

  const [cancelModalInvoice, setCancelModalInvoice] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadInvoices = useCallback(async () => {
    const db = getDb();
    const repo = new DexieInvoiceRepo(db);
    const list = await repo.list({ query: searchQuery });
    setInvoices(list);
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
    } else {
      setSelectedInvoice(null);
      setPdfUrl('');
      setPdfBlob(null);
      setStatusMsg(null);
    }
  }, [isOpen, loadInvoices]);

  if (!isOpen) return null;

  const handleSelectInvoice = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    try {
      const { blob, url } = await renderInvoicePdf(inv);
      setPdfBlob(blob);
      setPdfUrl(url);
    } catch (e: any) {
      console.error(e);
      setStatusMsg({ type: 'error', text: 'Error rendering PDF: ' + e.message });
    }
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
        createdBy: 'ADMIN',
      });

      setStatusMsg({ type: 'success', text: `Invoice ${cancelModalInvoice.number} cancelled. Credit note issued!` });
      setCancelModalInvoice(null);
      setCancelReason('');
      await loadInvoices();
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Failed to cancel invoice.' });
    }
  };

  const handleExportCsv = () => {
    if (invoices.length === 0) return;
    const headers = [
      'Invoice Number',
      'Document Type',
      'Date',
      'Guest Name',
      'Guest Phone',
      'Guest GSTIN',
      'Room Number',
      'Taxable Value (INR)',
      'CGST (INR)',
      'SGST (INR)',
      'IGST (INR)',
      'Grand Total (INR)',
      'Status',
    ];

    const rows = invoices.map((inv) => [
      inv.number,
      inv.docType,
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
    a.download = `GST_Register_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBackupExport = async () => {
    try {
      const json = await exportDatabaseToJson();
      downloadBackupFile(json);
      setStatusMsg({ type: 'success', text: 'Backup downloaded successfully!' });
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: 'Backup failed: ' + e.message });
    }
  };

  const handleBackupImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const res = await importDatabaseFromJson(reader.result as string);
        setStatusMsg({ type: 'success', text: `Restored ${res.invoicesImported} invoices successfully!` });
        await loadInvoices();
      } catch (err: any) {
        setStatusMsg({ type: 'error', text: 'Restore failed: ' + err.message });
      }
    };
    reader.readAsText(file);
  };

  const totalInvoicedPaise = invoices
    .filter((i) => i.docType === 'invoice' && i.status === 'issued')
    .reduce((acc, i) => acc + i.totals.grandTotal, 0);

  const totalGstPaise = invoices
    .filter((i) => i.docType === 'invoice' && i.status === 'issued')
    .reduce((acc, i) => acc + i.totals.cgst + i.totals.sgst + i.totals.igst, 0);

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#F8F5EE] border border-[#DDD6C8] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Official GST Invoices & Tax Register</h3>
              <p className="text-[11px] text-stone-600">Sequential series, credit notes, instant reprints & CSV export</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar & Metrics */}
        <div className="p-4 bg-white border-b border-[#E5DFD3] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] text-stone-500 block font-medium">Total Invoiced</span>
              <span className="text-sm font-bold font-mono text-emerald-700">{formatINR(totalInvoicedPaise)}</span>
            </div>
            <div className="border-l border-[#E5DFD3] pl-4">
              <span className="text-[10px] text-stone-500 block font-medium">Total GST Collected</span>
              <span className="text-sm font-bold font-mono text-indigo-700">{formatINR(totalGstPaise)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search invoice or guest..."
                className="bg-[#FAF8F5] border border-stone-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white focus:border-indigo-500 outline-none w-48 sm:w-56"
              />
            </div>

            {onOpenNewInvoice && (
              <button
                onClick={onOpenNewInvoice}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 font-medium shadow-sm"
              >
                + New Invoice
              </button>
            )}

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl flex items-center gap-1.5 border border-stone-300 shadow-2xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" /> Export GST Register (CSV)
            </button>

            <button
              onClick={handleBackupExport}
              className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl flex items-center gap-1.5 border border-stone-300 shadow-2xs font-medium"
              title="Download local JSON database backup"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" /> Backup
            </button>

            <label className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl flex items-center gap-1.5 border border-stone-300 shadow-2xs cursor-pointer font-medium">
              <Upload className="w-3.5 h-3.5 text-amber-600" /> Restore
              <input type="file" accept=".json" onChange={handleBackupImport} className="hidden" />
            </label>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div className={`p-3 text-xs flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-red-50 text-red-800 border-b border-red-200'}`}>
            {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Body Split View */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden font-sans text-xs">
          {/* Invoices List */}
          <div className="w-full md:w-1/2 p-4 overflow-y-auto space-y-2 border-r border-[#E5DFD3] bg-[#FAF8F5]">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-stone-500">
                No invoices found. Generate your first invoice from Front Desk or Checkout!
              </div>
            ) : (
              invoices.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => handleSelectInvoice(inv)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all ${
                    selectedInvoice?.id === inv.id
                      ? 'bg-white border-indigo-600 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-white hover:bg-stone-50 border-[#E5DFD3]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-stone-900 text-xs">{inv.number}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        inv.status === 'cancelled'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : inv.docType === 'credit-note'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {inv.docType === 'credit-note' ? 'CREDIT NOTE' : inv.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-stone-600 text-[11px]">
                    <span>{inv.buyer.name} {inv.stay ? `• Room ${inv.stay.roomNo}` : ''}</span>
                    <span className="font-mono font-bold text-stone-900 text-xs">{formatINR(inv.totals.grandTotal)}</span>
                  </div>

                  <div className="flex items-center justify-between text-stone-500 text-[10px] mt-1 pt-1 border-t border-[#E5DFD3]">
                    <span>{inv.issuedAt.slice(0, 10)}</span>
                    <span>GST: {formatINR(inv.totals.cgst + inv.totals.sgst + inv.totals.igst)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Pane: Selected Invoice Preview & Actions */}
          <div className="w-full md:w-1/2 p-4 bg-[#F8F5EE] flex flex-col justify-between overflow-y-auto">
            {selectedInvoice ? (
              <div className="space-y-4 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-stone-900">{selectedInvoice.number}</h4>
                    <span className="text-[11px] text-stone-600">
                      Billed to {selectedInvoice.buyer.name} on {selectedInvoice.issuedAt.slice(0, 10)}
                    </span>
                  </div>
                  {selectedInvoice.docType === 'invoice' && selectedInvoice.status === 'issued' && (
                    <button
                      onClick={() => setCancelModalInvoice(selectedInvoice)}
                      className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" /> Cancel & Credit Note
                    </button>
                  )}
                </div>

                {/* PDF Preview Frame */}
                <div className="flex-1 min-h-[300px] bg-[#ECE6DA] rounded-xl border border-[#DDD6C8] overflow-hidden shadow-inner">
                  {pdfUrl ? (
                    <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-0" title="Selected Invoice" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-stone-500">Loading PDF...</div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5DFD3]">
                  <button
                    onClick={() => {
                      if (selectedInvoice && pdfBlob) {
                        shareInvoicePdf({ invoice: selectedInvoice, pdfBlob });
                      }
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> Send on WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      if (pdfBlob) printInvoicePdf(pdfBlob);
                    }}
                    className="px-4 py-2 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5 text-stone-600" /> Print
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-stone-500 space-y-2">
                <FileText className="w-8 h-8 opacity-40 text-stone-400" />
                <span>Select an invoice from the list to preview, print or share</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Credit Note / Cancellation Modal */}
      {cancelModalInvoice && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-red-200 rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-red-600" /> Issue Reversing Credit Note
              </h3>
              <button onClick={() => setCancelModalInvoice(null)} className="text-stone-400 hover:text-stone-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-600">
              Per GST Rule 53, an issued invoice cannot be deleted. Issuing a credit note will officially reverse{' '}
              <strong className="text-stone-900">{cancelModalInvoice.number}</strong> and issue a linked Credit Note.
            </p>
            <div>
              <label className="text-[10px] font-semibold text-stone-600 block mb-1">Reason for cancellation / credit note*</label>
              <input
                type="text"
                required
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Guest requested tariff correction / early checkout"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-xs focus:bg-white focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#E5DFD3]">
              <button
                onClick={() => setCancelModalInvoice(null)}
                className="px-3 py-1.5 text-stone-600 hover:text-stone-900 text-xs font-semibold"
              >
                Abort
              </button>
              <button
                onClick={handleExecuteCancel}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm & Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
