import { describe, it, expect } from 'vitest';
import { generateInvoicePdf, invoiceDocumentDefinition } from './invoicePdf';
import { invoicePreviewHtml } from './invoicePreview';
import { domainInvoiceToVectorInvoice } from './invoiceAdapter';
import type { Invoice as VectorInvoice, HotelInvoiceConfig } from '../types/invoice';
import type { Invoice as DomainInvoice } from '../domain/invoice.types';
import type { HotelConfig } from '../types/hotel';

const sampleHotelConfig: HotelConfig & HotelInvoiceConfig = {
  hotelName: 'Grand Heritage Inn Hotel',
  legalName: 'Grand Heritage Hospitality Pvt Ltd',
  upiVpa: 'grandheritage@upi',
  merchantName: 'Grand Heritage Inn',
  gstin: '27AABCG1234H1Z5',
  gstEnabled: true,
  address: 'Beach Road, Bandra West, Mumbai 400050',
  phone: '+91 98765 43210',
  email: 'stay@grandheritage.com',
  invoicePrefix: 'GHI',
  stateName: 'Maharashtra',
  stateCode: '27',
  signatoryName: 'Aman Varma',
  signatoryTitle: 'General Manager',
  terms: ['Check-out: 11:00 AM', 'Disputes subject to local jurisdiction'],
};

const sampleVectorInvoice: VectorInvoice = {
  id: 'inv-test-1',
  invoiceNumber: 'GHI/25-26/0042',
  fiscalYear: '2025-26',
  issueDate: '2026-10-04',
  issueTime: '12:00',
  guest: {
    name: 'Rajesh Sharma',
    phone: '+91 98765 00000',
    address: 'Andheri West, Mumbai',
    stateName: 'Maharashtra',
    stateCode: '27',
  },
  stay: {
    roomNumber: '101',
    roomType: 'Deluxe Suite',
    checkIn: '2026-10-02',
    checkOut: '2026-10-04',
    nights: 2,
    tariffPerNight: 4500,
  },
  items: [
    {
      id: 'it-1',
      date: '2026-10-02',
      description: 'Room 101 Accommodation',
      category: 'ROOM',
      sac: '996311',
      qty: 2,
      rate: 4500,
      gstRate: 5,
      amount: 9000,
    },
    {
      id: 'it-2',
      date: '2026-10-03',
      description: 'Breakfast & Room Dining',
      category: 'FNB',
      sac: '996331',
      qty: 1,
      rate: 800,
      gstRate: 5,
      amount: 800,
    },
  ],
  payment: {
    method: 'UPI',
    status: 'PAID',
    received: 10290,
    balanceDue: 0,
    entries: [{ date: '2026-10-04', mode: 'UPI', amount: 10290, ref: 'UPI-REF-99' }],
    upiVpa: 'grandheritage@upi',
  },
  supplyType: 'INTRA',
  placeOfSupply: 'Maharashtra (27)',
  totals: {
    taxable: 9800,
    cgst: 245,
    sgst: 245,
    igst: 0,
    taxTotal: 490,
    roundOff: 0,
    grandTotal: 10290,
    totalInWords: 'Ten Thousand Two Hundred Ninety Rupees Only',
    slabs: [{ rate: 5, taxable: 9800, cgst: 245, sgst: 245, igst: 0, total: 10290 }],
  },
  mode: 'GST',
  status: 'ISSUED',
  issuedBy: 'Aman Varma',
  paperSize: 'A4',
  originalFor: 'RECIPIENT',
};

describe('Vector PDF Engine & Preview (pdfmake + pure hex HTML)', () => {
  it('builds A4 vector document definition without throwing', () => {
    const docDef = invoiceDocumentDefinition(sampleVectorInvoice, sampleHotelConfig, 'A4');
    expect(docDef).toBeDefined();
    expect(docDef.pageSize).toBe('A4');
    expect(docDef.content).toBeDefined();
  });

  it('builds A5 compact vector document definition with proportionate margins', () => {
    const docDef = invoiceDocumentDefinition(sampleVectorInvoice, sampleHotelConfig, 'A5');
    expect(docDef).toBeDefined();
    expect(docDef.pageSize).toBe('A5');
  });

  it('generates real vector PDF blob in A4 mode', async () => {
    const blob = await generateInvoicePdf(sampleVectorInvoice, sampleHotelConfig, 'A4');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/pdf');
  });

  it('generates real vector PDF blob in A5 mode', async () => {
    const blob = await generateInvoicePdf(sampleVectorInvoice, sampleHotelConfig, 'A5');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(1000);
    expect(blob.type).toBe('application/pdf');
  });

  it('renders sandboxed preview HTML with ZERO lch/oklch color references', () => {
    const html = invoicePreviewHtml(sampleVectorInvoice, sampleHotelConfig, 'A4');
    expect(html).toContain('<!doctype html>');
    expect(html).toContain('Tax Invoice');
    expect(html).toContain('GHI/25-26/0042');
    // Absolute ban on modern CSS color functions that break canvas or print parsers
    expect(html.toLowerCase()).not.toContain('oklch(');
    expect(html.toLowerCase()).not.toContain('lch(');
    // Verifies Heritage Luxe v2 luxury tokens and typography
    expect(html).toContain('--paper:#fffdf8');
    expect(html).toContain('--maroon:#7a1f2b');
    expect(html).toContain('class="wm serif"');
    expect(html).toContain('class="rule"');
  });

  it('adapts Dexie domain invoice to vector invoice cleanly', () => {
    const domainInvoice: DomainInvoice = {
      id: 'dom-1',
      docType: 'invoice',
      series: 'GHI',
      seq: 14,
      number: 'GHI/25-26/0014',
      fy: '2025-26',
      status: 'issued',
      issuedAt: '2026-10-04T10:30:00.000Z',
      supplier: {
        legalName: 'Grand Heritage Hotels Pvt Ltd',
        tradeName: 'Grand Heritage Inn',
        address: 'Jaipur, Rajasthan',
        gstin: '08AAPFU0939F1ZV',
        stateCode: '08',
        phone: '+91 98765 43210',
        upiVpa: 'grandheritage@upi',
        terms: ['Test term'],
      },
      buyer: {
        name: 'Amit Patel',
        phone: '+91 99999 88888',
      },
      stay: {
        roomNo: '204',
        roomType: 'Super Deluxe',
        nights: 1,
      },
      lines: [
        {
          id: 'l-1',
          kind: 'room',
          description: 'Room 204 Accommodation',
          sac: '996311',
          qty: 1,
          unitPrice: 350000,
          discount: 0,
          taxRateBp: 500,
          taxable: 350000,
          cgst: 8750,
          sgst: 8750,
          igst: 0,
          total: 367500,
        },
      ],
      priceMode: 'inclusive',
      interState: false,
      totals: {
        taxable: 350000,
        cgst: 8750,
        sgst: 8750,
        igst: 0,
        roundOff: 0,
        grandTotal: 367500,
      },
      payments: [
        {
          mode: 'UPI',
          amount: 367500,
          at: '2026-10-04T10:30:00.000Z',
        },
      ],
      balanceDue: 0,
      amountInWords: 'Three Thousand Six Hundred Seventy Five Rupees Only',
      templateId: 'royal-heritage',
      templateVersion: 1,
      taxRuleVersion: '2025-09-22',
      brand: {
        accent: '#5B1A1A',
        showDeity: true,
        shloka: '॥ श्री गणेशाय नमः ॥',
        paper: 'A4',
      },
      createdBy: 'FRONT_DESK',
      deviceId: 'DEV-1',
      hash: 'abc123hash',
      warnings: [],
    };

    const vectorInv = domainInvoiceToVectorInvoice(domainInvoice);
    expect(vectorInv.invoiceNumber).toBe('GHI/25-26/0014');
    expect(vectorInv.guest.name).toBe('Amit Patel');
    expect(vectorInv.stay?.roomNumber).toBe('204');
    expect(vectorInv.totals.grandTotal).toBe(3675);
    expect(vectorInv.items.length).toBe(1);
    expect(vectorInv.items[0].gstRate).toBe(5);
  });
});
