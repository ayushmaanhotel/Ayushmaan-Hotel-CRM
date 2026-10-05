/**
 * Ayushmaan OS v2 — Invoice register (bill history)
 * src/components/finance/InvoiceRegister.tsx
 *
 * Master-prompt §25/26: grouped list, search, status filter, and safe actions
 * (open / duplicate / record payment / mark paid / cancel-with-reason / export).
 * Issued invoices are NEVER hard-deleted — cancel records a reason instead.
 */
import React, { useMemo, useState } from 'react';
import { Search, FileText, Copy, Wallet, Ban, Download, Plus, X } from 'lucide-react';
import type { Invoice, PaymentStatus } from '../../types/invoice';
import { formatINR } from '../../lib/invoiceEngine';

interface Props {
  invoices: Invoice[];
  onNew: () => void;
  onOpen: (inv: Invoice) => void;
  onDuplicate: (inv: Invoice) => void;
  onRecordPayment: (inv: Invoice, amount: number, mode: 'UPI' | 'Cash' | 'Card') => void;
  onCancel: (inv: Invoice, reason: string) => void;
  onExport: () => void;
}

const STATUS_STYLE: Record<PaymentStatus | 'CANCELLED', string> = {
  PAID: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  PARTIAL: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  UNPAID: 'bg-red-500/15 text-red-300 border-red-500/30',
  CANCELLED: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
};

export const InvoiceRegister: React.FC<Props> = ({
  invoices, onNew, onOpen, onDuplicate, onRecordPayment, onCancel, onExport,
}) => {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'ALL' | PaymentStatus | 'CANCELLED'>('ALL');
  const [payFor, setPayFor] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMode, setPayMode] = useState<'UPI' | 'Cash' | 'Card'>('UPI');
  const [cancelFor, setCancelFor] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return invoices
      .filter(i => filter === 'ALL' || (filter === 'CANCELLED' ? i.status === 'CANCELLED' : i.payment.status === filter && i.status !== 'CANCELLED'))
      .filter(i => !needle || i.invoiceNumber.toLowerCase().includes(needle) || i.guest.name.toLowerCase().includes(needle))
      .sort((a, b) => (a.issueDate < b.issueDate ? 1 : -1));
  }, [invoices, q, filter]);

  const billed = rows.filter(r => r.status !== 'CANCELLED').reduce((a, r) => a + r.totals.grandTotal, 0);
  const chips: ('ALL' | PaymentStatus | 'CANCELLED')[] = ['ALL', 'PAID', 'PARTIAL', 'UNPAID', 'CANCELLED'];
  const input = 'bg-zinc-950 text-xs text-white px-3 py-2 rounded-xl border border-zinc-700 focus:outline-none focus:border-indigo-500';

  return (
    <div className="bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" /> Invoice Register
          </h3>
          <p className="text-[11px] text-zinc-400">{rows.length} bills · ₹{formatINR(billed, 0)} billed (filtered)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onExport} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-[11px] font-semibold flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Backup
          </button>
          <button onClick={onNew} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New Bill
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
          <input className={`${input} w-full pl-8`} placeholder="Search invoice # or customer…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1.5">
          {chips.map(c => (
            <button key={c} onClick={() => setFilter(c)}
              className={`px-2.5 py-2 rounded-xl text-[10px] font-bold border ${filter === c ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-600'}`}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {rows.length === 0 && (
          <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            No bills match. Tap <b>New Bill</b> to create the first one.
          </div>
        )}
        {rows.map(inv => {
          const st = inv.status === 'CANCELLED' ? 'CANCELLED' : inv.payment.status;
          return (
            <div key={inv.id} className="p-3 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl flex flex-col sm:flex-row sm:items-center gap-3">
              <button onClick={() => onOpen(inv)} className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold font-mono text-white">{inv.invoiceNumber}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${STATUS_STYLE[st]}`}>{st}</span>
                  <span className="text-[9px] font-mono text-zinc-500">{inv.mode === 'SIMPLE' ? 'BILL' : 'GST'} · {inv.issueDate}</span>
                </div>
                <div className="text-[11px] text-zinc-400 truncate">{inv.guest.name}{inv.stay ? ` · Room ${inv.stay.roomNumber}` : ''} · {inv.items.length} line(s)</div>
              </button>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-emerald-400">₹{formatINR(inv.totals.grandTotal, 0)}</div>
                  {inv.payment.balanceDue > 0 && <div className="text-[9px] text-amber-400 font-mono">due ₹{formatINR(inv.payment.balanceDue, 0)}</div>}
                </div>
                <div className="flex gap-1">
                  <button title="Duplicate" onClick={() => onDuplicate(inv)} className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-200"><Copy className="w-3.5 h-3.5" /></button>
                  {st !== 'CANCELLED' && inv.payment.balanceDue > 0 && (
                    <button title="Record payment" onClick={() => { setPayFor(inv); setPayAmount(inv.payment.balanceDue); }} className="p-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-emerald-300"><Wallet className="w-3.5 h-3.5" /></button>
                  )}
                  {inv.status === 'ISSUED' && (
                    <button title="Cancel (kept in records)" onClick={() => { setCancelFor(inv); setCancelReason(''); }} className="p-1.5 bg-zinc-700 hover:bg-red-600/60 rounded-lg text-zinc-200"><Ban className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* record payment dialog */}
      {payFor && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Record payment · {payFor.invoiceNumber}</h4>
              <button onClick={() => setPayFor(null)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input className={input} type="number" value={payAmount || ''} onChange={e => setPayAmount(+e.target.value || 0)} />
              <select className={input} value={payMode} onChange={e => setPayMode(e.target.value as any)}>
                <option>UPI</option><option>Cash</option><option>Card</option>
              </select>
            </div>
            <button
              onClick={() => { onRecordPayment(payFor, payAmount, payMode); setPayFor(null); }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold">
              Save payment
            </button>
          </div>
        </div>
      )}

      {/* cancel dialog (safeguarded) */}
      {cancelFor && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white">Cancel {cancelFor.invoiceNumber}?</h4>
              <button onClick={() => setCancelFor(null)} className="text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-[11px] text-zinc-400">The bill stays in your records marked CANCELLED (issued invoices are never deleted).</p>
            <input className={`${input} w-full`} placeholder="Reason (e.g. wrong room charge)" value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
            <button
              disabled={!cancelReason.trim()}
              onClick={() => { onCancel(cancelFor, cancelReason.trim()); setCancelFor(null); }}
              className="w-full py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold">
              Cancel bill
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
