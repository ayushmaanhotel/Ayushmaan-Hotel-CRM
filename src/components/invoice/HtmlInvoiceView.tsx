import React from 'react';
import { formatINR } from '../../domain/money';
import { GST_STATE_CODES } from '../../domain/gst/gstin';
import { 
  getThemePalette, 
  type TemplateId, 
  type ThemeColorKey 
} from '../../domain/themeTokens';
import { computeHsnTaxSummary } from '../../services/pdf/taxSummary';
import type { Invoice } from '../../domain/invoice.types';

export interface HtmlInvoiceViewProps {
  invoice: Invoice;
  qrDataUrl?: string;
  deityDataUrl?: string;
  logoDataUrl?: string;
  signatureDataUrl?: string;
  stampDataUrl?: string;
  templateId?: TemplateId;
  colorKey?: ThemeColorKey;
  showDeity?: boolean;
  showHsnTable?: boolean;
  showQr?: boolean;
  showStamp?: boolean;
}

export const HtmlInvoiceView: React.FC<HtmlInvoiceViewProps> = ({
  invoice,
  qrDataUrl,
  deityDataUrl,
  logoDataUrl,
  signatureDataUrl,
  stampDataUrl,
  templateId = 'advanced-gst',
  colorKey = 'sapphire',
  showDeity = true,
  showHsnTable = true,
  showQr = true,
  showStamp = true,
}) => {
  const { supplier, buyer, stay, lines, totals, payments } = invoice;
  const isThermal = templateId === 'thermal-80mm';
  const palette = getThemePalette(colorKey);

  // Derive Place of Supply (POS) and State info
  const buyerStateCode = buyer.gstin ? buyer.gstin.slice(0, 2) : supplier.stateCode || '08';
  const buyerStateName = GST_STATE_CODES[buyerStateCode] || 'Rajasthan';
  const supplierStateName = GST_STATE_CODES[supplier.stateCode] || 'Rajasthan';

  // Compute official statutory 8-column HSN tax matrix
  const hsnReport = computeHsnTaxSummary(lines);

  // ==========================================
  // FORMAT 1: THERMAL 80MM POS RECEIPT SLIP
  // ==========================================
  if (isThermal) {
    return (
      <div
        id="invoice-document"
        className="w-[320px] mx-auto p-4 bg-white text-black font-mono text-[11px] leading-tight select-none border border-zinc-300 shadow-sm print:m-0 print:border-0 print:w-full print:shadow-none"
      >
        {/* Merchant Header */}
        <div className="text-center pb-2 border-b border-dashed border-black space-y-0.5">
          <div className="font-bold text-sm tracking-wide uppercase">
            {supplier.tradeName || supplier.legalName}
          </div>
          <div className="text-[10px]">{supplier.address}</div>
          <div className="text-[10px]">
            GSTIN: <b>{supplier.gstin}</b>
          </div>
          <div className="text-[10px]">Ph: {supplier.phone}</div>
        </div>

        {/* Bill Meta */}
        <div className="py-2 border-b border-dashed border-black space-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span>Bill No: <b>{invoice.number}</b></span>
            <span>Date: {invoice.issuedAt.slice(0, 10)}</span>
          </div>
          <div>Guest: <b>{buyer.name}</b> {buyer.phone ? `(${buyer.phone})` : ''}</div>
          {stay && (
            <div>Room: {stay.roomNo} ({stay.roomType || 'Standard'}) • {stay.nights}N</div>
          )}
          {buyer.gstin && <div>Guest GSTIN: <b>{buyer.gstin}</b></div>}
        </div>

        {/* Line Items Table */}
        <div className="py-2 border-b border-dashed border-black">
          <div className="grid grid-cols-12 font-bold mb-1 border-b border-black pb-0.5 text-[10px]">
            <span className="col-span-6">Item</span>
            <span className="col-span-2 text-right">Qty</span>
            <span className="col-span-4 text-right">Amt (₹)</span>
          </div>
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-12 py-0.5 text-[10px]">
              <span className="col-span-6 truncate">{line.description}</span>
              <span className="col-span-2 text-right">{line.qty}</span>
              <span className="col-span-4 text-right font-bold">
                {(line.total / 100).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Totals Summary */}
        <div className="py-2 border-b border-dashed border-black space-y-1 text-right text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal (Taxable):</span>
            <span>{formatINR(totals.taxable)}</span>
          </div>
          {totals.cgst > 0 && (
            <div className="flex justify-between">
              <span>CGST:</span>
              <span>{formatINR(totals.cgst)}</span>
            </div>
          )}
          {totals.sgst > 0 && (
            <div className="flex justify-between">
              <span>SGST:</span>
              <span>{formatINR(totals.sgst)}</span>
            </div>
          )}
          {totals.igst > 0 && (
            <div className="flex justify-between">
              <span>IGST:</span>
              <span>{formatINR(totals.igst)}</span>
            </div>
          )}
          {totals.roundOff !== 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>Round Off:</span>
              <span>{formatINR(totals.roundOff)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
            <span>TOTAL AMOUNT:</span>
            <span>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>

        {/* Scannable Dynamic UPI QR */}
        {showQr && qrDataUrl && (
          <div className="py-2 text-center border-b border-dashed border-black">
            <img src={qrDataUrl} alt="UPI QR" className="w-24 h-24 mx-auto" />
            <div className="text-[9px] mt-1 font-semibold">Scan to Pay via UPI</div>
          </div>
        )}

        {/* Thermal Footer */}
        <div className="text-center pt-2 text-[9px] space-y-0.5">
          <div>Thank you for staying with us!</div>
          <div className="text-[8px] text-zinc-500">Ayushmaan Invoice • 100% Offline POS</div>
        </div>
      </div>
    );
  }

  // ========================================================
  // FORMAT 2: ADVANCED GST (TALLY / BILLBOOK STATUTORY A4)
  // ========================================================
  if (templateId === 'advanced-gst') {
    return (
      <div
        id="invoice-document"
        className="w-full max-w-[800px] min-h-[1050px] mx-auto bg-white text-zinc-950 font-sans p-6 sm:p-8 select-none border-2 shadow-2xl relative print:p-0 print:shadow-none print:border print:m-0"
        style={{ borderColor: palette.primary }}
      >
        {/* Document Top Header Banner */}
        <div 
          className="text-center py-2 px-4 border-b-2 font-bold text-xs uppercase tracking-wider flex items-center justify-between"
          style={{ backgroundColor: palette.primaryLight, borderColor: palette.primary, color: palette.primary }}
        >
          <span className="text-[10px] font-mono tracking-widest">FORM GST INV-1</span>
          <span className="text-sm font-bold">
            {invoice.docType === 'credit-note' ? 'CREDIT NOTE / कर जमा पत्र' : 'TAX INVOICE / कर बीजक'}
          </span>
          <span className="text-[10px] font-mono tracking-widest">ORIGINAL FOR RECIPIENT</span>
        </div>

        {/* Hotel / Supplier Details Section */}
        <div className="p-4 border-b grid grid-cols-1 sm:grid-cols-12 gap-4 items-center" style={{ borderColor: palette.border }}>
          <div className="sm:col-span-8 flex items-start gap-3">
            {logoDataUrl ? (
              <img src={logoDataUrl} alt="Hotel Logo" className="w-14 h-14 object-contain rounded-lg border p-1" style={{ borderColor: palette.border }} />
            ) : (
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl text-white shrink-0 shadow-sm"
                style={{ backgroundColor: palette.primary }}
              >
                {(supplier.tradeName || supplier.legalName).slice(0, 1)}
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold uppercase tracking-tight" style={{ color: palette.primaryDark }}>
                {supplier.tradeName || supplier.legalName}
              </h1>
              <div className="text-xs text-zinc-600 font-medium">{supplier.address}</div>
              <div className="text-xs text-zinc-700 flex flex-wrap gap-x-3 gap-y-0.5 pt-0.5">
                <span>GSTIN: <b className="font-mono text-zinc-900">{supplier.gstin}</b></span>
                <span>State: <b>{supplierStateName} ({supplier.stateCode})</b></span>
                {supplier.pan && <span>PAN: <b className="font-mono">{supplier.pan}</b></span>}
              </div>
              <div className="text-[11px] text-zinc-500">
                Ph: <b className="text-zinc-800">{supplier.phone}</b> {supplier.email ? `• ${supplier.email}` : ''}
              </div>
            </div>
          </div>

          <div className="sm:col-span-4 bg-zinc-50 p-3 rounded-xl border text-right space-y-1" style={{ borderColor: palette.border }}>
            <div className="text-[10px] font-bold uppercase text-zinc-400">Invoice Number:</div>
            <div className="text-sm font-bold font-mono" style={{ color: palette.primary }}>
              {invoice.number}
            </div>
            <div className="text-[11px] text-zinc-600">
              Dated: <b className="text-zinc-900">{invoice.issuedAt.slice(0, 10)}</b>
            </div>
            <div className="text-[10px] text-zinc-500">
              Place of Supply: <b className="text-zinc-800">{buyerStateCode}-{buyerStateName}</b>
            </div>
            <div className="text-[10px] text-zinc-500">
              Reverse Charge: <b className="text-zinc-800">NO</b>
            </div>
          </div>
        </div>

        {/* Dual Party & Stay Details Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 border-b divide-y sm:divide-y-0 sm:divide-x text-xs" style={{ borderColor: palette.border }}>
          {/* Left: Details of Receiver / Billed To */}
          <div className="p-3.5 space-y-1 bg-zinc-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.primary }}>
              Details of Receiver / Billed To (अतिथि का विवरण):
            </span>
            <div className="font-bold text-sm text-zinc-900">{buyer.name}</div>
            {buyer.phone && <div className="text-zinc-600 font-mono">Mobile: {buyer.phone}</div>}
            {buyer.address && <div className="text-zinc-600">{buyer.address}</div>}
            {buyer.gstin ? (
              <div className="text-indigo-900 font-mono font-semibold pt-0.5">
                B2B GSTIN: <span className="bg-indigo-100 px-1 py-0.5 rounded text-indigo-800">{buyer.gstin}</span>
              </div>
            ) : (
              <div className="text-[10px] text-zinc-500 italic">B2C Customer / Consumer</div>
            )}
            <div className="text-zinc-600 text-[11px]">
              State: <b>{buyerStateName} (Code {buyerStateCode})</b>
            </div>
          </div>

          {/* Right: Stay & Booking Details */}
          <div className="p-3.5 space-y-1 bg-zinc-50/50">
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.primary }}>
              Hospitality Stay Details (ठहरने का विवरण):
            </span>
            {stay ? (
              <>
                <div className="font-bold text-zinc-900">
                  Room No: <span className="font-mono text-indigo-700">{stay.roomNo}</span>
                  <span className="font-normal text-zinc-600 ml-1">({stay.roomType || 'Standard Room'})</span>
                </div>
                <div className="text-zinc-600">
                  Stay Duration: <b className="text-zinc-800">{stay.nights} Night(s)</b>
                </div>
                <div className="text-[11px] text-zinc-500">
                  SAC Code: <b className="font-mono text-zinc-800">996311</b> (Hotel Accommodation Services)
                </div>
                {stay.bookingRef && (
                  <div className="text-[11px] text-zinc-600 font-mono">
                    Booking ID: {stay.bookingRef}
                  </div>
                )}
              </>
            ) : (
              <div className="text-zinc-500 italic text-[11px]">Direct Walk-in / Counter Settlement</div>
            )}
            <div className="text-[10px] text-zinc-500 pt-0.5">
              Tariff Mode: <b>{invoice.priceMode === 'inclusive' ? 'GST Inclusive' : 'GST Exclusive'}</b>
            </div>
          </div>
        </div>

        {/* 8-Column Line Items Table */}
        <div className="border-b" style={{ borderColor: palette.border }}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr 
                style={{ backgroundColor: palette.tableHeaderBg, borderBottom: `2px solid ${palette.border}` }}
                className="font-bold text-zinc-800"
              >
                <th className="py-2 px-2.5 text-center w-8">#</th>
                <th className="py-2 px-2.5">Description of Goods / Services</th>
                <th className="py-2 px-2 text-center w-20 font-mono">HSN/SAC</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-2 text-right w-20">Rate (₹)</th>
                <th className="py-2 px-2.5 text-right w-24">Taxable (₹)</th>
                <th className="py-2 px-2 text-center w-16">GST %</th>
                <th className="py-2 px-3 text-right w-24">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {lines.map((line, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/40'}>
                  <td className="py-2 px-2.5 text-center text-zinc-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-2.5 font-semibold text-zinc-900">{line.description}</td>
                  <td className="py-2 px-2 text-center font-mono text-zinc-600">{line.sac}</td>
                  <td className="py-2 px-2 text-center font-mono">{line.qty}</td>
                  <td className="py-2 px-2 text-right font-mono text-zinc-700">{(line.unitPrice / 100).toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right font-mono font-medium">{(line.taxable / 100).toFixed(2)}</td>
                  <td className="py-2 px-2 text-center font-mono font-semibold" style={{ color: palette.primary }}>
                    {(line.taxRateBp / 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 text-right font-bold font-mono text-zinc-950">
                    {(line.total / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CBIC 2025 Statutory 8-Column HSN Tax Matrix Table */}
        {showHsnTable && (
          <div className="p-3 border-b bg-zinc-50/60" style={{ borderColor: palette.border }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: palette.primary }}>
              CBIC Statutory Tax Summary Matrix (कर विभाजन विवरण):
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse border border-zinc-300">
                <thead>
                  <tr className="bg-zinc-200/70 font-bold text-zinc-800 text-center border-b border-zinc-300">
                    <th className="py-1 px-1.5 border-r border-zinc-300" rowSpan={2}>HSN/SAC</th>
                    <th className="py-1 px-1.5 border-r border-zinc-300 text-right" rowSpan={2}>Taxable Amt (₹)</th>
                    <th className="py-0.5 px-1 border-r border-zinc-300" colSpan={2}>Central Tax (CGST)</th>
                    <th className="py-0.5 px-1 border-r border-zinc-300" colSpan={2}>State Tax (SGST)</th>
                    <th className="py-1 px-1.5 text-right" rowSpan={2}>Total Tax (₹)</th>
                  </tr>
                  <tr className="bg-zinc-200/50 text-[10px] font-semibold text-zinc-700 text-center border-b border-zinc-300">
                    <th className="py-0.5 px-1 border-r border-zinc-300 w-12">Rate</th>
                    <th className="py-0.5 px-1.5 border-r border-zinc-300 text-right">Amt (₹)</th>
                    <th className="py-0.5 px-1 border-r border-zinc-300 w-12">Rate</th>
                    <th className="py-0.5 px-1.5 border-r border-zinc-300 text-right">Amt (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {hsnReport.rows.map((row, idx) => (
                    <tr key={idx} className="text-right font-mono">
                      <td className="py-1 px-1.5 border-r border-zinc-200 text-center font-semibold">{row.sac}</td>
                      <td className="py-1 px-1.5 border-r border-zinc-200">{(row.taxable / 100).toFixed(2)}</td>
                      <td className="py-1 px-1 border-r border-zinc-200 text-center">{(row.cgstRateBp / 100).toFixed(1)}%</td>
                      <td className="py-1 px-1.5 border-r border-zinc-200">{(row.cgst / 100).toFixed(2)}</td>
                      <td className="py-1 px-1 border-r border-zinc-200 text-center">{(row.sgstRateBp / 100).toFixed(1)}%</td>
                      <td className="py-1 px-1.5 border-r border-zinc-200">{(row.sgst / 100).toFixed(2)}</td>
                      <td className="py-1 px-1.5 font-bold">{(row.totalTax / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-100 font-bold font-mono text-right border-t border-zinc-300">
                    <td className="py-1 px-1.5 border-r border-zinc-300 text-center">Total</td>
                    <td className="py-1 px-1.5 border-r border-zinc-300">{(hsnReport.totalTaxable / 100).toFixed(2)}</td>
                    <td className="py-1 px-1 border-r border-zinc-300"></td>
                    <td className="py-1 px-1.5 border-r border-zinc-300">{(hsnReport.totalCgst / 100).toFixed(2)}</td>
                    <td className="py-1 px-1 border-r border-zinc-300"></td>
                    <td className="py-1 px-1.5 border-r border-zinc-300">{(hsnReport.totalSgst / 100).toFixed(2)}</td>
                    <td className="py-1 px-1.5" style={{ color: palette.primary }}>{(hsnReport.totalTax / 100).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-[10px] text-zinc-600 mt-1">
              Tax Amount in Words: <b className="text-zinc-800">{hsnReport.taxAmountInWords}</b>
            </div>
          </div>
        )}

        {/* Bank & Settlement Details + Grand Total Section */}
        <div className="grid grid-cols-1 sm:grid-cols-12 border-b text-xs" style={{ borderColor: palette.border }}>
          {/* Left: Bank Account, UPI QR & Amount in Words */}
          <div className="sm:col-span-7 p-4 border-b sm:border-b-0 sm:border-r space-y-3" style={{ borderColor: palette.border }}>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Amount in Words:</span>
              <div className="font-semibold text-zinc-900 text-xs leading-snug">
                {invoice.amountInWords}
              </div>
            </div>

            {/* Bank & UPI QR Grid */}
            <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border" style={{ borderColor: palette.border }}>
              {showQr && qrDataUrl && (
                <div className="shrink-0 text-center">
                  <img src={qrDataUrl} alt="UPI QR" className="w-20 h-20 bg-white p-1 rounded-lg border border-zinc-200" />
                  <span className="text-[8px] font-bold text-zinc-500 block mt-0.5">Scan to Pay UPI</span>
                </div>
              )}
              <div className="space-y-0.5 text-[11px] text-zinc-600">
                <div className="font-bold text-zinc-900">Bank & Settlement Details:</div>
                <div>UPI VPA: <b className="font-mono text-zinc-900">{supplier.upiVpa || 'merchant@upi'}</b></div>
                {supplier.bank && supplier.bank.accountNumber && (
                  <>
                    <div>Bank: <b>{supplier.bank.bankName}</b></div>
                    <div>A/C: <b className="font-mono text-zinc-900">{supplier.bank.accountNumber}</b></div>
                    <div>IFSC: <b className="font-mono text-zinc-900">{supplier.bank.ifsc}</b></div>
                  </>
                )}
                {payments.length > 0 && (
                  <div className="text-emerald-700 font-semibold pt-0.5">
                    Mode: {payments.map((p) => `${p.mode} (${formatINR(p.amount)})`).join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Totals Calculation Summary */}
          <div className="sm:col-span-5 p-4 bg-zinc-50/70 space-y-2 text-xs">
            <div className="flex justify-between text-zinc-600">
              <span>Taxable Value (कर योग्य मूल्य):</span>
              <span className="font-mono font-medium">{formatINR(totals.taxable)}</span>
            </div>
            {totals.cgst > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>Central Tax (CGST):</span>
                <span className="font-mono font-medium">{formatINR(totals.cgst)}</span>
              </div>
            )}
            {totals.sgst > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>State Tax (SGST):</span>
                <span className="font-mono font-medium">{formatINR(totals.sgst)}</span>
              </div>
            )}
            {totals.igst > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>Integrated Tax (IGST):</span>
                <span className="font-mono font-medium">{formatINR(totals.igst)}</span>
              </div>
            )}
            {totals.roundOff !== 0 && (
              <div className="flex justify-between text-zinc-500 text-[11px]">
                <span>Round Off:</span>
                <span className="font-mono">{formatINR(totals.roundOff)}</span>
              </div>
            )}
            <div 
              className="flex justify-between text-base font-bold pt-2 border-t text-zinc-950"
              style={{ borderColor: palette.primary }}
            >
              <span>Grand Total (कुल राशि):</span>
              <span className="font-mono" style={{ color: palette.primary }}>
                {formatINR(totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms, Statutory Declaration & Authorized Signatory */}
        <div className="p-4 flex flex-col sm:flex-row justify-between items-end gap-4 text-[10px] text-zinc-500">
          <div className="space-y-1 max-w-sm">
            <div className="font-bold text-zinc-700 uppercase">Terms & Conditions:</div>
            <div>1. Standard Check-out time is 11:00 AM. ID proof required at check-in.</div>
            <div>2. Goods / hospitality services once consumed will not be refunded.</div>
            <div className="text-[9px] text-zinc-400 italic pt-1">
              "We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct."
            </div>
          </div>

          <div className="text-center sm:text-right space-y-1 relative">
            <div className="flex items-center justify-center sm:justify-end gap-2 h-12">
              {showStamp && stampDataUrl && (
                <img src={stampDataUrl} alt="Stamp" className="h-12 object-contain opacity-85 rotate-[-5deg]" />
              )}
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Signature" className="h-10 object-contain" />
              ) : (
                <div className="h-8" />
              )}
            </div>
            <div className="font-bold text-zinc-900">For {supplier.tradeName || supplier.legalName}</div>
            <div className="text-[9px] text-zinc-400">Authorised Signatory / Manager</div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // FORMAT 3: ROYAL HERITAGE (LUXURY HOTEL & RESORT ARCH)
  // ========================================================
  if (templateId === 'royal-heritage') {
    return (
      <div
        id="invoice-document"
        className="w-full max-w-[800px] min-h-[1050px] mx-auto bg-[#FFFDF8] text-zinc-950 font-serif p-6 sm:p-8 select-none border-2 shadow-2xl relative print:p-0 print:shadow-none print:border print:m-0"
        style={{ borderColor: palette.primary }}
      >
        {/* Sacred Arch & Shloka Header */}
        {showDeity && (
          <div className="text-center pb-3 mb-4 border-b-2" style={{ borderColor: palette.border }}>
            <div className="flex items-center justify-center gap-3">
              {deityDataUrl ? (
                <img src={deityDataUrl} alt="Sacred Deity" className="w-12 h-12 object-contain" />
              ) : (
                <span className="text-2xl">🪔</span>
              )}
              <div>
                <div className="text-base font-bold tracking-widest font-serif" style={{ color: palette.primary }}>
                  ॥ श्री गणेशाय नमः ॥
                </div>
                <div className="text-[11px] font-serif tracking-wide" style={{ color: palette.accent }}>
                  अतिथि देवो भव • Atithi Devo Bhava
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hotel Brand Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b" style={{ borderColor: palette.border }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: palette.primaryLight, color: palette.primary }}>
                Heritage Hospitality
              </span>
              <span className="text-xs font-mono font-bold text-zinc-600">GSTIN: {supplier.gstin}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight uppercase" style={{ color: palette.primaryDark }}>
              {supplier.tradeName || supplier.legalName}
            </h1>
            <div className="text-xs text-zinc-700 font-sans">{supplier.address}</div>
            <div className="text-xs text-zinc-600 font-sans">
              Phone: <b>{supplier.phone}</b> {supplier.email ? `• ${supplier.email}` : ''}
            </div>
          </div>

          <div className="sm:text-right bg-white p-3 rounded-xl border min-w-[200px]" style={{ borderColor: palette.border }}>
            <div className="text-xs font-bold uppercase tracking-wider" style={{ color: palette.primary }}>
              {invoice.docType === 'credit-note' ? 'CREDIT NOTE / कर जमा पत्र' : 'TAX INVOICE / कर बीजक'}
            </div>
            <div className="text-base font-bold font-mono mt-0.5" style={{ color: palette.primaryDark }}>
              {invoice.number}
            </div>
            <div className="text-[11px] text-zinc-600 font-sans mt-0.5">
              Date: <b className="text-zinc-900">{invoice.issuedAt.slice(0, 10)}</b>
            </div>
            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              ✓ CBIC GST COMPLIANT
            </div>
          </div>
        </div>

        {/* Guest & Luxury Stay Ledger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b font-sans text-xs" style={{ borderColor: palette.border }}>
          <div className="p-3.5 bg-white rounded-xl border space-y-1" style={{ borderColor: palette.border }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.primary }}>
              Billed To (अतिथि का विवरण):
            </span>
            <div className="font-bold text-sm text-zinc-900 font-serif">{buyer.name}</div>
            {buyer.phone && <div className="text-zinc-600 font-mono">Mobile: {buyer.phone}</div>}
            {buyer.gstin && (
              <div className="text-indigo-800 font-mono font-semibold">
                GSTIN: {buyer.gstin}
              </div>
            )}
            <div className="text-zinc-600 text-[11px]">
              State: <b>{buyerStateName} ({buyerStateCode})</b>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border space-y-1" style={{ borderColor: palette.border }}>
            <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.primary }}>
              Hospitality Stay Details (ठहरने का विवरण):
            </span>
            {stay && (
              <>
                <div className="font-bold text-zinc-900">
                  Room {stay.roomNo} <span className="font-normal text-zinc-600">({stay.roomType || 'Standard Room'})</span>
                </div>
                <div className="text-zinc-600">
                  Duration: <b className="text-zinc-800">{stay.nights} Night(s)</b>
                </div>
                <div className="text-[11px] text-zinc-500">
                  SAC Code: <b className="font-mono text-zinc-800">996311</b> (Hotel Accommodation Services)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-3 font-sans">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr 
                style={{ backgroundColor: palette.tableHeaderBg, borderBottom: `2px solid ${palette.border}` }}
                className="font-bold text-zinc-800"
              >
                <th className="py-2 px-2.5 text-center w-8">#</th>
                <th className="py-2 px-2.5">Item Description</th>
                <th className="py-2 px-2 text-center w-20 font-mono">SAC</th>
                <th className="py-2 px-2 text-center w-12">Qty</th>
                <th className="py-2 px-2 text-right w-20">Rate (₹)</th>
                <th className="py-2 px-2.5 text-right w-24">Taxable (₹)</th>
                <th className="py-2 px-2 text-center w-16">GST %</th>
                <th className="py-2 px-3 text-right w-24">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-2.5 text-center text-zinc-500 font-mono">{idx + 1}</td>
                  <td className="py-2 px-2.5 font-semibold text-zinc-900">{line.description}</td>
                  <td className="py-2 px-2 text-center font-mono text-zinc-600">{line.sac}</td>
                  <td className="py-2 px-2 text-center font-mono">{line.qty}</td>
                  <td className="py-2 px-2 text-right font-mono text-zinc-700">{(line.unitPrice / 100).toFixed(2)}</td>
                  <td className="py-2 px-2.5 text-right font-mono font-medium">{(line.taxable / 100).toFixed(2)}</td>
                  <td className="py-2 px-2 text-center font-mono font-semibold" style={{ color: palette.primary }}>
                    {(line.taxRateBp / 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 text-right font-bold font-mono text-zinc-950">
                    {(line.total / 100).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CBIC HSN Table in Heritage */}
        {showHsnTable && (
          <div className="p-3 border-y bg-amber-50/40 font-sans" style={{ borderColor: palette.border }}>
            <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: palette.primary }}>
              Statutory Tax Matrix:
            </div>
            <table className="w-full text-[11px] text-right font-mono border-collapse">
              <thead>
                <tr className="border-b border-zinc-300 font-bold text-zinc-700">
                  <th className="text-center py-1">SAC</th>
                  <th className="py-1">Taxable</th>
                  <th className="text-center py-1">CGST %</th>
                  <th className="py-1">CGST (₹)</th>
                  <th className="text-center py-1">SGST %</th>
                  <th className="py-1">SGST (₹)</th>
                  <th className="py-1">Total Tax (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {hsnReport.rows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-center py-1 font-semibold">{row.sac}</td>
                    <td className="py-1">{(row.taxable / 100).toFixed(2)}</td>
                    <td className="text-center py-1">{(row.cgstRateBp / 100).toFixed(1)}%</td>
                    <td className="py-1">{(row.cgst / 100).toFixed(2)}</td>
                    <td className="text-center py-1">{(row.sgstRateBp / 100).toFixed(1)}%</td>
                    <td className="py-1">{(row.sgst / 100).toFixed(2)}</td>
                    <td className="py-1 font-bold">{(row.totalTax / 100).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Heritage Totals & Bank Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 font-sans text-xs">
          <div className="sm:col-span-7 space-y-3">
            <div className="p-3 bg-white rounded-xl border" style={{ borderColor: palette.border }}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Total Amount in Words:</span>
              <div className="font-semibold text-zinc-900 text-[11px] mt-0.5">
                {invoice.amountInWords}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border" style={{ borderColor: palette.border }}>
              {showQr && qrDataUrl && (
                <div className="shrink-0 text-center">
                  <img src={qrDataUrl} alt="UPI QR" className="w-20 h-20 bg-white p-1 rounded-lg border border-zinc-200" />
                  <span className="text-[8px] font-bold text-zinc-500 block mt-0.5">Scan to Pay UPI</span>
                </div>
              )}
              <div className="space-y-0.5 text-[11px] text-zinc-600">
                <div className="font-bold text-zinc-900">Hotel Settlement Details:</div>
                <div>UPI VPA: <b className="font-mono text-zinc-900">{supplier.upiVpa || 'merchant@upi'}</b></div>
                {supplier.bank && supplier.bank.accountNumber && (
                  <>
                    <div>Bank: <b>{supplier.bank.bankName}</b></div>
                    <div>A/C: <b className="font-mono text-zinc-900">{supplier.bank.accountNumber}</b> • IFSC: <b className="font-mono">{supplier.bank.ifsc}</b></div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="sm:col-span-5 bg-white p-4 rounded-xl border space-y-2" style={{ borderColor: palette.border }}>
            <div className="flex justify-between text-zinc-600">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatINR(totals.taxable)}</span>
            </div>
            {totals.cgst > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>CGST:</span>
                <span className="font-mono">{formatINR(totals.cgst)}</span>
              </div>
            )}
            {totals.sgst > 0 && (
              <div className="flex justify-between text-zinc-600">
                <span>SGST:</span>
                <span className="font-mono">{formatINR(totals.sgst)}</span>
              </div>
            )}
            <div 
              className="flex justify-between text-base font-bold pt-2 border-t text-zinc-950 font-serif"
              style={{ borderColor: palette.primary }}
            >
              <span>Grand Total:</span>
              <span className="font-mono" style={{ color: palette.primary }}>
                {formatINR(totals.grandTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Heritage Footer */}
        <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-end gap-4 text-[10px] text-zinc-500 font-sans" style={{ borderColor: palette.border }}>
          <div className="space-y-0.5 max-w-sm">
            <div className="font-bold text-zinc-700 uppercase">Terms of Hospitality:</div>
            <div>Standard Check-out time: 11:00 AM. Government ID required at check-in.</div>
          </div>
          <div className="text-center sm:text-right space-y-1">
            <div className="flex items-center justify-center sm:justify-end gap-2 h-12">
              {showStamp && stampDataUrl && (
                <img src={stampDataUrl} alt="Stamp" className="h-12 object-contain opacity-85 rotate-[-5deg]" />
              )}
              {signatureDataUrl ? (
                <img src={signatureDataUrl} alt="Signature" className="h-10 object-contain" />
              ) : (
                <div className="h-8" />
              )}
            </div>
            <div className="font-bold text-zinc-900 font-serif">For {supplier.tradeName || supplier.legalName}</div>
            <div className="text-[9px] text-zinc-400">Authorized Signatory / Manager</div>
          </div>
        </div>
      </div>
    );
  }

  // ========================================================
  // FORMAT 4: STYLISH MODERN (BOUTIQUE CONTEMPORARY)
  // ========================================================
  return (
    <div
      id="invoice-document"
      className="w-full max-w-[800px] min-h-[1050px] mx-auto bg-white text-zinc-950 font-sans p-6 sm:p-8 select-none border shadow-2xl relative print:p-0 print:shadow-none print:border print:m-0"
      style={{ borderColor: palette.border }}
    >
      {/* Full-bleed Bold Color Header Banner */}
      <div 
        className="p-6 rounded-2xl text-white mb-6 flex flex-col sm:flex-row justify-between items-start gap-4 shadow-lg"
        style={{ backgroundColor: palette.primary }}
      >
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-widest font-bold opacity-80">
            {invoice.docType === 'credit-note' ? 'CREDIT NOTE' : 'TAX INVOICE'}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{supplier.tradeName || supplier.legalName}</h1>
          <div className="text-xs opacity-90">{supplier.address}</div>
          <div className="text-xs opacity-90 font-mono">GSTIN: {supplier.gstin} | Ph: {supplier.phone}</div>
        </div>

        <div className="sm:text-right bg-white/10 p-3 rounded-xl border border-white/20 backdrop-blur-sm min-w-[180px]">
          <div className="text-[10px] uppercase font-bold tracking-wider opacity-80">Bill Number</div>
          <div className="text-base font-bold font-mono">{invoice.number}</div>
          <div className="text-xs opacity-90 mt-0.5">Date: {invoice.issuedAt.slice(0, 10)}</div>
        </div>
      </div>

      {/* Guest & Stay Details */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b text-xs" style={{ borderColor: palette.border }}>
        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.primary }}>
            Billed To / Guest Details:
          </span>
          <div className="font-bold text-sm text-zinc-900">{buyer.name}</div>
          {buyer.phone && <div className="text-zinc-600 font-mono">Phone: {buyer.phone}</div>}
          {buyer.gstin && <div className="text-indigo-800 font-mono font-semibold">B2B GSTIN: {buyer.gstin}</div>}
        </div>

        <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: palette.primary }}>
            Stay Details:
          </span>
          {stay && (
            <>
              <div className="font-bold text-zinc-900">
                Room {stay.roomNo} <span className="font-normal text-zinc-600">({stay.roomType || 'Standard'})</span>
              </div>
              <div className="text-zinc-600">Duration: <b>{stay.nights} Night(s)</b></div>
            </>
          )}
        </div>
      </div>

      {/* Modern Table */}
      <div className="py-4">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr style={{ backgroundColor: palette.tableHeaderBg }} className="font-bold text-zinc-800 border-y border-zinc-200">
              <th className="py-2.5 px-3">#</th>
              <th className="py-2.5 px-3">Item Description</th>
              <th className="py-2.5 px-3 text-center font-mono">SAC</th>
              <th className="py-2.5 px-3 text-center">Qty</th>
              <th className="py-2.5 px-3 text-right">Rate (₹)</th>
              <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
              <th className="py-2.5 px-3 text-center">GST %</th>
              <th className="py-2.5 px-3 text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-zinc-50/50">
                <td className="py-2.5 px-3 text-zinc-500">{idx + 1}</td>
                <td className="py-2.5 px-3 font-semibold text-zinc-900">{line.description}</td>
                <td className="py-2.5 px-3 text-center font-mono text-zinc-600">{line.sac}</td>
                <td className="py-2.5 px-3 text-center font-medium">{line.qty}</td>
                <td className="py-2.5 px-3 text-right font-mono">{(line.unitPrice / 100).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-right font-mono">{(line.taxable / 100).toFixed(2)}</td>
                <td className="py-2.5 px-3 text-center font-mono font-bold" style={{ color: palette.primary }}>
                  {(line.taxRateBp / 100).toFixed(0)}%
                </td>
                <td className="py-2.5 px-3 text-right font-bold font-mono text-zinc-900">
                  {(line.total / 100).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Summary & Payment */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 py-4 border-t border-zinc-200 text-xs">
        <div className="sm:col-span-7 space-y-3">
          <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">Amount in Words:</span>
            <div className="font-semibold text-zinc-900 text-xs mt-0.5">{invoice.amountInWords}</div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
            {showQr && qrDataUrl && (
              <div className="shrink-0 text-center">
                <img src={qrDataUrl} alt="UPI QR" className="w-16 h-16 bg-white p-1 rounded-lg border" />
              </div>
            )}
            <div className="space-y-0.5 text-[11px] text-zinc-600">
              <div className="font-bold text-zinc-900">Pay via UPI: <span className="font-mono">{supplier.upiVpa || 'hotel@upi'}</span></div>
              {supplier.bank && (
                <div>Bank: {supplier.bank.bankName} | A/C: {supplier.bank.accountNumber} | IFSC: {supplier.bank.ifsc}</div>
              )}
            </div>
          </div>
        </div>

        <div className="sm:col-span-5 bg-zinc-50 p-4 rounded-xl border border-zinc-200 space-y-2 text-xs">
          <div className="flex justify-between text-zinc-600">
            <span>Subtotal (Taxable):</span>
            <span className="font-mono">{formatINR(totals.taxable)}</span>
          </div>
          {totals.cgst > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>CGST:</span>
              <span className="font-mono">{formatINR(totals.cgst)}</span>
            </div>
          )}
          {totals.sgst > 0 && (
            <div className="flex justify-between text-zinc-600">
              <span>SGST:</span>
              <span className="font-mono">{formatINR(totals.sgst)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t text-zinc-950" style={{ borderColor: palette.primary }}>
            <span>Total Payable:</span>
            <span className="font-mono" style={{ color: palette.primary }}>{formatINR(totals.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Modern Footer */}
      <div className="pt-4 border-t border-zinc-200 flex justify-between items-end text-[10px] text-zinc-500">
        <div>Thank you for choosing {supplier.tradeName || supplier.legalName}!</div>
        <div className="text-right">
          <div className="font-bold text-zinc-900">For {supplier.tradeName || supplier.legalName}</div>
          <div className="text-[9px] text-zinc-400">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};
