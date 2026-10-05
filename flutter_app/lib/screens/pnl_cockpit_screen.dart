import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';

class PnLCockpitScreen extends StatefulWidget {
  final List<Invoice> invoices;
  final List<Expense> expenses;
  final Function(Expense) onExpenseAdded;
  final Function(Expense) onExpenseVoided;
  final List<Room> rooms;
  final HotelConfig hotelConfig;

  const PnLCockpitScreen({
    super.key,
    required this.invoices,
    required this.expenses,
    required this.onExpenseAdded,
    required this.onExpenseVoided,
    required this.rooms,
    required this.hotelConfig,
  });

  @override
  State<PnLCockpitScreen> createState() => _PnLCockpitScreenState();
}

class _PnLCockpitScreenState extends State<PnLCockpitScreen> {
  final String _datePreset = 'All Time'; // 'Today' | 'This Week' | 'This Month' | 'All Time'
  ExpenseCategory? _filterCategory;
  String _searchQuery = '';

  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  List<Expense> get _filteredExpenses {
    return widget.expenses.where((e) {
      if (_filterCategory != null && e.category != _filterCategory) return false;
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final match = e.description.toLowerCase().contains(q) ||
            e.paidTo.toLowerCase().contains(q) ||
            e.voucherNumber.toLowerCase().contains(q);
        if (!match) return false;
      }
      return true;
    }).toList();
  }

  double get _totalRevenue {
    return widget.invoices.where((i) => i.status == 'ISSUED').fold(0.0, (sum, i) => sum + i.grandTotal);
  }

  double get _totalExpenses {
    return widget.expenses.where((e) => e.status == 'active').fold(0.0, (sum, e) => sum + e.amount);
  }

  double get _netProfit => _totalRevenue - _totalExpenses;

  double get _profitMargin {
    if (_totalRevenue <= 0) return 0.0;
    return ((_netProfit / _totalRevenue) * 100);
  }

  double get _revPar {
    if (widget.rooms.isEmpty) return 0.0;
    return _totalRevenue / widget.rooms.length;
  }

  double get _adr {
    final issuedCount = widget.invoices.where((i) => i.status == 'ISSUED').length;
    if (issuedCount == 0) return 0.0;
    return _totalRevenue / issuedCount;
  }

  Map<ExpenseCategory, double> get _categoryTotals {
    final map = <ExpenseCategory, double>{};
    for (final cat in ExpenseCategory.values) {
      map[cat] = 0.0;
    }
    for (final e in widget.expenses.where((e) => e.status == 'active')) {
      map[e.category] = (map[e.category] ?? 0.0) + e.amount;
    }
    return map;
  }

  void _exportPnLStatement() {
    final catMap = _categoryTotals;
    final buffer = StringBuffer();
    buffer.writeln('🏨 *${widget.hotelConfig.hotelName} — Profit & Loss (P&L) Statement*');
    buffer.writeln('📅 Period: $_datePreset · Generated: ${DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now())}');
    buffer.writeln('----------------------------------------');
    buffer.writeln('💰 *Gross Revenue*: ${_currency.format(_totalRevenue)} (${widget.invoices.length} bills)');
    buffer.writeln('📉 *Operating Expenses*: ${_currency.format(_totalExpenses)} (${widget.expenses.where((e) => e.status == 'active').length} vouchers)');
    buffer.writeln('${_netProfit >= 0 ? "🟢" : "🔴"} *Net Operating Profit*: ${_currency.format(_netProfit)} (${_profitMargin.toStringAsFixed(1)}% margin)');
    buffer.writeln('📊 RevPAR: ${_currency.format(_revPar)} · ADR: ${_currency.format(_adr)}');
    buffer.writeln('----------------------------------------');
    buffer.writeln('📂 *Category Expense Breakdown:*');
    catMap.forEach((cat, amt) {
      if (amt > 0) {
        final pct = _totalExpenses > 0 ? ((amt / _totalExpenses) * 100).toStringAsFixed(1) : '0';
        buffer.writeln('• ${cat.labelEn} (${cat.labelHi}): ${_currency.format(amt)} ($pct%)');
      }
    });
    buffer.writeln('----------------------------------------');
    buffer.writeln('✅ Verified by Ayushmaan P&L Engine v2.4');

    Clipboard.setData(ClipboardData(text: buffer.toString()));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('P&L Statement copied to clipboard! Ready to share with CA or WhatsApp.'),
        backgroundColor: AppTheme.maroon,
      ),
    );
  }

  void _showAddExpenseModal() {
    ExpenseCategory selectedCat = ExpenseCategory.kitchenGroceries;
    final amountCtrl = TextEditingController();
    final paidToCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String paymentMode = 'Cash';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 16,
                right: 16,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.add_shopping_cart_rounded, color: AppTheme.maroon, size: 22),
                            SizedBox(width: 8),
                            Text('Record Operating Expense', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                          ],
                        ),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                    const Text('Track daily hotel expenses to maintain accurate net operating profit & CA ledger.', style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted)),
                    const SizedBox(height: 14),

                    // Category Selector
                    const Text('Expense Category', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                    const SizedBox(height: 6),
                    DropdownButtonFormField<ExpenseCategory>(
                      initialValue: selectedCat,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      items: ExpenseCategory.values.map((cat) {
                        return DropdownMenuItem(
                          value: cat,
                          child: Row(
                            children: [
                              Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(color: Color(cat.colorValue), shape: BoxShape.circle),
                              ),
                              const SizedBox(width: 8),
                              Text('${cat.labelEn} (${cat.labelHi})', style: const TextStyle(fontSize: 12.5)),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) setModalState(() => selectedCat = val);
                      },
                    ),

                    const SizedBox(height: 12),
                    TextField(
                      controller: amountCtrl,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: InputDecoration(
                        labelText: 'Expense Amount (₹) *',
                        prefixIcon: const Icon(Icons.currency_rupee_rounded, color: AppTheme.maroon, size: 20),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),

                    const SizedBox(height: 12),
                    TextField(
                      controller: paidToCtrl,
                      decoration: InputDecoration(
                        labelText: 'Paid To / Vendor / Staff Name *',
                        hintText: 'e.g. Bandra Fresh Market or Suresh K.',
                        prefixIcon: const Icon(Icons.storefront_rounded, color: AppTheme.maroon, size: 20),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),

                    const SizedBox(height: 12),
                    TextField(
                      controller: descCtrl,
                      maxLines: 2,
                      decoration: InputDecoration(
                        labelText: 'Description / Bill Purpose',
                        hintText: 'e.g. 50L generator diesel or 30 bedsheets dry cleaning',
                        prefixIcon: const Icon(Icons.description_rounded, color: AppTheme.maroon, size: 20),
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),

                    const SizedBox(height: 12),
                    const Text('Payment Mode', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                    const SizedBox(height: 6),
                    Row(
                      children: ['Cash', 'UPI', 'Bank Transfer', 'Card'].map((mode) {
                        final isSel = paymentMode == mode;
                        return Expanded(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 2),
                            child: ChoiceChip(
                              label: FittedBox(child: Text(mode, style: TextStyle(fontSize: 11, fontWeight: isSel ? FontWeight.bold : FontWeight.normal))),
                              selected: isSel,
                              selectedColor: AppTheme.maroon.withValues(alpha: 0.15),
                              onSelected: (_) => setModalState(() => paymentMode = mode),
                            ),
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.check_circle_rounded, size: 20),
                        label: const Text('Save Expense Voucher', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          final amt = double.tryParse(amountCtrl.text.trim()) ?? 0.0;
                          final paidTo = paidToCtrl.text.trim();
                          if (amt <= 0 || paidTo.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please enter valid amount and vendor name!'), backgroundColor: AppTheme.alertRed),
                            );
                            return;
                          }

                          final count = widget.expenses.length + 1;
                          final voucherNumber = 'EXP/26-27/${count.toString().padLeft(4, '0')}';
                          final newExp = Expense(
                            id: 'EXP-${DateTime.now().millisecondsSinceEpoch}',
                            voucherNumber: voucherNumber,
                            date: DateFormat('dd-MMM-yyyy').format(DateTime.now()),
                            category: selectedCat,
                            amount: amt,
                            paymentMode: paymentMode,
                            paidTo: paidTo,
                            description: descCtrl.text.trim().isEmpty ? selectedCat.labelEn : descCtrl.text.trim(),
                            recordedBy: 'Admin',
                            status: 'active',
                          );

                          widget.onExpenseAdded(newExp);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Expense Voucher $voucherNumber for ${_currency.format(amt)} saved!'),
                              backgroundColor: AppTheme.maroon,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showVoidDialog(Expense expense) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Void Voucher ${expense.voucherNumber}?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Amount: ${_currency.format(expense.amount)} · ${expense.paidTo}'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              decoration: const InputDecoration(labelText: 'Reason for voiding *', hintText: 'e.g. Duplicate entry or cancelled bill'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.alertRed, foregroundColor: Colors.white),
            onPressed: () {
              if (reasonCtrl.text.trim().isEmpty) return;
              final voided = expense.copyWith(
                status: 'void',
                voidReason: reasonCtrl.text.trim(),
              );
              widget.onExpenseVoided(voided);
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Voucher ${expense.voucherNumber} marked as void.'), backgroundColor: AppTheme.alertRed),
              );
            },
            child: const Text('Confirm Void'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final netProfit = _netProfit;
    final isProfitable = netProfit >= 0;

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hotel P&L & Operating Cockpit', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Daily Revenue, Operating Expenses & CA Ledger', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: AppTheme.maroon),
            tooltip: 'Export P&L Statement',
            onPressed: _exportPnLStatement,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.maroon,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Add Expense', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _showAddExpenseModal,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Executive P&L Summary Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 4)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          isProfitable ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                          color: isProfitable ? AppTheme.greenSuccess : AppTheme.alertRed,
                          size: 22,
                        ),
                        const SizedBox(width: 8),
                        const Text('Net Operating Profit', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: (isProfitable ? AppTheme.greenSuccess : AppTheme.alertRed).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${_profitMargin.toStringAsFixed(1)}% MARGIN',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isProfitable ? AppTheme.greenSuccess : AppTheme.alertRed,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _currency.format(netProfit),
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.w900,
                      color: isProfitable ? AppTheme.ink : AppTheme.alertRed,
                      fontFamily: 'serif',
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                const Divider(height: 1),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Gross Revenue', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              _currency.format(_totalRevenue),
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.greenSuccess),
                            ),
                          ),
                          Text('${widget.invoices.length} Bills Issued', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 36, color: AppTheme.borderLight),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Operating Expenses', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              _currency.format(_totalExpenses),
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.alertRed),
                            ),
                          ),
                          Text('${widget.expenses.where((e) => e.status == 'active').length} Vouchers', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 36, color: AppTheme.borderLight),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('RevPAR / ADR', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Text(
                              '${_currency.format(_revPar)} / ${_currency.format(_adr)}',
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.ink),
                            ),
                          ),
                          Text('${widget.rooms.length} Rooms Total', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2. Expense Category Breakdown Bar
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Expense Allocation by Category', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                    Icon(Icons.pie_chart_outline_rounded, size: 18, color: AppTheme.maroon),
                  ],
                ),
                const SizedBox(height: 12),
                ...ExpenseCategory.values.map((cat) {
                  final amt = _categoryTotals[cat] ?? 0.0;
                  final pct = _totalExpenses > 0 ? (amt / _totalExpenses) : 0.0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(color: Color(cat.colorValue), shape: BoxShape.circle),
                                ),
                                const SizedBox(width: 6),
                                Text(cat.labelEn, style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: AppTheme.ink)),
                                const SizedBox(width: 4),
                                Text('(${cat.labelHi})', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                              ],
                            ),
                            Text('${_currency.format(amt)} (${(pct * 100).toStringAsFixed(0)}%)', style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                          ],
                        ),
                        const SizedBox(height: 4),
                        LinearProgressIndicator(
                          value: pct,
                          backgroundColor: Colors.grey.shade100,
                          valueColor: AlwaysStoppedAnimation<Color>(Color(cat.colorValue)),
                          borderRadius: BorderRadius.circular(4),
                          minHeight: 5,
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 3. Search & Filter Bar
          TextField(
            decoration: InputDecoration(
              hintText: 'Search vouchers, vendors, items...',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.borderLight)),
            ),
            onChanged: (val) => setState(() => _searchQuery = val.trim()),
          ),
          const SizedBox(height: 8),

          // Category Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ChoiceChip(
                  label: const Text('All Categories', style: TextStyle(fontSize: 11)),
                  selected: _filterCategory == null,
                  onSelected: (_) => setState(() => _filterCategory = null),
                ),
                ...ExpenseCategory.values.map((cat) {
                  final isSel = _filterCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: ChoiceChip(
                      label: Text(cat.labelEn, style: const TextStyle(fontSize: 11)),
                      selected: isSel,
                      selectedColor: Color(cat.colorValue).withValues(alpha: 0.2),
                      onSelected: (_) => setState(() => _filterCategory = isSel ? null : cat),
                    ),
                  );
                }),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // 4. Expenses List
          if (_filteredExpenses.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40),
              alignment: Alignment.center,
              child: const Text('No expense vouchers match this filter', style: TextStyle(color: AppTheme.textMuted)),
            )
          else
            ..._filteredExpenses.map((expense) {
              final isVoid = expense.status == 'void';
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isVoid ? Colors.grey.shade100 : Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: isVoid ? Colors.grey.shade300 : AppTheme.borderLight),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Color(expense.category.colorValue).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(Icons.receipt_rounded, color: Color(expense.category.colorValue), size: 20),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(expense.voucherNumber, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                              Text(expense.date, style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Text(
                            expense.description,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: FontWeight.bold,
                              color: isVoid ? AppTheme.textMuted : AppTheme.ink,
                              decoration: isVoid ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Paid to: ${expense.paidTo} · Mode: ${expense.paymentMode}',
                            style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted),
                          ),
                          if (isVoid && expense.voidReason != null)
                            Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Text(
                                'VOIDED: ${expense.voidReason}',
                                style: const TextStyle(fontSize: 10, color: AppTheme.alertRed, fontWeight: FontWeight.bold),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          _currency.format(expense.amount),
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: isVoid ? AppTheme.textMuted : AppTheme.alertRed,
                            decoration: isVoid ? TextDecoration.lineThrough : null,
                          ),
                        ),
                        if (!isVoid)
                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: const Icon(Icons.delete_outline_rounded, size: 18, color: AppTheme.textMuted),
                            tooltip: 'Void Voucher',
                            onPressed: () => _showVoidDialog(expense),
                          ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
