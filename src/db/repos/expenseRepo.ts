import type { HotelDB } from '../schema';
import type { Expense, DraftExpense, PnLSummary, ExpenseCategory } from '../../domain/expense.types';
import { EXPENSE_CATEGORIES } from '../../domain/expense.types';
import { newId, toLocalIso } from '../../domain/id';
import { financialYear } from '../../domain/numbering';
import { assertPaise, type Paise } from '../../domain/money';

export interface ExpenseListFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  category?: ExpenseCategory;
  status?: 'active' | 'void' | 'all';
  query?: string;
}

export class DexieExpenseRepo {
  private db: HotelDB;

  constructor(db: HotelDB) {
    this.db = db;
  }

  /**
   * Records a new expense voucher with atomic monotonic numbering.
   */
  async add(draft: DraftExpense, deviceId: string = 'A'): Promise<Expense> {
    assertPaise(draft.amount, 'Expense amount');
    if (!draft.paidTo.trim()) throw new Error('Paid-to recipient name is required');
    if (draft.amount <= 0) throw new Error('Expense amount must be greater than zero');

    const fy = financialYear(draft.date);
    const seqKey = `expense|${fy}|${deviceId}`;

    return await this.db.transaction('rw', [this.db.expenses, this.db.sequences], async () => {
      const seqRow = await this.db.sequences.get(seqKey);
      const nextSeq = (seqRow?.value ?? 0) + 1;
      await this.db.sequences.put({ key: seqKey, value: nextSeq });

      const voucherNumber = `EXP/${fy}/${nextSeq.toString().padStart(4, '0')}`;
      const expense: Expense = {
        id: newId(),
        voucherNumber,
        date: draft.date,
        category: draft.category,
        amount: draft.amount,
        paymentMode: draft.paymentMode,
        paidTo: draft.paidTo.trim(),
        description: draft.description.trim(),
        billReceiptAssetId: draft.billReceiptAssetId,
        recordedBy: draft.recordedBy,
        createdAt: toLocalIso(new Date()),
        status: 'active',
      };

      await this.db.expenses.add(expense);
      return expense;
    });
  }

  /**
   * Voids an expense voucher while preserving the audit trail.
   */
  async voidExpense(id: string, reason: string): Promise<Expense> {
    if (!reason.trim()) throw new Error('A reason is required to void an expense voucher');

    return await this.db.transaction('rw', [this.db.expenses], async () => {
      const existing = await this.db.expenses.get(id);
      if (!existing) throw new Error(`Expense voucher ${id} not found`);
      if (existing.status === 'void') throw new Error('Expense voucher is already voided');

      const updated: Expense = {
        ...existing,
        status: 'void',
        voidReason: reason.trim(),
        voidedAt: toLocalIso(new Date()),
      };

      await this.db.expenses.put(updated);
      return updated;
    });
  }

  async get(id: string): Promise<Expense | undefined> {
    return await this.db.expenses.get(id);
  }

  /**
   * Lists expenses matching the provided filter criteria.
   */
  async list(filter: ExpenseListFilter = {}): Promise<Expense[]> {
    let collection = this.db.expenses.toCollection();

    let items = await collection.toArray();

    // Sort newest first
    items.sort((a, b) => {
      const cmp = b.date.localeCompare(a.date);
      return cmp !== 0 ? cmp : b.createdAt.localeCompare(a.createdAt);
    });

    if (filter.status && filter.status !== 'all') {
      items = items.filter((e) => e.status === filter.status);
    } else if (!filter.status) {
      items = items.filter((e) => e.status === 'active');
    }

    if (filter.startDate) {
      items = items.filter((e) => e.date >= filter.startDate!);
    }

    if (filter.endDate) {
      items = items.filter((e) => e.date <= filter.endDate!);
    }

    if (filter.category) {
      items = items.filter((e) => e.category === filter.category);
    }

    if (filter.query) {
      const q = filter.query.toLowerCase().trim();
      items = items.filter(
        (e) =>
          e.voucherNumber.toLowerCase().includes(q) ||
          e.paidTo.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q),
      );
    }

    return items;
  }

  /**
   * Computes comprehensive, integer-accurate P&L metrics between startDate and endDate (inclusive).
   */
  async getPnLSummary(startDate: string, endDate: string): Promise<PnLSummary> {
    // 1. Fetch Invoices in range
    const invoices = await this.db.invoices
      .filter((inv) => {
        const invDate = inv.issuedAt.slice(0, 10);
        return (
          inv.status === 'issued' &&
          inv.docType === 'invoice' &&
          invDate >= startDate &&
          invDate <= endDate
        );
      })
      .toArray();

    // 2. Fetch Active Expenses in range
    const expenses = await this.db.expenses
      .filter((exp) => exp.status === 'active' && exp.date >= startDate && exp.date <= endDate)
      .toArray();

    // 3. Compute Gross Revenue & GST from Invoices
    let grossRevenue: Paise = 0;
    let totalGstCollected: Paise = 0;
    let cashRevenue: Paise = 0;

    for (const inv of invoices) {
      grossRevenue += inv.totals.grandTotal;
      totalGstCollected += inv.totals.cgst + inv.totals.sgst + inv.totals.igst;

      // Calculate cash receipts from payments
      for (const p of inv.payments) {
        if (p.mode === 'Cash') {
          cashRevenue += p.amount;
        }
      }
    }

    // 4. Compute Expenses & Breakdown
    let totalExpenses: Paise = 0;
    let cashExpenses: Paise = 0;
    const catTotals: Partial<Record<ExpenseCategory, Paise>> = {};

    for (const exp of expenses) {
      totalExpenses += exp.amount;
      catTotals[exp.category] = (catTotals[exp.category] ?? 0) + exp.amount;

      if (exp.paymentMode === 'Cash') {
        cashExpenses += exp.amount;
      }
    }

    const netOperatingProfit: Paise = grossRevenue - totalExpenses;
    const profitMarginPct =
      grossRevenue > 0
        ? Math.round((netOperatingProfit / grossRevenue) * 1000) / 10
        : totalExpenses > 0
          ? -100
          : 0;

    // Build Category Breakdown
    const allCategories = Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[];
    const categoryBreakdown = allCategories
      .map((catKey) => {
        const amount = catTotals[catKey] ?? 0;
        const percentageOfTotal =
          totalExpenses > 0 ? Math.round((amount / totalExpenses) * 1000) / 10 : 0;
        return {
          category: catKey,
          meta: EXPENSE_CATEGORIES[catKey],
          amount,
          percentageOfTotal,
        };
      })
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    return {
      startDate,
      endDate,
      grossRevenue,
      totalExpenses,
      netOperatingProfit,
      profitMarginPct,
      totalGstCollected,
      invoicesCount: invoices.length,
      expensesCount: expenses.length,
      categoryBreakdown,
      cashReconciliation: {
        cashRevenue,
        cashExpenses,
        netCashFlow: cashRevenue - cashExpenses,
      },
    };
  }
}
