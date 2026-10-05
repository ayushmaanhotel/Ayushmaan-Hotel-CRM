import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';
import 'invoice_detail_screen.dart';

/// Screen to compose and issue a statutory GST Tax Invoice on mobile.
class InvoiceComposerScreen extends StatefulWidget {
  final Room? preselectedRoom;
  final Function(Invoice) onInvoiceCreated;
  final HotelConfig? hotelConfig;

  const InvoiceComposerScreen({
    super.key,
    this.preselectedRoom,
    required this.onInvoiceCreated,
    this.hotelConfig,
  });

  @override
  State<InvoiceComposerScreen> createState() => _InvoiceComposerScreenState();
}

class _InvoiceComposerScreenState extends State<InvoiceComposerScreen> {
  final _formKey = GlobalKey<FormState>();
  final _guestNameController = TextEditingController();
  final _guestPhoneController = TextEditingController();
  final _guestAddressController = TextEditingController(text: 'Mumbai, Maharashtra');
  final _guestGstinController = TextEditingController();
  final _roomNumberController = TextEditingController();
  int _nights = 1;
  String _paymentMode = 'UPI';
  bool _isInterState = false;
  bool _isInclusiveTax = true;
  double _amountPaid = 0.0;
  final List<InvoiceLine> _lines = [];

  @override
  void initState() {
    super.initState();
    _isInclusiveTax = widget.hotelConfig?.priceMode != 'exclusive';
    if (widget.preselectedRoom != null) {
      final room = widget.preselectedRoom!;
      _roomNumberController.text = room.number;
      if (room.currentGuest != null) {
        _guestNameController.text = room.currentGuest!.name;
        _guestPhoneController.text = room.currentGuest!.phone;
      }
      // Add initial accommodation line
      _addPresetLine(
        'Room ${room.number} Accommodation',
        '996311',
        1,
        room.pricePerNight,
        room.pricePerNight > 7500 ? 18 : (room.pricePerNight > 1000 ? 5 : 0),
      );
    } else {
      _roomNumberController.text = '101';
      _addPresetLine('Room Accommodation (Deluxe)', '996311', 1, 4500, 5);
    }
  }

  @override
  void dispose() {
    _guestNameController.dispose();
    _guestPhoneController.dispose();
    _guestAddressController.dispose();
    _guestGstinController.dispose();
    _roomNumberController.dispose();
    super.dispose();
  }

  void _addPresetLine(String desc, String sac, int qty, double unitPrice, int gstRate) {
    double taxable;
    double totalGst;
    double total;

    if (_isInclusiveTax && gstRate > 0) {
      total = qty * unitPrice;
      taxable = total / (1.0 + (gstRate / 100.0));
      totalGst = total - taxable;
    } else {
      taxable = qty * unitPrice;
      totalGst = taxable * (gstRate / 100.0);
      total = taxable + totalGst;
    }

    final halfGst = totalGst / 2.0;

    setState(() {
      _lines.add(
        InvoiceLine(
          id: 'line-${DateTime.now().millisecondsSinceEpoch}-${_lines.length}',
          description: desc,
          sac: sac,
          qty: qty,
          unitPrice: unitPrice,
          taxable: taxable,
          cgst: _isInterState ? 0.0 : halfGst,
          sgst: _isInterState ? 0.0 : halfGst,
          igst: _isInterState ? totalGst : 0.0,
          total: total,
          gstRatePercent: gstRate,
        ),
      );
      _recalculatePaidDefault();
    });
  }

  void _recalculatePaidDefault() {
    final grand = _calculateGrandTotal();
    _amountPaid = grand;
  }

  double _calculateTaxable() => _lines.fold(0.0, (sum, l) => sum + l.taxable);
  double _calculateCgst() => _lines.fold(0.0, (sum, l) => sum + l.cgst);
  double _calculateSgst() => _lines.fold(0.0, (sum, l) => sum + l.sgst);
  double _calculateIgst() => _lines.fold(0.0, (sum, l) => sum + l.igst);
  double _calculateGrandTotal() {
    final sub = _calculateTaxable() + _calculateCgst() + _calculateSgst() + _calculateIgst();
    return sub.roundToDouble();
  }

  String _numberToIndianWords(double number) {
    final n = number.toInt();
    if (n <= 0) return 'Zero Rupees Only';

    const units = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
      'Seventeen', 'Eighteen', 'Nineteen'
    ];
    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    String convertUptoThousand(int num) {
      String str = '';
      if (num >= 100) {
        str += '${units[num ~/ 100]} Hundred ';
        num %= 100;
      }
      if (num >= 20) {
        str += '${tens[num ~/ 10]} ';
        num %= 10;
      }
      if (num > 0) {
        str += '${units[num]} ';
      }
      return str.trim();
    }

    int remaining = n;
    String result = '';

    final crores = remaining ~/ 10000000;
    if (crores > 0) {
      result += '${convertUptoThousand(crores)} Crore ';
      remaining %= 10000000;
    }

    final lakhs = remaining ~/ 100000;
    if (lakhs > 0) {
      result += '${convertUptoThousand(lakhs)} Lakh ';
      remaining %= 100000;
    }

    final thousands = remaining ~/ 1000;
    if (thousands > 0) {
      result += '${convertUptoThousand(thousands)} Thousand ';
      remaining %= 1000;
    }

    if (remaining > 0) {
      result += convertUptoThousand(remaining);
    }

    return '${result.trim()} Rupees Only';
  }

  void _showAddCustomItemDialog() {
    final descCtrl = TextEditingController();
    final sacCtrl = TextEditingController(text: '996331');
    final qtyCtrl = TextEditingController(text: '1');
    final rateCtrl = TextEditingController();
    int selectedGst = 5;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Add Line Item', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Description (e.g. In-Room Breakfast, Laundry)', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: sacCtrl,
                      decoration: const InputDecoration(labelText: 'SAC Code', border: OutlineInputBorder()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: qtyCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Quantity', border: OutlineInputBorder()),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: rateCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Unit Rate (₹)', border: OutlineInputBorder()),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text('GST Slab Rate:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
              const SizedBox(height: 6),
              Row(
                children: [0, 5, 12, 18].map((rate) {
                  final isSel = selectedGst == rate;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text('$rate%'),
                      selected: isSel,
                      selectedColor: AppTheme.maroon,
                      labelStyle: TextStyle(color: isSel ? Colors.white : AppTheme.ink),
                      onSelected: (val) => setModalState(() => selectedGst = rate),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.maroon,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () {
                    final desc = descCtrl.text.trim();
                    final qty = int.tryParse(qtyCtrl.text.trim()) ?? 1;
                    final rate = double.tryParse(rateCtrl.text.trim()) ?? 0.0;
                    if (desc.isEmpty || rate <= 0) return;

                    Navigator.pop(ctx);
                    _addPresetLine(desc, sacCtrl.text.trim(), qty, rate, selectedGst);
                  },
                  child: const Text('Add Item to Bill', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _issueInvoice() {
    if (_lines.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one line item to the bill'), backgroundColor: AppTheme.alertRed),
      );
      return;
    }
    if (_guestNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter the Guest Name'), backgroundColor: AppTheme.alertRed),
      );
      return;
    }

    final taxable = _calculateTaxable();
    final cgst = _calculateCgst();
    final sgst = _calculateSgst();
    final igst = _calculateIgst();
    final grandTotal = _calculateGrandTotal();
    final balance = (grandTotal - _amountPaid).clamp(0.0, grandTotal);
    final totalInWords = _numberToIndianWords(grandTotal);

    final now = DateTime.now();
    final dateStr = DateFormat('dd-MMM-yyyy').format(now);
    final prefix = (widget.hotelConfig?.invoicePrefix.isNotEmpty == true) ? widget.hotelConfig!.invoicePrefix : 'GHI';
    final invNum = '$prefix/26-27/${(now.millisecondsSinceEpoch % 9000 + 1000).toString().padLeft(4, '0')}';

    final invoice = Invoice(
      id: 'inv-${now.millisecondsSinceEpoch}',
      invoiceNumber: invNum,
      date: dateStr,
      guestName: _guestNameController.text.trim(),
      guestPhone: _guestPhoneController.text.trim().isEmpty ? '9876543210' : _guestPhoneController.text.trim(),
      guestAddress: _guestAddressController.text.trim(),
      roomNumber: _roomNumberController.text.trim().isEmpty ? '101' : _roomNumberController.text.trim(),
      nights: _nights,
      checkIn: DateFormat('dd-MMM-yyyy HH:mm').format(now.subtract(Duration(days: _nights))),
      checkOut: DateFormat('dd-MMM-yyyy HH:mm').format(now),
      lines: List.from(_lines),
      taxable: taxable,
      cgst: cgst,
      sgst: sgst,
      igst: igst,
      roundOff: 0.0,
      grandTotal: grandTotal,
      totalInWords: totalInWords,
      status: 'ISSUED',
      paymentMode: _paymentMode,
      upiVpa: (widget.hotelConfig?.upiVpa.isNotEmpty == true) ? widget.hotelConfig!.upiVpa : 'grandheritage@upi',
      balanceDue: balance,
      isInterState: _isInterState,
    );

    widget.onInvoiceCreated(invoice);

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Invoice ${invoice.invoiceNumber} issued successfully!'),
        backgroundColor: AppTheme.greenSuccess,
      ),
    );

    // Open detail screen for instant preview & printing
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => InvoiceDetailScreen(
          invoice: invoice,
          hotelConfig: widget.hotelConfig,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);
    final taxable = _calculateTaxable();
    final grand = _calculateGrandTotal();

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Compose GST Invoice', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('CBIC Rule 46 · Heritage Luxe v2', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: AppTheme.borderLight)),
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('GRAND TOTAL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
                    Text(
                      currency.format(grand),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.maroon,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _issueInvoice,
                icon: const Icon(Icons.check_circle_outline_rounded),
                label: const Text('Issue Tax Invoice', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ],
          ),
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // 1. Guest & Stay Information
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.person_rounded, size: 18, color: AppTheme.maroon),
                      SizedBox(width: 8),
                      Text('Guest & Stay Details', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _guestNameController,
                    decoration: const InputDecoration(
                      labelText: 'Guest Full Name *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline, size: 20),
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _guestPhoneController,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(
                            labelText: 'Mobile Number',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.phone_outlined, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextField(
                          controller: _roomNumberController,
                          decoration: const InputDecoration(
                            labelText: 'Room No.',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.meeting_room_outlined, size: 20),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _guestGstinController,
                          decoration: const InputDecoration(
                            labelText: 'Guest GSTIN (Optional B2B)',
                            border: OutlineInputBorder(),
                            prefixIcon: Icon(Icons.badge_outlined, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppTheme.borderLight),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Text('Nights: ', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                            DropdownButton<int>(
                              value: _nights,
                              underline: const SizedBox(),
                              items: [1, 2, 3, 4, 5, 7, 10, 14].map((n) => DropdownMenuItem(value: n, child: Text('$n'))).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _nights = val);
                              },
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Checkbox(
                        value: _isInterState,
                        activeColor: AppTheme.maroon,
                        onChanged: (val) {
                          setState(() {
                            _isInterState = val ?? false;
                            // Re-calculate CGST/SGST vs IGST
                            for (int i = 0; i < _lines.length; i++) {
                              final l = _lines[i];
                              final totalGst = l.taxable * (l.gstRatePercent / 100);
                              _lines[i] = InvoiceLine(
                                id: l.id,
                                description: l.description,
                                sac: l.sac,
                                qty: l.qty,
                                unitPrice: l.unitPrice,
                                taxable: l.taxable,
                                cgst: _isInterState ? 0.0 : totalGst / 2,
                                sgst: _isInterState ? 0.0 : totalGst / 2,
                                igst: _isInterState ? totalGst : 0.0,
                                total: l.taxable + totalGst,
                                gstRatePercent: l.gstRatePercent,
                              );
                            }
                          });
                        },
                      ),
                      const Text('Inter-State Supply (Apply IGST instead of CGST/SGST)', style: TextStyle(fontSize: 12, color: AppTheme.ink)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 2. Line Items (Folio)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.list_alt_rounded, size: 18, color: AppTheme.maroon),
                          SizedBox(width: 8),
                          Text('Folio Items & Services', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                        ],
                      ),
                      TextButton.icon(
                        onPressed: _showAddCustomItemDialog,
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Custom Item', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),

                  // Quick preset chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        ActionChip(
                          avatar: const Icon(Icons.restaurant, size: 14),
                          label: const Text('Dining +₹1,200 (5%)', style: TextStyle(fontSize: 11)),
                          onPressed: () => _addPresetLine('In-Room Dining (Dinner)', '996331', 1, 1200, 5),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          avatar: const Icon(Icons.local_laundry_service, size: 14),
                          label: const Text('Laundry +₹350 (18%)', style: TextStyle(fontSize: 11)),
                          onPressed: () => _addPresetLine('Laundry Express Service', '996337', 1, 350, 18),
                        ),
                        const SizedBox(width: 6),
                        ActionChip(
                          avatar: const Icon(Icons.local_taxi, size: 14),
                          label: const Text('Airport Cab +₹1,800 (5%)', style: TextStyle(fontSize: 11)),
                          onPressed: () => _addPresetLine('Airport Transfer Pick-up', '996412', 1, 1800, 5),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 12),
                  const Divider(height: 1),

                  if (_lines.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(
                        child: Text('No items added yet. Tap a preset or Custom Item above.', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                      ),
                    )
                  else
                    ..._lines.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final it = entry.value;
                      return Container(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        decoration: const BoxDecoration(
                          border: Border(bottom: BorderSide(color: AppTheme.borderLight, width: 0.6)),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(it.description, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                                  Text('SAC ${it.sac} · Qty ${it.qty} @ ₹${it.unitPrice.toStringAsFixed(0)} · GST ${it.gstRatePercent}%', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                ],
                              ),
                            ),
                            Text(currency.format(it.total), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.alertRed),
                              onPressed: () {
                                setState(() {
                                  _lines.removeAt(idx);
                                  _recalculatePaidDefault();
                                });
                              },
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // 3. Tax Breakdown & Payment Settlement
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.account_balance_wallet_rounded, size: 18, color: AppTheme.maroon),
                      SizedBox(width: 8),
                      Text('Payment Settlement & Slabs', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Taxable Amount', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                      Text(currency.format(taxable), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  if (!_isInterState) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('CGST Total', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        Text(currency.format(_calculateCgst()), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('SGST Total', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        Text(currency.format(_calculateSgst()), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ] else ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('IGST Total', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                        Text(currency.format(_calculateIgst()), style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                  const Divider(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount Due', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                      Text(currency.format(grand), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                    ],
                  ),
                  const SizedBox(height: 14),

                  const Text('Settlement Mode:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted)),
                  const SizedBox(height: 6),
                  Row(
                    children: ['UPI', 'Cash', 'Card'].map((mode) {
                      final isSel = _paymentMode == mode;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(mode),
                          selected: isSel,
                          selectedColor: AppTheme.maroon,
                          labelStyle: TextStyle(color: isSel ? Colors.white : AppTheme.ink, fontWeight: FontWeight.bold),
                          onSelected: (val) => setState(() => _paymentMode = mode),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
