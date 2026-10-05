import type { Paise } from './money';
import type { TaxRuleVersion } from './gst/rules';
import type { DocType } from './numbering';

export type LineKind = 'room' | 'food' | 'extra-bed' | 'laundry' | 'service' | 'other';
export type PriceMode = 'inclusive' | 'exclusive';
export type PaymentMode = 'UPI' | 'Cash' | 'Card' | 'Bank';
export type PaperSize = 'A4' | 'A5' | 'T80' | 'T58';
export type InvoiceStatus = 'issued' | 'cancelled';

/** User/booking-supplied line before tax is derived. */
export interface DraftLine {
  id: string;
  kind: LineKind;
  description: string;
  /** Overrides the default SAC for the line kind. */
  sac?: string;
  /** Whole units (nights for rooms). */
  qty: number;
  /** Per-unit price in paise. Interpreted per `PriceMode` (tax-inclusive or pre-tax). */
  unitPrice: Paise;
  /** Total discount for this line in paise, in the same basis as `unitPrice`. */
  discount: Paise;
  /** Explicit GST rate in basis points. Honoured only for `service`, `laundry` and `other` lines. */
  rateBpOverride?: number;
}

export interface InvoiceLine {
  id: string;
  kind: LineKind;
  description: string;
  sac: string;
  qty: number;
  /** Pre-tax per-unit price, rounded to paise (informational). */
  unitPrice: Paise;
  discount: Paise;
  taxRateBp: number;
  taxable: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  total: Paise;
}

export interface InvoiceTotals {
  taxable: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  /** Rounding to the nearest whole rupee; can be negative. */
  roundOff: Paise;
  grandTotal: Paise;
}

export interface SupplierSnapshot {
  legalName: string;
  tradeName: string;
  address: string;
  gstin: string;
  stateCode: string;
  phone: string;
  email?: string;
  pan?: string;
  upiVpa?: string;
  bank?: { accountName: string; accountNumber: string; ifsc: string; bankName: string };
  /** Content hash of the logo asset kept in the assets table. */
  logoAssetId?: string;
  signatureAssetId?: string;
  stampAssetId?: string;
  terms: string[];
}

export interface Buyer {
  name: string;
  phone?: string;
  address?: string;
  /** Optional. Absent means B2C. */
  gstin?: string;
}

export interface StayInfo {
  bookingRef?: string;
  roomNo: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  nights: number;
  pax?: number;
}

export interface Payment {
  mode: PaymentMode;
  amount: Paise;
  ref?: string;
  at: string;
}

export interface BrandSnapshot {
  accent: string;
  showDeity: boolean;
  deityAssetId?: string;
  shloka?: string;
  paper: PaperSize;
}

export interface Invoice {
  id: string;
  docType: DocType;
  /** "GHI/25-26/A" */
  series: string;
  seq: number;
  /** "GHI/25-26/A0042" */
  number: string;
  fy: string;
  /** Mutable lifecycle flag. Excluded from `hash`. */
  status: InvoiceStatus;
  issuedAt: string;
  supplier: SupplierSnapshot;
  buyer: Buyer;
  stay?: StayInfo;
  lines: InvoiceLine[];
  priceMode: PriceMode;
  interState: boolean;
  totals: InvoiceTotals;
  payments: Payment[];
  balanceDue: Paise;
  amountInWords: string;
  templateId: string;
  templateVersion: number;
  taxRuleVersion: TaxRuleVersion;
  brand: BrandSnapshot;
  createdBy: string;
  deviceId: string;
  /** SHA-256 over the canonical JSON of every field except `status` and `hash`. */
  hash: string;
  /** Set on credit notes: id of the invoice being reversed. */
  creditNoteOf?: string;
  reason?: string;
  /** Warnings produced by the tax engine at issue time. */
  warnings: string[];
}
