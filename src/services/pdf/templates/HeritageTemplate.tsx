import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { Invoice } from '../../../domain/invoice.types';
import { formatINR } from '../../../domain/money';

export interface InvoiceTemplateProps {
  invoice: Invoice;
  qrDataUrl?: string;
  deityDataUrl?: string;
  logoDataUrl?: string;
  signatureDataUrl?: string;
  stampDataUrl?: string;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FAF7F0',
    padding: 24,
    fontFamily: 'Inter',
    fontSize: 8.5,
    color: '#1F1A17',
    position: 'relative',
  },
  outerBorder: {
    border: '1.5pt solid #B08D3C',
    padding: 16,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  deityContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  deityImage: {
    width: 44,
    height: 48,
    borderRadius: 22,
    border: '1pt solid #B08D3C',
    marginBottom: 3,
    objectFit: 'cover',
  },
  shlokaText: {
    fontFamily: 'Devanagari',
    fontSize: 9,
    color: '#5B1A1A',
    fontWeight: 'normal',
    letterSpacing: 0.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '0.8pt solid #D6C29E',
    paddingBottom: 10,
    marginBottom: 10,
  },
  hotelBlock: {
    width: '60%',
  },
  hotelTitle: {
    fontFamily: 'CormorantGaramond',
    fontSize: 18,
    color: '#5B1A1A',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  hotelSub: {
    fontSize: 8,
    color: '#5A524C',
    lineHeight: 1.3,
  },
  invoiceMetaBlock: {
    width: '38%',
    alignItems: 'flex-end',
  },
  invoiceTag: {
    fontFamily: 'CormorantGaramond',
    fontSize: 14,
    color: '#5B1A1A',
    fontWeight: 'bold',
    letterSpacing: 0.8,
  },
  invoiceNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1F1A17',
    marginTop: 2,
  },
  invoiceDate: {
    fontSize: 8,
    color: '#6E665F',
    marginTop: 1,
  },
  statusPill: {
    marginTop: 4,
    backgroundColor: '#E8F5E9',
    border: '0.5pt solid #2E7D32',
    color: '#1B5E20',
    fontSize: 7.5,
    fontWeight: 'bold',
    paddingVertical: 1.5,
    paddingHorizontal: 6,
    borderRadius: 3,
  },
  grid2Col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5EFEB',
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
  },
  gridCol: {
    width: '48%',
  },
  sectionLabel: {
    fontSize: 7.5,
    color: '#8C765C',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  primaryName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1F1A17',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EDE4D8',
    borderBottom: '1pt solid #B08D3C',
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontWeight: 'bold',
    fontSize: 7.5,
    color: '#5B1A1A',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #E3D9CC',
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 8,
  },
  colDesc: { width: '38%' },
  colSac: { width: '12%', textAlign: 'center' },
  colQty: { width: '8%', textAlign: 'center' },
  colRate: { width: '14%', textAlign: 'right' },
  colTax: { width: '14%', textAlign: 'right' },
  colTotal: { width: '14%', textAlign: 'right' },

  totalsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  inWordsBlock: {
    width: '55%',
    paddingRight: 10,
  },
  inWordsLabel: {
    fontSize: 7,
    color: '#8C765C',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  inWordsText: {
    fontSize: 8,
    color: '#2C2520',
    marginTop: 2,
  },
  taxSummaryTable: {
    marginTop: 6,
    border: '0.5pt solid #E3D9CC',
    borderRadius: 3,
    padding: 4,
    backgroundColor: '#FAF5EE',
  },
  totalsTable: {
    width: '42%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    fontSize: 8,
    color: '#5A524C',
  },
  grandTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#5B1A1A',
    color: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginTop: 4,
  },
  grandTotalText: {
    fontFamily: 'CormorantGaramond',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  grandTotalAmount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '0.8pt solid #D6C29E',
    paddingTop: 8,
    marginTop: 8,
  },
  qrBlock: {
    width: '24%',
    alignItems: 'center',
  },
  qrImage: {
    width: 60,
    height: 60,
  },
  bankBlock: {
    width: '46%',
    paddingHorizontal: 6,
  },
  signatoryBlock: {
    width: '28%',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  signatoryImage: {
    width: 70,
    height: 32,
    marginBottom: 4,
  },
  signatoryLabel: {
    fontSize: 7.5,
    color: '#5A524C',
    borderTop: '0.5pt solid #B08D3C',
    paddingTop: 2,
    textAlign: 'center',
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    fontSize: 7,
    color: '#8C765C',
    marginTop: 6,
  },
});

export const HeritageTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  qrDataUrl,
  deityDataUrl,
  signatureDataUrl,
  stampDataUrl,
}) => {
  const { supplier, buyer, stay, lines, totals } = invoice;
  const isPaid = invoice.balanceDue <= 0;

  return (
    <Document title={`Invoice-${invoice.number}`} author={supplier.tradeName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBorder}>
          <View>
            {/* Sacred Deity Header */}
            {invoice.brand.showDeity && (
              <View style={styles.deityContainer}>
                {deityDataUrl && <Image src={deityDataUrl} style={styles.deityImage} />}
                <Text style={styles.shlokaText}>{invoice.brand.shloka || '॥ श्री गणेशाय नमः ॥'}</Text>
              </View>
            )}

            {/* Hotel & Invoice Header */}
            <View style={styles.headerRow}>
              <View style={styles.hotelBlock}>
                <Text style={styles.hotelTitle}>{supplier.tradeName}</Text>
                <Text style={styles.hotelSub}>{supplier.legalName}</Text>
                <Text style={styles.hotelSub}>{supplier.address}</Text>
                <Text style={styles.hotelSub}>GSTIN: {supplier.gstin} • State: {supplier.stateCode}</Text>
                <Text style={styles.hotelSub}>Phone: {supplier.phone} {supplier.email ? `• ${supplier.email}` : ''}</Text>
              </View>
              <View style={styles.invoiceMetaBlock}>
                <Text style={styles.invoiceTag}>
                  {invoice.docType === 'credit-note' ? 'CREDIT NOTE' : 'TAX INVOICE'}
                </Text>
                <Text style={styles.invoiceNumber}>{invoice.number}</Text>
                <Text style={styles.invoiceDate}>Date: {invoice.issuedAt.slice(0, 10)}</Text>
                {invoice.status === 'cancelled' ? (
                  <Text style={[styles.statusPill, { backgroundColor: '#FFEBEE', color: '#C62828', borderColor: '#C62828' }]}>
                    CANCELLED
                  </Text>
                ) : (
                  <Text style={styles.statusPill}>
                    {isPaid ? 'PAID & SETTLED' : `BAL DUE: ${formatINR(invoice.balanceDue)}`}
                  </Text>
                )}
              </View>
            </View>

            {/* Guest & Stay Details */}
            <View style={styles.grid2Col}>
              <View style={styles.gridCol}>
                <Text style={styles.sectionLabel}>Billed To (Guest)</Text>
                <Text style={styles.primaryName}>{buyer.name}</Text>
                {buyer.phone && <Text style={styles.hotelSub}>Phone: {buyer.phone}</Text>}
                {buyer.address && <Text style={styles.hotelSub}>Address: {buyer.address}</Text>}
                {buyer.gstin && <Text style={styles.hotelSub}>Buyer GSTIN: {buyer.gstin}</Text>}
              </View>
              <View style={styles.gridCol}>
                <Text style={styles.sectionLabel}>Stay Particulars</Text>
                {stay ? (
                  <>
                    <Text style={styles.primaryName}>Room {stay.roomNo} {stay.roomType ? `(${stay.roomType})` : ''}</Text>
                    <Text style={styles.hotelSub}>
                      Duration: {stay.nights} Night{stay.nights > 1 ? 's' : ''}
                      {stay.checkIn && stay.checkOut ? ` (${stay.checkIn} to ${stay.checkOut})` : ''}
                    </Text>
                    {stay.bookingRef && <Text style={styles.hotelSub}>Booking Ref: {stay.bookingRef}</Text>}
                  </>
                ) : (
                  <Text style={styles.hotelSub}>Hotel Accommodations & Incidental Services</Text>
                )}
                <Text style={styles.hotelSub}>Place of Supply: {supplier.stateCode} (Intra-state)</Text>
              </View>
            </View>

            {/* Line Items Table */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.colDesc}>Description</Text>
                <Text style={styles.colSac}>SAC/HSN</Text>
                <Text style={styles.colQty}>Qty</Text>
                <Text style={styles.colRate}>Taxable (₹)</Text>
                <Text style={styles.colTax}>GST</Text>
                <Text style={styles.colTotal}>Total (₹)</Text>
              </View>
              {lines.map((l) => (
                <View key={l.id} style={styles.tableRow}>
                  <Text style={styles.colDesc}>{l.description}</Text>
                  <Text style={styles.colSac}>{l.sac}</Text>
                  <Text style={styles.colQty}>{l.qty}</Text>
                  <Text style={styles.colRate}>{formatINR(l.taxable, { decimals: true }).replace('₹', '')}</Text>
                  <Text style={styles.colTax}>{(l.taxRateBp / 100).toFixed(0)}%</Text>
                  <Text style={[styles.colTotal, { fontWeight: 'bold' }]}>
                    {formatINR(l.total, { decimals: true }).replace('₹', '')}
                  </Text>
                </View>
              ))}
            </View>

            {/* Totals & Tax Summary */}
            <View style={styles.totalsSection}>
              <View style={styles.inWordsBlock}>
                <Text style={styles.inWordsLabel}>Amount in Words</Text>
                <Text style={styles.inWordsText}>{invoice.amountInWords}</Text>

                <View style={styles.taxSummaryTable}>
                  <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#5B1A1A', marginBottom: 2 }}>
                    Tax Summary Breakdown:
                  </Text>
                  <Text style={{ fontSize: 7, color: '#5A524C' }}>
                    Taxable: {formatINR(totals.taxable)} • CGST: {formatINR(totals.cgst)} • SGST: {formatINR(totals.sgst)}
                    {totals.igst > 0 ? ` • IGST: ${formatINR(totals.igst)}` : ''}
                  </Text>
                </View>
              </View>

              <View style={styles.totalsTable}>
                <View style={totalRowStyle(false)}>
                  <Text>Total Taxable Value:</Text>
                  <Text>{formatINR(totals.taxable)}</Text>
                </View>
                <View style={totalRowStyle(false)}>
                  <Text>CGST Total:</Text>
                  <Text>{formatINR(totals.cgst)}</Text>
                </View>
                <View style={totalRowStyle(false)}>
                  <Text>SGST Total:</Text>
                  <Text>{formatINR(totals.sgst)}</Text>
                </View>
                {totals.roundOff !== 0 && (
                  <View style={totalRowStyle(false)}>
                    <Text>Round Off:</Text>
                    <Text>{formatINR(totals.roundOff)}</Text>
                  </View>
                )}
                <View style={styles.grandTotalBar}>
                  <Text style={styles.grandTotalText}>Grand Total:</Text>
                  <Text style={styles.grandTotalAmount}>{formatINR(totals.grandTotal)}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Footer & Payment QR & Signature */}
          <View>
            <View style={styles.bottomSection}>
              {qrDataUrl && (
                <View style={styles.qrBlock}>
                  <Image src={qrDataUrl} style={styles.qrImage} />
                  <Text style={{ fontSize: 6.5, color: '#5A524C', marginTop: 2 }}>Scan to Pay via UPI</Text>
                </View>
              )}

              <View style={styles.bankBlock}>
                <Text style={{ fontSize: 7.5, fontWeight: 'bold', color: '#5B1A1A', marginBottom: 1 }}>
                  Bank & UPI Transfer:
                </Text>
                {supplier.upiVpa && <Text style={{ fontSize: 7, color: '#2C2520' }}>UPI VPA: {supplier.upiVpa}</Text>}
                {supplier.bank && (
                  <>
                    <Text style={{ fontSize: 7, color: '#2C2520' }}>Bank: {supplier.bank.bankName}</Text>
                    <Text style={{ fontSize: 7, color: '#2C2520' }}>A/C: {supplier.bank.accountNumber} • IFSC: {supplier.bank.ifsc}</Text>
                  </>
                )}
                {supplier.terms.length > 0 && (
                  <Text style={{ fontSize: 6.5, color: '#7A726A', marginTop: 2 }}>
                    Terms: {supplier.terms[0]}
                  </Text>
                )}
              </View>

              <View style={styles.signatoryBlock}>
                {signatureDataUrl ? (
                  <Image src={signatureDataUrl} style={styles.signatoryImage} />
                ) : stampDataUrl ? (
                  <Image src={stampDataUrl} style={styles.signatoryImage} />
                ) : (
                  <View style={{ height: 28 }} />
                )}
                <Text style={styles.signatoryLabel}>Authorized Signatory</Text>
                <Text style={{ fontSize: 6.5, color: '#8C765C' }}>For {supplier.tradeName}</Text>
              </View>
            </View>

            <Text style={styles.footer}>
              Thank you for staying with us! • Computer generated tax invoice
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

function totalRowStyle(_bold: boolean) {
  return styles.totalRow;
}
