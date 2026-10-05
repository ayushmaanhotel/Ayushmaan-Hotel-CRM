/**
 * Ayushmaan OS v2 — Bill composer (full billing mode)
 * src/components/finance/InvoiceComposerModal.tsx
 *
 * The master-prompt core screen: customer → items → review → issue.
 *  · prices entered exactly as quoted (tax-inclusive); engine converts forward
 *  · SIMPLE vs GST mode (progressive disclosure — GST fields only when enabled)
 *  · autosaves a draft every 400 ms (crash / call / app-switch recovery)
 *  · one-hand friendly: single scroll column, sticky totals footer
 */
import React, { useEffect, useMemo, useState } from 'react';
import { X, Plus, Trash2, FileText, Save } from 'lucide-react';
import type { Guest, Room, HotelConfig } from '../../types/hotel';
import type { HotelInvoiceConfig, Invoice, InvoiceDraft, FolioCategory } from '../../types/invoice';
import { folioFromInclusive, computeTotals, defaultGstRate, derivePaymentStatus, formatINR, type InclusiveLineEntry } from '../../lib/invoiceEngine';

interface Line {
  id: string;
  description: string;
  category: FolioCategory;
  qty: number;
  rateIncl: number;
}

const SAC: Record<FolioCategory, string> = {
  ROOM: '996311', FNB: '996331', LAUNDRY: '999712', TRANSPORT: '996400', EXTRA: '998399', DISCOUNT: '996311',
};
const CATS: FolioCategory[] = ['FNB', 'LAUNDRY', 'TRANSPORT', 'EXTRA', 'DISCOUNT'];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hotelConfig: HotelConfig;
  invoiceConfig: HotelInvoiceConfig;
  guests: Guest[];
  rooms: Room[];
  seed: InvoiceDraft | null;
  onIssued: (inv: Invoice) => void;
  onIssue: (input: {
    guestName: string; guestPhone: string; guestGstin?: string | null;
    stay?: { roomNumber: string; roomType: string; checkIn: string; checkOut: string; nights: number; tariffPerNight: number };
    entries: InclusiveLineEntry[]; received: number;
    paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Mixed';
    mode: 'SIMPLE' | 'GST';
  }) => Invoice;
  saveDraft: (d: InvoiceDraft) => void;
  clearDraft: () => void;
}

export const InvoiceComposerModal: React.FC<Props> = ({
  isOpen, onClose, invoiceConfig, guests, rooms, seed, onIssued, onIssue, saveDraft, clearDraft,
}) => {
  const [guestName, setGuestName] = useState(seed?.guestName ?? '');
  const [guestPhone, setGuestPhone] = useState(seed?.guestPhone ?? '');
  const [guestGstin, setGuestGstin] = useState(seed?.guestGstin ?? '');
  const [roomNumber, setRoomNumber] = useState(seed?.roomNumber ?? '');
  const [nights, setNights] = useState(seed?.nights ?? 1);
  const [tariff, setTariff] = useState(seed?.tariffPerNight ?? 0);
  const [lines, setLines] = useState<Line[]>(
    seed?.items.map(it => ({ id: it.id, description: it.description, category: it.category, qty: it.qty, rateIncl: it.rate })) ?? []
  );
  const [method, setMethod] = useState<'UPI' | 'Cash' | 'Card' | 'Mixed'>(seed?.paymentMethod ?? 'UPI');
  const [received, setReceived] = useState(seed?.received ?? 0);
  const [mode, setMode] = useState<'SIMPLE' | 'GST'>(seed?.mode ?? (invoiceConfig.gstEnabled ? 'GST' : 'SIMPLE'));
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const room = rooms.find(r => r.number === roomNumber);

  /* room line stays in sync with the stay selector */
  useEffect(() => {
    setLines(prev => {
      const others = prev.filter(l => l.category !== 'ROOM');
      if (!room) return others;
      const roomLine: Line = {
        id: 'line-room',
        description: `Room Tariff — ${room.type} (Room ${room.number})`,
        category: 'ROOM',
        qty: nights,
        rateIncl: tariff || room.pricePerNight,
      };
      return [roomLine, ...others];
    });
  }, [roomNumber, nights, tariff, room]);

  /* draft autosave (debounced) */
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      saveDraft({
        updatedAt: new Date().toISOString(), guestName, guestPhone, guestGstin,
        roomNumber, nights, tariffPerNight: tariff,
        items: lines.map(l => ({
          id: l.id, date: new Date().toISOString().slice(0, 10), description: l.description,
          category: l.category, sac: SAC[l.category], qty: l.qty, rate: l.rateIncl,
          gstRate: mode === 'SIMPLE' ? 0 : defaultGstRate(l.category, tariff), amount: l.qty * l.rateIncl,
        })),
        paymentMethod: method, received, mode,
      });
      setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 400);
    return () => clearTimeout(t);
  }, [isOpen, guestName, guestPhone, guestGstin, roomNumber, nights, tariff, lines, method, received, mode, saveDraft]);

  const entries: InclusiveLineEntry[] = useMemo(() => lines.map(l => ({
    id: l.id, description: l.description, category: l.category, sac: SAC[l.category], qty: l.qty, rateIncl: l.rateIncl,
  })), [lines]);

  const folio = useMemo(() => folioFromInclusive(entries, tariff || undefined, mode), [entries, tariff, mode]);
  const totals = useMemo(() => computeTotals(folio, 'INTRA'), [folio]);
  const status = derivePaymentStatus(received, totals.grandTotal);

  if (!isOpen) return null;

  const addLine = (cat: FolioCategory) => setLines(prev => [...prev, {
    id: `line-${Date.now()}-${prev.length}`,
    description: cat === 'DISCOUNT' ? 'Discount' : cat === 'FNB' ? 'Restaurant / dining' : cat === 'LAUNDRY' ? 'Laundry' : cat === 'TRANSPORT' ? 'Pickup / drop' : 'Extra service',
    category: cat, qty: 1, rateIncl: cat === 'DISCOUNT' ? -100 : 0,
  }]);

  const issue = () => {
    if (!guestName.trim() || folio.length === 0) return;
    const inv = onIssue({
      guestName: guestName.trim(), guestPhone: guestPhone.trim() || '+91 00000 00000',
      guestGstin: mode === 'GST' && guestGstin.trim() ? guestGstin.trim() : null,
      stay: room ? {
        roomNumber: room.number, roomType: room.type,
        checkIn: new Date().toISOString(),
        checkOut: new Date(Date.now() + nights * 86400000).toISOString(),
        nights, tariffPerNight: tariff || room.pricePerNight,
      } : undefined,
      entries, received, paymentMethod: method, mode,
    });
    clearDraft();
    onIssued(inv);
  };

  const input = 'w-full bg-zinc-950 text-xs text-white px-3 py-2.5 rounded-xl border border-zinc-700 focus:outline-none focus:border-indigo-500';
  const lbl = 'text-[10px] font-semibold text-zinc-400 block mb-1';

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center">
      <div className="w-full max-w-lg h-[94vh] sm:h-[90vh] bg-zinc-900 border border-zinc-700/80 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* header */}
        <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-400" /> New Bill</h3>
            <p className="text-[10px] text-zinc-500">{savedAt ? `Draft saved ${savedAt}` : 'Autosaves as you type'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-[10px] font-bold">
              <button onClick={() => setMode('SIMPLE')} className={`px-2.5 py-1.5 ${mode === 'SIMPLE' ? 'bg-emerald-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>SIMPLE</button>
              <button onClick={() => setMode('GST')} className={`px-2.5 py-1.5 ${mode === 'GST' ? 'bg-indigo-600 text-white' : 'bg-zinc-900 text-zinc-400'}`}>GST</button>
            </div>
            <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* customer */}
          <section className="space-y-2">
            <label className={lbl}>CUSTOMER</label>
            <div className="flex gap-2">
              <input className={input} placeholder="Name" value={guestName} onChange={e => setGuestName(e.target.value)} />
              <input className={`${input} font-mono w-36`} placeholder="Phone" value={guestPhone} onChange={e => setGuestPhone(e.target.value)} />
            </div>
            {guests.length > 0 && (
              <select className={input} value="" onChange={e => {
                const g = guests.find(g => g.id === e.target.value);
                if (g) { setGuestName(g.name); setGuestPhone(g.phone); }
              }}>
                <option value="">Pick existing customer…</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.name} · {g.phone}</option>)}
              </select>
            )}
            {mode === 'GST' && (
              <input className={`${input} font-mono`} placeholder="Customer GSTIN (optional)" value={guestGstin} onChange={e => setGuestGstin(e.target.value)} />
            )}
          </section>

          {/* stay */}
          <section className="space-y-2">
            <label className={lbl}>ROOM / STAY (OPTIONAL)</label>
            <div className="grid grid-cols-3 gap-2">
              <select className={input} value={roomNumber} onChange={e => { setRoomNumber(e.target.value); const r = rooms.find(r => r.number === e.target.value); if (r) setTariff(r.pricePerNight); }}>
                <option value="">No room</option>
                {rooms.map(r => <option key={r.id} value={r.number}>Room {r.number}</option>)}
              </select>
              <input className={input} type="number" min={1} placeholder="Nights" value={nights} onChange={e => setNights(Math.max(1, +e.target.value || 1))} />
              <input className={input} type="number" min={0} placeholder="₹ / night" value={tariff || ''} onChange={e => setTariff(+e.target.value || 0)} />
            </div>
          </section>

          {/* items */}
          <section className="space-y-2">
            <label className={lbl}>ITEMS &amp; CHARGES {mode === 'GST' ? '(prices as quoted, tax-inclusive)' : '(simple bill — no tax)'}</label>
            {lines.filter(l => l.category !== 'ROOM' || room).map(l => (
              <div key={l.id} className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex gap-2">
                  <input className={input} value={l.description} onChange={e => setLines(p => p.map(x => x.id === l.id ? { ...x, description: e.target.value } : x))} />
                  <button onClick={() => setLines(p => p.filter(x => x.id !== l.id))} className="p-2 text-zinc-500 hover:text-red-400 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input className={input} type="number" min={0} step="0.01" value={l.qty} onChange={e => setLines(p => p.map(x => x.id === l.id ? { ...x, qty: +e.target.value || 0 } : x))} />
                  <input className={input} type="number" min={0} step="0.01" placeholder="₹ price" value={l.rateIncl || ''} onChange={e => setLines(p => p.map(x => x.id === l.id ? { ...x, rateIncl: +e.target.value || 0 } : x))} />
                  <div className="flex items-center justify-end pr-1 text-xs font-mono text-emerald-400">₹{formatINR(l.qty * l.rateIncl, 0)}</div>
                </div>
                {mode === 'GST' && (
                  <div className="text-[9px] text-zinc-500 font-mono">SAC {SAC[l.category]} · {defaultGstRate(l.category, tariff || undefined)}% {l.category === 'DISCOUNT' ? '(matches room slab)' : ''}</div>
                )}
              </div>
            ))}
            <div className="flex gap-1.5 flex-wrap">
              {CATS.map(c => (
                <button key={c} onClick={() => addLine(c)} className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[10px] font-semibold flex items-center gap-1">
                  <Plus className="w-3 h-3" /> {c}
                </button>
              ))}
            </div>
          </section>

          {/* payment */}
          <section className="space-y-2">
            <label className={lbl}>PAYMENT RECEIVED</label>
            <div className="grid grid-cols-2 gap-2">
              <select className={input} value={method} onChange={e => setMethod(e.target.value as any)}>
                <option>UPI</option><option>Cash</option><option>Card</option><option>Mixed</option>
              </select>
              <input className={input} type="number" min={0} placeholder="₹ received" value={received || ''} onChange={e => setReceived(+e.target.value || 0)} />
            </div>
            <div className={`text-[10px] font-bold font-mono ${status === 'PAID' ? 'text-emerald-400' : status === 'PARTIAL' ? 'text-amber-400' : 'text-red-400'}`}>
              {status} {status !== 'PAID' && `· balance ₹${formatINR(Math.max(0, totals.grandTotal - received), 0)}`}
            </div>
          </section>
        </div>

        {/* sticky totals + issue */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-3 shrink-0 space-y-2">
          <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
            <span>Taxable ₹{formatINR(totals.taxable, 0)} {mode === 'GST' && `· Tax ₹${formatINR(totals.taxTotal, 0)}`}</span>
            <span className="text-white font-bold text-sm">₹{formatINR(totals.grandTotal, 0)}</span>
          </div>
          <button
            onClick={issue}
            disabled={!guestName.trim() || folio.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Generate {mode === 'GST' ? 'GST Invoice' : 'Bill'} &amp; PDF
          </button>
        </div>
      </div>
    </div>
  );
};
