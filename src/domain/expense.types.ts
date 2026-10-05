import type { Paise } from './money';

export type ExpenseCategory =
  | 'kitchen_groceries'   // Milk, vegetables, provisions, cooking gas
  | 'laundry_linen'       // Bed sheets, towels, dry cleaning
  | 'utilities_bills'     // Electricity, water, Wi-Fi, generator diesel
  | 'staff_wages'         // Daily wages, salary advances, overtime
  | 'maintenance_repairs' // Plumbing, AC service, electrical repairs, painting
  | 'ota_commissions'     // MakeMyTrip, Goibibo, Booking.com commissions
  | 'miscellaneous';      // Stationery, guest toiletries, cleaning supplies

export interface ExpenseCategoryMeta {
  key: ExpenseCategory;
  labelEn: string;
  labelHi: string;
  iconName: string;
  color: string;
  bgClass: string;
  textClass: string;
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, ExpenseCategoryMeta> = {
  kitchen_groceries: {
    key: 'kitchen_groceries',
    labelEn: 'Kitchen & Provisions',
    labelHi: 'रसोई और राशन',
    iconName: 'Utensils',
    color: '#F59E0B',
    bgClass: 'bg-amber-500/10 border-amber-500/30',
    textClass: 'text-amber-400',
  },
  laundry_linen: {
    key: 'laundry_linen',
    labelEn: 'Laundry & Linen',
    labelHi: 'धुलाई और चादरें',
    iconName: 'Shirt',
    color: '#3B82F6',
    bgClass: 'bg-blue-500/10 border-blue-500/30',
    textClass: 'text-blue-400',
  },
  utilities_bills: {
    key: 'utilities_bills',
    labelEn: 'Electricity & Utilities',
    labelHi: 'बिजली व जनरेटर',
    iconName: 'Zap',
    color: '#EF4444',
    bgClass: 'bg-red-500/10 border-red-500/30',
    textClass: 'text-red-400',
  },
  staff_wages: {
    key: 'staff_wages',
    labelEn: 'Staff Salary & Advance',
    labelHi: 'स्टाफ वेतन व अग्रिम',
    iconName: 'Users',
    color: '#8B5CF6',
    bgClass: 'bg-purple-500/10 border-purple-500/30',
    textClass: 'text-purple-400',
  },
  maintenance_repairs: {
    key: 'maintenance_repairs',
    labelEn: 'Repairs & Maintenance',
    labelHi: 'मरम्मत व रखरखाव',
    iconName: 'Wrench',
    color: '#EC4899',
    bgClass: 'bg-pink-500/10 border-pink-500/30',
    textClass: 'text-pink-400',
  },
  ota_commissions: {
    key: 'ota_commissions',
    labelEn: 'OTA Commission Leak',
    labelHi: 'MMT / OTA कमीशन',
    iconName: 'Percent',
    color: '#F97316',
    bgClass: 'bg-orange-500/10 border-orange-500/30',
    textClass: 'text-orange-400',
  },
  miscellaneous: {
    key: 'miscellaneous',
    labelEn: 'General & Misc',
    labelHi: 'अन्य विविध खर्च',
    iconName: 'Package',
    color: '#6B7280',
    bgClass: 'bg-zinc-500/10 border-zinc-500/30',
    textClass: 'text-zinc-400',
  },
};

export type ExpensePaymentMode = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer';

export interface Expense {
  id: string;
  voucherNumber: string; // e.g. EXP/26-27/0001
  date: string;          // YYYY-MM-DD
  category: ExpenseCategory;
  amount: Paise;         // Integer paise
  paymentMode: ExpensePaymentMode;
  paidTo: string;        // Recipient / Vendor name
  description: string;
  billReceiptAssetId?: string; // Optional photo reference
  recordedBy: string;    // Staff ID or name
  createdAt: string;     // ISO 8601
  status: 'active' | 'void';
  voidReason?: string;
  voidedAt?: string;
}

export interface DraftExpense {
  date: string;
  category: ExpenseCategory;
  amount: Paise;
  paymentMode: ExpensePaymentMode;
  paidTo: string;
  description: string;
  billReceiptAssetId?: string;
  recordedBy: string;
}

export interface PnLSummary {
  startDate: string;
  endDate: string;
  grossRevenue: Paise;       // From issued invoices
  totalExpenses: Paise;      // From active expenses
  netOperatingProfit: Paise; // grossRevenue - totalExpenses
  profitMarginPct: number;   // (netOperatingProfit / grossRevenue) * 100
  totalGstCollected: Paise;  // CGST + SGST + IGST
  invoicesCount: number;
  expensesCount: number;
  categoryBreakdown: Array<{
    category: ExpenseCategory;
    meta: ExpenseCategoryMeta;
    amount: Paise;
    percentageOfTotal: number;
  }>;
  cashReconciliation: {
    cashRevenue: Paise;
    cashExpenses: Paise;
    netCashFlow: Paise;
  };
}
