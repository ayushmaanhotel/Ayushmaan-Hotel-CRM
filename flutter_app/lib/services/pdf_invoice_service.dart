import 'dart:convert';
import 'dart:typed_data';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/hotel_models.dart';

/// Ayushmaan OS Flutter Engine · Multi-Template Vector PDF & Thermal Print Engine
///
/// Features 4 production-grade invoice layouts:
/// 1. 'royal-heritage': Lord Ganesha arch, Sanskrit shloka, ivory stationery & gold hairlines.
/// 2. 'advanced-gst': Double-line statutory B2B accounting grid with CBIC 8-column HSN tax matrix.
/// 3. 'stylish-modern': Full-bleed colored header banner, crisp itemized list & scan-to-pay block.
/// 4. 'thermal-80mm': 3-inch POS monospace receipt slip with dashed cutlines & offline UPI QR.
class PdfInvoiceService {
  static pw.MemoryImage? _safeImage(String? base64Str) {
    if (base64Str == null || base64Str.isEmpty) return null;
    try {
      final clean = base64Str.contains(',') ? base64Str.split(',').last : base64Str;
      return pw.MemoryImage(base64Decode(clean));
    } catch (_) {
      return null;
    }
  }

  /// Generates the complete vector PDF bytes for either A4 or A5 paper sizes.
  static Future<Uint8List> buildPdfBytes(
    Invoice invoice, {
    HotelConfig? config,
    String? templateId,
    String? colorKey,
    bool? showDeity,
    String? shlokaText,
    bool? showHsnTable,
    bool? showQr,
    bool? showStamp,
    bool isA5 = false,
  }) async {
    final cfg = config ?? HotelConfig();
    final tmpl = templateId ?? cfg.selectedTemplate;
    final cKey = colorKey ?? cfg.selectedColor;
    final deity = showDeity ?? cfg.showDeity;
    final shloka = shlokaText ?? cfg.shlokaText;
    final hsn = showHsnTable ?? cfg.showHsnTable;
    final qr = showQr ?? cfg.showQr;
    final stamp = showStamp ?? cfg.showStamp;

    if (tmpl == 'thermal-80mm') {
      return buildThermalReceiptBytes(invoice, config: cfg);
    }

    final palette = getThemePalette(cKey);
    final pdf = pw.Document(
      title: 'Tax Invoice ${invoice.invoiceNumber}',
      author: cfg.legalName,
      creator: 'Ayushmaan OS Flutter · Multi-Template Engine',
    );

    pw.Font? devanagariFont;
    try {
      devanagariFont = await PdfGoogleFonts.notoSansDevanagariRegular();
    } catch (_) {}

    pw.Font? playfairFont;
    try {
      playfairFont = await PdfGoogleFonts.playfairDisplayBold();
    } catch (_) {}

    final pageFormat = isA5 ? PdfPageFormat.a5 : PdfPageFormat.a4;
    final hMargin = isA5 ? 20.0 : 36.0;
    final vMargin = isA5 ? 18.0 : 30.0;

    pdf.addPage(
      pw.Page(
        pageFormat: pageFormat,
        margin: pw.EdgeInsets.symmetric(horizontal: hMargin, vertical: vMargin),
        build: (pw.Context context) {
          if (tmpl == 'advanced-gst') {
            return _buildAdvancedGstLayout(invoice, cfg, palette, isA5, hsn, qr, stamp);
          } else if (tmpl == 'stylish-modern') {
            return _buildStylishModernLayout(invoice, cfg, palette, isA5, qr, stamp);
          } else {
            // Default: 'royal-heritage'
            return _buildRoyalHeritageLayout(
              invoice,
              cfg,
              palette,
              isA5,
              deity,
              shloka,
              hsn,
              qr,
              stamp,
              devanagariFont,
              playfairFont,
            );
          }
        },
      ),
    );

    return pdf.save();
  }

  /// Sends the vector PDF directly to the Android print manager or PDF share sheet.
  static Future<void> printInvoice(
    Invoice invoice, {
    HotelConfig? config,
    String? templateId,
    String? colorKey,
    bool? showDeity,
    String? shlokaText,
    bool? showHsnTable,
    bool? showQr,
    bool? showStamp,
    bool isA5 = false,
  }) async {
    final bytes = await buildPdfBytes(
      invoice,
      config: config,
      templateId: templateId,
      colorKey: colorKey,
      showDeity: showDeity,
      shlokaText: shlokaText,
      showHsnTable: showHsnTable,
      showQr: showQr,
      showStamp: showStamp,
      isA5: isA5,
    );
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: 'Invoice_${invoice.invoiceNumber}.pdf',
    );
  }

  /// Exports and shares the invoice vector PDF using native Android share sheet.
  static Future<void> shareInvoicePdf(
    Invoice invoice, {
    HotelConfig? config,
    String? templateId,
    String? colorKey,
    bool? showDeity,
    String? shlokaText,
    bool? showHsnTable,
    bool? showQr,
    bool? showStamp,
    bool isA5 = false,
  }) async {
    final bytes = await buildPdfBytes(
      invoice,
      config: config,
      templateId: templateId,
      colorKey: colorKey,
      showDeity: showDeity,
      shlokaText: shlokaText,
      showHsnTable: showHsnTable,
      showQr: showQr,
      showStamp: showStamp,
      isA5: isA5,
    );
    await Printing.sharePdf(
      bytes: bytes,
      filename: 'Invoice_${invoice.invoiceNumber}.pdf',
    );
  }

  // =========================================================================
  // TEMPLATE 1: ROYAL HERITAGE (LUXURY HOSPITALITY V2)
  // =========================================================================
  static pw.Widget _buildRoyalHeritageLayout(
    Invoice invoice,
    HotelConfig cfg,
    ThemePalette pal,
    bool isA5,
    bool showDeity,
    String shloka,
    bool showHsnTable,
    bool showQr,
    bool showStamp,
    pw.Font? devanagariFont,
    pw.Font? playfairFont,
  ) {
    final primaryCol = PdfColor.fromInt(pal.primary);
    final primaryDarkCol = PdfColor.fromInt(pal.primaryDark);
    final goldCol = PdfColor.fromInt(0xFFB98A2F);
    final goldSoftCol = PdfColor.fromInt(0xFFD9BD7F);
    final inkCol = PdfColor.fromInt(0xFF1C1917);
    final mutedCol = PdfColor.fromInt(0xFF6F6759);
    final paperCol = PdfColor.fromInt(0xFFFFFDF8);
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs. ', decimalDigits: 2);

    final hsnReport = computeHsnTaxSummary(invoice.lines);

    return pw.Container(
      color: paperCol,
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          // 1. Header with Blessing & Hotel Title
          if (showDeity) ...[
            pw.Center(
              child: pw.Text(
                devanagariFont != null ? shloka : '|| SHREE GANESHAYA NAMAH ||',
                style: pw.TextStyle(
                  font: devanagariFont,
                  fontSize: isA5 ? 7.0 : 8.5,
                  fontWeight: pw.FontWeight.bold,
                  color: primaryCol,
                  letterSpacing: 1.5,
                ),
              ),
            ),
            pw.SizedBox(height: isA5 ? 2 : 3),
          ],
          pw.Center(
            child: pw.Text(
              cfg.hotelName.toUpperCase(),
              style: pw.TextStyle(
                font: playfairFont,
                fontSize: isA5 ? 16.0 : 21.0,
                fontWeight: pw.FontWeight.bold,
                color: primaryDarkCol,
                letterSpacing: isA5 ? 3.5 : 5.0,
              ),
            ),
          ),
          pw.SizedBox(height: 1),
          pw.Center(
            child: pw.Text(
              cfg.legalName.toUpperCase(),
              style: pw.TextStyle(
                fontSize: isA5 ? 5.8 : 7.0,
                fontWeight: pw.FontWeight.bold,
                color: mutedCol,
                letterSpacing: 0.8,
              ),
            ),
          ),
          pw.SizedBox(height: 2),
          pw.Center(
            child: pw.Text(
              '${cfg.address}  -  ${cfg.phone}  -  GSTIN ${cfg.gstin}  -  State ${cfg.stateName} (${cfg.stateCode})',
              textAlign: pw.TextAlign.center,
              style: pw.TextStyle(fontSize: isA5 ? 5.2 : 6.5, color: mutedCol, lineSpacing: 1.4),
            ),
          ),
          pw.SizedBox(height: isA5 ? 4 : 6),
          _ornRule(goldCol, goldSoftCol),
          pw.SizedBox(height: isA5 ? 4 : 6),

          // 2. Invoice Title Strip
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'TAX INVOICE',
                    style: pw.TextStyle(
                      font: playfairFont,
                      fontSize: isA5 ? 10.5 : 13.0,
                      fontWeight: pw.FontWeight.bold,
                      color: inkCol,
                      letterSpacing: 3.0,
                    ),
                  ),
                  pw.Text(
                    'Rule 46, CGST Rules 2017 - Original for Recipient',
                    style: pw.TextStyle(fontSize: isA5 ? 5.2 : 6.4, color: mutedCol, letterSpacing: 0.6),
                  ),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text(
                    invoice.invoiceNumber,
                    style: pw.TextStyle(
                      fontSize: isA5 ? 9.5 : 12.0,
                      fontWeight: pw.FontWeight.bold,
                      color: primaryCol,
                      letterSpacing: 0.6,
                    ),
                  ),
                  pw.Text(
                    'Date: ${invoice.date}',
                    style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7.2, color: mutedCol),
                  ),
                ],
              ),
            ],
          ),
          pw.SizedBox(height: isA5 ? 6 : 8),

          // 3. Parties & Stay Grid
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                flex: 5,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    _tableHeader('BILLED TO (GUEST DETAILS)', goldCol, isA5),
                    pw.Text(invoice.guestName, style: pw.TextStyle(fontSize: isA5 ? 7.2 : 9.0, fontWeight: pw.FontWeight.bold, color: inkCol)),
                    pw.Text('Phone: ${invoice.guestPhone}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7.2, color: mutedCol)),
                    if (invoice.guestAddress.isNotEmpty)
                      pw.Text(invoice.guestAddress, style: pw.TextStyle(fontSize: isA5 ? 5.5 : 6.8, color: mutedCol)),
                    if (invoice.guestGstin != null && invoice.guestGstin!.isNotEmpty)
                      pw.Text('GSTIN: ${invoice.guestGstin}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7.2, fontWeight: pw.FontWeight.bold, color: inkCol)),
                  ],
                ),
              ),
              pw.SizedBox(width: 14),
              pw.Expanded(
                flex: 4,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    _tableHeader('STAY & FOLIO PARTICULARS', goldCol, isA5),
                    _metaCell('Room Allotted:', invoice.roomNumber, isA5, inkCol, mutedCol),
                    _metaCell('Duration:', '${invoice.nights} Night(s)', isA5, inkCol, mutedCol),
                    _metaCell('Check-In:', invoice.checkIn, isA5, inkCol, mutedCol),
                    _metaCell('Check-Out:', invoice.checkOut, isA5, inkCol, mutedCol),
                  ],
                ),
              ),
            ],
          ),
          pw.SizedBox(height: isA5 ? 8 : 10),

          // 4. Line Items Table
          pw.Container(
            decoration: pw.BoxDecoration(
              border: pw.Border(
                top: pw.BorderSide(color: goldCol, width: 0.8),
                bottom: pw.BorderSide(color: goldCol, width: 0.8),
              ),
            ),
            padding: const pw.EdgeInsets.symmetric(vertical: 4),
            child: pw.Row(
              children: [
                pw.Expanded(flex: 5, child: _tableHeader('DESCRIPTION', goldCol, isA5)),
                pw.Expanded(flex: 2, child: _tableHeader('SAC', goldCol, isA5)),
                pw.Expanded(flex: 1, child: _tableHeader('QTY', goldCol, isA5, align: pw.TextAlign.center)),
                pw.Expanded(flex: 2, child: _tableHeader('RATE', goldCol, isA5, align: pw.TextAlign.right)),
                pw.Expanded(flex: 1, child: _tableHeader('GST', goldCol, isA5, align: pw.TextAlign.center)),
                pw.Expanded(flex: 2, child: _tableHeader('AMOUNT', goldCol, isA5, align: pw.TextAlign.right)),
              ],
            ),
          ),
          ...invoice.lines.map((line) {
            return pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 3.5),
              decoration: pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(color: PdfColor.fromInt(0xFFEEE4D0), width: 0.5)),
              ),
              child: pw.Row(
                children: [
                  pw.Expanded(flex: 5, child: pw.Text(line.description, style: pw.TextStyle(fontSize: isA5 ? 6.2 : 7.6, color: inkCol))),
                  pw.Expanded(flex: 2, child: pw.Text(line.sac.isNotEmpty ? line.sac : '996311', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7.0, color: mutedCol))),
                  pw.Expanded(flex: 1, child: pw.Text('${line.quantity}', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: isA5 ? 6.2 : 7.6, color: inkCol))),
                  pw.Expanded(flex: 2, child: pw.Text(currency.format(line.rate), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6.2 : 7.6, color: inkCol))),
                  pw.Expanded(flex: 1, child: pw.Text('${line.taxRate.round()}%', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7.0, color: mutedCol))),
                  pw.Expanded(flex: 2, child: pw.Text(currency.format(line.total), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6.2 : 7.6, fontWeight: pw.FontWeight.bold, color: inkCol))),
                ],
              ),
            );
          }),
          pw.SizedBox(height: isA5 ? 6 : 8),

          // 5. Statutory 8-Column CBIC HSN Table (if enabled)
          if (showHsnTable) ...[
            pw.Text(
              'TAX SUMMARY (CBIC RULE 46 AUDIT MATRIX)',
              style: pw.TextStyle(fontSize: isA5 ? 5.2 : 6.4, fontWeight: pw.FontWeight.bold, color: goldCol, letterSpacing: 0.8),
            ),
            pw.SizedBox(height: 2),
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 2.5),
              decoration: pw.BoxDecoration(color: PdfColor.fromInt(0xFFF9F7F2), border: pw.Border.all(color: goldSoftCol, width: 0.5)),
              child: pw.Row(
                children: [
                  pw.Expanded(flex: 2, child: pw.Text(' HSN/SAC', style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 3, child: pw.Text('Taxable (Rs.)', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 2, child: pw.Text('CGST', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 2, child: pw.Text('SGST', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 3, child: pw.Text('Total Tax ', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, fontWeight: pw.FontWeight.bold))),
                ],
              ),
            ),
            ...hsnReport.rows.map((r) => pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 1.5),
              child: pw.Row(
                children: [
                  pw.Expanded(flex: 2, child: pw.Text(' ${r.sac}', style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, color: mutedCol))),
                  pw.Expanded(flex: 3, child: pw.Text(currency.format(r.taxable), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0))),
                  pw.Expanded(flex: 2, child: pw.Text('${r.cgstRate.toStringAsFixed(1)}% : ${r.cgst.toStringAsFixed(1)}', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0))),
                  pw.Expanded(flex: 2, child: pw.Text('${r.sgstRate.toStringAsFixed(1)}% : ${r.sgst.toStringAsFixed(1)}', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0))),
                  pw.Expanded(flex: 3, child: pw.Text('${currency.format(r.totalTax)} ', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, fontWeight: pw.FontWeight.bold))),
                ],
              ),
            )),
            pw.SizedBox(height: isA5 ? 6 : 8),
          ],

          // 6. Totals & Settlement Strip
          pw.Row(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                flex: 6,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Amount in Words:', style: pw.TextStyle(fontSize: isA5 ? 5.4 : 6.6, color: mutedCol)),
                    pw.Text(invoice.totalInWords, style: pw.TextStyle(fontSize: isA5 ? 6.2 : 7.6, fontWeight: pw.FontWeight.bold, color: inkCol)),
                    pw.SizedBox(height: 6),
                    pw.Row(
                      children: [
                        if (showQr) ...[
                          if (cfg.customQrBase64 != null && _safeImage(cfg.customQrBase64) != null) ...[
                            pw.Image(
                              _safeImage(cfg.customQrBase64)!,
                              width: isA5 ? 36 : 48,
                              height: isA5 ? 36 : 48,
                              fit: pw.BoxFit.contain,
                            ),
                            pw.SizedBox(width: 8),
                          ] else ...[
                            pw.BarcodeWidget(
                              barcode: pw.Barcode.qrCode(),
                              data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(invoice.invoiceNumber)}',
                              width: isA5 ? 36 : 48,
                              height: isA5 ? 36 : 48,
                            ),
                            pw.SizedBox(width: 8),
                          ],
                        ],
                        pw.Expanded(
                          child: pw.Column(
                            crossAxisAlignment: pw.CrossAxisAlignment.start,
                            children: [
                              pw.Text('Merchant UPI: ${cfg.upiVpa}', style: pw.TextStyle(fontSize: isA5 ? 5.2 : 6.4, fontWeight: pw.FontWeight.bold)),
                              pw.Text('Bank: ${cfg.bankName} - A/C: ${cfg.bankAccount}', style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.2, color: mutedCol)),
                              pw.Text('IFSC: ${cfg.bankIfsc}', style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.2, color: mutedCol)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              pw.SizedBox(width: 12),
              pw.Expanded(
                flex: 4,
                child: pw.Column(
                  children: [
                    _totalRowItem('Taxable Amount', currency.format(invoice.taxable), isA5, inkCol, mutedCol),
                    _totalRowItem('CGST (Central Tax)', currency.format(invoice.cgst), isA5, inkCol, mutedCol),
                    _totalRowItem('SGST (State Tax)', currency.format(invoice.sgst), isA5, inkCol, mutedCol),
                    pw.Divider(color: goldCol, thickness: 1.0),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('GRAND TOTAL', style: pw.TextStyle(fontSize: isA5 ? 7.6 : 9.5, fontWeight: pw.FontWeight.bold, color: primaryDarkCol)),
                        pw.Text(currency.format(invoice.grandTotal), style: pw.TextStyle(fontSize: isA5 ? 8.5 : 11.0, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                      ],
                    ),
                    pw.Container(height: 1.5, color: primaryCol, margin: const pw.EdgeInsets.only(top: 2)),
                  ],
                ),
              ),
            ],
          ),

          pw.Spacer(),

          // 7. Footer & Signature
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text('Terms of Hospitality:', style: pw.TextStyle(fontSize: isA5 ? 5.2 : 6.4, fontWeight: pw.FontWeight.bold, color: mutedCol)),
                  pw.Text('Standard Check-out: 11:00 AM. Government ID required at check-in.', style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.0, color: mutedCol)),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  if (showStamp) ...[
                    if (cfg.stampBase64 != null && _safeImage(cfg.stampBase64) != null)
                      pw.Image(
                        _safeImage(cfg.stampBase64)!,
                        width: isA5 ? 36 : 46,
                        height: isA5 ? 36 : 46,
                        fit: pw.BoxFit.contain,
                      )
                    else
                      pw.Container(
                        padding: const pw.EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: pw.BoxDecoration(border: pw.Border.all(color: primaryCol, width: 0.8), borderRadius: pw.BorderRadius.circular(4)),
                        child: pw.Text('SEAL & STAMP VERIFIED', style: pw.TextStyle(fontSize: 6.0, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                      ),
                    pw.SizedBox(height: 3),
                  ],
                  if (cfg.signatureBase64 != null && _safeImage(cfg.signatureBase64) != null) ...[
                    pw.Image(
                      _safeImage(cfg.signatureBase64)!,
                      width: isA5 ? 54 : 70,
                      height: isA5 ? 20 : 26,
                      fit: pw.BoxFit.contain,
                    ),
                    pw.SizedBox(height: 2),
                  ],
                  pw.Text('For ${cfg.legalName}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7.2, fontWeight: pw.FontWeight.bold, color: inkCol)),
                  pw.Text('Authorized Signatory / Manager', style: pw.TextStyle(fontSize: isA5 ? 5.0 : 6.2, color: mutedCol)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TEMPLATE 2: ADVANCED GST (TALLY / CBIC 8-COLUMN STANDARD)
  // =========================================================================
  static pw.Widget _buildAdvancedGstLayout(
    Invoice invoice,
    HotelConfig cfg,
    ThemePalette pal,
    bool isA5,
    bool showHsnTable,
    bool showQr,
    bool showStamp,
  ) {
    final primaryCol = PdfColor.fromInt(pal.primary);
    final borderCol = PdfColor.fromInt(pal.border);
    final tableHeaderBg = PdfColor.fromInt(pal.tableHeaderBg);
    final inkCol = PdfColor.fromInt(pal.text);
    final mutedCol = PdfColor.fromInt(0xFF64748B);
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs. ', decimalDigits: 2);
    final hsnReport = computeHsnTaxSummary(invoice.lines);

    return pw.Container(
      decoration: pw.BoxDecoration(
        border: pw.Border.all(color: primaryCol, width: 1.5),
      ),
      padding: const pw.EdgeInsets.all(12),
      child: pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.stretch,
        children: [
          // Header
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(cfg.hotelName, style: pw.TextStyle(fontSize: isA5 ? 12 : 16, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                  pw.Text(cfg.legalName, style: pw.TextStyle(fontSize: isA5 ? 6 : 8, color: mutedCol)),
                  pw.Text('${cfg.address} | Ph: ${cfg.phone}', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7, color: mutedCol)),
                  pw.Text('GSTIN: ${cfg.gstin} | State: ${cfg.stateName} (${cfg.stateCode})', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: inkCol)),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Container(
                    padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    color: primaryCol,
                    child: pw.Text('TAX INVOICE', style: pw.TextStyle(fontSize: isA5 ? 8 : 11, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Text('Invoice No: ${invoice.invoiceNumber}', style: pw.TextStyle(fontSize: isA5 ? 7 : 9, fontWeight: pw.FontWeight.bold)),
                  pw.Text('Date: ${invoice.date}', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, color: mutedCol)),
                ],
              ),
            ],
          ),
          pw.Divider(color: primaryCol, thickness: 1.0, height: 12),

          // Parties & Stay Table
          pw.Row(
            children: [
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(6),
                  decoration: pw.BoxDecoration(border: pw.Border.all(color: borderCol, width: 0.6)),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('BUYER / GUEST PARTICULARS', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 6.8, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                      pw.Text(invoice.guestName, style: pw.TextStyle(fontSize: isA5 ? 7 : 8.5, fontWeight: pw.FontWeight.bold)),
                      pw.Text('Phone: ${invoice.guestPhone}', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7)),
                      if (invoice.guestGstin != null && invoice.guestGstin!.isNotEmpty)
                        pw.Text('GSTIN: ${invoice.guestGstin}', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                ),
              ),
              pw.SizedBox(width: 8),
              pw.Expanded(
                child: pw.Container(
                  padding: const pw.EdgeInsets.all(6),
                  decoration: pw.BoxDecoration(border: pw.Border.all(color: borderCol, width: 0.6)),
                  child: pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('STAY & DISPATCH DETAILS', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 6.8, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                      pw.Text('Room No: ${invoice.roomNumber} | Nights: ${invoice.nights}', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5)),
                      pw.Text('Check-in: ${invoice.checkIn}', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7)),
                      pw.Text('Check-out: ${invoice.checkOut}', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          pw.SizedBox(height: 8),

          // Line Items Grid
          pw.Container(
            color: tableHeaderBg,
            padding: const pw.EdgeInsets.symmetric(vertical: 4, horizontal: 4),
            child: pw.Row(
              children: [
                pw.Expanded(flex: 5, child: pw.Text('Item Description', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
                pw.Expanded(flex: 2, child: pw.Text('HSN/SAC', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
                pw.Expanded(flex: 1, child: pw.Text('Qty', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
                pw.Expanded(flex: 2, child: pw.Text('Rate (Rs.)', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
                pw.Expanded(flex: 2, child: pw.Text('Total (Rs.)', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
              ],
            ),
          ),
          ...invoice.lines.map((l) => pw.Container(
            padding: const pw.EdgeInsets.symmetric(vertical: 3, horizontal: 4),
            decoration: pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: borderCol, width: 0.5))),
            child: pw.Row(
              children: [
                pw.Expanded(flex: 5, child: pw.Text(l.description, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5))),
                pw.Expanded(flex: 2, child: pw.Text(l.sac.isNotEmpty ? l.sac : '996311', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7, color: mutedCol))),
                pw.Expanded(flex: 1, child: pw.Text('${l.quantity}', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5))),
                pw.Expanded(flex: 2, child: pw.Text(currency.format(l.rate), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5))),
                pw.Expanded(flex: 2, child: pw.Text(currency.format(l.total), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
              ],
            ),
          )),
          pw.SizedBox(height: 6),

          // Statutory CBIC 8-Column Matrix
          if (showHsnTable) ...[
            pw.Container(
              color: tableHeaderBg,
              padding: const pw.EdgeInsets.symmetric(vertical: 2.5, horizontal: 4),
              child: pw.Row(
                children: [
                  pw.Expanded(flex: 2, child: pw.Text('HSN/SAC', style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 3, child: pw.Text('Taxable (Rs.)', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 2, child: pw.Text('CGST', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 2, child: pw.Text('SGST', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, fontWeight: pw.FontWeight.bold))),
                  pw.Expanded(flex: 3, child: pw.Text('Total Tax', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, fontWeight: pw.FontWeight.bold))),
                ],
              ),
            ),
            ...hsnReport.rows.map((r) => pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 2, horizontal: 4),
              child: pw.Row(
                children: [
                  pw.Expanded(flex: 2, child: pw.Text(r.sac, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, color: mutedCol))),
                  pw.Expanded(flex: 3, child: pw.Text(currency.format(r.taxable), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2))),
                  pw.Expanded(flex: 2, child: pw.Text('${r.cgstRate.toStringAsFixed(1)}% : ${r.cgst.toStringAsFixed(1)}', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2))),
                  pw.Expanded(flex: 2, child: pw.Text('${r.sgstRate.toStringAsFixed(1)}% : ${r.sgst.toStringAsFixed(1)}', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2))),
                  pw.Expanded(flex: 3, child: pw.Text(currency.format(r.totalTax), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, fontWeight: pw.FontWeight.bold))),
                ],
              ),
            )),
            pw.SizedBox(height: 6),
          ],

          // Totals Row
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Expanded(
                flex: 5,
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Amount in Words: ${invoice.totalInWords}', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7, fontWeight: pw.FontWeight.bold)),
                    pw.SizedBox(height: 4),
                    if (showQr)
                      pw.Row(
                        children: [
                          if (cfg.customQrBase64 != null && _safeImage(cfg.customQrBase64) != null)
                            pw.Image(
                              _safeImage(cfg.customQrBase64)!,
                              width: isA5 ? 32 : 42,
                              height: isA5 ? 32 : 42,
                              fit: pw.BoxFit.contain,
                            )
                          else
                            pw.BarcodeWidget(
                              barcode: pw.Barcode.qrCode(),
                              data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(invoice.invoiceNumber)}',
                              width: isA5 ? 32 : 42,
                              height: isA5 ? 32 : 42,
                            ),
                          pw.SizedBox(width: 6),
                          pw.Text('Scan to Pay UPI\n${cfg.upiVpa}', style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2)),
                        ],
                      ),
                  ],
                ),
              ),
              pw.Expanded(
                flex: 5,
                child: pw.Column(
                  children: [
                    _totalRowItem('Taxable Value', currency.format(invoice.taxable), isA5, inkCol, mutedCol),
                    _totalRowItem('CGST', currency.format(invoice.cgst), isA5, inkCol, mutedCol),
                    _totalRowItem('SGST', currency.format(invoice.sgst), isA5, inkCol, mutedCol),
                    pw.Divider(color: primaryCol, thickness: 1.0),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('GRAND TOTAL', style: pw.TextStyle(fontSize: isA5 ? 7.5 : 9.5, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                        pw.Text(currency.format(invoice.grandTotal), style: pw.TextStyle(fontSize: isA5 ? 8 : 10.5, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),

          pw.Spacer(),

          // Signature Foot
          pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.end,
            children: [
              pw.Text('Electronic Tax Invoice generated by Ayushmaan OS', style: pw.TextStyle(fontSize: isA5 ? 4.8 : 5.8, color: mutedCol)),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  if (showStamp) ...[
                    if (cfg.stampBase64 != null && _safeImage(cfg.stampBase64) != null)
                      pw.Image(
                        _safeImage(cfg.stampBase64)!,
                        width: isA5 ? 34 : 44,
                        height: isA5 ? 34 : 44,
                        fit: pw.BoxFit.contain,
                      )
                    else
                      pw.Text('[OFFICIAL SEAL]', style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                    pw.SizedBox(height: 3),
                  ],
                  if (cfg.signatureBase64 != null && _safeImage(cfg.signatureBase64) != null) ...[
                    pw.Image(
                      _safeImage(cfg.signatureBase64)!,
                      width: isA5 ? 54 : 70,
                      height: isA5 ? 20 : 26,
                      fit: pw.BoxFit.contain,
                    ),
                    pw.SizedBox(height: 2),
                  ],
                  pw.Text('For ${cfg.legalName}', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.2, fontWeight: pw.FontWeight.bold)),
                  pw.Text('Authorized Signatory', style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, color: mutedCol)),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TEMPLATE 3: STYLISH MODERN (BOUTIQUE CONTEMPORARY)
  // =========================================================================
  static pw.Widget _buildStylishModernLayout(
    Invoice invoice,
    HotelConfig cfg,
    ThemePalette pal,
    bool isA5,
    bool showQr,
    bool showStamp,
  ) {
    final primaryCol = PdfColor.fromInt(pal.primary);
    final primaryLightCol = PdfColor.fromInt(pal.primaryLight);
    final cardBgCol = PdfColor.fromInt(pal.cardBg);
    final borderCol = PdfColor.fromInt(pal.border);
    final inkCol = PdfColor.fromInt(pal.text);
    final mutedCol = PdfColor.fromInt(0xFF64748B);
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs. ', decimalDigits: 2);

    return pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.stretch,
      children: [
        // 1. Full-Bleed Color Banner Header
        pw.Container(
          color: primaryCol,
          padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: pw.Row(
            mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
            crossAxisAlignment: pw.CrossAxisAlignment.center,
            children: [
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(cfg.hotelName, style: pw.TextStyle(fontSize: isA5 ? 13 : 17, fontWeight: pw.FontWeight.bold, color: PdfColors.white)),
                  pw.Text(cfg.legalName, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, color: PdfColor.fromInt(pal.primaryLight))),
                  pw.Text('GSTIN: ${cfg.gstin} | Ph: ${cfg.phone}', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.2, color: PdfColors.white)),
                ],
              ),
              pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.end,
                children: [
                  pw.Text('INVOICE', style: pw.TextStyle(fontSize: isA5 ? 12 : 16, fontWeight: pw.FontWeight.bold, color: PdfColors.white, letterSpacing: 2)),
                  pw.Text('#${invoice.invoiceNumber}', style: pw.TextStyle(fontSize: isA5 ? 7 : 9, color: PdfColor.fromInt(pal.primaryLight))),
                  pw.Text(invoice.date, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, color: PdfColors.white)),
                ],
              ),
            ],
          ),
        ),
        pw.SizedBox(height: 10),

        // 2. Dual Modern Information Cards
        pw.Row(
          children: [
            pw.Expanded(
              child: pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(color: cardBgCol, border: pw.Border.all(color: borderCol, width: 0.8), borderRadius: pw.BorderRadius.circular(6)),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('GUEST & BILLING', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                    pw.SizedBox(height: 2),
                    pw.Text(invoice.guestName, style: pw.TextStyle(fontSize: isA5 ? 7 : 8.5, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Phone: ${invoice.guestPhone}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7, color: mutedCol)),
                    if (invoice.guestGstin != null && invoice.guestGstin!.isNotEmpty)
                      pw.Text('GSTIN: ${invoice.guestGstin}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
              ),
            ),
            pw.SizedBox(width: 8),
            pw.Expanded(
              child: pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(color: cardBgCol, border: pw.Border.all(color: borderCol, width: 0.8), borderRadius: pw.BorderRadius.circular(6)),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('STAY SUMMARY', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                    pw.SizedBox(height: 2),
                    pw.Text('Room ${invoice.roomNumber} (${invoice.nights} Night)', style: pw.TextStyle(fontSize: isA5 ? 7 : 8.5, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Check-in: ${invoice.checkIn}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7, color: mutedCol)),
                    pw.Text('Check-out: ${invoice.checkOut}', style: pw.TextStyle(fontSize: isA5 ? 5.8 : 7, color: mutedCol)),
                  ],
                ),
              ),
            ),
          ],
        ),
        pw.SizedBox(height: 10),

        // 3. Line Items Table with Rounded Top
        pw.Container(
          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 5),
          decoration: pw.BoxDecoration(color: primaryLightCol, borderRadius: pw.BorderRadius.circular(4)),
          child: pw.Row(
            children: [
              pw.Expanded(flex: 5, child: pw.Text('Service Description', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: primaryCol))),
              pw.Expanded(flex: 2, child: pw.Text('SAC', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: primaryCol))),
              pw.Expanded(flex: 1, child: pw.Text('Qty', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: primaryCol))),
              pw.Expanded(flex: 2, child: pw.Text('Rate', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: primaryCol))),
              pw.Expanded(flex: 2, child: pw.Text('Amount', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: primaryCol))),
            ],
          ),
        ),
        ...invoice.lines.map((l) => pw.Container(
          padding: const pw.EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: pw.BoxDecoration(border: pw.Border(bottom: pw.BorderSide(color: borderCol, width: 0.5))),
          child: pw.Row(
            children: [
              pw.Expanded(flex: 5, child: pw.Text(l.description, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5))),
              pw.Expanded(flex: 2, child: pw.Text(l.sac.isNotEmpty ? l.sac : '996311', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7, color: mutedCol))),
              pw.Expanded(flex: 1, child: pw.Text('${l.quantity}', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5))),
              pw.Expanded(flex: 2, child: pw.Text(currency.format(l.rate), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5))),
              pw.Expanded(flex: 2, child: pw.Text(currency.format(l.total), textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold))),
            ],
          ),
        )),
        pw.SizedBox(height: 10),

        // 4. Totals Card & UPI QR Callout
        pw.Row(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Expanded(
              flex: 5,
              child: pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(color: cardBgCol, border: pw.Border.all(color: borderCol, width: 0.6), borderRadius: pw.BorderRadius.circular(6)),
                child: pw.Row(
                  children: [
                    if (showQr) ...[
                      if (cfg.customQrBase64 != null && _safeImage(cfg.customQrBase64) != null) ...[
                        pw.Image(
                          _safeImage(cfg.customQrBase64)!,
                          width: isA5 ? 36 : 46,
                          height: isA5 ? 36 : 46,
                          fit: pw.BoxFit.contain,
                        ),
                        pw.SizedBox(width: 8),
                      ] else ...[
                        pw.BarcodeWidget(
                          barcode: pw.Barcode.qrCode(),
                          data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(invoice.invoiceNumber)}',
                          width: isA5 ? 36 : 46,
                          height: isA5 ? 36 : 46,
                        ),
                        pw.SizedBox(width: 8),
                      ],
                    ],
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('Instant UPI Pay', style: pw.TextStyle(fontSize: isA5 ? 6 : 7.5, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                          pw.Text(cfg.upiVpa, style: pw.TextStyle(fontSize: isA5 ? 5.5 : 6.8)),
                          pw.Text('${cfg.bankName} - ${cfg.bankAccount}', style: pw.TextStyle(fontSize: isA5 ? 5 : 6.2, color: mutedCol)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            pw.SizedBox(width: 8),
            pw.Expanded(
              flex: 5,
              child: pw.Container(
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(color: cardBgCol, border: pw.Border.all(color: borderCol, width: 0.6), borderRadius: pw.BorderRadius.circular(6)),
                child: pw.Column(
                  children: [
                    _totalRowItem('Taxable Amount', currency.format(invoice.taxable), isA5, inkCol, mutedCol),
                    _totalRowItem('CGST + SGST', currency.format(invoice.cgst + invoice.sgst), isA5, inkCol, mutedCol),
                    pw.Divider(color: primaryCol, thickness: 1.0),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text('GRAND TOTAL', style: pw.TextStyle(fontSize: isA5 ? 7.5 : 9.5, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                        pw.Text(currency.format(invoice.grandTotal), style: pw.TextStyle(fontSize: isA5 ? 8.5 : 11, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),

        pw.Spacer(),

        // Modern Footer
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            pw.Text('Thank you for staying at ${cfg.hotelName}!', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7, color: mutedCol)),
            pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                if (showStamp) ...[
                  if (cfg.stampBase64 != null && _safeImage(cfg.stampBase64) != null)
                    pw.Image(
                      _safeImage(cfg.stampBase64)!,
                      width: isA5 ? 34 : 44,
                      height: isA5 ? 34 : 44,
                      fit: pw.BoxFit.contain,
                    )
                  else
                    pw.Text('[SEAL]', style: pw.TextStyle(fontSize: 6, fontWeight: pw.FontWeight.bold, color: primaryCol)),
                  pw.SizedBox(height: 3),
                ],
                if (cfg.signatureBase64 != null && _safeImage(cfg.signatureBase64) != null) ...[
                  pw.Image(
                    _safeImage(cfg.signatureBase64)!,
                    width: isA5 ? 54 : 70,
                    height: isA5 ? 20 : 26,
                    fit: pw.BoxFit.contain,
                  ),
                  pw.SizedBox(height: 2),
                ],
                pw.Text('Authorized Signature', style: pw.TextStyle(fontSize: isA5 ? 5.5 : 7, fontWeight: pw.FontWeight.bold)),
              ],
            ),
          ],
        ),
      ],
    );
  }

  // =========================================================================
  // TEMPLATE 4: THERMAL 80MM POS RECEIPT SLIP
  // =========================================================================
  static Future<Uint8List> buildThermalReceiptBytes(
    Invoice invoice, {
    HotelConfig? config,
  }) async {
    final cfg = config ?? HotelConfig();
    final pdf = pw.Document(title: 'Receipt ${invoice.invoiceNumber}');
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: 'Rs.', decimalDigits: 2);

    const double rollWidthMm = 72.0;
    final pageFormat = PdfPageFormat(
      rollWidthMm * PdfPageFormat.mm,
      double.infinity,
      marginAll: 4 * PdfPageFormat.mm,
    );

    pdf.addPage(
      pw.Page(
        pageFormat: pageFormat,
        build: (pw.Context context) {
          return pw.Container(
            color: PdfColors.white,
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.stretch,
              children: [
                pw.Center(
                  child: pw.Text(
                    cfg.hotelName.toUpperCase(),
                    textAlign: pw.TextAlign.center,
                    style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold),
                  ),
                ),
                pw.Center(
                  child: pw.Text(
                    cfg.address,
                    textAlign: pw.TextAlign.center,
                    style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700),
                  ),
                ),
                pw.Center(
                  child: pw.Text(
                    'GSTIN: ${cfg.gstin} | Ph: ${cfg.phone}',
                    textAlign: pw.TextAlign.center,
                    style: const pw.TextStyle(fontSize: 6.5),
                  ),
                ),
                pw.SizedBox(height: 3),
                _thermalDashedDivider(),
                pw.SizedBox(height: 2),

                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Bill: ${invoice.invoiceNumber}', style: pw.TextStyle(fontSize: 7.0, fontWeight: pw.FontWeight.bold)),
                    pw.Text('Date: ${invoice.date}', style: const pw.TextStyle(fontSize: 6.5)),
                  ],
                ),
                pw.Text('Guest: ${invoice.guestName}', style: const pw.TextStyle(fontSize: 7.0)),
                pw.Text('Room: ${invoice.roomNumber} (${invoice.nights} Night)', style: const pw.TextStyle(fontSize: 6.5)),
                if (invoice.guestGstin != null && invoice.guestGstin!.isNotEmpty)
                  pw.Text('Guest GSTIN: ${invoice.guestGstin}', style: const pw.TextStyle(fontSize: 6.5)),
                pw.SizedBox(height: 2),
                _thermalDashedDivider(),
                pw.SizedBox(height: 2),

                pw.Row(
                  children: [
                    pw.Expanded(flex: 5, child: pw.Text('ITEM', style: pw.TextStyle(fontSize: 6.5, fontWeight: pw.FontWeight.bold))),
                    pw.Expanded(flex: 2, child: pw.Text('QTY', textAlign: pw.TextAlign.center, style: pw.TextStyle(fontSize: 6.5, fontWeight: pw.FontWeight.bold))),
                    pw.Expanded(flex: 3, child: pw.Text('AMT', textAlign: pw.TextAlign.right, style: pw.TextStyle(fontSize: 6.5, fontWeight: pw.FontWeight.bold))),
                  ],
                ),
                pw.Divider(thickness: 0.5, height: 4),

                ...invoice.lines.map((l) => pw.Padding(
                  padding: const pw.EdgeInsets.symmetric(vertical: 1.0),
                  child: pw.Row(
                    children: [
                      pw.Expanded(flex: 5, child: pw.Text(l.description, style: const pw.TextStyle(fontSize: 6.5))),
                      pw.Expanded(flex: 2, child: pw.Text('${l.quantity}', textAlign: pw.TextAlign.center, style: const pw.TextStyle(fontSize: 6.5))),
                      pw.Expanded(flex: 3, child: pw.Text(currency.format(l.total), textAlign: pw.TextAlign.right, style: const pw.TextStyle(fontSize: 6.5))),
                    ],
                  ),
                )),
                pw.SizedBox(height: 2),
                _thermalDashedDivider(),

                _thermalTotalRow('Taxable Value', currency.format(invoice.taxable)),
                _thermalTotalRow('CGST', currency.format(invoice.cgst)),
                _thermalTotalRow('SGST', currency.format(invoice.sgst)),
                pw.Divider(thickness: 1.0, height: 4),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('NET TOTAL:', style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold)),
                    pw.Text(currency.format(invoice.grandTotal), style: pw.TextStyle(fontSize: 9.0, fontWeight: pw.FontWeight.bold)),
                  ],
                ),
                pw.SizedBox(height: 2),
                _thermalDashedDivider(),
                pw.SizedBox(height: 4),

                if (cfg.stampBase64 != null && _safeImage(cfg.stampBase64) != null) ...[
                  pw.Center(
                    child: pw.Image(
                      _safeImage(cfg.stampBase64)!,
                      width: 36,
                      height: 36,
                      fit: pw.BoxFit.contain,
                    ),
                  ),
                  pw.SizedBox(height: 3),
                ],

                pw.Center(
                  child: (cfg.customQrBase64 != null && _safeImage(cfg.customQrBase64) != null)
                      ? pw.Image(
                          _safeImage(cfg.customQrBase64)!,
                          width: 54,
                          height: 54,
                          fit: pw.BoxFit.contain,
                        )
                      : pw.BarcodeWidget(
                          barcode: pw.Barcode.qrCode(),
                          data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}&am=${invoice.grandTotal.toStringAsFixed(2)}&cu=INR&tn=${Uri.encodeComponent(invoice.invoiceNumber)}',
                          width: 54,
                          height: 54,
                        ),
                ),
                pw.SizedBox(height: 2),
                pw.Center(
                  child: pw.Text('Scan to Pay UPI: ${cfg.upiVpa}', style: const pw.TextStyle(fontSize: 6.0)),
                ),
                pw.SizedBox(height: 6),
                pw.Center(
                  child: pw.Text('THANK YOU! VISIT AGAIN', style: pw.TextStyle(fontSize: 7.0, fontWeight: pw.FontWeight.bold)),
                ),
              ],
            ),
          );
        },
      ),
    );

    return pdf.save();
  }

  static Future<void> printThermalReceipt(Invoice invoice, {HotelConfig? config}) async {
    final bytes = await buildThermalReceiptBytes(invoice, config: config);
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => bytes,
      name: 'Receipt_${invoice.invoiceNumber}.pdf',
    );
  }

  // --- Helper Widgets ---
  static pw.Widget _ornRule(PdfColor goldCol, PdfColor goldSoftCol) {
    return pw.Row(
      children: [
        pw.Expanded(child: pw.Container(height: 0.8, color: goldSoftCol)),
        pw.SizedBox(width: 4),
        pw.Container(width: 4, height: 4, color: goldCol),
        pw.SizedBox(width: 3),
        pw.Container(
          width: 5.5,
          height: 5.5,
          decoration: pw.BoxDecoration(border: pw.Border.all(color: goldCol, width: 0.8)),
        ),
        pw.SizedBox(width: 3),
        pw.Container(width: 4, height: 4, color: goldCol),
        pw.SizedBox(width: 4),
        pw.Expanded(child: pw.Container(height: 0.8, color: goldSoftCol)),
      ],
    );
  }

  static pw.Widget _metaCell(String key, String value, bool isA5, PdfColor inkCol, PdfColor mutedCol) {
    return pw.RichText(
      text: pw.TextSpan(
        children: [
          pw.TextSpan(
            text: '$key ',
            style: pw.TextStyle(fontSize: isA5 ? 5.4 : 6.8, color: mutedCol, letterSpacing: 0.6),
          ),
          pw.TextSpan(
            text: value,
            style: pw.TextStyle(fontSize: isA5 ? 5.4 : 6.8, fontWeight: pw.FontWeight.bold, color: inkCol),
          ),
        ],
      ),
    );
  }

  static pw.Widget _tableHeader(String text, PdfColor goldCol, bool isA5, {pw.TextAlign align = pw.TextAlign.left}) {
    return pw.Padding(
      padding: const pw.EdgeInsets.only(bottom: 3),
      child: pw.Text(
        text,
        textAlign: align,
        style: pw.TextStyle(
          fontSize: isA5 ? 5.2 : 6.4,
          fontWeight: pw.FontWeight.bold,
          color: goldCol,
          letterSpacing: 1.1,
        ),
      ),
    );
  }

  static pw.Widget _totalRowItem(String label, String value, bool isA5, PdfColor inkCol, PdfColor mutedCol) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 1.0),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: pw.TextStyle(fontSize: isA5 ? 6.0 : 7.5, color: mutedCol)),
          pw.Text(value, style: pw.TextStyle(fontSize: isA5 ? 6.0 : 7.5, color: inkCol)),
        ],
      ),
    );
  }

  static pw.Widget _thermalDashedDivider() {
    return pw.Center(
      child: pw.Text(
        '- - - - - - - - - - - - - - - - - - - - - - - -',
        style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700),
      ),
    );
  }

  static pw.Widget _thermalTotalRow(String label, String value) {
    return pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 6.5, color: PdfColors.grey700)),
        pw.Text(value, style: const pw.TextStyle(fontSize: 6.5)),
      ],
    );
  }
}
