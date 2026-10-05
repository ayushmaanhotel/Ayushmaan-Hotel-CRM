import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceTemplateProps } from './HeritageTemplate';
import { formatINR } from '../../../domain/money';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    fontFamily: 'Inter',
    fontSize: 7.5,
    color: '#000000',
  },
  center: {
    alignItems: 'center',
    marginBottom: 6,
  },
  hotelName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1,
  },
  sub: {
    fontSize: 6.5,
    textAlign: 'center',
    color: '#333333',
  },
  divider: {
    borderBottom: '0.8pt dashed #000000',
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '0.5pt solid #000000',
    paddingBottom: 2,
    marginBottom: 2,
    fontWeight: 'bold',
    fontSize: 7,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
  },
  qrWrap: {
    alignItems: 'center',
    marginTop: 6,
  },
  qr: {
    width: 65,
    height: 65,
  },
  footerText: {
    fontSize: 6.5,
    textAlign: 'center',
    marginTop: 5,
  },
});

export const ThermalTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  qrDataUrl,
}) => {
  const { supplier, buyer, stay, lines, totals } = invoice;

  // 80mm roll width ~ 226pt
  return (
    <Document title={`Receipt-${invoice.number}`}>
      <Page size={[226, 500]} style={styles.page}>
        <View style={styles.center}>
          <Text style={styles.hotelName}>{supplier.tradeName}</Text>
          <Text style={styles.sub}>{supplier.address}</Text>
          <Text style={styles.sub}>GSTIN: {supplier.gstin}</Text>
          <Text style={styles.sub}>Tel: {supplier.phone}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.bold}>{invoice.docType === 'credit-note' ? 'CREDIT NOTE' : 'TAX INVOICE'}</Text>
          <Text style={styles.bold}>{invoice.number}</Text>
        </View>
        <View style={styles.row}>
          <Text>Date: {invoice.issuedAt.slice(0, 10)}</Text>
          <Text>Room: {stay?.roomNo || 'N/A'}</Text>
        </View>
        <View style={styles.row}>
          <Text>Guest: {buyer.name}</Text>
        </View>

        <View style={styles.divider} />

        {/* Line Items */}
        <View style={styles.tableHeader}>
          <Text style={{ width: '50%' }}>Item</Text>
          <Text style={{ width: '15%', textAlign: 'center' }}>Qty</Text>
          <Text style={{ width: '35%', textAlign: 'right' }}>Total (₹)</Text>
        </View>
        {lines.map((l) => (
          <View key={l.id} style={styles.itemRow}>
            <Text style={{ width: '50%' }}>{l.description}</Text>
            <Text style={{ width: '15%', textAlign: 'center' }}>{l.qty}</Text>
            <Text style={{ width: '35%', textAlign: 'right' }}>{formatINR(l.total).replace('₹', '')}</Text>
          </View>
        ))}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text>Taxable Value:</Text>
          <Text>{formatINR(totals.taxable)}</Text>
        </View>
        <View style={styles.row}>
          <Text>CGST:</Text>
          <Text>{formatINR(totals.cgst)}</Text>
        </View>
        <View style={styles.row}>
          <Text>SGST:</Text>
          <Text>{formatINR(totals.sgst)}</Text>
        </View>
        {totals.roundOff !== 0 && (
          <View style={styles.row}>
            <Text>Round Off:</Text>
            <Text>{formatINR(totals.roundOff)}</Text>
          </View>
        )}
        <View style={[styles.row, { marginTop: 2 }]}>
          <Text style={[styles.bold, { fontSize: 9 }]}>GRAND TOTAL:</Text>
          <Text style={[styles.bold, { fontSize: 9 }]}>{formatINR(totals.grandTotal)}</Text>
        </View>

        {qrDataUrl && (
          <View style={styles.qrWrap}>
            <Image src={qrDataUrl} style={styles.qr} />
            <Text style={{ fontSize: 6, marginTop: 2 }}>Scan to Pay via UPI</Text>
          </View>
        )}

        <View style={styles.divider} />
        <Text style={styles.footerText}>Thank you for your visit!</Text>
      </Page>
    </Document>
  );
};
