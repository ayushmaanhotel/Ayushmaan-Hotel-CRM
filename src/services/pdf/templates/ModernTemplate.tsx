import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceTemplateProps } from './HeritageTemplate';
import { formatINR } from '../../../domain/money';

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 8.5,
    color: '#0F172A',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2pt solid #0F172A',
    paddingBottom: 14,
    marginBottom: 16,
  },
  brandTitle: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  subText: {
    fontSize: 8,
    color: '#64748B',
    lineHeight: 1.35,
  },
  invoiceMetaBlock: {
    alignItems: 'flex-end',
  },
  taxInvoiceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    letterSpacing: 1,
  },
  metaText: {
    fontSize: 8.5,
    color: '#334155',
    marginTop: 2,
  },
  grid2Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    border: '1pt solid #E2E8F0',
    borderRadius: 6,
    padding: 10,
  },
  cardLabel: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 8,
    color: '#1E293B',
  },
  colDesc: { width: '38%' },
  colSac: { width: '12%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '14%', textAlign: 'right' },
  colTax: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right' },

  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inWordsCard: {
    width: '54%',
    backgroundColor: '#F8FAFC',
    border: '1pt solid #E2E8F0',
    borderRadius: 6,
    padding: 10,
  },
  summaryBlock: {
    width: '42%',
  },
  sumRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 8,
    color: '#475569',
  },
  grandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 6,
  },
  bottomGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1pt solid #E2E8F0',
    paddingTop: 12,
    marginTop: 18,
  },
  qrBlock: {
    width: '24%',
    alignItems: 'center',
  },
  qrImg: {
    width: 60,
    height: 60,
  },
  bankBlock: {
    width: '46%',
  },
  signBlock: {
    width: '28%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  signImg: {
    width: 70,
    height: 32,
    marginBottom: 4,
  },
});

export const ModernTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  qrDataUrl,
  signatureDataUrl,
  stampDataUrl,
}) => {
  const { supplier, buyer, stay, lines, totals } = invoice;
  const isPaid = invoice.balanceDue <= 0;

  return (
    <Document title={`Invoice-${invoice.number}`} author={supplier.tradeName}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brandTitle}>{supplier.tradeName}</Text>
            <Text style={styles.subText}>{supplier.legalName}</Text>
            <Text style={styles.subText}>{supplier.address}</Text>
            <Text style={styles.subText}>GSTIN: {supplier.gstin} • State: {supplier.stateCode}</Text>
            <Text style={styles.subText}>Phone: {supplier.phone} {supplier.email ? `• ${supplier.email}` : ''}</Text>
          </View>
          <View style={styles.invoiceMetaBlock}>
            <Text style={styles.taxInvoiceTitle}>
              {invoice.docType === 'credit-note' ? 'CREDIT NOTE' : 'TAX INVOICE'}
            </Text>
            <Text style={styles.metaText}>{invoice.number}</Text>
            <Text style={styles.subText}>Date: {invoice.issuedAt.slice(0, 10)}</Text>
            <Text style={[styles.subText, { fontWeight: 'bold', color: isPaid ? '#16A34A' : '#DC2626', marginTop: 3 }]}>
              {isPaid ? 'PAID IN FULL' : `BALANCE DUE: ${formatINR(invoice.balanceDue)}`}
            </Text>
          </View>
        </View>

        {/* 2-Column Info Grid */}
        <View style={styles.grid2Col}>
          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Billed To</Text>
            <Text style={styles.cardTitle}>{buyer.name}</Text>
            {buyer.phone && <Text style={styles.subText}>Contact: {buyer.phone}</Text>}
            {buyer.address && <Text style={styles.subText}>{buyer.address}</Text>}
            {buyer.gstin && <Text style={styles.subText}>GSTIN: {buyer.gstin}</Text>}
          </View>

          <View style={styles.gridCard}>
            <Text style={styles.cardLabel}>Stay Details</Text>
            {stay ? (
              <>
                <Text style={styles.cardTitle}>Room {stay.roomNo} {stay.roomType ? `• ${stay.roomType}` : ''}</Text>
                <Text style={styles.subText}>
                  Nights: {stay.nights} {stay.checkIn ? `(${stay.checkIn} - ${stay.checkOut})` : ''}
                </Text>
                {stay.bookingRef && <Text style={styles.subText}>Ref: {stay.bookingRef}</Text>}
              </>
            ) : (
              <Text style={styles.subText}>Hotel Accommodations</Text>
            )}
            <Text style={styles.subText}>Place of Supply: {supplier.stateCode}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colSac}>SAC Code</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Taxable (₹)</Text>
            <Text style={styles.colTax}>GST %</Text>
            <Text style={styles.colTotal}>Total (₹)</Text>
          </View>
          {lines.map((l) => (
            <View key={l.id} style={styles.tableRow}>
              <Text style={styles.colDesc}>{l.description}</Text>
              <Text style={styles.colSac}>{l.sac}</Text>
              <Text style={styles.colQty}>{l.qty}</Text>
              <Text style={styles.colRate}>{formatINR(l.taxable).replace('₹', '')}</Text>
              <Text style={styles.colTax}>{(l.taxRateBp / 100).toFixed(0)}%</Text>
              <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>{formatINR(l.total).replace('₹', '')}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsRow}>
          <View style={styles.inWordsCard}>
            <Text style={styles.cardLabel}>Amount in Words</Text>
            <Text style={[styles.subText, { color: '#0F172A', marginTop: 2 }]}>
              {invoice.amountInWords}
            </Text>
            <View style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 7, color: '#64748B' }}>
                Tax Split: Taxable {formatINR(totals.taxable)} | CGST {formatINR(totals.cgst)} | SGST {formatINR(totals.sgst)}
              </Text>
            </View>
          </View>

          <View style={styles.summaryBlock}>
            <View style={styles.sumRow}>
              <Text>Taxable Value:</Text>
              <Text>{formatINR(totals.taxable)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text>CGST Total:</Text>
              <Text>{formatINR(totals.cgst)}</Text>
            </View>
            <View style={styles.sumRow}>
              <Text>SGST Total:</Text>
              <Text>{formatINR(totals.sgst)}</Text>
            </View>
            {totals.roundOff !== 0 && (
              <View style={styles.sumRow}>
                <Text>Round Off:</Text>
                <Text>{formatINR(totals.roundOff)}</Text>
              </View>
            )}
            <View style={styles.grandBar}>
              <Text style={{ fontWeight: 'bold', fontSize: 11, color: '#FFFFFF' }}>Grand Total:</Text>
              <Text style={{ fontWeight: 'bold', fontSize: 11, color: '#FFFFFF' }}>{formatINR(totals.grandTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomGrid}>
          {qrDataUrl && (
            <View style={styles.qrBlock}>
              <Image src={qrDataUrl} style={styles.qrImg} />
              <Text style={{ fontSize: 7, color: '#64748B', marginTop: 3 }}>Instant UPI Pay</Text>
            </View>
          )}

          <View style={styles.bankBlock}>
            <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#0F172A', marginBottom: 2 }}>Payment & Bank Info</Text>
            {supplier.upiVpa && <Text style={styles.subText}>UPI VPA: {supplier.upiVpa}</Text>}
            {supplier.bank && (
              <>
                <Text style={styles.subText}>Bank: {supplier.bank.bankName}</Text>
                <Text style={styles.subText}>Account: {supplier.bank.accountNumber} • IFSC: {supplier.bank.ifsc}</Text>
              </>
            )}
          </View>

          <View style={styles.signBlock}>
            {signatureDataUrl ? (
              <Image src={signatureDataUrl} style={styles.signImg} />
            ) : stampDataUrl ? (
              <Image src={stampDataUrl} style={styles.signImg} />
            ) : (
              <View style={{ height: 26 }} />
            )}
            <Text style={{ fontSize: 7.5, color: '#64748B', borderTop: '1pt solid #E2E8F0', paddingTop: 3 }}>
              Authorized Signatory
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
