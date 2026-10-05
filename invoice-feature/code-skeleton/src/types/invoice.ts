/**
 * Ayushmaan OS v2 — Invoice domain types
 * Drop into: src/types/invoice.ts
 *
 * Extends (does NOT replace) the existing types in src/types/hotel.ts.
 * `Transaction` stays as the payment ledger row; `Invoice` becomes the
 * legal tax document generated from a folio of line items.
 */

/** GST service categories used on a hotel folio. */
export type FolioCategory =
  | 'ROOM'       // accommodation — SAC 996311, slab derived from per-night tariff
  | 'FNB'        // restaurant / in-room dining — SAC 996331, 5% (specified premises)
  | 'LAUNDRY'    // SAC 999712 — 18%
  | 'TRANSPORT'  // hotel car / pickup — SAC 996400 — 18%
  | 'EXTRA'      // minibar, banquet, spa etc. — default 18% (review per item)
  | 'DISCOUNT';  // negative line; inherits slab of the line it discounts

export type GstRate = 0 | 5 | 12 | 18 | 28;

export interface FolioItem {
  id: string;
  date: string;                 // ISO yyyy-mm-dd
  description: string;
  category: FolioCategory;
  sac: string;                  // e.g. '996311'
  qty: number;                  // nights / counts
  rate: number;                 // per-unit TAXABLE value (₹, signed: discounts negative)
  gstRate: GstRate;             // resolved by invoiceEngine.gstRateForItem()
  amount: number;               // qty * rate (signed taxable value)
  roomId?: string;
  notes?: string;
}

export interface InvoiceGuest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string | null;        // null/undefined → "Unregistered"
  stateName: string;            // e.g. 'Maharashtra'
  stateCode: string;            // e.g. '27'
}

export interface InvoiceStay {
  roomNumber: string;
  roomType: string;
  checkIn: string;              // ISO datetime
  checkOut: string;
  nights: number;
  tariffPerNight: number;       // drives the ROOM GST slab
  guests?: number;
}

export interface InvoicePayment {
  method: 'UPI' | 'Cash' | 'Card' | 'Mixed' | 'Pending';
  received: number;
  balanceDue: number;
  entries: { date: string; mode: string; amount: number; ref?: string }[];
  upiVpa: string;
}

export interface SlabBreakup {
  rate: GstRate;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface InvoiceTotals {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxTotal: number;
  roundOff: number;             // signed, to reach whole-rupee grand total
  grandTotal: number;           // whole rupees
  totalInWords: string;         // Indian numbering (lakh/crore)
  slabs: SlabBreakup[];
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'CANCELLED' | 'AMENDED';

export interface Invoice {
  id: string;                   // internal uuid
  invoiceNumber: string;        // legal, sequential, <= 16 chars: GHI/26-27/0142
  fiscalYear: string;           // '2026-27' (Apr–Mar)
  issueDate: string;            // ISO date
  issueTime: string;            // HH:mm
  bookingRef?: string;
  folioNumber?: string;
  guest: InvoiceGuest;
  stay?: InvoiceStay;
  items: FolioItem[];
  payment: InvoicePayment;
  supplyType: 'INTRA' | 'INTER';// INTRA → CGST+SGST, INTER → IGST
  placeOfSupply: string;        // 'Maharashtra (27)'
  totals: InvoiceTotals;
  status: InvoiceStatus;
  issuedBy: string;             // staff name
  originalFor: 'RECIPIENT';
}

/** Additions to HotelConfig needed by invoicing (merge into types/hotel.ts). */
export interface HotelInvoiceConfig {
  invoicePrefix: string;        // 'GHI' — keep prefix short: total ≤ 16 chars
  legalName: string;            // registered entity name
  stateName: string;
  stateCode: string;
  pan?: string;
  bank?: { name: string; account: string; ifsc: string; branch: string };
  logoDataUrl?: string | null;  // base64 PNG, ≤ 60KB
  deityDataUrl?: string | null; // base64 JPG/PNG header artwork, ≤ 80KB
  blessingLine?: string;        // '॥ श्री गणेशाय नमः ॥' — '' to hide
  signatoryName: string;
  signatoryTitle: string;
  terms: string[];              // footer terms, max 6 lines
}
