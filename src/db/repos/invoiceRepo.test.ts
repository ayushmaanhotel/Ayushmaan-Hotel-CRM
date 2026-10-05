import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { HotelDB } from '../schema';
import { DexieInvoiceRepo } from './invoiceRepo';
import type { HashableInvoice } from '../../domain/hash';
import type { SeriesSpec } from '../../domain/numbering';

describe('DexieInvoiceRepo', () => {
  let db: HotelDB;
  let repo: DexieInvoiceRepo;

  beforeEach(async () => {
    db = new HotelDB(`test_db_${Date.now()}_${Math.random()}`);
    repo = new DexieInvoiceRepo(db);
  });

  const spec: SeriesSpec = {
    docType: 'invoice',
    prefix: 'GHI',
    fy: '25-26',
    device: 'A',
  };

  const sampleDraft = (alloc: { seq: number; number: string; series: string; fy: string }): HashableInvoice => ({
    id: `inv-${alloc.number}`,
    docType: 'invoice',
    series: alloc.series,
    seq: alloc.seq,
    number: alloc.number,
    fy: alloc.fy,
    issuedAt: '2026-07-24T10:00:00+05:30',
    supplier: {
      legalName: 'Grand Heritage Inn',
      tradeName: 'Grand Heritage Inn',
      address: 'Beach Road, Mumbai',
      gstin: '27AAPFU0939F1ZV',
      stateCode: '27',
      phone: '+91 9876543210',
      terms: ['Standard terms'],
    },
    buyer: {
      name: 'John Doe',
      phone: '+91 9999999999',
    },
    lines: [
      {
        id: 'l1',
        kind: 'room',
        description: 'Deluxe Room',
        sac: '996311',
        qty: 1,
        unitPrice: 500000,
        discount: 0,
        taxRateBp: 500,
        taxable: 500000,
        cgst: 12500,
        sgst: 12500,
        igst: 0,
        total: 525000,
      },
    ],
    priceMode: 'exclusive',
    interState: false,
    totals: {
      taxable: 500000,
      cgst: 12500,
      sgst: 12500,
      igst: 0,
      roundOff: 0,
      grandTotal: 525000,
    },
    payments: [],
    balanceDue: 525000,
    amountInWords: 'Rupees Five Thousand Two Hundred Fifty Only',
    templateId: 'heritage',
    templateVersion: 1,
    taxRuleVersion: '2025-09-22',
    brand: {
      accent: '#5B1A1A',
      showDeity: false,
      paper: 'A4',
    },
    createdBy: 'STF-101',
    deviceId: 'dev-1',
    warnings: [],
  });

  it('allocates sequential numbers monotonically', async () => {
    const inv1 = await repo.issue(spec, (alloc) => sampleDraft(alloc));
    expect(inv1.seq).toBe(1);
    expect(inv1.number).toBe('GHI/25-26/A0001');
    expect(inv1.status).toBe('issued');
    expect(inv1.hash).toBeDefined();

    const inv2 = await repo.issue(spec, (alloc) => sampleDraft(alloc));
    expect(inv2.seq).toBe(2);
    expect(inv2.number).toBe('GHI/25-26/A0002');
  });

  it('verifies tamper-proof hash correctly', async () => {
    const inv = await repo.issue(spec, (alloc) => sampleDraft(alloc));
    const isValid = await repo.verify(inv.id);
    expect(isValid).toBe(true);

    // If data in DB were mutated directly:
    await db.invoices.update(inv.id, { amountInWords: 'Rupees Zero Only' });
    const isNowValid = await repo.verify(inv.id);
    expect(isNowValid).toBe(false);
  });

  it('cancels target invoice atomically when credit note issued', async () => {
    const original = await repo.issue(spec, (alloc) => sampleDraft(alloc));
    expect(original.status).toBe('issued');

    const cnSpec: SeriesSpec = { ...spec, docType: 'credit-note' };
    const cn = await repo.issue(
      cnSpec,
      (alloc) => ({
        ...sampleDraft(alloc),
        docType: 'credit-note',
        creditNoteOf: original.id,
      }),
      { cancels: original.id },
    );

    expect(cn.docType).toBe('credit-note');
    expect(cn.number).toBe('GHI/25-26/CNA001');

    const updatedOriginal = await repo.get(original.id);
    expect(updatedOriginal?.status).toBe('cancelled');

    const relatedCns = await repo.creditNotesFor(original.id);
    expect(relatedCns).toHaveLength(1);
    expect(relatedCns[0].id).toBe(cn.id);
  });
});
