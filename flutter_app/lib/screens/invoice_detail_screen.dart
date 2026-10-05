import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';
import '../services/pdf_invoice_service.dart';
import '../widgets/theme_studio_bar.dart';

class InvoiceDetailScreen extends StatefulWidget {
  final Invoice invoice;
  final HotelConfig? hotelConfig;

  const InvoiceDetailScreen({
    super.key,
    required this.invoice,
    this.hotelConfig,
  });

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  late String _selectedTemplate;
  late String _selectedColor;
  late bool _showDeity;
  late bool _showHsnTable;
  late bool _showQr;
  late bool _showStamp;
  bool _isA5 = false;
  bool _isExporting = false;

  Widget? _buildSafeImageWidget(String? base64Str, {double? width, double? height, BoxFit fit = BoxFit.contain}) {
    if (base64Str == null || base64Str.isEmpty) return null;
    try {
      final clean = base64Str.contains(',') ? base64Str.split(',').last : base64Str;
      final bytes = base64Decode(clean);
      return Image.memory(bytes, width: width, height: height, fit: fit);
    } catch (_) {
      return null;
    }
  }

  @override
  void initState() {
    super.initState();
    final cfg = widget.hotelConfig ?? HotelConfig();
    _selectedTemplate = cfg.selectedTemplate;
    _selectedColor = cfg.selectedColor;
    _showDeity = cfg.showDeity;
    _showHsnTable = cfg.showHsnTable;
    _showQr = cfg.showQr;
    _showStamp = cfg.showStamp;
  }

  Future<void> _handlePrint() async {
    setState(() => _isExporting = true);
    try {
      await PdfInvoiceService.printInvoice(
        widget.invoice,
        config: widget.hotelConfig,
        templateId: _selectedTemplate,
        colorKey: _selectedColor,
        showDeity: _showDeity,
        showHsnTable: _showHsnTable,
        showQr: _showQr,
        showStamp: _showStamp,
        isA5: _isA5,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Print failed: $e'), backgroundColor: AppTheme.alertRed),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _handleSharePdf() async {
    setState(() => _isExporting = true);
    try {
      await PdfInvoiceService.shareInvoicePdf(
        widget.invoice,
        config: widget.hotelConfig,
        templateId: _selectedTemplate,
        colorKey: _selectedColor,
        showDeity: _showDeity,
        showHsnTable: _showHsnTable,
        showQr: _showQr,
        showStamp: _showStamp,
        isA5: _isA5,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Share failed: $e'), backgroundColor: AppTheme.alertRed),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  Future<void> _handleThermalPrint() async {
    setState(() => _isExporting = true);
    try {
      await PdfInvoiceService.printThermalReceipt(
        widget.invoice,
        config: widget.hotelConfig,
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Thermal print failed: $e'), backgroundColor: AppTheme.alertRed),
        );
      }
    } finally {
      if (mounted) setState(() => _isExporting = false);
    }
  }

  void _shareWhatsAppText() {
    final cfg = widget.hotelConfig ?? HotelConfig();
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs. ', decimalDigits: 0);
    final msg = '''
*Tax Invoice ${widget.invoice.invoiceNumber}*
_${cfg.hotelName}_

Dear *${widget.invoice.guestName}* Ji,
Thank you for choosing ${cfg.hotelName}. Your stay details:
• Room: ${widget.invoice.roomNumber} (${widget.invoice.nights} Night)
• Check-in: ${widget.invoice.checkIn}
• Check-out: ${widget.invoice.checkOut}
• Net Payable: *${currency.format(widget.invoice.grandTotal)}*
• Settled via: ${widget.invoice.paymentMode}

Statutory GST Invoice generated under Rule 46 CGST Rules.
Contact: ${cfg.phone} | UPI: ${cfg.upiVpa}
'''.trim();

    Clipboard.setData(ClipboardData(text: msg));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('WhatsApp receipt copied to clipboard! Ready to paste.'),
        backgroundColor: AppTheme.maroon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cfg = widget.hotelConfig ?? HotelConfig();
    final palette = getThemePalette(_selectedColor);
    final primaryColor = Color(palette.primary);
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs. ', decimalDigits: 2);

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.invoice.invoiceNumber, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text(
              '${widget.invoice.guestName} · Room ${widget.invoice.roomNumber}',
              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_rounded, color: AppTheme.maroon),
            tooltip: 'Share WhatsApp Bill',
            onPressed: _shareWhatsAppText,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        children: [
          // 1. Interactive Theme Studio Bar
          ThemeStudioBar(
            selectedTemplate: _selectedTemplate,
            onSelectTemplate: (t) => setState(() => _selectedTemplate = t),
            selectedColor: _selectedColor,
            onSelectColor: (c) => setState(() => _selectedColor = c),
            showDeity: _showDeity,
            onToggleDeity: (v) => setState(() => _showDeity = v),
            showHsnTable: _showHsnTable,
            onToggleHsnTable: (v) => setState(() => _showHsnTable = v),
            showQr: _showQr,
            onToggleQr: (v) => setState(() => _showQr = v),
            showStamp: _showStamp,
            onToggleStamp: (v) => setState(() => _showStamp = v),
          ),
          const SizedBox(height: 14),

          // 2. Paper Size & Live Studio Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(color: primaryColor, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 6),
                  const Text('LIVE STATIONERY PREVIEW', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.6, color: AppTheme.ink)),
                ],
              ),
              if (_selectedTemplate != 'thermal-80mm')
                Row(
                  children: [
                    ChoiceChip(
                      label: const Text('A4 Sheet', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      selected: !_isA5,
                      selectedColor: primaryColor,
                      labelStyle: TextStyle(color: !_isA5 ? Colors.white : AppTheme.ink),
                      onSelected: (val) => setState(() => _isA5 = false),
                    ),
                    const SizedBox(width: 6),
                    ChoiceChip(
                      label: const Text('A5 Voucher', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                      selected: _isA5,
                      selectedColor: primaryColor,
                      labelStyle: TextStyle(color: _isA5 ? Colors.white : AppTheme.ink),
                      onSelected: (val) => setState(() => _isA5 = true),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 10),

          // 3. Dynamic Visual Invoice Document Preview
          _buildLiveDocumentView(cfg, palette, currency),
          const SizedBox(height: 24),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          border: const Border(top: BorderSide(color: AppTheme.borderLight)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                flex: 4,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: _isExporting
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Icon(Icons.print_rounded, size: 18),
                  label: const Text('Print / PDF', style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold)),
                  onPressed: _isExporting ? null : _handlePrint,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 3,
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.maroon,
                    side: const BorderSide(color: AppTheme.maroon),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.share_rounded, size: 16),
                  label: const Text('Share PDF', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  onPressed: _isExporting ? null : _handleSharePdf,
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 3,
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.surfaceWarm,
                    foregroundColor: AppTheme.ink,
                    elevation: 0,
                    side: const BorderSide(color: AppTheme.borderLight),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  icon: const Icon(Icons.receipt_long_rounded, size: 16),
                  label: const Text('POS 80mm', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                  onPressed: _isExporting ? null : _handleThermalPrint,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- Dynamic Live Document Switcher ---
  Widget _buildLiveDocumentView(HotelConfig cfg, ThemePalette pal, NumberFormat currency) {
    if (_selectedTemplate == 'thermal-80mm') {
      return _buildThermalPreviewCard(cfg, currency);
    } else if (_selectedTemplate == 'advanced-gst') {
      return _buildAdvancedGstPreviewCard(cfg, pal, currency);
    } else if (_selectedTemplate == 'stylish-modern') {
      return _buildStylishModernPreviewCard(cfg, pal, currency);
    } else {
      return _buildRoyalHeritagePreviewCard(cfg, pal, currency);
    }
  }

  // --- 1. Royal Heritage Live View ---
  Widget _buildRoyalHeritagePreviewCard(HotelConfig cfg, ThemePalette pal, NumberFormat currency) {
    final primaryColor = Color(pal.primary);
    final primaryDarkColor = Color(pal.primaryDark);
    final hsnReport = computeHsnTaxSummary(widget.invoice.lines);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFDF8),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE6DCC6), width: 1.2),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_showDeity) ...[
            Center(
              child: Text(
                cfg.shlokaText,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor, letterSpacing: 1.2),
              ),
            ),
            const SizedBox(height: 4),
          ],
          Center(
            child: Text(
              cfg.hotelName.toUpperCase(),
              style: TextStyle(
                fontFamily: 'serif',
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: primaryDarkColor,
                letterSpacing: 3.0,
              ),
            ),
          ),
          Center(
            child: Text(
              cfg.legalName.toUpperCase(),
              style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppTheme.textMuted, letterSpacing: 0.6),
            ),
          ),
          const SizedBox(height: 2),
          Center(
            child: Text(
              '${cfg.address}  ·  ${cfg.phone}  ·  GSTIN ${cfg.gstin}  ·  State ${cfg.stateName} (${cfg.stateCode})',
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 9, color: AppTheme.textMuted),
            ),
          ),
          const SizedBox(height: 10),
          _buildGoldRule(),
          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('TAX INVOICE', style: TextStyle(fontFamily: 'serif', fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 2.0)),
                  const Text('Rule 46, CGST Rules 2017 · Original for Recipient', style: TextStyle(fontSize: 9, color: AppTheme.textMuted)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(widget.invoice.invoiceNumber, style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: primaryColor)),
                  Text('Date: ${widget.invoice.date}', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Parties Grid
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('BILLED TO (GUEST DETAILS)', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F), letterSpacing: 0.8)),
                    const SizedBox(height: 2),
                    Text(widget.invoice.guestName, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                    Text('Phone: ${widget.invoice.guestPhone}', style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                    if (widget.invoice.guestAddress.isNotEmpty)
                      Text(widget.invoice.guestAddress, style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                    if (widget.invoice.guestGstin != null && widget.invoice.guestGstin!.isNotEmpty)
                      Text('GSTIN: ${widget.invoice.guestGstin}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('STAY & FOLIO PARTICULARS', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F), letterSpacing: 0.8)),
                    const SizedBox(height: 2),
                    Text('Room: ${widget.invoice.roomNumber} (${widget.invoice.nights} Night)', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600)),
                    Text('Check-in: ${widget.invoice.checkIn}', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                    Text('Check-out: ${widget.invoice.checkOut}', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Items Table
          Container(
            padding: const EdgeInsets.symmetric(vertical: 4),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(color: Color(0xFFB98A2F), width: 0.8),
                bottom: BorderSide(color: Color(0xFFB98A2F), width: 0.8),
              ),
            ),
            child: const Row(
              children: [
                Expanded(flex: 5, child: Text('DESCRIPTION', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F)))),
                Expanded(flex: 2, child: Text('SAC', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F)))),
                Expanded(flex: 1, child: Text('QTY', textAlign: TextAlign.center, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F)))),
                Expanded(flex: 2, child: Text('RATE', textAlign: TextAlign.right, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F)))),
                Expanded(flex: 2, child: Text('AMOUNT', textAlign: TextAlign.right, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F)))),
              ],
            ),
          ),
          ...widget.invoice.lines.map((l) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                Expanded(flex: 5, child: Text(l.description, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w500))),
                Expanded(flex: 2, child: Text(l.sac.isNotEmpty ? l.sac : '996311', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted))),
                Expanded(flex: 1, child: Text('${l.quantity}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 10.5))),
                Expanded(flex: 2, child: Text(currency.format(l.rate), textAlign: TextAlign.right, style: const TextStyle(fontSize: 10))),
                Expanded(flex: 2, child: Text(currency.format(l.total), textAlign: TextAlign.right, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold))),
              ],
            ),
          )),
          const SizedBox(height: 10),

          // CBIC HSN Table
          if (_showHsnTable) ...[
            const Text('TAX SUMMARY (CBIC RULE 46 AUDIT MATRIX)', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFB98A2F))),
            const SizedBox(height: 2),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 3, horizontal: 4),
              color: const Color(0xFFF9F7F2),
              child: const Row(
                children: [
                  Expanded(flex: 2, child: Text('HSN/SAC', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 3, child: Text('Taxable (Rs.)', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 2, child: Text('CGST', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 2, child: Text('SGST', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 3, child: Text('Total Tax', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                ],
              ),
            ),
            ...hsnReport.rows.map((r) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
              child: Row(
                children: [
                  Expanded(flex: 2, child: Text(r.sac, style: const TextStyle(fontSize: 8.5, color: AppTheme.textMuted))),
                  Expanded(flex: 3, child: Text(currency.format(r.taxable), textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5))),
                  Expanded(flex: 2, child: Text('${r.cgstRate.toStringAsFixed(1)}%: ${r.cgst.toStringAsFixed(1)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5))),
                  Expanded(flex: 2, child: Text('${r.sgstRate.toStringAsFixed(1)}%: ${r.sgst.toStringAsFixed(1)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5))),
                  Expanded(flex: 3, child: Text(currency.format(r.totalTax), textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                ],
              ),
            )),
            const SizedBox(height: 10),
          ],

          // Totals Strip
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                flex: 5,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Amount in Words:', style: TextStyle(fontSize: 9, color: AppTheme.textMuted)),
                    Text(widget.invoice.totalInWords, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                    const SizedBox(height: 6),
                    if (_showQr)
                      Row(
                        children: [
                          if (cfg.customQrBase64 != null && _buildSafeImageWidget(cfg.customQrBase64) != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: _buildSafeImageWidget(cfg.customQrBase64, width: 44, height: 44)!,
                            )
                          else
                            QrImageView(
                              data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${widget.invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(widget.invoice.invoiceNumber)}',
                              version: QrVersions.auto,
                              size: 44,
                            ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Scan UPI: ${cfg.upiVpa}', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                                Text('Bank: ${cfg.bankName} - ${cfg.bankAccount}', style: const TextStyle(fontSize: 8.5, color: AppTheme.textMuted)),
                                Text('IFSC: ${cfg.bankIfsc}', style: const TextStyle(fontSize: 8.5, color: AppTheme.textMuted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                flex: 5,
                child: Column(
                  children: [
                    _onScreenTotalRow('Taxable Amount', currency.format(widget.invoice.taxable)),
                    _onScreenTotalRow('CGST (Central Tax)', currency.format(widget.invoice.cgst)),
                    _onScreenTotalRow('SGST (State Tax)', currency.format(widget.invoice.sgst)),
                    const Divider(color: Color(0xFFB98A2F), thickness: 1.0, height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('GRAND TOTAL', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryDarkColor)),
                        Text(currency.format(widget.invoice.grandTotal), style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: primaryColor)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Foot & Stamp
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              const Text('Terms: Standard Check-out 11:00 AM.', style: TextStyle(fontSize: 8.5, color: AppTheme.textMuted)),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (_showStamp) ...[
                    if (cfg.stampBase64 != null && _buildSafeImageWidget(cfg.stampBase64) != null)
                      _buildSafeImageWidget(cfg.stampBase64, width: 44, height: 44)!
                    else
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(border: Border.all(color: primaryColor, width: 0.8), borderRadius: BorderRadius.circular(4)),
                        child: Text('SEAL & STAMP VERIFIED', style: TextStyle(fontSize: 7.5, fontWeight: FontWeight.bold, color: primaryColor)),
                      ),
                    const SizedBox(height: 3),
                  ],
                  if (cfg.signatureBase64 != null && _buildSafeImageWidget(cfg.signatureBase64) != null) ...[
                    _buildSafeImageWidget(cfg.signatureBase64, width: 65, height: 26)!,
                    const SizedBox(height: 2),
                  ],
                  Text('For ${cfg.legalName}', style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold)),
                  const Text('Authorized Signatory', style: TextStyle(fontSize: 8.5, color: AppTheme.textMuted)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // --- 2. Advanced GST Live View ---
  Widget _buildAdvancedGstPreviewCard(HotelConfig cfg, ThemePalette pal, NumberFormat currency) {
    final primaryColor = Color(pal.primary);
    final hsnReport = computeHsnTaxSummary(widget.invoice.lines);

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: primaryColor, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(cfg.hotelName, style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: primaryColor)),
                  Text(cfg.legalName, style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
                  Text('GSTIN: ${cfg.gstin} | State: ${cfg.stateName} (${cfg.stateCode})', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                color: primaryColor,
                child: const Text('TAX INVOICE', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const Divider(height: 14),

          // Items Table
          Container(
            padding: const EdgeInsets.all(4),
            color: Color(pal.tableHeaderBg),
            child: const Row(
              children: [
                Expanded(flex: 5, child: Text('Item Description', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
                Expanded(flex: 2, child: Text('SAC', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
                Expanded(flex: 1, child: Text('Qty', textAlign: TextAlign.center, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
                Expanded(flex: 2, child: Text('Rate', textAlign: TextAlign.right, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
                Expanded(flex: 2, child: Text('Total', textAlign: TextAlign.right, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold))),
              ],
            ),
          ),
          ...widget.invoice.lines.map((l) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
            child: Row(
              children: [
                Expanded(flex: 5, child: Text(l.description, style: const TextStyle(fontSize: 10))),
                Expanded(flex: 2, child: Text(l.sac.isNotEmpty ? l.sac : '996311', style: const TextStyle(fontSize: 9, color: AppTheme.textMuted))),
                Expanded(flex: 1, child: Text('${l.quantity}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 10))),
                Expanded(flex: 2, child: Text(currency.format(l.rate), textAlign: TextAlign.right, style: const TextStyle(fontSize: 9.5))),
                Expanded(flex: 2, child: Text(currency.format(l.total), textAlign: TextAlign.right, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold))),
              ],
            ),
          )),
          const SizedBox(height: 8),

          // 8-Column CBIC Table
          if (_showHsnTable) ...[
            Container(
              padding: const EdgeInsets.all(4),
              color: Color(pal.tableHeaderBg),
              child: const Row(
                children: [
                  Expanded(flex: 2, child: Text('HSN/SAC', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 3, child: Text('Taxable', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 2, child: Text('CGST', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 2, child: Text('SGST', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                  Expanded(flex: 3, child: Text('Total Tax', textAlign: TextAlign.right, style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                ],
              ),
            ),
            ...hsnReport.rows.map((r) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 4),
              child: Row(
                children: [
                  Expanded(flex: 2, child: Text(r.sac, style: const TextStyle(fontSize: 8.5, color: AppTheme.textMuted))),
                  Expanded(flex: 3, child: Text(currency.format(r.taxable), textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5))),
                  Expanded(flex: 2, child: Text('${r.cgstRate.toStringAsFixed(1)}%: ${r.cgst.toStringAsFixed(1)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5))),
                  Expanded(flex: 2, child: Text('${r.sgstRate.toStringAsFixed(1)}%: ${r.sgst.toStringAsFixed(1)}', textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5))),
                  Expanded(flex: 3, child: Text(currency.format(r.totalTax), textAlign: TextAlign.right, style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold))),
                ],
              ),
            )),
            const SizedBox(height: 8),
          ],

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('NET TOTAL:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: primaryColor)),
              Text(currency.format(widget.invoice.grandTotal), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: primaryColor)),
            ],
          ),
        ],
      ),
    );
  }

  // --- 3. Stylish Modern Live View ---
  Widget _buildStylishModernPreviewCard(HotelConfig cfg, ThemePalette pal, NumberFormat currency) {
    final primaryColor = Color(pal.primary);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Color(pal.border), width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Full-Bleed Colored Header Band
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: primaryColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(cfg.hotelName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
                    Text('GSTIN: ${cfg.gstin} · Ph: ${cfg.phone}', style: const TextStyle(fontSize: 9, color: Colors.white70)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('INVOICE', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white, letterSpacing: 1.5)),
                    Text(widget.invoice.invoiceNumber, style: const TextStyle(fontSize: 9.5, color: Colors.white70)),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Color(pal.cardBg), borderRadius: BorderRadius.circular(8), border: Border.all(color: Color(pal.border))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('GUEST INFORMATION', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: primaryColor)),
                            Text(widget.invoice.guestName, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            Text('Phone: ${widget.invoice.guestPhone}', style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: Color(pal.cardBg), borderRadius: BorderRadius.circular(8), border: Border.all(color: Color(pal.border))),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('STAY INFORMATION', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: primaryColor)),
                            Text('Room ${widget.invoice.roomNumber} (${widget.invoice.nights}N)', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            Text('Check-in: ${widget.invoice.checkIn}', style: const TextStyle(fontSize: 9, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),

                ...widget.invoice.lines.map((l) => Padding(
                  padding: const EdgeInsets.symmetric(vertical: 3),
                  child: Row(
                    children: [
                      Expanded(flex: 6, child: Text(l.description, style: const TextStyle(fontSize: 10.5))),
                      Expanded(flex: 1, child: Text('${l.quantity}', textAlign: TextAlign.center, style: const TextStyle(fontSize: 10))),
                      Expanded(flex: 3, child: Text(currency.format(l.total), textAlign: TextAlign.right, style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold))),
                    ],
                  ),
                )),
                const Divider(height: 14),

                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('GRAND TOTAL', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: primaryColor)),
                    Text(currency.format(widget.invoice.grandTotal), style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: primaryColor)),
                  ],
                ),
                const SizedBox(height: 12),

                // Modern Footer with QR, Stamp and Signature
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (_showQr)
                      Row(
                        children: [
                          if (cfg.customQrBase64 != null && _buildSafeImageWidget(cfg.customQrBase64) != null)
                            ClipRRect(
                              borderRadius: BorderRadius.circular(6),
                              child: _buildSafeImageWidget(cfg.customQrBase64, width: 44, height: 44)!,
                            )
                          else
                            QrImageView(
                              data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${widget.invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(widget.invoice.invoiceNumber)}',
                              version: QrVersions.auto,
                              size: 44,
                            ),
                          const SizedBox(width: 6),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('UPI: ${cfg.upiVpa}', style: const TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold)),
                              Text('${cfg.bankName} · ${cfg.bankAccount}', style: const TextStyle(fontSize: 8, color: AppTheme.textMuted)),
                            ],
                          ),
                        ],
                      )
                    else
                      const SizedBox.shrink(),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        if (_showStamp) ...[
                          if (cfg.stampBase64 != null && _buildSafeImageWidget(cfg.stampBase64) != null)
                            _buildSafeImageWidget(cfg.stampBase64, width: 42, height: 42)!
                          else
                            Text('[SEAL]', style: TextStyle(fontSize: 7.5, fontWeight: FontWeight.bold, color: primaryColor)),
                          const SizedBox(height: 2),
                        ],
                        if (cfg.signatureBase64 != null && _buildSafeImageWidget(cfg.signatureBase64) != null) ...[
                          _buildSafeImageWidget(cfg.signatureBase64, width: 60, height: 24)!,
                          const SizedBox(height: 2),
                        ],
                        const Text('Authorized Signature', style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // --- 4. Thermal 80mm Live View ---
  Widget _buildThermalPreviewCard(HotelConfig cfg, NumberFormat currency) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey.shade400, width: 1.2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Text(
              cfg.hotelName.toUpperCase(),
              style: const TextStyle(fontFamily: 'monospace', fontSize: 13, fontWeight: FontWeight.bold),
            ),
          ),
          Center(
            child: Text(
              '${cfg.address} | GSTIN: ${cfg.gstin}',
              textAlign: TextAlign.center,
              style: const TextStyle(fontFamily: 'monospace', fontSize: 9, color: AppTheme.textMuted),
            ),
          ),
          const Center(child: Text('- - - - - - - - - - - - - - - - - - - - - - - -', style: TextStyle(fontFamily: 'monospace', fontSize: 9))),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Bill: ${widget.invoice.invoiceNumber}', style: const TextStyle(fontFamily: 'monospace', fontSize: 9.5, fontWeight: FontWeight.bold)),
              Text(widget.invoice.date, style: const TextStyle(fontFamily: 'monospace', fontSize: 9)),
            ],
          ),
          Text('Guest: ${widget.invoice.guestName} (Room ${widget.invoice.roomNumber})', style: const TextStyle(fontFamily: 'monospace', fontSize: 9.5)),
          const Center(child: Text('- - - - - - - - - - - - - - - - - - - - - - - -', style: TextStyle(fontFamily: 'monospace', fontSize: 9))),

          ...widget.invoice.lines.map((l) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Row(
              children: [
                Expanded(flex: 6, child: Text(l.description, style: const TextStyle(fontFamily: 'monospace', fontSize: 9.5))),
                Expanded(flex: 1, child: Text('x${l.quantity}', textAlign: TextAlign.center, style: const TextStyle(fontFamily: 'monospace', fontSize: 9.5))),
                Expanded(flex: 3, child: Text(currency.format(l.total), textAlign: TextAlign.right, style: const TextStyle(fontFamily: 'monospace', fontSize: 9.5, fontWeight: FontWeight.bold))),
              ],
            ),
          )),
          const Center(child: Text('- - - - - - - - - - - - - - - - - - - - - - - -', style: TextStyle(fontFamily: 'monospace', fontSize: 9))),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('NET TOTAL:', style: TextStyle(fontFamily: 'monospace', fontSize: 11, fontWeight: FontWeight.bold)),
              Text(currency.format(widget.invoice.grandTotal), style: const TextStyle(fontFamily: 'monospace', fontSize: 13, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),

          if (cfg.stampBase64 != null && _buildSafeImageWidget(cfg.stampBase64) != null) ...[
            Center(child: _buildSafeImageWidget(cfg.stampBase64, width: 38, height: 38)!),
            const SizedBox(height: 4),
          ],

          Center(
            child: (cfg.customQrBase64 != null && _buildSafeImageWidget(cfg.customQrBase64) != null)
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: _buildSafeImageWidget(cfg.customQrBase64, width: 56, height: 56)!,
                  )
                : QrImageView(
                    data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${widget.invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(widget.invoice.invoiceNumber)}',
                    version: QrVersions.auto,
                    size: 56,
                  ),
          ),
          Center(
            child: Text('Scan to Pay UPI: ${cfg.upiVpa}', style: const TextStyle(fontFamily: 'monospace', fontSize: 8.5)),
          ),
          const SizedBox(height: 6),
          const Center(child: Text('THANK YOU! VISIT AGAIN', style: TextStyle(fontFamily: 'monospace', fontSize: 9.5, fontWeight: FontWeight.bold))),
        ],
      ),
    );
  }

  // Helper widgets
  Widget _buildGoldRule() {
    return Row(
      children: [
        Expanded(child: Container(height: 0.8, color: const Color(0xFFD9BD7F))),
        const SizedBox(width: 4),
        Container(width: 4, height: 4, color: const Color(0xFFB98A2F)),
        const SizedBox(width: 3),
        Container(
          width: 5.5,
          height: 5.5,
          decoration: BoxDecoration(border: Border.all(color: const Color(0xFFB98A2F), width: 0.8)),
        ),
        const SizedBox(width: 3),
        Container(width: 4, height: 4, color: const Color(0xFFB98A2F)),
        const SizedBox(width: 4),
        Expanded(child: Container(height: 0.8, color: const Color(0xFFD9BD7F))),
      ],
    );
  }

  Widget _onScreenTotalRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 1.5),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
          Text(value, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppTheme.ink)),
        ],
      ),
    );
  }
}
