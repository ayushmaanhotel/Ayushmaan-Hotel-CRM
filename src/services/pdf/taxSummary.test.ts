import { describe, it, expect } from 'vitest';
import { computeHsnTaxSummary } from './taxSummary';
import type { InvoiceLine } from '../../domain/invoice.types';

describe('computeHsnTaxSummary', () => {
  it('aggregates multiple lines with the same SAC correctly', () => {
    const lines: InvoiceLine[] = [
      {
        id: '1',
        kind: 'room',
        description: 'Room 101',
        sac: '996311',
        qty: 1,
        unitPrice: 400000,
        discount: 0,
        taxRateBp: 500,
        taxable: 400000,
        cgst: 10000,
        sgst: 10000,
        igst: 0,
        total: 420000,
      },
      {
        id: '2',
        kind: 'room',
        description: 'Room 102',
        sac: '996311',
        qty: 1,
        unitPrice: 200000,
        discount: 0,
        taxRateBp: 500,
        taxable: 200000,
        cgst: 5000,
        sgst: 5000,
        igst: 0,
        total: 210000,
      },
      {
        id: '3',
        kind: 'food',
        description: 'Restaurant Food Order',
        sac: '996331',
        qty: 2,
        unitPrice: 50000,
        discount: 0,
        taxRateBp: 500,
        taxable: 100000,
        cgst: 2500,
        sgst: 2500,
        igst: 0,
        total: 105000,
      },
    ];

    const result = computeHsnTaxSummary(lines);

    expect(result.rows).toHaveLength(2);
    expect(result.totalTaxable).toBe(700000);
    expect(result.totalCgst).toBe(17500);
    expect(result.totalSgst).toBe(17500);
    expect(result.totalTax).toBe(35000);

    const roomRow = result.rows.find((r) => r.sac === '996311')!;
    expect(roomRow.taxable).toBe(600000);
    expect(roomRow.cgst).toBe(15000);
    expect(roomRow.sgst).toBe(15000);
    expect(roomRow.cgstRateBp).toBe(250); // 2.5%
    expect(roomRow.sgstRateBp).toBe(250); // 2.5%

    const foodRow = result.rows.find((r) => r.sac === '996331')!;
    expect(foodRow.taxable).toBe(100000);
    expect(foodRow.cgst).toBe(2500);
    expect(foodRow.sgst).toBe(2500);
  });
});
