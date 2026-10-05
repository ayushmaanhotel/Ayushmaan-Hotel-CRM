/**
 * Ayushmaan OS v2 — Premium invoice modal (preview + share + print)
 * Drop into: src/components/finance/PremiumInvoiceModal.tsx
 * Replaces GSTInvoiceModal in App.tsx (keep the old file until parity checks pass).
 *
 * Flow (respects the repo's "3 clicks max" rule):
 *   Finance → tap transaction → this modal → [Share PDF on WhatsApp | Print | Download]
 */
import React, { useMemo, useState } from 'react';
import { X, Send, Printer, Download, Loader2 } from 'lucide-react';
import type { Invoice, HotelInvoiceConfig } from '../../types/invoice';
import type { HotelConfig } from '../../types/hotel';
import { invoicePreviewHtml } from '../../lib/invoicePreview';
import { generateInvoicePdf } from '../../lib/invoicePdf';
import { shareInvoicePdf, downloadBlob, printHtml, invoiceFileName, whatsAppLink } from '../../lib/sharePdf';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  hotelConfig: HotelConfig;
  invoiceConfig: HotelInvoiceConfig;
}

export const PremiumInvoiceModal: React.FC<Props> = ({
  isOpen, onClose, invoice, hotelConfig, invoiceConfig,
}) => {
  const [busy, setBusy] = useState<null | 'pdf' | 'share' | 'print'>(null);
  const [toast, setToast] = useState<string | null>(null);

  const html = useMemo(
    () => (invoice ? invoicePreviewHtml(invoice, { ...hotelConfig, ...invoiceConfig }) : ''),
    [invoice, hotelConfig, invoiceConfig]
  );

  if (!isOpen || !invoice) return null;
  const cfg = { ...hotelConfig, ...invoiceConfig };

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const withPdf = async (fn: (blob: Blob) => Promise<void> | void) => {
    setBusy('pdf');
    try {
      const blob = await generateInvoicePdf(invoice, cfg);
      await fn(blob);
    } catch (e) {
      console.error(e);
      flash('PDF generation failed — check fonts are built (see README)');
    } finally {
      setBusy(null);
    }
  };

  const onShare = () => withPdf(async blob => {
    setBusy('share');
    const out = await shareInvoicePdf(blob, invoiceFileName(invoice.invoiceNumber), `Tax Invoice ${invoice.invoiceNumber}`);
    if (out === 'downloaded') {
      flash('Share not supported here — PDF saved to Downloads. Attaching via wa.me…');
      window.open(whatsAppLink(invoice.guest.phone,
        `Dear ${invoice.guest.name}, your tax invoice ${invoice.invoiceNumber} for ₹${invoice.totals.grandTotal.toLocaleString('en-IN')} from ${cfg.hotelName}. PDF saved on this device.`), '_blank');
    } else if (out === 'shared') {
      flash('Invoice PDF handed to share sheet ✔');
    }
  });

  const onDownload = () => withPdf(blob => {
    downloadBlob(blob, invoiceFileName(invoice.invoiceNumber));
    flash('PDF downloaded');
  });

  const onPrint = () => { setBusy('print'); printHtml(html); setTimeout(() => setBusy(null), 800); };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-6">
      <div className="w-full max-w-3xl h-[94vh] bg-zinc-900 border border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* header */}
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950 shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white">Tax Invoice · {invoice.invoiceNumber}</h3>
            <p className="text-[11px] text-zinc-400">
              {invoice.guest.name} · ₹{invoice.totals.grandTotal.toLocaleString('en-IN')} · {invoice.status}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* A4 preview sheet */}
        <div className="flex-1 overflow-auto bg-zinc-950 p-2 sm:p-4">
          <iframe
            title="Invoice preview"
            srcDoc={html}
            className="w-full h-full min-h-[60vh] bg-white rounded-lg"
            style={{ border: 0 }}
            sandbox="allow-same-origin"
          />
        </div>

        {/* actions */}
        <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center gap-2 shrink-0">
          {toast && <span className="text-[11px] text-emerald-300 mr-auto">{toast}</span>}
          <button
            onClick={onShare}
            disabled={!!busy}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            {busy === 'share' || busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Share PDF on WhatsApp
          </button>
          <button
            onClick={onPrint}
            disabled={!!busy}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button
            onClick={onDownload}
            disabled={!!busy}
            className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button onClick={onClose} className="ml-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
