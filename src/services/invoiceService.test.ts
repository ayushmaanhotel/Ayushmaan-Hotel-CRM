import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { HotelDB } from '../db/schema';
import { DexieInvoiceRepo } from '../db/repos/invoiceRepo';
import { cancelInvoice, issueInvoice } from './invoiceService';
import type { SupplierProfile, BrandingSettings, DeviceIdentity } from '../db/repos/settingsRepo';

describe('invoiceService', () => {
  let db: HotelDB;
  let repo: DexieInvoiceRepo;

  beforeEach(() => {
    db = new HotelDB(`test_service_db_${Date.now()}_${Math.random()}`);
    repo = new DexieInvoiceRepo(db);
  });

  const supplier: SupplierProfile = {
    legalName: 'Grand Heritage Inn Hospitality Pvt Ltd',
    tradeName: 'Grand Heritage Inn',
    address: 'Beach Road, Bandra West, Mumbai 400050',
    gstin: '27AAPFU0939F1ZV',
    phone: '+91 98765 43210',
    email: undefined,
    upiVpa: undefined,
    invoicePrefix: 'GHI',
    logoAssetId: undefined,
    signatureAssetId: undefined,
    stampAssetId: undefined,
    terms: ['Check-out time 11:00 AM'],
  };

  const branding: BrandingSettings = {
    accent: '#5B1A1A',
    showDeity: false,
    deityAssetId: undefined,
    shloka: '॥ श्री गणेशाय नमः ॥',
    paper: 'A4',
    templateId: 'heritage',
    priceMode: 'inclusive',
  };

  const device: DeviceIdentity = {
    deviceId: 'dev-pos-1',
    deviceLetter: 'A',
  };

  it('issues an invoice with full GST breakdown, amount in words, and balance due', async () => {
    const inv = await issueInvoice(repo, {
      supplier,
      branding,
      device,
      createdBy: 'STF-101',
      buyer: {
        name: 'Rahul Sharma',
        phone: '+91 98200 11223',
      },
      stay: {
        roomNo: '204',
        roomType: 'Deluxe Ocean View',
        nights: 2,
        checkIn: '2026-10-01',
        checkOut: '2026-10-03',
      },
      lines: [
        {
          id: 'l1',
          kind: 'room',
          description: 'Deluxe Ocean View Accommodation',
          qty: 2,
          unitPrice: 350000, // ₹3,500/night inclusive -> ₹7,000 total (5% GST slab)
          discount: 0,
        },
      ],
      payments: [
        {
          mode: 'UPI',
          amount: 700000,
          ref: 'UPI-TXN-12345',
          at: '2026-10-03T11:00:00+05:30',
        },
      ],
      now: new Date('2026-10-03T11:00:00+05:30'),
    });

    expect(inv.number).toMatch(/^GHI\/26-27\/A0001$/);
    expect(inv.totals.grandTotal).toBe(700000);
    expect(inv.lines[0].taxRateBp).toBe(500);
    expect(inv.lines[0].taxable).toBe(666667); // ₹6,666.67
    expect(inv.totals.cgst).toBe(16667); // ₹166.67
    expect(inv.totals.sgst).toBe(16666); // ₹166.66
    expect(inv.balanceDue).toBe(0);
    expect(inv.amountInWords).toBe('Rupees Seven Thousand Only');
  });

  it('cancels invoice and creates linked credit note', async () => {
    const inv = await issueInvoice(repo, {
      supplier,
      branding,
      device,
      createdBy: 'STF-101',
      buyer: { name: 'Pooja Verma' },
      lines: [
        {
          id: 'l1',
          kind: 'room',
          description: 'Standard Room',
          qty: 1,
          unitPrice: 200000,
          discount: 0,
        },
      ],
      now: new Date('2026-10-03T11:00:00+05:30'),
    });

    const cn = await cancelInvoice(repo, {
      invoiceId: inv.id,
      reason: 'Guest early cancellation before check-in',
      device,
      createdBy: 'STF-101',
      now: new Date('2026-10-03T11:30:00+05:30'),
    });

    expect(cn.docType).toBe('credit-note');
    expect(cn.creditNoteOf).toBe(inv.id);
    expect(cn.reason).toBe('Guest early cancellation before check-in');

    const refreshed = await repo.get(inv.id);
    expect(refreshed?.status).toBe('cancelled');
  });
});
