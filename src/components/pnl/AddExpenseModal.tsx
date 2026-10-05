import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Utensils, 
  Shirt, 
  Zap, 
  Users, 
  Wrench, 
  Percent, 
  Package, 
  IndianRupee,
  Calendar,
  Camera,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getDb } from '../../db/schema';
import { DexieExpenseRepo } from '../../db/repos/expenseRepo';
import { 
  EXPENSE_CATEGORIES, 
  type ExpenseCategory, 
  type ExpensePaymentMode,
  type Expense 
} from '../../domain/expense.types';
import { rupeesToPaise, formatINR } from '../../domain/money';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExpenseAdded?: (expense: Expense) => void;
  currentStaffName?: string;
}

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  kitchen_groceries: Utensils,
  laundry_linen: Shirt,
  utilities_bills: Zap,
  staff_wages: Users,
  maintenance_repairs: Wrench,
  ota_commissions: Percent,
  miscellaneous: Package,
};

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000, 5000];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onExpenseAdded,
  currentStaffName = 'Front Desk',
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(todayStr);
  const [category, setCategory] = useState<ExpenseCategory>('kitchen_groceries');
  const [amountRupees, setAmountRupees] = useState('');
  const [paymentMode, setPaymentMode] = useState<ExpensePaymentMode>('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [receiptPhoto, setReceiptPhoto] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickAddAmount = (addVal: number) => {
    const curr = Number(amountRupees) || 0;
    setAmountRupees((curr + addVal).toString());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('Receipt photo must be under 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const val = Number(amountRupees);
    if (!val || val <= 0) {
      setErrorMsg('Please enter a valid expense amount in Rupees');
      return;
    }
    if (!paidTo.trim()) {
      setErrorMsg('Please enter vendor or recipient name (Paid To)');
      return;
    }

    setIsSubmitting(true);
    try {
      const db = getDb();
      const repo = new DexieExpenseRepo(db);
      const paise = rupeesToPaise(val);

      const created = await repo.add({
        date,
        category,
        amount: paise,
        paymentMode,
        paidTo: paidTo.trim(),
        description: description.trim() || EXPENSE_CATEGORIES[category].labelEn,
        billReceiptAssetId: receiptPhoto || undefined,
        recordedBy: currentStaffName,
      });

      setSuccessMsg(`Voucher ${created.voucherNumber} recorded (${formatINR(created.amount)})`);
      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessMsg('');
        // Reset fields
        setAmountRupees('');
        setPaidTo('');
        setDescription('');
        setReceiptPhoto('');
        onExpenseAdded?.(created);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Failed to record expense voucher');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-[#F8F5EE] border border-[#DDD6C8] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-white border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Record Hotel Expense (खर्च दर्ज करें)</h3>
              <p className="text-[11px] text-stone-600">10-second petty cash & vendor voucher</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Amount Input & Quick Chips */}
          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-2">
            <label className="text-xs font-semibold text-stone-700 flex items-center justify-between">
              <span>Amount (रुपये) *</span>
              <span className="text-[10px] text-stone-500 font-mono">INTEGER INR</span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-lg font-bold text-amber-700">₹</span>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                placeholder="0"
                className="w-full bg-[#FAF8F5] border border-stone-300 focus:border-amber-600 focus:bg-white rounded-xl pl-9 pr-4 py-2.5 text-xl font-bold font-mono text-stone-900 placeholder-stone-400 outline-none transition-all"
              />
            </div>

            {/* Quick Amount Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAddAmount(amt)}
                  className="px-2.5 py-1 bg-white hover:bg-stone-50 text-stone-700 rounded-lg text-xs font-mono border border-stone-300 active:scale-95 transition-all shadow-2xs font-semibold"
                >
                  +{amt}
                </button>
              ))}
              {amountRupees && (
                <button
                  type="button"
                  onClick={() => setAmountRupees('')}
                  className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-xs font-mono border border-red-200 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Grid */}
          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-2">
            <label className="text-xs font-semibold text-stone-700">Category (खर्च की श्रेणी) *</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(EXPENSE_CATEGORIES) as ExpenseCategory[]).map((catKey) => {
                const meta = EXPENSE_CATEGORIES[catKey];
                const IconComponent = CATEGORY_ICONS[catKey];
                const isSelected = category === catKey;

                return (
                  <button
                    key={catKey}
                    type="button"
                    onClick={() => setCategory(catKey)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-start gap-2 ${
                      isSelected
                        ? `${meta.bgClass} ring-1 ring-amber-500 shadow-xs`
                        : 'bg-[#FAF8F5] border-stone-200 hover:border-stone-300 text-stone-600'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? meta.textClass : 'text-stone-400'}`} />
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                        {meta.labelEn}
                      </div>
                      <div className="text-[10px] text-stone-500 truncate">{meta.labelHi}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paid To & Payment Mode */}
          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Paid To (किसे दिया) *</label>
              <input
                type="text"
                required
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="e.g. Raju Dhobi, Milk Dairy"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 outline-none focus:bg-white focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Payment Mode (भुगतान माध्यम)</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as ExpensePaymentMode)}
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:bg-white focus:border-amber-600"
              >
                <option value="Cash">Cash (नकद)</option>
                <option value="UPI">UPI (Google Pay / PhonePe)</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Card">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {/* Date & Description */}
          <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-stone-400" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 outline-none focus:bg-white focus:border-amber-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-stone-700">Notes / Item Details</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 10 litres milk, 20 towels wash"
                className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 outline-none focus:bg-white focus:border-amber-600"
              />
            </div>
          </div>

          {/* Optional Bill/Receipt Photo */}
          <div className="p-3 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-600 flex items-center gap-1.5 font-medium">
                <Camera className="w-3.5 h-3.5 text-stone-500" /> Attach Bill / Kacha Parchi Photo (Optional)
              </span>
              {receiptPhoto && (
                <button
                  type="button"
                  onClick={() => setReceiptPhoto('')}
                  className="text-[10px] text-red-600 hover:underline font-semibold"
                >
                  Remove
                </button>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="block w-full text-[11px] text-stone-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
            />

            {receiptPhoto && (
              <div className="mt-2 w-20 h-20 rounded-lg overflow-hidden border border-stone-300">
                <img src={receiptPhoto} alt="Receipt preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              {isSubmitting ? 'Recording Voucher...' : `Save Expense Voucher • ₹${Number(amountRupees) || 0}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
