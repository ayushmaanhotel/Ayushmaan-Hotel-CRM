import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';
import 'invoice_detail_screen.dart';
import 'invoice_composer_screen.dart';

class InvoicesScreen extends StatefulWidget {
  final List<Invoice> invoices;
  final Function(Invoice)? onInvoiceCreated;
  final HotelConfig? hotelConfig;

  const InvoicesScreen({
    super.key,
    required this.invoices,
    this.onInvoiceCreated,
    this.hotelConfig,
  });

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  String _searchQuery = '';
  String _statusFilter = 'All'; // 'All' | 'Issued' | 'Cancelled'

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    final filteredInvoices = widget.invoices.where((inv) {
      final matchesSearch = inv.invoiceNumber.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          inv.guestName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          inv.roomNumber.toLowerCase().contains(_searchQuery.toLowerCase());
      if (_statusFilter == 'Issued') return matchesSearch && inv.status == 'ISSUED';
      if (_statusFilter == 'Cancelled') return matchesSearch && inv.status == 'CANCELLED';
      return matchesSearch;
    }).toList();

    final totalInvoiced = widget.invoices.fold<double>(0.0, (sum, i) => sum + i.grandTotal);
    final totalGst = widget.invoices.fold<double>(0.0, (sum, i) => sum + (i.cgst + i.sgst + i.igst));

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('GST Invoices Register', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('CBIC 2026 Compliant · Heritage Luxe v2', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.maroon,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_rounded),
        label: const Text('Create Bill', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => InvoiceComposerScreen(
                hotelConfig: widget.hotelConfig,
                onInvoiceCreated: (newInv) {
                  if (widget.onInvoiceCreated != null) {
                    widget.onInvoiceCreated!(newInv);
                  }
                  setState(() {});
                },
              ),
            ),
          );
        },
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Ledger Metric Cards (Responsive Row)
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Total Invoiced', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          currency.format(totalInvoiced),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.greenSuccess),
                        ),
                      ),
                      Text('${widget.invoices.length} Active Bills', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('GST Collected', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                      const SizedBox(height: 2),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          currency.format(totalGst),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                        ),
                      ),
                      const Text('CGST + SGST', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // 2. Search Box
          TextField(
            onChanged: (val) => setState(() => _searchQuery = val),
            decoration: InputDecoration(
              hintText: 'Search by invoice #, guest, room...',
              prefixIcon: const Icon(Icons.search, size: 20, color: AppTheme.textMuted),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 14),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderLight),
              ),
            ),
          ),

          const SizedBox(height: 10),

          // 3. Status Filters (Wrapped in Horizontal Scroll to NEVER overflow)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilter('All (${widget.invoices.length})', 'All'),
                const SizedBox(width: 8),
                _buildFilter('Issued (${widget.invoices.where((i) => i.status == 'ISSUED').length})', 'Issued'),
                const SizedBox(width: 8),
                _buildFilter('Cancelled (${widget.invoices.where((i) => i.status == 'CANCELLED').length})', 'Cancelled'),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // 4. Invoices List (Zero Flex Overflows)
          if (filteredInvoices.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.receipt_long_outlined, size: 48, color: AppTheme.textMuted.withValues(alpha: 0.5)),
                    const SizedBox(height: 10),
                    const Text('No invoices match the filter', style: TextStyle(color: AppTheme.textMuted)),
                  ],
                ),
              ),
            )
          else
            ...filteredInvoices.map((inv) => _buildInvoiceCard(inv, currency)),
        ],
      ),
    );
  }

  Widget _buildInvoiceCard(Invoice inv, NumberFormat currency) {
    final isAyush = inv.guestName.toLowerCase().contains('ayush');
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isAyush ? AppTheme.gold : AppTheme.borderLight,
          width: isAyush ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => InvoiceDetailScreen(
                  invoice: inv,
                  hotelConfig: widget.hotelConfig,
                ),
              ),
            );
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Row 1: GST Avatar + Invoice Number + Status Badge + Grand Total
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: isAyush ? AppTheme.goldPale : AppTheme.maroonLight,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'GST',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isAyush ? AppTheme.gold : AppTheme.maroon,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Row(
                        children: [
                          Flexible(
                            child: Text(
                              inv.invoiceNumber,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.ink,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: inv.status == 'CANCELLED' ? AppTheme.alertSoft : AppTheme.greenSoft,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              inv.status,
                              style: TextStyle(
                                fontSize: 8.5,
                                fontWeight: FontWeight.bold,
                                color: inv.status == 'CANCELLED' ? AppTheme.alertRed : AppTheme.greenSuccess,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      currency.format(inv.grandTotal),
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.ink,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Row 2: Guest Name, Room + GST Tax Amount
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${inv.guestName} · Room ${inv.roomNumber}',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.ink),
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 1),
                          Text(
                            '${inv.date} · ${inv.lines.length} item(s) · ${inv.guestPhone}',
                            style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'GST: ${currency.format(inv.cgst + inv.sgst + inv.igst)}',
                          style: const TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.w500),
                        ),
                        Text(
                          inv.paymentMode,
                          style: const TextStyle(fontSize: 9.5, color: AppTheme.maroon, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFilter(String label, String value) {
    final isSelected = _statusFilter == value;
    return GestureDetector(
      onTap: () => setState(() => _statusFilter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.maroon : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: isSelected ? AppTheme.maroon : AppTheme.borderLight),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }
}
