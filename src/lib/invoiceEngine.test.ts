import { describe, it, expect } from 'vitest';
import {
  accommodationGstRate,
  taxableFromInclusive,
  computeTotals,
  amountInWordsINR,
  fiscalYearOf,
  formatINR,
} from './invoiceEngine';
import type { FolioItem } from '../types/invoice';

const line = (over: Partial<FolioItem>): FolioItem => ({
  id: 'x', date: '2026-10-03', description: 'd', category: 'ROOM', sac: '996311',
  qty: 1, rate: 0, gstRate: 5, amount: 0, ...over,
});

describe('GST slabs (post 22-Sep-2025)', () => {
  it('boundaries', () => {
    expect(accommodationGstRate(999)).toBe(0);
    expect(accommodationGstRate(1000)).toBe(5);
    expect(accommodationGstRate(7500)).toBe(5);
    expect(accommodationGstRate(7501)).toBe(18);
  });
  it('inclusive back-derivation per slab', () => {
    expect(taxableFromInclusive(10500, 5)).toBe(10000);
    expect(taxableFromInclusive(11800, 18)).toBe(10000);
    expect(taxableFromInclusive(500, 0)).toBe(500);
  });
});

describe('totals & slab breakup', () => {
  const items = [
    line({ id: '1', qty: 2, rate: 6500, gstRate: 5 }),
    line({ id: '2', category: 'FNB', qty: 1, rate: 2340, gstRate: 5 }),
    line({ id: '3', category: 'LAUNDRY', qty: 5, rate: 91, gstRate: 18 }),
    line({ id: '4', category: 'TRANSPORT', qty: 1, rate: 1200, gstRate: 18 }),
    line({ id: '5', category: 'DISCOUNT', qty: 1, rate: -500, gstRate: 5 }),
  ];
  const t = computeTotals(items, 'INTRA');

  it('matches the designed template fixture to the paisa', () => {
    expect(t.taxable).toBe(16495);
    expect(t.cgst).toBe(519.95);
    expect(t.sgst).toBe(519.95);
    expect(t.roundOff).toBe(0.1);
    expect(t.grandTotal).toBe(17535);
  });
  it('slab rows sum correctly', () => {
    expect(t.slabs.map(s => [s.rate, s.taxable])).toEqual([[5, 14840], [18, 1655]]);
  });
  it('inter-state swaps to IGST', () => {
    const ti = computeTotals(items, 'INTER');
    expect(ti.cgst).toBe(0);
    expect(ti.igst).toBeCloseTo(1039.9, 2);
    expect(ti.grandTotal).toBe(17535);
  });
});

describe('amount in words (Indian numbering)', () => {
  it('template fixture', () => {
    expect(amountInWordsINR(17535)).toBe('Rupees Seventeen Thousand Five Hundred and Thirty-Five Only');
  });
  it('crore/lakh', () => {
    expect(amountInWordsINR(10234567)).toBe('Rupees One Crore Two Lakh Thirty-Four Thousand Five Hundred and Sixty-Seven Only');
  });
  it('zero', () => {
    expect(amountInWordsINR(0)).toBe('Rupees Zero Only');
  });
});

describe('fiscal year & formatting', () => {
  it('Apr–Mar window', () => {
    expect(fiscalYearOf(new Date('2026-10-03'))).toBe('2026-27');
    expect(fiscalYearOf(new Date('2027-01-15'))).toBe('2026-27');
    expect(fiscalYearOf(new Date('2027-04-01'))).toBe('2027-28');
  });
  it('en-IN grouping', () => {
    expect(formatINR(1234567.5)).toBe('12,34,567.50');
  });
});
