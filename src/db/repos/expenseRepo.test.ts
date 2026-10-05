import 'fake-indexeddb/auto';
import { describe, expect, it, beforeEach } from 'vitest';
import { HotelDB } from '../schema';
import { DexieExpenseRepo } from './expenseRepo';
import { DexieInvoiceRepo } from './invoiceRepo';
import type { HashableInvoice } from '../../domain/hash';
import type { SeriesSpec } from '../../domain/numbering';

describe('DexieExpenseRepo and P&L Engine', () => {
  let db: HotelDB;
  let expenseRepo: DexieExpenseRepo;
  let invoiceRepo: DexieInvoiceRepo;

  beforeEach(() => {
    db = new HotelDB(`test_pnl_db_${Date.now()}_${Math.random()}`);
    expenseRepo = new DexieExpenseRepo(db);
    invoiceRepo = new DexieInvoiceRepo(db);
  });

  it('allocates monotonic voucher numbers for expenses', async () => {
    const exp1 = await expenseRepo.add({
      date: '2026-07-24',
      category: 'kitchen_groceries',
      amount: 45000, // ₹450.00
      paymentMode: 'Cash',
      paidTo: 'Laxmi Milk Dairy',
      description: '10 Litres cow milk for breakfast',
      recordedBy: 'Receptionist Amit',
    });

    expect(exp1.voucherNumber).toBe('EXP/26-27/0001');
    expect(exp1.status).toBe('active');

    const exp2 = await expenseRepo.add({
      date: '2026-07-24',
      category: 'laundry_linen',
      amount: 120000, // ₹1,200.00
      paymentMode: 'UPI',
      paidTo: 'Raju Dhobi',
      description: '25 bedsheets washed and pressed',
      recordedBy: 'Receptionist Amit',
    });

    expect(exp2.voucherNumber).toBe('EXP/26-27/0002');
  });

  it('rejects invalid or zero amounts', async () => {
    await expect(
      expenseRepo.add({
        date: '2026-07-24',
        category: 'kitchen_groceries',
        amount: 0,
        paymentMode: 'Cash',
        paidTo: 'Vendor',
        description: 'Test',
        recordedBy: 'Amit',
      }),
    ).rejects.toThrow();
  });

  it('voids an expense voucher with audit reason', async () => {
    const exp = await expenseRepo.add({
      date: '2026-07-24',
      category: 'maintenance_repairs',
      amount: 80000,
      paymentMode: 'Cash',
      paidTo: 'Electrician Suresh',
      description: 'AC capacitor replace Room 201',
      recordedBy: 'Amit',
    });

    const voided = await expenseRepo.voidExpense(exp.id, 'Wrong bill amount entered');
    expect(voided.status).toBe('void');
    expect(voided.voidReason).toBe('Wrong bill amount entered');
    expect(voided.voidedAt).toBeDefined();

    const activeList = await expenseRepo.list({ status: 'active' });
    expect(activeList).toHaveLength(0);
  });

  it('computes integer-accurate P&L summary and cash reconciliation', async () => {
    // 1. Issue an Invoice for ₹5,250 (500,000 taxable + 25,000 GST) with ₹5,250 Cash
    const spec: SeriesSpec = { docType: 'invoice', prefix: 'GHI', fy: '26-27', device: 'A' };
    await invoiceRepo.issue(spec, (alloc): HashableInvoice => ({
      id: `inv-${alloc.number}`,
      docType: 'invoice',
      series: alloc.series,
      seq: alloc.seq,
      number: alloc.number,
      fy: alloc.fy,
      issuedAt: '2026-07-24T10:00:00+05:30',
      supplier: {
        legalName: 'Grand Heritage Inn',
        tradeName: 'Grand Heritage Inn',
        address: 'Mumbai',
        gstin: '27AAPFU0939F1ZV',
        stateCode: '27',
        phone: '9876543210',
        terms: [],
      },
      buyer: { name: 'Dr. Sunita Patel', phone: '9999999999' },
      lines: [
        {
          id: 'l1',
          kind: 'room',
          description: 'Deluxe Room',
          sac: '996311',
          qty: 1,
          unitPrice: 500000,
          discount: 0,
          taxRateBp: 500,
          taxable: 500000,
          cgst: 12500,
          sgst: 12500,
          igst: 0,
          total: 525000,
        },
      ],
      priceMode: 'exclusive',
      interState: false,
      totals: {
        taxable: 500000,
        cgst: 12500,
        sgst: 12500,
        igst: 0,
        roundOff: 0,
        grandTotal: 525000,
      },
      payments: [{ mode: 'Cash', amount: 525000, at: '2026-07-24T10:00:00+05:30' }],
      balanceDue: 0,
      amountInWords: 'Rupees Five Thousand Two Hundred Fifty Only',
      templateId: 'heritage',
      templateVersion: 1,
      taxRuleVersion: '2025-09-22',
      brand: { accent: '#5B1A1A', showDeity: false, paper: 'A4' },
      createdBy: 'STF-101',
      deviceId: 'A',
      warnings: [],
    }));

    // 2. Add an Expense of ₹1,000 (Cash) and ₹500 (UPI)
    await expenseRepo.add({
      date: '2026-07-24',
      category: 'kitchen_groceries',
      amount: 100000, // ₹1,000 Cash
      paymentMode: 'Cash',
      paidTo: 'Vegetable Market',
      description: 'Daily fresh vegetables',
      recordedBy: 'Amit',
    });

    await expenseRepo.add({
      date: '2026-07-24',
      category: 'utilities_bills',
      amount: 50000, // ₹500 UPI
      paymentMode: 'UPI',
      paidTo: 'BSNL Wi-Fi',
      description: 'Fiber internet bill',
      recordedBy: 'Amit',
    });

    // 3. Compute P&L for 2026-07-24
    const pnl = await expenseRepo.getPnLSummary('2026-07-24', '2026-07-24');

    expect(pnl.grossRevenue).toBe(525000); // ₹5,250.00
    expect(pnl.totalExpenses).toBe(150000); // ₹1,500.00
    expect(pnl.netOperatingProfit).toBe(375000); // ₹3,750.00 profit!
    expect(pnl.profitMarginPct).toBe(71.4); // 375,000 / 525,000 = 71.4%
    expect(pnl.totalGstCollected).toBe(25000); // ₹250.00 GST
    expect(pnl.invoicesCount).toBe(1);
    expect(pnl.expensesCount).toBe(2);

    // Cash Drawer Reconciliation
    expect(pnl.cashReconciliation.cashRevenue).toBe(525000); // ₹5,250 Cash In
    expect(pnl.cashReconciliation.cashExpenses).toBe(100000); // ₹1,000 Cash Out
    expect(pnl.cashReconciliation.netCashFlow).toBe(425000); // ₹4,250 Expected Cash in Drawer!
  });
});
