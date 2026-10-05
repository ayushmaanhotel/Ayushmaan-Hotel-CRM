import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { computeInvoice, pickRoomRate, WARN_SLAB_GAP } from './engine';
import { TAX_RULES, ruleVersionFor } from './rules';
import type { DraftLine } from '../invoice.types';

const room = (unitRupees: number, qty = 1, discountRupees = 0): DraftLine => ({
  id: 'r1',
  kind: 'room',
  description: 'Room',
  qty,
  unitPrice: unitRupees * 100,
  discount: discountRupees * 100,
});

const ex = { priceMode: 'exclusive', ruleVersion: '2025-09-22' } as const;
const inc = { priceMode: 'inclusive', ruleVersion: '2025-09-22' } as const;

describe('rule version selection', () => {
  it('switches on 22 Sep 2025', () => {
    expect(ruleVersionFor('2025-09-21')).toBe('2017-07-01');
    expect(ruleVersionFor('2025-09-22')).toBe('2025-09-22');
    expect(ruleVersionFor('2026-10-03T10:00:00+05:30')).toBe('2025-09-22');
  });
});

describe('room slabs (exclusive)', () => {
  const slabs = TAX_RULES['2025-09-22'].room;
  it.each([
    [100_000, 0],
    [100_001, 500],
    [750_000, 500],
    [750_001, 1800],
  ])('per-night %i paise -> %i bp', (value, bp) => {
    expect(pickRoomRate(value, slabs, 'exclusive').rateBp).toBe(bp);
  });

  it('taxes a ₹6,000 room at 5% with 2.5% CGST/SGST', () => {
    const r = computeInvoice([room(6000, 2)], ex);
    const l = r.lines[0];
    expect(l.taxRateBp).toBe(500);
    expect(l.taxable).toBe(1_200_000);
    expect(l.cgst).toBe(30_000);
    expect(l.sgst).toBe(30_000);
    expect(r.totals.grandTotal).toBe(1_260_000);
  });

  it('taxes a ₹9,000 room at 18%', () => {
    const r = computeInvoice([room(9000)], ex);
    expect(r.lines[0].taxRateBp).toBe(1800);
    expect(r.totals.grandTotal).toBe(1_062_000);
  });

  it('judges the slab on the discounted tariff (₹8,000 rack sold at ₹7,000 -> 5%)', () => {
    const r = computeInvoice([room(8000, 1, 1000)], ex);
    expect(r.lines[0].taxRateBp).toBe(500);
  });

  it('exempts rooms at or under ₹1,000', () => {
    const r = computeInvoice([room(1000)], ex);
    expect(r.lines[0].taxRateBp).toBe(0);
    expect(r.totals.grandTotal).toBe(100_000);
  });

  it('uses the old 12% slab for pre-reform dates', () => {
    const r = computeInvoice([room(5000)], { priceMode: 'exclusive', ruleVersion: '2017-07-01' });
    expect(r.lines[0].taxRateBp).toBe(1200);
  });
});

describe('inclusive pricing', () => {
  it('backs tax out of a ₹6,300 all-in room (5%)', () => {
    const r = computeInvoice([room(6300)], inc);
    const l = r.lines[0];
    expect(l.taxRateBp).toBe(500);
    expect(l.taxable).toBe(600_000);
    expect(l.cgst + l.sgst).toBe(30_000);
    expect(l.total).toBe(630_000);
    expect(r.totals.grandTotal).toBe(630_000);
    expect(r.warnings).toHaveLength(0);
  });

  it('keeps the guest-visible total unchanged (taxable + tax === total)', () => {
    const r = computeInvoice([room(7875)], inc);
    expect(r.lines[0].taxRateBp).toBe(500);
    expect(r.lines[0].taxable).toBe(750_000);
  });

  it('flags the unsolvable gap just above the 5% ceiling and picks 18%', () => {
    const r = computeInvoice([room(8000)], inc);
    expect(r.lines[0].taxRateBp).toBe(1800);
    expect(r.warnings.some((w) => w.startsWith(WARN_SLAB_GAP))).toBe(true);
  });

  it('treats ₹8,850.00 all-in as ambiguous (pre-tax is exactly ₹7,500) but ₹8,850.01 as a clean 18%', () => {
    const edge = computeInvoice([room(8850)], inc);
    expect(edge.lines[0].taxRateBp).toBe(1800);
    expect(edge.warnings.some((w) => w.startsWith(WARN_SLAB_GAP))).toBe(true);

    const clean = computeInvoice(
      [{ id: 'r1', kind: 'room', description: 'Room', qty: 1, unitPrice: 885_001, discount: 0 }],
      inc,
    );
    expect(clean.lines[0].taxRateBp).toBe(1800);
    expect(clean.warnings).toHaveLength(0);
  });

  it('18% invoices well above the gap carry no warning', () => {
    const r = computeInvoice([room(10_000)], inc);
    expect(r.lines[0].taxRateBp).toBe(1800);
    expect(r.warnings).toHaveLength(0);
  });
});

describe('mixed invoices', () => {
  it('applies 5% to food and follows the room slab for extra beds', () => {
    const lines: DraftLine[] = [
      room(9000),
      { id: 'b', kind: 'extra-bed', description: 'Extra bed', qty: 1, unitPrice: 100_000, discount: 0 },
      { id: 'f', kind: 'food', description: 'Dinner', qty: 1, unitPrice: 200_000, discount: 0 },
      { id: 'l', kind: 'laundry', description: 'Laundry', qty: 1, unitPrice: 50_000, discount: 0 },
    ];
    const r = computeInvoice(lines, ex);
    expect(r.lines.map((l) => l.taxRateBp)).toEqual([1800, 1800, 500, 1800]);
    expect(r.lines[1].sac).toBe('996311');
    expect(r.lines[2].sac).toBe('996331');
  });

  it('honours an explicit service rate override', () => {
    const r = computeInvoice(
      [{ id: 's', kind: 'service', description: 'Tour', qty: 1, unitPrice: 100_000, discount: 0, rateBpOverride: 500 }],
      ex,
    );
    expect(r.lines[0].taxRateBp).toBe(500);
  });

  it('rounds the grand total to the nearest rupee and records round-off', () => {
    const r = computeInvoice(
      [{ id: 'f', kind: 'food', description: 'Snack', qty: 1, unitPrice: 12_345, discount: 0 }],
      ex,
    );
    expect(r.totals.grandTotal % 100).toBe(0);
    expect(r.totals.grandTotal - r.totals.roundOff).toBe(r.lines[0].total);
  });

  it('emits IGST only for inter-state supply', () => {
    const r = computeInvoice([room(9000)], { ...ex, interState: true });
    expect(r.totals.cgst).toBe(0);
    expect(r.totals.sgst).toBe(0);
    expect(r.totals.igst).toBe(162_000);
  });
});

describe('validation', () => {
  it('rejects empty invoices, bad qty and over-discounts', () => {
    expect(() => computeInvoice([], ex)).toThrow();
    expect(() => computeInvoice([room(1000, 0)], ex)).toThrow();
    expect(() => computeInvoice([room(1000, 1, 1001)], ex)).toThrow();
    expect(() => computeInvoice([{ ...room(1000), unitPrice: 10.5 }], ex)).toThrow();
  });
});

describe('invariants (property tests)', () => {
  const draftArb = fc.record({
    kind: fc.constantFrom('room', 'food', 'extra-bed', 'laundry', 'service', 'other') as fc.Arbitrary<DraftLine['kind']>,
    qty: fc.integer({ min: 1, max: 30 }),
    unitPrice: fc.integer({ min: 0, max: 5_000_000 }),
  });

  it.each([ex, inc])('totals are internally consistent (%o)', (opts) => {
    fc.assert(
      fc.property(fc.array(draftArb, { minLength: 1, maxLength: 8 }), (rows) => {
        const lines: DraftLine[] = rows.map((r, i) => ({
          id: `l${i}`,
          kind: r.kind,
          description: `line ${i}`,
          qty: r.qty,
          unitPrice: r.unitPrice,
          discount: 0,
        }));
        const out = computeInvoice(lines, opts);
        for (const l of out.lines) {
          expect(l.taxable + l.cgst + l.sgst + l.igst).toBe(l.total);
          expect(l.taxable).toBeGreaterThanOrEqual(0);
          if (opts.priceMode === 'inclusive') {
            const raw = lines.find((d) => d.id === l.id)!;
            expect(l.total).toBe(raw.qty * raw.unitPrice);
          }
        }
        const t = out.totals;
        expect(t.taxable + t.cgst + t.sgst + t.igst + t.roundOff).toBe(t.grandTotal);
        expect(t.grandTotal % 100).toBe(0);
        expect(Math.abs(t.roundOff)).toBeLessThanOrEqual(50);
      }),
      { numRuns: 300 },
    );
  });

  it('room slab is monotone in price (exclusive)', () => {
    const slabs = TAX_RULES['2025-09-22'].room;
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2_000_000 }), fc.integer({ min: 0, max: 2_000_000 }), (a, b) => {
        const [lo, hi] = a <= b ? [a, b] : [b, a];
        expect(pickRoomRate(lo, slabs, 'exclusive').rateBp).toBeLessThanOrEqual(
          pickRoomRate(hi, slabs, 'exclusive').rateBp,
        );
      }),
    );
  });
});
