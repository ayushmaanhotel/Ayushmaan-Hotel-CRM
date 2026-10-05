import { describe, expect, it } from 'vitest';
import { gstinCheckChar, normalizeGstin, validateGstin } from './gstin';
import { NumberingError, financialYear, formatNumber, seriesKey } from '../numbering';

describe('GSTIN', () => {
  // 27AAPFU0939F1ZV is the widely-published sample GSTIN used in GST documentation.
  it('accepts a known-valid GSTIN and extracts state and PAN', () => {
    const r = validateGstin('27AAPFU0939F1ZV');
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.stateName).toBe('Maharashtra');
      expect(r.pan).toBe('AAPFU0939F');
    }
  });
  it('normalises spaces and case', () => {
    expect(normalizeGstin(' 27aapfu0939f1zv ')).toBe('27AAPFU0939F1ZV');
    expect(validateGstin(' 27aapfu0939f1zv ').valid).toBe(true);
  });
  it('detects a bad checksum', () => {
    expect(validateGstin('27AAPFU0939F1ZX')).toEqual({ valid: false, reason: 'checksum' });
  });
  it('detects bad structure and unknown state', () => {
    expect(validateGstin('27AAPFU0939F1Z')).toEqual({ valid: false, reason: 'format' });
    expect(validateGstin('00AAPFU0939F1ZV')).toEqual({ valid: false, reason: 'state' });
  });
  it('flags the repo placeholder GSTIN as invalid so it is never printed as real', () => {
    expect(validateGstin('27AABCG1234H1Z5').valid).toBe(false);
  });
  it('generates consistent check characters', () => {
    const first14 = '27AAPFU0939F1Z';
    const full = first14 + gstinCheckChar(first14);
    expect(validateGstin(full).valid).toBe(true);
  });
});

describe('financial year', () => {
  it('rolls over on 1 April', () => {
    expect(financialYear('2026-03-31')).toBe('25-26');
    expect(financialYear('2026-04-01')).toBe('26-27');
    expect(financialYear('2026-10-03T12:00:00+05:30')).toBe('26-27');
    expect(financialYear('1999-12-31')).toBe('99-00');
  });
  it('rejects garbage', () => {
    expect(() => financialYear('garbage')).toThrow(NumberingError);
  });
});

describe('invoice numbers', () => {
  const spec = { docType: 'invoice', prefix: 'GHI', fy: '25-26', device: 'A' } as const;
  it('formats within 16 chars', () => {
    expect(formatNumber(spec, 42)).toBe('GHI/25-26/A0042');
    expect(formatNumber(spec, 42).length).toBeLessThanOrEqual(16);
    expect(formatNumber({ ...spec, docType: 'credit-note' }, 7)).toBe('GHI/25-26/CNA007');
  });
  it('allows a 4-character prefix up to 9999 and rejects overflow', () => {
    expect(formatNumber({ ...spec, prefix: 'GHIX' }, 9999)).toBe('GHIX/25-26/A9999');
    expect(() => formatNumber({ ...spec, prefix: 'GHIX' }, 10_000)).toThrow(NumberingError);
  });
  it('rejects bad prefix, device and sequence', () => {
    expect(() => formatNumber({ ...spec, prefix: 'ghi' }, 1)).toThrow(NumberingError);
    expect(() => formatNumber({ ...spec, device: 'AB' }, 1)).toThrow(NumberingError);
    expect(() => formatNumber(spec, 0)).toThrow(NumberingError);
  });
  it('keeps separate sequence keys per kind, FY and device', () => {
    const keys = new Set([
      seriesKey(spec),
      seriesKey({ ...spec, device: 'B' }),
      seriesKey({ ...spec, fy: '26-27' }),
      seriesKey({ ...spec, docType: 'credit-note' }),
    ]);
    expect(keys.size).toBe(4);
  });
});
