/**
 * Ayushmaan OS v2 — Premium invoice PDF renderer · THEME: HERITAGE LUXE v2 (variant A)
 * Drop-in: src/lib/invoicePdf.ts
 *
 * Vector A4 via pdfmake: razor-sharp at any zoom, selectable text, ~80–140 KB.
 * Design source of truth: template/premium-gallery.html → sheet "A · Heritage Luxe v2".
 * Design language: ivory paper, maroon ink, antique-gold hairlines, NO boxes,
 * editorial 3-step type scale, deity as centred medallion, double-rule grand total.
 */
import pdfMake from 'pdfmake/build/pdfmake';
import './setupFonts';
import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import type { Invoice, HotelInvoiceConfig } from '../types/invoice';
import type { HotelConfig } from '../types/hotel';
import { formatINR, upiUri } from './invoiceEngine';

export type InvoicePdfConfig = HotelConfig & HotelInvoiceConfig;

/* ---- Heritage Luxe v2 tokens (keep in sync with invoicePreview.ts) ---- */
const C = {
  paper: '#FFFDF8', ink: '#1C1917', muted: '#6F6759', faint: '#8D8577',
  hair: '#E6DCC6', hairSoft: '#EEE4D0',
  maroon: '#7A1F2B', maroonDark: '#5D1620',
  gold: '#B98A2F', goldSoft: '#D9BD7F',
};
const MM = 2.83465;

const sc = (t: string, size: number, color: string, ls: number, extra: Record<string, unknown> = {}): Content => ({
  text: t.toUpperCase(), fontSize: size, color, bold: true, characterSpacing: ls, ...extra,
});

export function invoiceDocumentDefinition(
  inv: Invoice,
  cfg: InvoicePdfConfig,
  paperSize: 'A4' | 'A5' = (inv as any).paperSize || 'A4'
): TDocumentDefinitions {
  const isA5 = paperSize === 'A5';
  const pageW = isA5 ? 419.53 : 595.28;
  const pageH = isA5 ? 595.28 : 841.89;
  const margins = isA5 ? [34, 28, 34, 22] : [51, 45, 51, 34];
  const contentW = pageW - margins[0] - margins[2];

  const t = inv.totals;
  const intra = inv.supplyType === 'INTRA';
  const simple = inv.mode === 'SIMPLE';
  const upi = upiUri(inv.payment.upiVpa, cfg.merchantName, t.grandTotal, inv.invoiceNumber);

  const money = (n: number, color = C.ink, size = 7.9): Content =>
    ({ text: formatINR(n), fontSize: size, color, alignment: 'right' as const });

  /* ---------------- header ---------------- */
  const header: Content[] = [];
  if (cfg.deityDataUrl) header.push({ image: cfg.deityDataUrl, fit: [20 * MM, 20 * MM], alignment: 'center' });
  if (cfg.blessingLine) header.push({ text: cfg.blessingLine, font: 'NotoDevanagari', fontSize: 7.4, color: C.maroon, alignment: 'center', margin: [0, 2, 0, 2] });
  header.push({ text: cfg.hotelName.toUpperCase(), font: 'Playfair', bold: true, fontSize: isA5 ? 19 : 23, color: C.maroonDark, characterSpacing: isA5 ? 4.5 : 6, alignment: 'center', margin: [0, 2, 0, 0] });
  header.push({ text: cfg.legalName.toUpperCase(), fontSize: 7, color: C.muted, characterSpacing: 0.7, alignment: 'center', margin: [0, 4, 0, 0] });
  header.push({
    stack: [
      { text: `${cfg.address}  ·  ` },
      { text: `${cfg.phone}  ·  `, bold: true, color: C.ink },
      { text: `GSTIN ${cfg.gstin}`, bold: true, color: C.ink },
      { text: `  ·  State ${cfg.stateName} (${cfg.stateCode})` },
      cfg.pan ? { text: `  ·  PAN ${cfg.pan}` } : '',
    ],
    fontSize: 7, color: C.muted, alignment: 'center', lineHeight: 1.6, margin: [0, 3.4, 0, 0],
  });
  header.push({ canvas: ornRule(contentW), margin: [0, (isA5 ? 3 : 4.5) * MM, 0, (isA5 ? 3.5 : 5) * MM] });

  /* ---------------- content ---------------- */
  const content: any[] = [
    ...header,

    /* title row */
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: simple ? 'BILL' : 'TAX INVOICE', font: 'Playfair', bold: true, fontSize: 13, color: C.ink, characterSpacing: 5.5 },
            sc(simple ? 'Original for Recipient' : 'Issued under Rule 46, CGST Rules 2017 · Original for Recipient', 6.5, C.muted, 1.0, { margin: [0, 3.4, 0, 0] }),
          ],
        },
        {
          width: 150,
          stack: [
            { text: inv.invoiceNumber, fontSize: 11.5, color: C.maroon, bold: true, characterSpacing: 0.5, alignment: 'right' },
            { text: `${fmtDate(inv.issueDate)} · FY ${inv.fiscalYear}`, fontSize: 7.6, color: C.muted, alignment: 'right', margin: [0, 2.3, 0, 0] },
          ],
        },
      ],
      columnGap: 12,
    },

    /* meta strip with vertical hairlines */
    {
      table: {
        widths: simple ? ['*', '*', '*'] : ['*', '*', '*', '*'],
        body: [[
          metaCell([{ text: 'BOOKING ' }, { text: inv.bookingRef ?? '—', bold: true, color: C.ink }]),
          metaCell([{ text: 'FOLIO ' }, { text: inv.folioNumber ?? '—', bold: true, color: C.ink }]),
          ...(simple ? [] : [
            metaCell([{ text: 'PLACE OF SUPPLY ' }, { text: inv.placeOfSupply, bold: true, color: C.ink }]),
            metaCell(intra
              ? [{ text: 'INTRA-STATE', bold: true, color: C.ink }, { text: ' · CGST + SGST' }]
              : [{ text: 'INTER-STATE', bold: true, color: C.ink }, { text: ' · IGST' }]),
          ]),
        ]],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i: number, _n?: any, _row?: any) => {
          const cols = simple ? 3 : 4;
          return i === 0 || i === cols ? 0 : 0.7;
        },
        vLineColor: () => C.hair,
        paddingTop: () => 0, paddingBottom: () => 0,
        paddingLeft: (i: number) => (i === 0 ? 0 : 14),
        paddingRight: (i: number) => (i === (simple ? 2 : 3) ? 0 : 14),
      },
      margin: [0, 4 * MM, 0, 5 * MM],
    },

    /* parties — two open columns, hairline divider */
    {
      table: {
        widths: ['*', '*'],
        body: [[
          {
            stack: [
              sc('Billed To', 6.6, C.gold, 1.5),
              { text: inv.guest.name, font: 'Playfair', bold: true, fontSize: 11, color: C.ink, margin: [0, 4.5, 0, 0] },
              ...(inv.guest.address ? [{ text: inv.guest.address, fontSize: 7.6, color: C.muted, lineHeight: 1.65 }] : []),
              { text: [{ text: 'M ', bold: true, color: C.ink }, { text: inv.guest.phone },
                ...(inv.guest.email ? [{ text: `  ·  E ${inv.guest.email}` }] : [])], fontSize: 7.6, color: C.muted, lineHeight: 1.65 },
              { text: inv.guest.gstin ? `GSTIN ${inv.guest.gstin}` : 'UNREGISTERED RECIPIENT', fontSize: 7.6, color: C.muted, margin: [0, 1.5, 0, 0] },
            ],
          },
          {
            stack: inv.stay ? [
              sc('Stay Summary', 6.6, C.gold, 1.5),
              { text: `Room ${inv.stay.roomNumber} · ${inv.stay.roomType}`, font: 'Playfair', bold: true, fontSize: 11, color: C.ink, margin: [0, 4.5, 0, 0] },
              { text: `${fmtDT(inv.stay.checkIn)}  →  ${fmtDT(inv.stay.checkOut)}`, fontSize: 7.6, color: C.muted, lineHeight: 1.65 },
              { text: [{ text: `${inv.stay.nights} nights`, bold: true, color: C.ink }, { text: `  @  ₹${formatINR(inv.stay.tariffPerNight, 0)} / night` }], fontSize: 7.6, color: C.muted, lineHeight: 1.65 },
            ] : [{ text: ' ' }],
          },
        ]],
      },
      layout: {
        hLineWidth: () => 0,
        vLineWidth: (i: number) => (i === 1 ? 0.7 : 0),
        vLineColor: () => C.hair,
        paddingTop: () => 0, paddingBottom: () => 0,
        paddingLeft: (i: number) => (i === 1 ? 8 * MM : 0),
        paddingRight: (i: number) => (i === 0 ? 8 * MM : 0),
      },
      margin: [0, 0, 0, 5 * MM],
    },

    /* folio — hairline table, gold head rule */
    {
      table: {
        headerRows: 1,
        widths: simple ? [40, '*', 31, 57, 62] : [40, '*', 31, 57, 62, 31],
        body: [
          [
            sc('Date', 6.4, C.gold, 1.1), sc('Particulars', 6.4, C.gold, 1.1),
            sc('Qty', 6.4, C.gold, 1.1, { alignment: 'right' }), sc('Rate ₹', 6.4, C.gold, 1.1, { alignment: 'right' }),
            sc(simple ? 'Amount ₹' : 'Taxable ₹', 6.4, C.gold, 1.1, { alignment: 'right' }),
            ...(simple ? [] : [sc('GST', 6.4, C.gold, 1.1, { alignment: 'right' })]),
          ],
          ...inv.items.map((it): Content[] => {
            const neg = it.qty * it.rate < 0;
            const col = neg ? C.maroon : C.ink;
            return [
              { text: fmtDate(it.date).slice(0, 6), fontSize: 7.9, color: C.ink },
              {
                stack: [
                  { text: it.description, fontSize: 7.9, bold: true, color: col },
                  ...(simple ? [] : [{ text: `SAC ${it.sac}${it.notes ? ' · ' + it.notes : ''}`, fontSize: 6.2, color: C.faint, margin: [0, 1.7, 0, 0] as [number, number, number, number] }]),
                ],
              },
              { text: String(it.qty), fontSize: 7.9, color: C.ink, alignment: 'right' },
              money(it.rate, col), money(it.qty * it.rate, col),
              ...(simple ? [] : [{ text: `${it.gstRate}%`, fontSize: 7.9, color: C.ink, alignment: 'right' as const }]),
            ];
          }),
        ],
      },
      layout: {
        hLineWidth: (i: number) => (i === 0 ? 0 : i === 1 ? 1 : 0.7),
        hLineColor: (i: number) => (i === 1 ? C.gold : C.hairSoft),
        vLineWidth: () => 0,
        paddingTop: () => 6.5, paddingBottom: () => 6.5,
        paddingLeft: () => 0, paddingRight: () => 5.7,
      },
    },

    /* slabs + totals */
    {
      columns: [
        simple ? { width: '*', stack: [{ text: ' ', fontSize: 7 }] } : {
          width: '*',
          table: {
            widths: [40, '*', '*', '*'],
            body: [
              [
                sc('Slab', 6.2, C.faint, 1.0), sc('Taxable ₹', 6.2, C.faint, 1.0, { alignment: 'right' }),
                sc(intra ? 'CGST ₹' : 'IGST ₹', 6.2, C.faint, 1.0, { alignment: 'right' }),
                ...(intra ? [sc('SGST ₹', 6.2, C.faint, 1.0, { alignment: 'right' })] : []),
              ],
              ...t.slabs.map((s): Content[] => [
                { text: `${s.rate}%`, fontSize: 7, bold: true, color: C.ink },
                { text: formatINR(s.taxable), fontSize: 7, color: C.muted, alignment: 'right' },
                { text: formatINR(intra ? s.cgst : s.igst), fontSize: 7, color: C.muted, alignment: 'right' },
                ...(intra ? [{ text: formatINR(s.sgst), fontSize: 7, color: C.muted, alignment: 'right' as const }] : []),
              ]),
            ],
          },
          layout: {
            hLineWidth: (i: number) => (i === 0 ? 0 : 0.7),
            hLineStyle: (i: number) => (i === 0 ? undefined : { dash: { length: 1.5, space: 1.5 } }),
            hLineColor: () => C.hair,
            vLineWidth: () => 0,
            paddingTop: () => 3.7, paddingBottom: () => 3.7,
            paddingLeft: () => 0, paddingRight: () => 0,
          },
        },
        {
          width: 198,
          stack: [
            tRowA(simple ? 'Subtotal' : 'Taxable value', formatINR(t.taxable)),
            ...(simple
              ? [tRowA('Tax', '—')]
              : [...(intra ? [tRowA('CGST', formatINR(t.cgst)), tRowA('SGST', formatINR(t.sgst))] : [tRowA('IGST', formatINR(t.igst))]),
                 tRowA('Round off', (t.roundOff >= 0 ? '+' : '') + formatINR(t.roundOff))]),
            {
              columns: [
                { text: 'GRAND TOTAL', fontSize: 7, color: C.maroon, bold: true, characterSpacing: 1.7, margin: [0, 5.7, 0, 5.1] },
                { text: `₹${formatINR(t.grandTotal, 0)}`, font: 'Playfair', bold: true, fontSize: 15, color: C.maroonDark, alignment: 'right', margin: [0, 3.4, 0, 2.8] },
              ],
              columnGap: 6,
              border: [false, true, false, true],
              borderColor: [C.maroon, C.maroon, C.maroon, C.maroon],
              borderWidth: [0, 2, 0, 1],
              margin: [0, 4.5, 0, 0],
            },
            { text: inv.payment.balanceDue <= 0 ? 'PAID IN FULL' : `BALANCE DUE ₹${formatINR(inv.payment.balanceDue, 0)}`,
              fontSize: 6.6, color: C.gold, bold: true, characterSpacing: 1.9, alignment: 'right', margin: [0, 4, 0, 0] },
          ],
        },
      ],
      columnGap: 10 * MM,
      margin: [0, 5 * MM, 0, 0],
    },

    /* amount in words */
    {
      text: [
        { text: 'IN WORDS ·  ', fontSize: 6.4, color: C.gold, bold: true, characterSpacing: 1.5 },
        { text: t.totalInWords, fontSize: 8.2, italics: true, font: 'Playfair', color: C.maroonDark },
      ],
      margin: [0, 4 * MM, 0, 0],
    },

    /* payment + signature */
    {
      columns: [
        {
          width: '*',
          columns: [
            {
              width: 60,
              stack: [{ qr: upi, fit: 54, foreground: C.ink, margin: [3.4, 3.4, 3.4, 3.4] }],
              border: [0.7, 0.7, 0.7, 0.7],
              borderColor: [C.hair, C.hair, C.hair, C.hair],
              background: '#FFFFFF',
            },
            {
              width: '*',
              stack: [
                { text: [{ text: 'UPI ', bold: true, color: C.ink }, { text: inv.payment.upiVpa }, { text: '  ·  HDFC BANK', bold: true, color: C.ink }, { text: cfg.bank ? ` ${cfg.bank.branch}` : '' }], fontSize: 7.1, color: C.muted, lineHeight: 1.7 },
                ...(cfg.bank ? [{ text: `A/C ${cfg.bank.account}  ·  IFSC ${cfg.bank.ifsc}`, fontSize: 7.1, color: C.muted, lineHeight: 1.7 }] : []),
                ...inv.payment.entries.map(e => ({
                  text: `Received ₹${formatINR(e.amount, 0)} via ${e.mode} (${fmtDate(e.date)}${e.ref ? ', ref ' + e.ref : ''})`,
                  fontSize: 7.1, color: C.muted, lineHeight: 1.7,
                })),
                { text: inv.payment.balanceDue <= 0 ? 'Balance ₹0 — settled in full' : `Balance due ₹${formatINR(inv.payment.balanceDue, 0)}`, fontSize: 7.1, color: C.ink, bold: true, lineHeight: 1.7 },
              ],
            },
          ],
          columnGap: 4 * MM,
        },
        {
          width: 176,
          stack: [
            { text: `For ${cfg.legalName}`, fontSize: 7.8, bold: true, color: C.ink, alignment: 'right' },
            { text: ' ', fontSize: 8, margin: [0, 0, 0, 14 * MM] },
            { canvas: [{ type: 'line', x1: 34, y1: 0.5, x2: 176, y2: 0.5, lineWidth: 0.7, lineColor: C.ink }] },
            { text: `Authorised Signatory · ${cfg.signatoryName}, ${cfg.signatoryTitle}`, fontSize: 6.9, color: C.muted, alignment: 'right', margin: [0, 3, 0, 0] },
          ],
        },
      ],
      columnGap: 8 * MM,
      margin: [0, 5 * MM, 0, 0],
    },

    /* footer */
    {
      columns: [
        { text: cfg.terms.slice(0, 3).join('  ·  '), fontSize: 6.3, color: C.faint, width: '*', margin: [0, 8.5, 0, 0] },
        { text: `${inv.invoiceNumber} · Page 1 of 1`, fontSize: 6.3, color: C.faint, alignment: 'right', width: 'auto', margin: [0, 8.5, 0, 0] },
      ],
      columnGap: 8,
      border: [false, true, false, false],
      borderColor: [C.goldSoft, C.goldSoft, C.goldSoft, C.goldSoft],
      borderWidth: [0, 0.8, 0, 0],
      margin: [0, 10, 0, 0],
    },
  ];

  return {
    pageSize: paperSize,
    pageMargins: margins as [number, number, number, number],
    pageOrientation: 'portrait',
    background: () => ({ canvas: [{ type: 'rect', x: 0, y: 0, w: pageW, h: pageH, color: C.paper, lineWidth: 0 }] }),
    content,
    defaultStyle: { font: 'Inter', fontSize: isA5 ? 7.0 : 7.9, color: C.ink },
    info: {
      title: `Tax Invoice ${inv.invoiceNumber}`,
      author: cfg.legalName,
      subject: 'GST Tax Invoice',
      keywords: `GST ${inv.invoiceNumber} ${inv.guest.name}`,
      creator: 'Ayushmaan OS v2 · Heritage Luxe v2',
    },
  };
}

/** Generate the PDF Blob entirely on-device (offline-safe). */
export async function generateInvoicePdf(
  inv: Invoice,
  cfg: InvoicePdfConfig,
  paperSize?: 'A4' | 'A5'
): Promise<Blob> {
  const doc = pdfMake.createPdf(invoiceDocumentDefinition(inv, cfg, paperSize));
  if (typeof (doc as any).getBlob === 'function') {
    const res = (doc as any).getBlob();
    if (res && typeof res.then === 'function') {
      return await res;
    }
  }
  return new Promise((resolve, reject) => {
    try {
      (doc as any).getBlob((blob: Blob) => resolve(blob));
    } catch (err) {
      reject(err);
    }
  });
}

/** Open the PDF in a new tab (desktop debugging). */
export function openInvoicePdf(inv: Invoice, cfg: InvoicePdfConfig, paperSize?: 'A4' | 'A5'): void {
  (pdfMake.createPdf(invoiceDocumentDefinition(inv, cfg, paperSize)) as any).open();
}

/* ================= helpers ================= */

function metaCell(parts: { text: string; bold?: boolean; color?: string }[]): Content {
  return { text: parts.map(p => ({ ...p })), fontSize: 6.8, color: C.muted, alignment: 'center', characterSpacing: 0.6 };
}
function tRowA(k: string, v: string): Content {
  return { columns: [{ text: k, fontSize: 7.8, color: C.muted }, { text: v, fontSize: 7.8, color: C.ink, alignment: 'right' }], columnGap: 6, margin: [0, 3.4, 0, 3.4] };
}
function ornRule(width = 493.28): any[] {
  const y = 3, mid = width / 2;
  return [
    { type: 'line', x1: 0, y1: y, x2: mid - 15, y2: y, lineWidth: 0.8, lineColor: C.goldSoft },
    { type: 'rect', x: mid - 9, y: y - 2.5, w: 5, h: 5, lineWidth: 0, color: C.gold },
    { type: 'rect', x: mid - 3.5, y: y - 3.5, w: 7, h: 7, lineWidth: 0.9, lineColor: C.gold },
    { type: 'rect', x: mid + 4, y: y - 2.5, w: 5, h: 5, lineWidth: 0, color: C.gold },
    { type: 'line', x1: mid + 15, y1: y, x2: width, y2: y, lineWidth: 0.8, lineColor: C.goldSoft },
  ];
}

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
