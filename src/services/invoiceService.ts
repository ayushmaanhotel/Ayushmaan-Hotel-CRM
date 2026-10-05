import { amountInWords, assertPaise, MoneyError, type Paise } from '../domain/money';
import { computeInvoice } from '../domain/gst/engine';
import { ruleVersionFor } from '../domain/gst/rules';
import { validateGstin } from '../domain/gst/gstin';
import { financialYear } from '../domain/numbering';
import { newId, toLocalIso } from '../domain/id';
import type { Buyer, DraftLine, Invoice, Payment, PriceMode, StayInfo } from '../domain/invoice.types';
import type { InvoiceRepo } from '../db/repos/invoiceRepo';
import {
  SupplierProfileSchema,
  toBrandSnapshot,
  toSupplierSnapshot,
  type BrandingSettings,
  type DeviceIdentity,
  type SupplierProfile,
} from '../db/repos/settingsRepo';

export class InvoiceServiceError extends Error {}

export interface IssueInvoiceInput {
  supplier: SupplierProfile;
  branding: BrandingSettings;
  device: DeviceIdentity;
  createdBy: string;
  buyer: Buyer;
  stay?: StayInfo;
  lines: DraftLine[];
  priceMode?: PriceMode;
  interState?: boolean;
  payments?: Payment[];
  templateVersion?: number;
  now?: Date;
}

function cleanBuyer(buyer: Buyer): Buyer {
  const name = buyer.name.trim();
  if (name.length < 1 || name.length > 100) throw new InvoiceServiceError('Guest name is required (max 100 characters)');
  const out: Buyer = { name };
  if (buyer.phone?.trim()) out.phone = buyer.phone.trim();
  if (buyer.address?.trim()) out.address = buyer.address.trim();
  if (buyer.gstin?.trim()) {
    const g = validateGstin(buyer.gstin);
    if (!g.valid) throw new InvoiceServiceError(`Guest GSTIN is invalid (${g.reason})`);
    out.gstin = g.gstin;
  }
  return out;
}

function checkPayments(payments: Payment[], grandTotal: Paise): Paise {
  let paid = 0;
  for (const p of payments) {
    assertPaise(p.amount, 'payment amount');
    if (p.amount <= 0) throw new InvoiceServiceError('Payment amounts must be positive');
    paid += p.amount;
  }
  if (paid > grandTotal) throw new InvoiceServiceError('Payments exceed the invoice total');
  return grandTotal - paid;
}

/** Computes tax, allocates the next number atomically and stores an immutable invoice. */
export async function issueInvoice(repo: InvoiceRepo, input: IssueInvoiceInput): Promise<Invoice> {
  const supplier = SupplierProfileSchema.parse(input.supplier); // throws with field-level messages
  const buyer = cleanBuyer(input.buyer);
  const now = input.now ?? new Date();
  const issuedAt = toLocalIso(now);
  const priceMode = input.priceMode ?? input.branding.priceMode;
  const taxRuleVersion = ruleVersionFor(issuedAt);
  const computed = computeInvoice(input.lines, {
    priceMode,
    ruleVersion: taxRuleVersion,
    interState: input.interState ?? false,
  });
  if (computed.totals.grandTotal <= 0) throw new InvoiceServiceError('Invoice total must be greater than zero');
  const payments = input.payments ?? [];
  const balanceDue = checkPayments(payments, computed.totals.grandTotal);
  const fy = financialYear(issuedAt);
  const brand = toBrandSnapshot(input.branding);
  const supplierSnapshot = toSupplierSnapshot(supplier);

  return repo.issue(
    { docType: 'invoice', prefix: supplier.invoicePrefix, fy, device: input.device.deviceLetter },
    (alloc) => ({
      id: newId(),
      docType: 'invoice',
      series: alloc.series,
      seq: alloc.seq,
      number: alloc.number,
      fy,
      issuedAt,
      supplier: supplierSnapshot,
      buyer,
      stay: input.stay,
      lines: computed.lines,
      priceMode,
      interState: input.interState ?? false,
      totals: computed.totals,
      payments,
      balanceDue,
      amountInWords: amountInWords(computed.totals.grandTotal),
      templateId: input.branding.templateId,
      templateVersion: input.templateVersion ?? 1,
      taxRuleVersion,
      brand,
      createdBy: input.createdBy,
      deviceId: input.device.deviceId,
      warnings: computed.warnings,
    }),
  );
}

export interface CancelInvoiceInput {
  invoiceId: string;
  reason: string;
  device: DeviceIdentity;
  createdBy: string;
  now?: Date;
}

/**
 * Cancels by issuing a credit note that mirrors the original, then flips the original to `cancelled`
 * in the same transaction. The original's content (and hash) never changes.
 */
export async function cancelInvoice(repo: InvoiceRepo, input: CancelInvoiceInput): Promise<Invoice> {
  const reason = input.reason.trim();
  if (reason.length < 3) throw new InvoiceServiceError('A reason is required to cancel an invoice');
  const original = await repo.get(input.invoiceId);
  if (!original) throw new InvoiceServiceError('Invoice not found');
  if (original.docType !== 'invoice') throw new InvoiceServiceError('Only invoices can be cancelled');
  if (original.status === 'cancelled') throw new InvoiceServiceError(`Invoice ${original.number} is already cancelled`);

  const now = input.now ?? new Date();
  const issuedAt = toLocalIso(now);
  const fy = financialYear(issuedAt);
  const prefix = original.series.split('/')[0];

  return repo.issue(
    { docType: 'credit-note', prefix, fy, device: input.device.deviceLetter },
    (alloc) => ({
      id: newId(),
      docType: 'credit-note',
      series: alloc.series,
      seq: alloc.seq,
      number: alloc.number,
      fy,
      issuedAt,
      supplier: structuredClone(original.supplier),
      buyer: structuredClone(original.buyer),
      stay: original.stay ? structuredClone(original.stay) : undefined,
      lines: structuredClone(original.lines),
      priceMode: original.priceMode,
      interState: original.interState,
      totals: structuredClone(original.totals),
      payments: [],
      balanceDue: 0,
      amountInWords: original.amountInWords,
      templateId: original.templateId,
      templateVersion: original.templateVersion,
      taxRuleVersion: original.taxRuleVersion,
      // Credit notes are working documents, so the deity image is never printed on them.
      brand: { ...original.brand, showDeity: false },
      createdBy: input.createdBy,
      deviceId: input.device.deviceId,
      creditNoteOf: original.id,
      reason,
      warnings: [],
    }),
    { cancels: original.id },
  );
}

export { MoneyError };
