import { describe, it, expect, beforeAll } from 'vitest';
import {
  derivePaymentStatus, sanitizeFileName, invoicePdfFileName,
  folioFromInclusive, buildInvoice, reserveInvoiceNumber, fiscalYearOf,
} from './invoiceEngine';
import type { HotelInvoiceConfig } from '../types/invoice';

const store: Record<string, string> = {};
beforeAll(() => {
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
  };
});

const CFG: HotelInvoiceConfig = {
  invoicePrefix: 'GHI', gstEnabled: true, legalName: 'Grand Heritage Inn Hospitality Pvt Ltd',
  stateName: 'Maharashtra', stateCode: '27', blessingLine: '', signatoryName: 'A', signatoryTitle: 'GM', terms: [],
};

describe('payment status (master prompt §29)', () => {
  it('paid / partial / unpaid', () => {
    expect(derivePaymentStatus(10000, 10000)).toBe('PAID');
    expect(derivePaymentStatus(6000, 10000)).toBe('PARTIAL');
    expect(derivePaymentStatus(0, 10000)).toBe('UNPAID');
    expect(derivePaymentStatus(9999.999, 10000)).toBe('PAID');   // round-off safe
  });
});

describe('file names (master prompt §46)', () => {
  it('sanitizes unsafe characters', () => {
    expect(sanitizeFileName('Grand Heritage Inn!')).toBe('GrandHeritageInn');
    expect(sanitizeFileName('../../etc/passwd')).toBe('....etcpasswd');
    expect(sanitizeFileName('$$$')).toBe('invoice');
  });
  it('business-number-date pattern', () => {
    expect(invoicePdfFileName('Grand Heritage Inn', 'GHI/26-27/0142', '2026-10-03'))
      .toBe('GrandHeritageInn_GHI-26-27-0142_2026-10-03.pdf');
  });
});

describe('inclusive → taxable folio conversion (master prompt §40)', () => {
  it('GST mode: 5% slab back-derives taxable, tax adds forward', () => {
    const folio = folioFromInclusive(
      [{ id: '1', description: 'Room', category: 'ROOM', sac: '996311', qty: 2, rateIncl: 6500 }],
      6500, 'GST');
    expect(folio[0].gstRate).toBe(5);
    expect(folio[0].rate).toBe(6190.48);            // 13000/1.05/2 rounded
    expect(folio[0].amount).toBe(12380.96);
  });
  it('SIMPLE mode: zero tax, amounts as quoted', () => {
    const folio = folioFromInclusive(
      [{ id: '1', description: 'Tea', category: 'FNB', sac: '996331', qty: 3, rateIncl: 20 }],
      undefined, 'SIMPLE');
    expect(folio[0].gstRate).toBe(0);
    expect(folio[0].amount).toBe(60);
  });
  it('discounts stay negative', () => {
    const folio = folioFromInclusive(
      [{ id: '1', description: 'Disc', category: 'DISCOUNT', sac: '996311', qty: 1, rateIncl: -500 }],
      6500, 'GST');
    expect(folio[0].amount).toBeLessThan(0);
  });
});

describe('GST-optional rule (master prompt §2/§11)', () => {
  const guest = { name: 'Rahul', phone: '+91 90000 00000', stateName: 'Maharashtra', stateCode: '27' };
  const items = folioFromInclusive(
    [{ id: '1', description: 'Product A', category: 'EXTRA', sac: '998399', qty: 1, rateIncl: 500 },
     { id: '2', description: 'Product B', category: 'EXTRA', sac: '998399', qty: 2, rateIncl: 200 }],
    undefined, 'SIMPLE');

  it('config gstEnabled=false forces SIMPLE with zero tax', () => {
    const inv = buildInvoice({
      config: { ...CFG, gstEnabled: false }, guest, items,
      payment: { method: 'Cash', status: 'PAID', received: 900, balanceDue: 0, entries: [], upiVpa: 'x@upi' },
      issuedBy: 'test',
    });
    expect(inv.mode).toBe('SIMPLE');
    expect(inv.totals.taxTotal).toBe(0);
    expect(inv.totals.grandTotal).toBe(900);
    expect(inv.payment.status).toBe('PAID');
  });

  it('explicit mode override wins over config', () => {
    const inv = buildInvoice({
      config: { ...CFG, gstEnabled: false }, guest, mode: 'GST',
      items: folioFromInclusive(
        [{ id: '1', description: 'Room', category: 'ROOM', sac: '996311', qty: 1, rateIncl: 5000 }], 5000, 'GST'),
      payment: { method: 'UPI', status: 'UNPAID', received: 0, balanceDue: 0, entries: [], upiVpa: 'x@upi' },
      issuedBy: 'test',
    });
    expect(inv.mode).toBe('GST');
    expect(inv.totals.taxTotal).toBeGreaterThan(0);
    expect(inv.payment.status).toBe('UNPAID');
  });
});

describe('numbering safeguards (master prompt §16)', () => {
  it('sequential, FY-keyed, 16-char safe', () => {
    const d = new Date('2026-10-03');
    const a = reserveInvoiceNumber('GHI', d);
    const b = reserveInvoiceNumber('GHI', d);
    expect(a).not.toBe(b);
    expect(b.length).toBeLessThanOrEqual(16);
    expect(fiscalYearOf(d)).toBe('2026-27');
  });
});
