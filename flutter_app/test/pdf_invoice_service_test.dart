import 'package:flutter_test/flutter_test.dart';
import 'package:ayushman_hotel_flutter/services/pdf_invoice_service.dart';
import 'package:ayushman_hotel_flutter/models/hotel_models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  final sampleInvoice = Invoice(
    id: 'inv-test-1',
    invoiceNumber: 'GHI/26-27/0142',
    date: '04-Oct-2026',
    guestName: 'Rajesh Sharma',
    guestPhone: '9876543210',
    guestAddress: 'Beach Road, Bandra West, Mumbai',
    roomNumber: '101',
    nights: 2,
    checkIn: '02-Oct-2026 12:00',
    checkOut: '04-Oct-2026 11:00',
    lines: [
      InvoiceLine(
        id: 'l-1',
        description: 'Room 101 Accommodation',
        sac: '996311',
        qty: 2,
        unitPrice: 4500,
        taxable: 9000,
        cgst: 225,
        sgst: 225,
        igst: 0,
        total: 9450,
        gstRatePercent: 5,
      ),
      InvoiceLine(
        id: 'l-2',
        description: 'Breakfast & Dining',
        sac: '996331',
        qty: 1,
        unitPrice: 800,
        taxable: 800,
        cgst: 20,
        sgst: 20,
        igst: 0,
        total: 840,
        gstRatePercent: 5,
      ),
    ],
    taxable: 9800,
    cgst: 245,
    sgst: 245,
    igst: 0,
    roundOff: 0,
    grandTotal: 10290,
    totalInWords: 'Ten Thousand Two Hundred Ninety Rupees Only',
    paymentMode: 'UPI',
    upiVpa: 'grandheritage@upi',
    balanceDue: 0,
  );

  test('PdfInvoiceService generates valid A4 vector PDF bytes', () async {
    final bytes = await PdfInvoiceService.buildPdfBytes(sampleInvoice, isA5: false);
    expect(bytes, isNotNull);
    expect(bytes.length, greaterThan(1000));
    // Verify PDF header magic bytes %PDF-
    expect(String.fromCharCodes(bytes.sublist(0, 5)), equals('%PDF-'));
  });

  test('PdfInvoiceService generates valid A5 vector PDF bytes', () async {
    final bytes = await PdfInvoiceService.buildPdfBytes(sampleInvoice, isA5: true);
    expect(bytes, isNotNull);
    expect(bytes.length, greaterThan(1000));
    expect(String.fromCharCodes(bytes.sublist(0, 5)), equals('%PDF-'));
  });

  test('PdfInvoiceService supports all 4 templates and color palettes', () async {
    for (final template in ['royal-heritage', 'advanced-gst', 'stylish-modern', 'thermal-80mm']) {
      for (final color in ['ruby', 'sapphire', 'emerald', 'terracotta', 'slate', 'violet']) {
        final config = HotelConfig(
          selectedTemplate: template,
          selectedColor: color,
          showDeity: true,
          showHsnTable: true,
          showQr: true,
          showStamp: true,
        );
        final bytes = await PdfInvoiceService.buildPdfBytes(sampleInvoice, config: config);
        expect(bytes, isNotNull);
        expect(bytes.length, greaterThan(500));
        expect(String.fromCharCodes(bytes.sublist(0, 5)), equals('%PDF-'));
      }
    }
  });

  test('computeHsnTaxSummary accurately groups by SAC code and tallies CGST/SGST', () {
    final report = computeHsnTaxSummary(sampleInvoice.lines);
    expect(report.rows.length, equals(2));
    expect(report.totalTaxable, equals(9800.0));
    expect(report.totalCgst, equals(245.0));
    expect(report.totalSgst, equals(245.0));
    expect(report.totalTax, equals(490.0));
  });

  test('PdfInvoiceService generates valid 80mm Thermal Receipt bytes', () async {
    final config = HotelConfig(selectedTemplate: 'thermal-80mm', showQr: true);
    final bytes = await PdfInvoiceService.buildThermalReceiptBytes(sampleInvoice, config: config);
    expect(bytes, isNotNull);
    expect(bytes.length, greaterThan(500));
    expect(String.fromCharCodes(bytes.sublist(0, 5)), equals('%PDF-'));
  });
}
