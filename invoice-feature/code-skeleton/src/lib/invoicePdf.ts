/**
 * Ayushmaan OS v2 — Premium invoice PDF renderer (VECTOR, on-device, offline)
 * Drop into: src/lib/invoicePdf.ts
 *
 * Engine choice: pdfmake (client-side). Produces true vector PDF: razor-sharp
 * at any zoom, selectable/searchable text, tiny files (~60–120 KB), print-safe.
 * NEVER use html2canvas+jsPDF here — that rasterises the invoice into a blurry
 * screenshot, which is exactly what "premium quality" must avoid.
 *
 * Install:  npm i pdfmake
 * Fonts:    run scripts/build-fonts.mjs once (see README) so the ₹ glyph and
 *           the Devanagari blessing line render. Do NOT rely on pdfmake's
 *           bundled Roboto for ₹ / Devanagari.
 */
import pdfMake from 'pdfmake/build/pdfmake';
import './setupFonts';                                    // registers vfs + fonts
import type { TDocumentDefinitions, Content, StyleDictionary } from 'pdfmake/interfaces';
import type { Invoice, HotelInvoiceConfig } from '../types/invoice';
import type { HotelConfig } from '../types/hotel';
import { formatINR, upiUri } from './invoiceEngine';

export type InvoicePdfConfig = HotelConfig & HotelInvoiceConfig;

/* Brand tokens — keep in sync with the HTML preview template */
const C = {
  ink: '#1C1917', muted: '#6F6759', hair: '#E6DCC6',
  maroon: '#7A1F2B', maroonDark: '#5D1620',
  gold: '#B98A2F', goldSoft: '#D9BD7F', goldPale: '#F3EAD6',
  ivory: '#FFFDF8', slab: '#FBF7EE',
};

export function invoiceDocumentDefinition(
  inv: Invoice,
  cfg: InvoicePdfConfig
): TDocumentDefinitions {
  const t = inv.totals;
  const intra = inv.supplyType === 'INTRA';

  /* ---------- header: blessing line + deity artwork + identity ---------- */
  const header: Content[] = [];
  if (cfg.blessingLine) header.push({ text: cfg.blessingLine, style: 'blessing' });
  if (cfg.deityDataUrl) header.push({ image: cfg.deityDataUrl, fit: [74, 74], alignment: 'center', margin: [0, 4, 0, 2] });
  header.push({ text: cfg.hotelName, style: 'hotelName' });
  header.push({ text: cfg.legalName.toUpperCase(), style: 'hotelLegal' });
  header.push({
    stack: [
      { text: cfg.address },
      { text: [
          { text: `Ph: ${cfg.phone}   ·   `, bold: false },
          { text: `GSTIN ${cfg.gstin}`, bold: true },
          cfg.pan ? { text: `   ·   PAN ${cfg.pan}`, bold: true } : '',
          { text: `   ·   State: ${cfg.stateName} (${cfg.stateCode})`, bold: false },
        ] },
    ],
    style: 'hotelMeta',
  });
  header.push({ canvas: ornRule(), margin: [0, 8, 0, 8] });

  /* ---------- folio table ---------- */
  const folioBody: Content[][] = [
    [
      { text: '#', style: 'th' },
      { text: 'Date', style: 'th' },
      { text: 'Particulars', style: 'th' },
      { text: 'Qty', style: ['th', 'right'] },
      { text: 'Rate (₹)', style: ['th', 'right'] },
      { text: 'Taxable (₹)', style: ['th', 'right'] },
      { text: 'GST', style: ['th', 'right'] },
    ],
    ...inv.items.map((it, i): Content[] => [
      { text: String(i + 1), style: 'cellMono' },
      { text: fmtDate(it.date), style: 'cellMono' },
      {
        stack: [
          { text: it.description, style: 'cellDesc' },
          { text: `SAC ${it.sac}${it.notes ? '  ·  ' + it.notes : ''}`, style: 'cellSac' },
        ],
      },
      { text: String(it.qty), style: ['cellMono', 'right'] },
      { text: formatINR(it.rate), style: ['cellMono', 'right'] },
      { text: formatINR(it.qty * it.rate), style: ['cellMono', 'right'] },
      { text: `${it.gstRate}%`, style: ['cellMono', 'right'] },
    ]),
  ];

  /* ---------- slab summary ---------- */
  const slabRows: Content[][] = [
    [
      { text: 'GST Rate', style: 'th2' },
      { text: 'Taxable (₹)', style: ['th2', 'right'] },
      intra ? { text: 'CGST (₹)', style: ['th2', 'right'] } : { text: 'IGST (₹)', style: ['th2', 'right'] },
      ...(intra ? [{ text: 'SGST (₹)', style: ['th2', 'right'] }] : []),
      { text: 'Total (₹)', style: ['th2', 'right'] },
    ],
    ...t.slabs.map((s): Content[] => [
      { text: `${s.rate}%`, style: 'cellMono' },
      { text: formatINR(s.taxable), style: ['cellMono', 'right'] },
      intra ? { text: formatINR(s.cgst), style: ['cellMono', 'right'] } : { text: formatINR(s.igst), style: ['cellMono', 'right'] },
      ...(intra ? [{ text: formatINR(s.sgst), style: ['cellMono', 'right'] }] : []),
      { text: formatINR(s.total), style: ['cellMono', 'right'] },
    ]),
    [
      { text: 'Total', style: ['cellMono', 'bold'] },
      { text: formatINR(t.taxable), style: ['cellMono', 'right', 'bold'] },
      intra ? { text: formatINR(t.cgst), style: ['cellMono', 'right', 'bold'] } : { text: formatINR(t.igst), style: ['cellMono', 'right', 'bold'] },
      ...(intra ? [{ text: formatINR(t.sgst), style: ['cellMono', 'right', 'bold'] }] : []),
      { text: formatINR(t.taxable + t.taxTotal), style: ['cellMono', 'right', 'bold'] },
    ],
  ];

  const upi = upiUri(inv.payment.upiVpa, cfg.merchantName, t.grandTotal, inv.invoiceNumber);

  const content: Content[] = [
    ...header,

    /* ---------- title band ---------- */
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'TAX INVOICE', style: 'docTitle' },
            { text: 'ISSUED UNDER RULE 46, CGST RULES 2017  ·  ORIGINAL FOR RECIPIENT', style: 'docSub' },
            {
              columns: [
                { text: [{ text: 'INVOICE No.   ', style: 'lbl' }, { text: inv.invoiceNumber, style: 'invNo' }], width: 'auto' },
                { text: [{ text: 'DATED   ', style: 'lbl' }, { text: fmtDate(inv.issueDate), style: 'invDate' }], width: 'auto' },
              ],
              columnGap: 14,
              margin: [0, 6, 0, 0],
            },
          ],
        },
        {
          width: 176,
          border: [0.6, 0.6, 0.6, 0.6],
          borderColor: [C.hair, C.hair, C.hair, C.hair],
          background: C.slab,
          padding: [8, 8, 8, 8],
          stack: [
            metaRow('Fiscal Year', inv.fiscalYear),
            metaRow('Booking Ref', inv.bookingRef ?? '—'),
            metaRow('Folio No.', inv.folioNumber ?? '—'),
            metaRow('Place of Supply', inv.placeOfSupply),
            metaRow('Supply Type', intra ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'),
            metaRow('Payment Mode', inv.payment.method),
          ],
        },
      ],
      columnGap: 12,
    },

    /* ---------- parties ---------- */
    {
      columns: [
        {
          width: '*',
          border: [0.6, 2, 0.6, 0.6],
          borderColor: [C.hair, C.gold, C.hair, C.hair],
          background: '#FFFFFF',
          padding: [8, 9, 8, 9],
          stack: [
            { text: 'BILLED TO', style: 'cardHead' },
            { text: inv.guest.name, style: 'partyName' },
            ...(inv.guest.address ? [{ text: inv.guest.address, style: 'muted' as const }] : []),
            { text: `M: ${inv.guest.phone}${inv.guest.email ? '   ·   E: ' + inv.guest.email : ''}`, style: 'muted' },
            { text: inv.guest.gstin ? `GSTIN: ${inv.guest.gstin}` : 'UNREGISTERED RECIPIENT — NO GSTIN', style: 'chip' },
          ],
        },
        {
          width: '*',
          border: [0.6, 2, 0.6, 0.6],
          borderColor: [C.hair, C.gold, C.hair, C.hair],
          background: '#FFFFFF',
          padding: [8, 9, 8, 9],
          stack: inv.stay ? [
            { text: 'STAY SUMMARY', style: 'cardHead' },
            { text: `Room ${inv.stay.roomNumber} · ${inv.stay.roomType}`, style: 'partyName' },
            { text: `Check-in: ${fmtDT(inv.stay.checkIn)}   →   Check-out: ${fmtDT(inv.stay.checkOut)}`, style: 'muted' },
            { text: `Nights: ${inv.stay.nights}   ·   Tariff: ₹${formatINR(inv.stay.tariffPerNight, 0)} / night`, style: 'muted' },
            { text: `SETTLED · ${inv.payment.method.toUpperCase()}`, style: 'chip' },
          ] : [{ text: ' ' }],
        },
      ],
      columnGap: 12,
      margin: [0, 10, 0, 0],
    },

    /* ---------- folio ---------- */
    {
      table: { headerRows: 1, widths: [18, 42, '*', 30, 54, 60, 30], body: folioBody },
      layout: folioLayout(),
      margin: [0, 10, 0, 0],
    },

    /* ---------- slabs + totals ---------- */
    {
      columns: [
        {
          width: '*',
          table: {
            headerRows: 1,
            widths: intra ? [36, '*', '*', '*', '*'] : [36, '*', '*', '*'],
            body: slabRows,
          },
          layout: slabLayout(),
        },
        {
          width: 200,
          border: [0.6, 0.6, 0.6, 0.6],
          borderColor: [C.hair, C.hair, C.hair, C.hair],
          background: '#FFFFFF',
          stack: [
            { text: 'INVOICE TOTALS', style: 'cardHead2' },
            tRow('Taxable Value', formatINR(t.taxable)),
            ...(intra ? [tRow('CGST', formatINR(t.cgst)), tRow('SGST', formatINR(t.sgst))] : [tRow('IGST', formatINR(t.igst))]),
            tRow('Round Off', (t.roundOff >= 0 ? '+' : '') + formatINR(t.roundOff)),
            {
              columns: [
                { text: 'GRAND TOTAL', style: 'grandK' },
                { text: `₹${formatINR(t.grandTotal, 0)}`, style: 'grandV' },
              ],
              background: C.maroon,
              padding: [7, 8, 7, 8],
              margin: [0, 2, 0, 0],
            },
          ],
        },
      ],
      columnGap: 12,
      margin: [0, 8, 0, 0],
    },

    /* ---------- amount in words ---------- */
    {
      border: [0.8, 0.8, 0.8, 0.8],
      borderColor: [C.goldSoft, C.goldSoft, C.goldSoft, C.goldSoft],
      background: C.goldPale,
      padding: [6, 8, 6, 8],
      margin: [0, 8, 0, 0],
      stack: [
        { text: 'AMOUNT IN WORDS (INR)', style: 'wordsLbl' },
        { text: t.totalInWords, style: 'wordsVal' },
      ],
    },

    /* ---------- payment + signature ---------- */
    {
      columns: [
        {
          width: '*',
          columns: [
            {
              width: 82,
              border: [0.6, 0.6, 0.6, 0.6],
              borderColor: [C.hair, C.hair, C.hair, C.hair],
              background: '#FFFFFF',
              padding: [4, 4, 4, 4],
              stack: [
                { qr: upi, fit: 66, foreground: C.ink },
                { text: 'UPI · SCAN TO VERIFY', style: 'qrCap', margin: [0, 3, 0, 0] },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'PAYMENT DETAILS', style: 'cardHead' },
                { text: `UPI VPA: ${inv.payment.upiVpa}`, style: 'muted' },
                ...(cfg.bank ? [
                  { text: `${cfg.bank.name}, ${cfg.bank.branch}`, style: 'muted' as const },
                  { text: `A/c ${cfg.bank.account}  ·  IFSC ${cfg.bank.ifsc}`, style: 'muted' as const },
                ] : []),
                ...inv.payment.entries.map(e => ({
                  text: `Received ₹${formatINR(e.amount, 0)} via ${e.mode} (${fmtDate(e.date)}${e.ref ? ', ref ' + e.ref : ''})`,
                  style: 'muted' as const,
                })),
                {
                  text: t.balanceDue <= 0
                    ? 'BALANCE DUE: ₹0 — SETTLED IN FULL'
                    : `BALANCE DUE: ₹${formatINR(t.balanceDue, 0)}`,
                  style: 'due',
                },
              ],
            },
          ],
          columnGap: 10,
        },
        {
          width: 176,
          stack: [
            { text: `For ${cfg.legalName}`, style: 'signFor', alignment: 'right' },
            { text: ' ', fontSize: 8, margin: [0, 0, 0, 36] },
            { canvas: [{ type: 'line', x1: 26, y1: 0, x2: 176, y2: 0, lineWidth: 0.7, lineColor: C.ink }] },
            { text: 'Authorised Signatory', style: 'signLine', alignment: 'right', margin: [0, 2, 0, 0] },
            { text: `${cfg.signatoryName} · ${cfg.signatoryTitle}`, style: 'signLine2', alignment: 'right' },
          ],
        },
      ],
      columnGap: 12,
      margin: [0, 10, 0, 0],
    },

    /* ---------- footer ---------- */
    {
      stack: [
        { text: cfg.terms.slice(0, 6).map((x, i) => `${i + 1}.  ${x}`).join('\n'), style: 'terms' },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 527, y2: 0, lineWidth: 0.8, lineColor: C.goldSoft }], margin: [0, 6, 0, 4] },
        {
          columns: [
            { text: 'ORIGINAL FOR RECIPIENT', style: 'orig', width: 'auto' },
            { text: 'Computer-generated tax invoice — valid without physical seal', style: 'footMid', width: '*' },
            { text: `${inv.invoiceNumber} · Page 1 of 1`, style: ['footMid', 'right'], width: 'auto' },
          ],
          columnGap: 8,
        },
      ],
      margin: [0, 12, 0, 0],
    },
  ];

  return {
    pageSize: 'A4',
    pageMargins: [34, 28, 34, 26],
    content,
    styles: styles(),
    defaultStyle: { font: 'Inter', fontSize: 8, color: C.ink },
    info: {
      title: `Tax Invoice ${inv.invoiceNumber}`,
      author: cfg.legalName,
      subject: 'GST Tax Invoice',
      keywords: `GST ${inv.invoiceNumber} ${inv.guest.name}`,
      creator: 'Ayushmaan OS v2',
    },
  };
}

/** Generate the PDF Blob entirely on-device (no network, works offline). */
export function generateInvoicePdf(inv: Invoice, cfg: InvoicePdfConfig): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const doc = pdfMake.createPdf(invoiceDocumentDefinition(inv, cfg));
      doc.getBlob((blob: Blob) => resolve(blob));
    } catch (err) {
      reject(err);
    }
  });
}

/** Open the PDF in a new tab (desktop debugging / preview). */
export function openInvoicePdf(inv: Invoice, cfg: InvoicePdfConfig): void {
  pdfMake.createPdf(invoiceDocumentDefinition(inv, cfg)).open();
}

/* ================================================================== */
/* helpers                                                             */
/* ================================================================== */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${MONTHS[+m - 1]}-${y}`;
}
function fmtDT(iso: string): string {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fmtDate(dt.toISOString().slice(0, 10))} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
}
function metaRow(k: string, v: string): Content {
  return { columns: [{ text: k, style: 'metaK' }, { text: v, style: ['metaV', 'right'] }], columnGap: 6, margin: [0, 0, 0, 3] };
}
function tRow(k: string, v: string): Content {
  return { columns: [{ text: k, style: 'tK' }, { text: v, style: ['tV', 'right'] }], columnGap: 6, margin: [7, 3, 7, 3] };
}

/** Gold ornament rule under the header (vector canvas → prints crisp). */
function ornRule(): any[] {
  const y = 3.5;
  return [
    { type: 'line', x1: 0,   y1: y, x2: 246, y2: y, lineWidth: 0.8, lineColor: C.gold },
    { type: 'rect', x: 254, y: y - 2.5, w: 5, h: 5, lineWidth: 0, color: C.gold },
    { type: 'rect', x: 262, y: y - 3.5, w: 7, h: 7, lineWidth: 0.9, lineColor: C.gold },
    { type: 'rect', x: 272, y: y - 2.5, w: 5, h: 5, lineWidth: 0, color: C.gold },
    { type: 'line', x1: 281, y1: y, x2: 527, y2: y, lineWidth: 0.8, lineColor: C.gold },
  ];
}

function folioLayout() {
  return {
    fillColor: (ri: number) => (ri === 0 ? C.maroon : ri % 2 === 0 ? C.slab : null),
    hLineColor: () => C.hair,
    vLineColor: () => C.hair,
    hLineWidth: () => 0.6,
    vLineWidth: () => 0,
    paddingTop: () => 4.5,
    paddingBottom: () => 4.5,
    paddingLeft: () => 5,
    paddingRight: () => 5,
  };
}
function slabLayout() {
  return {
    fillColor: (ri: number) => (ri === 0 ? C.goldPale : null),
    hLineColor: () => C.hair,
    vLineWidth: () => 0,
    hLineWidth: () => 0.6,
    paddingTop: () => 3.5,
    paddingBottom: () => 3.5,
    paddingLeft: () => 6,
    paddingRight: () => 6,
  };
}

function styles(): StyleDictionary {
  return {
    blessing:   { alignment: 'center', fontSize: 8.5, color: C.maroon, font: 'NotoDevanagari' },
    hotelName:  { alignment: 'center', fontSize: 21, font: 'Playfair', color: C.maroonDark, characterSpacing: 4, bold: true },
    hotelLegal: { alignment: 'center', fontSize: 7.5, color: C.muted, characterSpacing: 1, margin: [0, 2, 0, 0] },
    hotelMeta:  { alignment: 'center', fontSize: 7.4, color: C.muted, lineHeight: 1.45, margin: [0, 3, 0, 0] },
    docTitle:   { fontSize: 15, font: 'Playfair', characterSpacing: 5, color: C.ink, bold: true },
    docSub:     { fontSize: 6.8, color: C.muted, characterSpacing: 1.3, margin: [0, 2, 0, 0] },
    lbl:        { fontSize: 7, color: C.muted, characterSpacing: 1 },
    invNo:      { fontSize: 12, color: C.maroon, bold: true, characterSpacing: 0.8 },
    invDate:    { fontSize: 9.5, color: C.ink },
    metaK:      { fontSize: 7.2, color: C.muted },
    metaV:      { fontSize: 7.2, bold: true, color: C.ink },
    cardHead:   { fontSize: 6.8, color: C.gold, bold: true, characterSpacing: 2, margin: [0, 0, 0, 4] },
    cardHead2:  { fontSize: 6.8, color: C.gold, bold: true, characterSpacing: 2, margin: [7, 7, 0, 3] },
    partyName:  { fontSize: 10.5, font: 'Playfair', bold: true, color: C.ink, margin: [0, 0, 0, 2] },
    muted:      { fontSize: 7.6, color: C.muted, lineHeight: 1.5 },
    chip:       { fontSize: 6.6, color: C.maroon, background: C.goldPale, margin: [0, 5, 0, 0], characterSpacing: 0.8 },
    th:         { fontSize: 6.8, color: '#F7EFE0', bold: true, characterSpacing: 1.2 },
    th2:        { fontSize: 6.6, color: C.maroonDark, bold: true, characterSpacing: 1 },
    cellMono:   { fontSize: 7.6 },
    cellDesc:   { fontSize: 7.8, bold: true, color: C.ink },
    cellSac:    { fontSize: 6.4, color: C.muted, margin: [0, 1.5, 0, 0] },
    bold:       { bold: true },
    right:      { alignment: 'right' },
    tK:         { fontSize: 7.8, color: C.muted, margin: [0, 0, 0, 0] },
    tV:         { fontSize: 7.8, color: C.ink },
    grandK:     { fontSize: 8, color: '#F9F1E2', bold: true, characterSpacing: 2 },
    grandV:     { fontSize: 13, color: '#F9F1E2', bold: true, alignment: 'right' },
    wordsLbl:   { fontSize: 6.6, color: C.gold, bold: true, characterSpacing: 1.6, margin: [0, 0, 0, 2] },
    wordsVal:   { fontSize: 8.6, italics: true, font: 'Playfair', color: C.maroonDark },
    qrCap:      { fontSize: 6, color: C.muted, alignment: 'center', characterSpacing: 0.6 },
    due:        { fontSize: 7.8, bold: true, color: C.maroon, margin: [0, 3, 0, 0] },
    signFor:    { fontSize: 8, bold: true, color: C.ink },
    signLine:   { fontSize: 7.2, color: C.muted },
    signLine2:  { fontSize: 7, color: C.muted },
    terms:      { fontSize: 6.4, color: C.muted, lineHeight: 1.5 },
    orig:       { fontSize: 6.6, color: C.maroon, bold: true, background: C.goldPale, characterSpacing: 1.2 },
    footMid:    { fontSize: 6.6, color: C.muted, characterSpacing: 0.6 },
  };
}
