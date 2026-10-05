import type { InvoiceLine } from '../../domain/invoice.types';
import { amountInWords, type Paise } from '../../domain/money';

export interface HsnTaxSummaryRow {
  sac: string;
  taxable: Paise;
  cgstRateBp: number;
  cgst: Paise;
  sgstRateBp: number;
  sgst: Paise;
  igstRateBp: number;
  igst: Paise;
  totalTax: Paise;
}

export interface TaxSummaryReport {
  rows: HsnTaxSummaryRow[];
  totalTaxable: Paise;
  totalCgst: Paise;
  totalSgst: Paise;
  totalIgst: Paise;
  totalTax: Paise;
  taxAmountInWords: string;
}

/**
 * Groups line items by HSN/SAC and tax rate to produce the statutory
 * CBIC 8-column GST audit table.
 */
export function computeHsnTaxSummary(lines: InvoiceLine[]): TaxSummaryReport {
  const map = new Map<string, HsnTaxSummaryRow>();

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalTax = 0;

  for (const line of lines) {
    const sac = line.sac || '996311';
    const key = `${sac}-${line.taxRateBp}`;

    let row = map.get(key);
    if (!row) {
      // For intra-state, split rate between CGST and SGST
      const halfRateBp = Math.floor(line.taxRateBp / 2);
      row = {
        sac,
        taxable: 0,
        cgstRateBp: line.cgst > 0 ? halfRateBp : 0,
        cgst: 0,
        sgstRateBp: line.sgst > 0 ? halfRateBp : 0,
        sgst: 0,
        igstRateBp: line.igst > 0 ? line.taxRateBp : 0,
        igst: 0,
        totalTax: 0,
      };
      map.set(key, row);
    }

    row.taxable += line.taxable;
    row.cgst += line.cgst;
    row.sgst += line.sgst;
    row.igst += line.igst;
    const lineTax = line.cgst + line.sgst + line.igst;
    row.totalTax += lineTax;

    totalTaxable += line.taxable;
    totalCgst += line.cgst;
    totalSgst += line.sgst;
    totalIgst += line.igst;
    totalTax += lineTax;
  }

  const rows = Array.from(map.values()).sort((a, b) => a.sac.localeCompare(b.sac));

  let taxAmountInWords = 'Zero';
  try {
    taxAmountInWords = amountInWords(totalTax);
  } catch {
    taxAmountInWords = `INR ${(totalTax / 100).toFixed(2)}`;
  }

  return {
    rows,
    totalTaxable,
    totalCgst,
    totalSgst,
    totalIgst,
    totalTax,
    taxAmountInWords,
  };
}
