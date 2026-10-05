/**
 * Ayushmaan OS v2 — Invoice engine (pure logic, no UI)
 * Drop into: src/lib/invoiceEngine.ts
 *
 * Responsibilities:
 *  1. GST slab resolution (hotel accommodation slabs effective 22-Sep-2025)
 *  2. Slab-wise tax breakup (CGST+SGST intra-state / IGST inter-state)
 *  3. Sequential, fiscal-year invoice numbering (Rule 46 compliance)
 *  4. Indian-style amount-in-words
 *  5. Invoice assembly + totals with round-off
 */
import type {
  FolioItem, GstRate, Invoice, InvoiceTotals, SlabBreakup, HotelInvoiceConfig
} from '../types/invoice';

/* ------------------------------------------------------------------ */
/* 1. GST SLABS                                                        */
/* ------------------------------------------------------------------ */

/**
 * Accommodation slab is driven by PER-NIGHT TARIFF (declared/actual):
 *   < ₹1,000            → exempt (0%)
 *   ₹1,000 – ₹7,500     → 5% (no ITC to customer)      [was 12% before 22-Sep-2025]
 *   > ₹7,500            → 18%
 * Source: GST Council 56th meeting rationalisation, effective 22-Sep-2025.
 */
export function accommodationGstRate(tariffPerNight: number): GstRate {
  if (tariffPerNight < 1000) return 0;
  if (tariffPerNight <= 7500) return 5;
  return 18;
}

/** Category defaults for non-room folio lines. */
export function defaultGstRate(category: FolioItem['category'], tariffPerNight?: number): GstRate {
  switch (category) {
    case 'ROOM':     return accommodationGstRate(tariffPerNight ?? 0);
    case 'FNB':      return 5;    // restaurant at specified premises (tariff ≤ 7.5k) — verify per CA
    case 'LAUNDRY':  return 18;
    case 'TRANSPORT':return 18;
    case 'EXTRA':    return 18;
    case 'DISCOUNT': return 5;    // must be overridden to match the discounted line's slab
  }
}

export function gstRateForItem(item: FolioItem, tariffPerNight?: number): GstRate {
  return item.gstRate ?? defaultGstRate(item.category, tariffPerNight);
}

/* ------------------------------------------------------------------ */
/* 2. TOTALS + SLAB BREAKUP                                            */
/* ------------------------------------------------------------------ */

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeTotals(
  items: FolioItem[],
  supplyType: 'INTRA' | 'INTER'
): InvoiceTotals {
  const slabMap = new Map<GstRate, SlabBreakup>();

  for (const it of items) {
    const taxable = round2(it.qty * it.rate);
    let s = slabMap.get(it.gstRate);
    if (!s) {
      s = { rate: it.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      slabMap.set(it.gstRate, s);
    }
    const tax = (taxable * it.gstRate) / 100;
    s.taxable = round2(s.taxable + taxable);
    if (supplyType === 'INTRA') {
      s.cgst = round2(s.cgst + tax / 2);
      s.sgst = round2(s.sgst + tax / 2);
    } else {
      s.igst = round2(s.igst + tax);
    }
  }

  const slabs = [...slabMap.values()].sort((a, b) => a.rate - b.rate);
  for (const s of slabs) s.total = round2(s.taxable + s.cgst + s.sgst + s.igst);

  const taxable  = round2(slabs.reduce((a, s) => a + s.taxable, 0));
  const cgst     = round2(slabs.reduce((a, s) => a + s.cgst, 0));
  const sgst     = round2(slabs.reduce((a, s) => a + s.sgst, 0));
  const igst     = round2(slabs.reduce((a, s) => a + s.igst, 0));
  const taxTotal = round2(cgst + sgst + igst);
  const exact    = round2(taxable + taxTotal);
  const grandTotal = Math.round(exact);
  const roundOff   = round2(grandTotal - exact);

  return {
    taxable, cgst, sgst, igst, taxTotal, roundOff, grandTotal,
    totalInWords: amountInWordsINR(grandTotal),
    slabs,
  };
}

/* ------------------------------------------------------------------ */
/* 3. SEQUENTIAL NUMBERING (fiscal year Apr–Mar)                       */
/* ------------------------------------------------------------------ */

export function fiscalYearOf(d: Date): string {
  const y = d.getFullYear();
  return d.getMonth() >= 3 ? `${y}-${String((y + 1) % 100).padStart(2, '0')}`
                           : `${y - 1}-${String(y % 100).padStart(2, '0')}`;
}

const LS_COUNTER = 'ayushmaan_invoice_counter_';

/**
 * Atomically reserve the next sequential number for a fiscal year.
 * Stored in localStorage alongside the rest of the store; the number is
 * assigned ONLY at issue time so drafts never burn a number (no gaps).
 * Format stays ≤ 16 chars: PREFIX(3) + '/' + FY(5) + '/' + SEQ(4) = 15.
 */
export function reserveInvoiceNumber(prefix: string, issueDate: Date): string {
  const fy = fiscalYearOf(issueDate);          // '2026-27' (storage / meta box)
  const shortFy = fy.slice(2);                 // '26-27'   (invoice number, Indian convention)
  const key = LS_COUNTER + fy;
  const next = (parseInt(localStorage.getItem(key) ?? '0', 10) || 0) + 1;
  localStorage.setItem(key, String(next));
  const seq = String(next).padStart(4, '0');
  const num = `${prefix}/${shortFy}/${seq}`;
  if (num.length > 16) {
    // Rule 46: invoice number must not exceed 16 characters — fail loud.
    throw new Error(`Invoice number "${num}" exceeds 16 chars. Shorten invoicePrefix.`);
  }
  return num;
}

/** Release a number only if issue failed before persistence (crash-safe). */
export function releaseInvoiceNumber(fy: string): void {
  const key = LS_COUNTER + fy;
  const cur = parseInt(localStorage.getItem(key) ?? '0', 10) || 0;
  if (cur > 0) localStorage.setItem(key, String(cur - 1));
}

/* ------------------------------------------------------------------ */
/* 4. AMOUNT IN WORDS — Indian numbering (lakh / crore)                */
/* ------------------------------------------------------------------ */

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? '-' + ONES[n % 10] : ''}`;
}
function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${h ? ONES[h] + ' Hundred' : ''}${h && r ? ' and ' : ''}${r ? twoDigits(r) : ''}`;
}

export function amountInWordsINR(rupees: number): string {
  if (rupees === 0) return 'Rupees Zero Only';
  const crore  = Math.floor(rupees / 10_000_000);
  const lakh   = Math.floor((rupees % 10_000_000) / 100_000);
  const thous  = Math.floor((rupees % 100_000) / 1_000);
  const rest   = rupees % 1_000;
  const parts: string[] = [];
  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh)  parts.push(`${twoDigits(lakh)} Lakh`);
  if (thous) parts.push(`${twoDigits(thous)} Thousand`);
  if (rest)  parts.push(threeDigits(rest));
  return `Rupees ${parts.join(' ')} Only`;
}

/* ------------------------------------------------------------------ */
/* 5. ASSEMBLY                                                         */
/* ------------------------------------------------------------------ */

export function formatINR(n: number, decimals = 2): string {
  return n.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Build a final Invoice ready for PDF rendering + persistence. */
export function buildInvoice(input: {
  config: HotelInvoiceConfig;
  guest: Invoice['guest'];
  stay?: Invoice['stay'];
  items: FolioItem[];
  payment: Invoice['payment'];
  bookingRef?: string;
  issuedBy: string;
}): Invoice {
  const now = new Date();
  const supplyType: 'INTRA' | 'INTER' =
    input.guest.stateCode === input.config.stateCode ? 'INTRA' : 'INTER';

  // resolve slab for every line against the stay tariff before totaling
  const items = input.items.map(it => ({
    ...it,
    gstRate: gstRateForItem(it, input.stay?.tariffPerNight),
  }));

  const totals = computeTotals(items, supplyType);
  const invoiceNumber = reserveInvoiceNumber(input.config.invoicePrefix, now);

  return {
    id: `inv-${now.getTime()}`,
    invoiceNumber,
    fiscalYear: fiscalYearOf(now),
    issueDate: now.toISOString().slice(0, 10),
    issueTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
    bookingRef: input.bookingRef,
    folioNumber: input.stay ? `F-${input.stay.roomNumber}-${now.getDate()}${now.getMonth() + 1}` : undefined,
    guest: input.guest,
    stay: input.stay,
    items,
    payment: { ...input.payment, balanceDue: round2(totals.grandTotal - input.payment.received) },
    supplyType,
    placeOfSupply: `${input.config.stateName} (${input.config.stateCode})`,
    totals,
    status: 'ISSUED',
    issuedBy: input.issuedBy,
    originalFor: 'RECIPIENT',
  };
}

/* ------------------------------------------------------------------ */
/* 6. UPI URI (reused by the on-invoice QR)                            */
/* ------------------------------------------------------------------ */

export function upiUri(vpa: string, merchant: string, amount: number, note: string): string {
  const p = new URLSearchParams({ pa: vpa, pn: merchant, am: amount.toFixed(2), cu: 'INR', tn: note });
  return `upi://pay?${p.toString()}`;
}
