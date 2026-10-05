import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  amountInWords,
  assertPaise,
  formatINR,
  rupeesInWords,
  rupeesToPaise,
  roundDiv,
} from './money';

describe('roundDiv', () => {
  it('rounds half away from zero', () => {
    expect(roundDiv(5, 2)).toBe(3);
    expect(roundDiv(-5, 2)).toBe(-3);
    expect(roundDiv(4, 3)).toBe(1);
    expect(roundDiv(0, 7)).toBe(0);
  });
  it('returns the nearest integer to the exact quotient, ties away from zero', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 1, max: 1000 }), (n, d) => {
        const r = roundDiv(n, d);
        // within half a unit of the exact quotient
        expect(Math.abs(r * d - n) * 2).toBeLessThanOrEqual(d);
        // exact ties (2n/d odd integer) resolve upward for positives
        if ((n * 2) % d === 0 && Math.floor((n * 2) / d) % 2 === 1) {
          expect(r).toBe(Math.floor(n / d) + 1);
        }
        // symmetric for negatives
        expect(roundDiv(-n, d)).toBe(r === 0 ? 0 : -r);
      }),
    );
  });
  it('rejects non-integers and non-positive denominators', () => {
    expect(() => roundDiv(1.5, 2)).toThrow();
    expect(() => roundDiv(1, 0)).toThrow();
  });
});

describe('paise helpers', () => {
  it('converts rupees without float drift', () => {
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
    expect(rupeesToPaise(1234.56)).toBe(123456);
  });
  it('asserts integers', () => {
    expect(() => assertPaise(10.5)).toThrow();
    expect(() => assertPaise(10)).not.toThrow();
  });
});

describe('formatINR', () => {
  it('uses lakh/crore grouping and the rupee sign', () => {
    expect(formatINR(12345600)).toBe('\u20B91,23,456.00');
    expect(formatINR(630000)).toBe('\u20B96,300.00');
    expect(formatINR(630000, { decimals: false })).toBe('\u20B96,300');
    expect(formatINR(-5050)).toBe('-\u20B950.50');
    expect(formatINR(1_00_00_000_00)).toBe('\u20B91,00,00,000.00');
  });
});

describe('amountInWords', () => {
  it('speaks Indian numbering', () => {
    expect(amountInWords(630000)).toBe('Rupees Six Thousand Three Hundred Only');
    expect(amountInWords(12345600)).toBe(
      'Rupees One Lakh Twenty Three Thousand Four Hundred Fifty Six Only',
    );
    expect(amountInWords(1_00_00_000_00)).toBe('Rupees One Crore Only');
    expect(amountInWords(105)).toBe('Rupees One And Five Paise Only');
    expect(amountInWords(50)).toBe('Fifty Paise Only');
    expect(amountInWords(0)).toBe('Rupees Zero Only');
  });
  it('handles teens and round tens', () => {
    expect(rupeesInWords(19)).toBe('Nineteen');
    expect(rupeesInWords(110_000)).toBe('One Lakh Ten Thousand');
    expect(rupeesInWords(7_500)).toBe('Seven Thousand Five Hundred');
  });
  it('rejects negatives', () => {
    expect(() => amountInWords(-1)).toThrow();
  });
});
