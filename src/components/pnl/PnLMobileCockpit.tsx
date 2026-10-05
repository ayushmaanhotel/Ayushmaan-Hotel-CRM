import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Plus, 
  Download, 
  Calendar, 
  Search, 
  Lock, 
  Trash2, 
  AlertCircle,
  CheckCircle2,
  Receipt,
  FileText
} from 'lucide-react';
import { getDb } from '../../db/schema';
import { DexieExpenseRepo } from '../../db/repos/expenseRepo';
import { 
  type PnLSummary, 
  type Expense, 
  type ExpenseCategory,
  EXPENSE_CATEGORIES 
} from '../../domain/expense.types';
import { formatINR } from '../../domain/money';
import { 
  getPresetDateRange, 
  type DateRangePreset, 
  exportExpensesToCsv, 
  exportPnLToCsv, 
  downloadCsvFile 
} from '../../services/pnlService';
import { AddExpenseModal } from './AddExpenseModal';
import type { UserRole } from '../../hooks/useHotelStore';

interface PnLMobileCockpitProps {
  activeRole: UserRole;
  currentStaffName?: string;
  onOpenNewInvoice?: () => void;
}

export const PnLMobileCockpit: React.FC<PnLMobileCockpitProps> = ({
  activeRole,
  currentStaffName = 'Staff',
  onOpenNewInvoice,
}) => {
  const [preset, setPreset] = useState<DateRangePreset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [isCustomDate, setIsCustomDate] = useState(false);

  const [summary, setSummary] = useState<PnLSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory | 'all'>('all');

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [voidingExpense, setVoidingExpense] = useState<Expense | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isOwner = activeRole === 'owner';

  const fetchPnLData = useCallback(async () => {
    try {
      const db = getDb();
      const repo = new DexieExpenseRepo(db);

      let startDate: string;
      let endDate: string;

      if (isCustomDate && customStart && customEnd) {
        startDate = customStart;
        endDate = customEnd;
      } else {
        const range = getPresetDateRange(preset);
        startDate = range.startDate;
        endDate = range.endDate;
      }

      const pnlData = await repo.getPnLSummary(startDate, endDate);
      setSummary(pnlData);

      const expList = await repo.list({
        startDate,
        endDate,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        query: searchQuery,
        status: 'all',
      });
      setExpenses(expList);
    } catch (err: any) {
      console.error('Failed to load P&L data:', err);
    }
  }, [preset, isCustomDate, customStart, customEnd, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchPnLData();
  }, [fetchPnLData]);

  const handleVoidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingExpense || !voidReason.trim()) return;

    try {
      const db = getDb();
      const repo = new DexieExpenseRepo(db);
      await repo.voidExpense(voidingExpense.id, voidReason);
      setVoidingExpense(null);
      setVoidReason('');
      setActionMsg({ type: 'success', text: `Voucher ${voidingExpense.voucherNumber} marked void` });
      fetchPnLData();
      setTimeout(() => setActionMsg(null), 3000);
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.message || 'Failed to void expense' });
    }
  };

  const handleExportExpensesCsv = () => {
    const csv = exportExpensesToCsv(expenses);
    downloadCsvFile(csv, `Expenses_Ledger_${summary?.startDate || 'export'}.csv`);
  };

  const handleExportPnLCsv = () => {
    if (!summary) return;
    const csv = exportPnLToCsv(summary);
    downloadCsvFile(csv, `PnL_Statement_${summary.startDate}_to_${summary.endDate}.csv`);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      {/* Cockpit Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#E5DFD3] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-mono border border-amber-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              P&L ENGINE LIVE
            </span>
            <span className="text-xs text-stone-500">Offline-First Accounting</span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight mt-1">
            Profit & Loss Cockpit (मुनाफा व खर्च)
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Real-time daily margins, expense vouchers & cash drawer reconciliation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddExpenseOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Record Expense (खर्च)
          </button>

          {onOpenNewInvoice && (
            <button
              onClick={onOpenNewInvoice}
              className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <FileText className="w-3.5 h-3.5" />
              + New Bill
            </button>
          )}
        </div>
      </div>

      {actionMsg && (
        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
          actionMsg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{actionMsg.text}</span>
        </div>
      )}

      {/* Date Filter Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#E5DFD3] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['today', 'yesterday', 'this_week', 'this_month', 'last_month'] as DateRangePreset[]).map((p) => {
            const range = getPresetDateRange(p);
            const isSelected = !isCustomDate && preset === p;
            return (
              <button
                key={p}
                onClick={() => {
                  setIsCustomDate(false);
                  setPreset(p);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  isSelected
                    ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs font-bold'
                    : 'bg-[#FAF8F5] text-stone-600 hover:text-stone-900 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {range.label}
              </button>
            );
          })}

          <div className="flex items-center gap-1.5 pl-2 sm:border-l border-[#E5DFD3]">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <input
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                if (e.target.value && customEnd) setIsCustomDate(true);
              }}
              className="bg-[#FAF8F5] border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-900 focus:bg-white outline-none"
            />
            <span className="text-stone-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                if (customStart && e.target.value) setIsCustomDate(true);
              }}
              className="bg-[#FAF8F5] border border-stone-300 rounded-lg px-2 py-1 text-[11px] text-stone-900 focus:bg-white outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {summary && isOwner && (
            <button
              onClick={handleExportPnLCsv}
              className="px-2.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl flex items-center gap-1 border border-stone-300 shadow-2xs font-medium"
              title="Download Accountant P&L CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" /> P&L CSV
            </button>
          )}
          <button
            onClick={handleExportExpensesCsv}
            className="px-2.5 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl flex items-center gap-1 border border-stone-300 shadow-2xs font-medium"
            title="Download Expense Ledger CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" /> Expense CSV
          </button>
        </div>
      </div>

      {/* Hero Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Gross Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-600 text-xs font-semibold">
            <span>Gross Revenue (कुल आय)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-stone-900">
            {formatINR(summary?.grossRevenue ?? 0)}
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-2">
            <span>{summary?.invoicesCount ?? 0} Invoices</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium">GST: {formatINR(summary?.totalGstCollected ?? 0)}</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-2">
          <div className="flex items-center justify-between text-stone-600 text-xs font-semibold">
            <span>Operating Expenses (कुल खर्च)</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black font-mono text-stone-900">
            {formatINR(summary?.totalExpenses ?? 0)}
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-2">
            <span>{summary?.expensesCount ?? 0} Vouchers logged</span>
            <span>•</span>
            <span className="text-rose-700 font-medium">{summary?.categoryBreakdown.length ?? 0} Categories</span>
          </div>
        </div>

        {/* Net Profit (Role Gated) */}
        <div className={`p-4 rounded-2xl border shadow-xs space-y-2 ${
          isOwner 
            ? (summary?.netOperatingProfit ?? 0) >= 0
              ? 'bg-emerald-50/70 border-emerald-200'
              : 'bg-rose-50/70 border-rose-200'
            : 'bg-white border-[#E5DFD3]'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className={isOwner ? 'text-stone-800' : 'text-stone-500'}>Net Profit (शुद्ध मुनाफा)</span>
            {isOwner ? (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                (summary?.netOperatingProfit ?? 0) >= 0 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {summary?.profitMarginPct ?? 0}% Margin
              </span>
            ) : (
              <Lock className="w-3.5 h-3.5 text-stone-400" />
            )}
          </div>

          {isOwner ? (
            <>
              <div className={`text-2xl font-black font-mono ${
                (summary?.netOperatingProfit ?? 0) >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}>
                {formatINR(summary?.netOperatingProfit ?? 0)}
              </div>
              <div className="text-[11px] text-stone-600 font-medium">
                {(summary?.netOperatingProfit ?? 0) >= 0 ? '✓ Profitable Operations' : '⚠ Operating at a Deficit'}
              </div>
            </>
          ) : (
            <div className="py-2 text-xs text-stone-500 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-stone-400" />
              <span>Owner PIN required for net margin visibility</span>
            </div>
          )}
        </div>
      </div>

      {/* Cash Drawer Reconciliation (Daily Shutter Closing) */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Cash Drawer Reconciliation (गल्ला / दराज नकदी मिलान)
            </h3>
          </div>
          <span className="text-[10px] text-stone-500 font-mono font-medium">Daily Drawer Balance</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3]">
            <span className="text-[10px] text-stone-500 block mb-0.5 font-medium">Cash In (नकद आया)</span>
            <span className="text-sm font-bold font-mono text-emerald-700">
              +{formatINR(summary?.cashReconciliation.cashRevenue ?? 0)}
            </span>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3]">
            <span className="text-[10px] text-stone-500 block mb-0.5 font-medium">Cash Out (नकद खर्च हुआ)</span>
            <span className="text-sm font-bold font-mono text-rose-700">
              -{formatINR(summary?.cashReconciliation.cashExpenses ?? 0)}
            </span>
          </div>

          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3]">
            <span className="text-[10px] text-stone-500 block mb-0.5 font-medium">Expected Cash in Hand (दराज में नकद)</span>
            <span className="text-sm font-bold font-mono text-amber-800">
              ={formatINR(summary?.cashReconciliation.netCashFlow ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Expense Breakdown & Progress Bars */}
      {summary && summary.categoryBreakdown.length > 0 && (
        <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
            Where Did Money Go? (खर्च का विवरण)
          </h3>

          <div className="space-y-2.5">
            {summary.categoryBreakdown.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-800">{item.meta.labelEn}</span>
                    <span className="text-[10px] text-stone-500 font-mono">({item.meta.labelHi})</span>
                  </div>
                  <div className="font-mono text-xs font-bold text-stone-900">
                    {formatINR(item.amount)}{' '}
                    <span className="text-[10px] text-stone-500 font-normal">({item.percentageOfTotal}%)</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${item.percentageOfTotal}%`,
                      backgroundColor: item.meta.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense Vouchers Feed & Register */}
      <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-600" />
            Expense Vouchers Log ({expenses.length})
          </h3>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vendor / item..."
                className="bg-[#FAF8F5] border border-stone-300 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:bg-white outline-none w-48"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-[#FAF8F5] border border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-900 focus:bg-white outline-none"
            >
              <option value="all">All Categories</option>
              {Object.keys(EXPENSE_CATEGORIES).map((k) => (
                <option key={k} value={k}>
                  {EXPENSE_CATEGORIES[k as ExpenseCategory].labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="p-8 text-center text-xs text-stone-500 space-y-2">
            <Receipt className="w-8 h-8 text-stone-400 mx-auto" />
            <p>No expense vouchers found for this period.</p>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="text-amber-700 hover:underline font-semibold"
            >
              + Record the first expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E5DFD3] max-h-96 overflow-y-auto">
            {expenses.map((exp) => {
              const meta = EXPENSE_CATEGORIES[exp.category];
              const isVoid = exp.status === 'void';

              return (
                <div
                  key={exp.id}
                  className={`py-3 flex items-center justify-between gap-3 transition-colors ${
                    isVoid ? 'opacity-50 line-through' : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center font-bold text-xs ${meta.bgClass} ${meta.textClass}`}>
                      {meta.labelEn.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-stone-900 flex items-center gap-2">
                        <span>{exp.paidTo}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${meta.bgClass} ${meta.textClass}`}>
                          {meta.labelEn}
                        </span>
                        {isVoid && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-100 border border-red-200 text-red-700 font-mono">
                            VOID
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-stone-600">{exp.voucherNumber}</span>
                        <span>•</span>
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span>{exp.paymentMode}</span>
                        {exp.description && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[150px]">{exp.description}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-stone-900">
                        {formatINR(exp.amount)}
                      </div>
                      <div className="text-[10px] text-stone-500">{exp.recordedBy}</div>
                    </div>

                    {!isVoid && isOwner && (
                      <button
                        onClick={() => setVoidingExpense(exp)}
                        className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-stone-100"
                        title="Void voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onExpenseAdded={() => fetchPnLData()}
        currentStaffName={currentStaffName}
      />

      {/* Void Confirmation Modal */}
      {voidingExpense && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-[#DDD6C8] rounded-2xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-sm font-bold text-stone-900">Void Expense Voucher?</h4>
            <p className="text-xs text-stone-600">
              Voucher <span className="font-mono text-amber-700 font-bold">{voidingExpense.voucherNumber}</span> for{' '}
              {formatINR(voidingExpense.amount)} will be marked void. An audit reason is required.
            </p>

            <form onSubmit={handleVoidSubmit} className="space-y-3">
              <input
                type="text"
                required
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason (e.g. Bill entered twice, cancelled)"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:bg-white focus:border-red-500"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidingExpense(null)}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Confirm Void
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
