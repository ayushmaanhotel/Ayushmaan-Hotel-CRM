import type { Expense, PnLSummary } from '../domain/expense.types';
import { EXPENSE_CATEGORIES } from '../domain/expense.types';
import { paiseToRupees } from '../domain/money';

export type DateRangePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month';

export function getPresetDateRange(preset: DateRangePreset): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (preset) {
    case 'today': {
      const todayStr = format(now);
      return { startDate: todayStr, endDate: todayStr, label: 'Today (आज)' };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = format(y);
      return { startDate: yStr, endDate: yStr, label: 'Yesterday (कल)' };
    }
    case 'this_week': {
      const start = new Date(now);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      return { startDate: format(start), endDate: format(now), label: 'This Week (इस सप्ताह)' };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: format(start), endDate: format(now), label: 'This Month (इस महीने)' };
    }
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: format(start), endDate: format(end), label: 'Last Month (पिछले महीने)' };
    }
  }
}

/**
 * Generates an accountant-ready CSV spreadsheet of all expense vouchers.
 */
export function exportExpensesToCsv(expenses: Expense[]): string {
  const headers = [
    'Voucher Number',
    'Date',
    'Category',
    'Category (Hindi)',
    'Amount (INR)',
    'Payment Mode',
    'Paid To',
    'Description',
    'Recorded By',
    'Status',
  ];

  const rows = expenses.map((exp) => {
    const meta = EXPENSE_CATEGORIES[exp.category];
    return [
      `"${exp.voucherNumber}"`,
      `"${exp.date}"`,
      `"${meta.labelEn}"`,
      `"${meta.labelHi}"`,
      paiseToRupees(exp.amount).toFixed(2),
      `"${exp.paymentMode}"`,
      `"${exp.paidTo.replace(/"/g, '""')}"`,
      `"${exp.description.replace(/"/g, '""')}"`,
      `"${exp.recordedBy.replace(/"/g, '""')}"`,
      `"${exp.status}"`,
    ];
  });

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Generates a Profit & Loss summary CSV report.
 */
export function exportPnLToCsv(summary: PnLSummary): string {
  const lines: string[] = [];
  lines.push('AYUSHMAAN OS — PROFIT & LOSS STATEMENT');
  lines.push(`Period,${summary.startDate} to ${summary.endDate}`);
  lines.push('');
  lines.push('Metric,Amount (INR)');
  lines.push(`Gross Room & Service Revenue,${paiseToRupees(summary.grossRevenue).toFixed(2)}`);
  lines.push(`Total Operating Expenses,${paiseToRupees(summary.totalExpenses).toFixed(2)}`);
  lines.push(`Net Operating Profit,${paiseToRupees(summary.netOperatingProfit).toFixed(2)}`);
  lines.push(`Operating Margin (%),${summary.profitMarginPct.toFixed(1)}%`);
  lines.push(`GST Collected,${paiseToRupees(summary.totalGstCollected).toFixed(2)}`);
  lines.push('');
  lines.push('EXPENSE CATEGORY BREAKDOWN');
  lines.push('Category,Amount (INR),Share of Expenses (%)');

  for (const cat of summary.categoryBreakdown) {
    lines.push(`"${cat.meta.labelEn}",${paiseToRupees(cat.amount).toFixed(2)},${cat.percentageOfTotal}%`);
  }

  lines.push('');
  lines.push('CASH FLOW RECONCILIATION');
  lines.push(`Cash Revenue Collected,${paiseToRupees(summary.cashReconciliation.cashRevenue).toFixed(2)}`);
  lines.push(`Cash Expenses Paid,${paiseToRupees(summary.cashReconciliation.cashExpenses).toFixed(2)}`);
  lines.push(`Net Cash Retained,${paiseToRupees(summary.cashReconciliation.netCashFlow).toFixed(2)}`);

  return lines.join('\n');
}

export function downloadCsvFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
