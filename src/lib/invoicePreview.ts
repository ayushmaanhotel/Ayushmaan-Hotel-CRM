/**
 * Ayushmaan OS v2 — on-screen / print HTML renderer · THEME: HERITAGE LUXE v2 (variant A)
 * Drop-in: src/lib/invoicePreview.ts
 *
 * Mirrors template/premium-gallery.html sheet A exactly (same tokens, same anatomy).
 * Used for the in-app preview iframe and the Android print dialog (true A4).
 * Pass `qrDataUrl` (generated client-side via the `qrcode` package) for a real
 * scannable UPI QR; a neutral placeholder is rendered when absent.
 */
import type { Invoice, HotelInvoiceConfig } from '../types/invoice';
import type { HotelConfig } from '../types/hotel';
import { formatINR } from './invoiceEngine';

export type InvoicePreviewConfig = HotelConfig & HotelInvoiceConfig;

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}-${MONTHS[+m - 1]}-${y}`;
};
const fmtDT = (iso: string) => {
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return esc(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${fmtDate(dt.toISOString().slice(0, 10))} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const getCSS = (paperSize: 'A4' | 'A5' = 'A4') => `
:root{--paper:#fffdf8;--ink:#1c1917;--muted:#6f6759;--faint:#8d8577;--hair:#e6dcc6;--hair2:#eee4d0;
--maroon:#7a1f2b;--maroon-d:#5d1620;--gold:#b98a2f;--gold-s:#d9bd7f}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,'Segoe UI',system-ui,sans-serif;color:var(--ink);background:#fff;
-webkit-print-color-adjust:exact;print-color-adjust:exact}
.serif{font-family:'Playfair Display',Georgia,'Times New Roman',serif}
.mono{font-family:'JetBrains Mono','SF Mono',Consolas,monospace;font-variant-numeric:tabular-nums}
.sc{font-variant-caps:all-small-caps;letter-spacing:.14em}
.page{width:${paperSize === 'A5' ? '148mm' : '210mm'};min-height:${paperSize === 'A5' ? '210mm' : '297mm'};margin:0 auto;background:var(--paper);padding:${paperSize === 'A5' ? '10mm 12mm 8mm' : '16mm 18mm 12mm'};
display:flex;flex-direction:column}
.head{text-align:center}
.deity{width:20mm;height:20mm;object-fit:contain;margin:0 auto 2mm;display:block}
.bless{font-size:7.4pt;color:var(--maroon);margin:0 0 1mm}
.wm{font-size:23pt;letter-spacing:.3em;color:var(--maroon-d);text-transform:uppercase;font-weight:600}
.legal{font-size:7pt;color:var(--muted);letter-spacing:.1em;margin-top:1.4mm}
.addr{font-size:7pt;color:var(--muted);margin-top:1.2mm;line-height:1.6}
.addr b{color:var(--ink)}
.rule{display:flex;align-items:center;gap:2.6mm;margin:4.5mm 0 5mm}
.rule i{flex:1;height:1px;background:var(--gold-s)}
.rule s{width:5px;height:5px;background:var(--gold);transform:rotate(45deg);text-decoration:none}
.titlerow{display:flex;justify-content:space-between;align-items:flex-end}
.t1{font-size:13pt;letter-spacing:.42em;font-weight:600}
.t2{font-size:6.5pt;color:var(--muted);letter-spacing:.16em;margin-top:1.2mm}
.no{text-align:right}
.no .n{font-size:11.5pt;color:var(--maroon);font-weight:700;letter-spacing:.05em}
.no .d{font-size:7.6pt;color:var(--muted);margin-top:.8mm}
.meta{display:flex;justify-content:center;gap:5mm;margin:4mm 0 5mm;font-size:6.8pt;color:var(--muted)}
.meta b{color:var(--ink);font-weight:600}
.meta span+span{border-left:1px solid var(--hair);padding-left:5mm}
.parties{display:flex;gap:8mm;margin-bottom:5mm}
.parties>div{flex:1}
.parties>div+div{border-left:1px solid var(--hair);padding-left:8mm}
.lbl{font-size:6.6pt;color:var(--gold);font-weight:700;letter-spacing:.22em;margin-bottom:1.6mm}
.pname{font-size:11pt;font-weight:700}
.pln{font-size:7.6pt;color:var(--muted);line-height:1.65}
.pln b{color:var(--ink)}
table.f{width:100%;border-collapse:collapse;font-size:7.9pt}
table.f th{font-size:6.4pt;color:var(--gold);font-weight:700;letter-spacing:.18em;text-align:left;
padding:0 2mm 1.8mm 0;border-bottom:1px solid var(--gold)}
table.f th.r,table.f td.r{text-align:right}
table.f td{padding:2.3mm 2mm 2.3mm 0;border-bottom:1px solid var(--hair2);vertical-align:top;line-height:1.45}
table.f td.dsc{font-weight:600}
table.f .sac{display:block;font-size:6.2pt;color:var(--faint);margin-top:.6mm}
.bottom{display:flex;gap:10mm;margin-top:5mm}
.slabs{flex:1;font-size:7pt;color:var(--muted)}
.slabs table{width:100%;border-collapse:collapse}
.slabs th{font-size:6.2pt;letter-spacing:.14em;color:var(--faint);text-align:right;padding:0 0 1.4mm;font-weight:600}
.slabs th:first-child{text-align:left}
.slabs td{padding:1.3mm 0;border-bottom:1px dotted var(--hair);text-align:right}
.slabs td:first-child{text-align:left;font-weight:600;color:var(--ink)}
.tot{width:70mm}
.tot .row{display:flex;justify-content:space-between;font-size:7.8pt;color:var(--muted);padding:1.2mm 0}
.tot .row .v{color:var(--ink)}
.grand{border-top:2px solid var(--maroon);border-bottom:1px solid var(--maroon);margin-top:1.6mm;
padding:2mm 0 1.8mm;display:flex;justify-content:space-between;align-items:baseline}
.grand .k{font-size:7pt;letter-spacing:.24em;color:var(--maroon);font-weight:700}
.grand .v{font-size:15pt;font-weight:700;color:var(--maroon-d)}
.paid{font-size:6.6pt;color:var(--gold);font-weight:700;letter-spacing:.26em;text-align:right;margin-top:1.4mm}
.words{font-size:8.2pt;color:var(--maroon-d);margin-top:4mm}
.words .wl{font-size:6.4pt;color:var(--gold);font-weight:700;letter-spacing:.15em}
.words i{font-family:Georgia,serif}
.payrow{display:flex;gap:8mm;margin-top:5mm}
.payrow .l{flex:1;display:flex;gap:4mm}
.qrbox{width:21mm;height:21mm;border:1px solid var(--hair);padding:1.2mm;background:#fff}
.qrbox img,.qrbox svg{width:100%;height:100%;display:block}
.bank{font-size:7.1pt;color:var(--muted);line-height:1.7}
.bank b{color:var(--ink)}
.sign{width:62mm;text-align:right}
.sign .for{font-size:7.8pt;font-weight:700}
.sign .sp{height:14mm}
.sign .rl{border-top:1px solid var(--ink);width:50mm;margin-left:auto;padding-top:1.2mm;font-size:6.9pt;color:var(--muted)}
.foot{margin-top:auto;padding-top:3mm;border-top:1px solid var(--gold-s);display:flex;
justify-content:space-between;font-size:6.3pt;color:var(--faint)}
@media screen{body{background:#23211e;padding:16px}.page{box-shadow:0 16px 60px rgba(0,0,0,.5)}}
@page{size:${paperSize};margin:0}
@media print{body{background:#fff;padding:0}.page{box-shadow:none;width:auto;min-height:0}}
`;

const QR_PLACEHOLDER = `<svg viewBox="0 0 29 29" shape-rendering="crispEdges"><rect width="29" height="29" fill="#fff"/><g fill="#1c1917"><path d="M0 0h7v7H0zM2 2h3v3H2z" fill-rule="evenodd"/><path d="M22 0h7v7h-7zM24 2h3v3h-3z" fill-rule="evenodd"/><path d="M0 22h7v7H0zM2 24h3v3H2z" fill-rule="evenodd"/><rect x="9" y="1" width="1" height="2"/><rect x="12" y="0" width="2" height="1"/><rect x="16" y="2" width="1" height="3"/><rect x="10" y="4" width="3" height="1"/><rect x="15" y="6" width="2" height="1"/><rect x="12" y="9" width="1" height="2"/><rect x="16" y="8" width="3" height="1"/><rect x="21" y="9" width="1" height="2"/><rect x="4" y="11" width="1" height="2"/><rect x="0" y="13" width="1" height="2"/><rect x="9" y="12" width="2" height="2"/><rect x="15" y="12" width="1" height="3"/><rect x="22" y="12" width="1" height="2"/><rect x="25" y="13" width="2" height="2"/><rect x="11" y="15" width="2" height="1"/><rect x="18" y="16" width="1" height="2"/><rect x="9" y="19" width="1" height="2"/><rect x="16" y="19" width="1" height="2"/><rect x="26" y="20" width="2" height="2"/><rect x="14" y="24" width="1" height="2"/><rect x="21" y="24" width="1" height="2"/><rect x="18" y="26" width="2" height="2"/></g></svg>`;

export function invoicePreviewHtml(
  inv: Invoice,
  cfg: InvoicePreviewConfig,
  qrDataUrlOrPaperSize?: string,
  paperSizeParam?: 'A4' | 'A5'
): string {
  let qrDataUrl: string | undefined;
  let paperSize: 'A4' | 'A5' = (inv as any).paperSize || 'A4';
  if (qrDataUrlOrPaperSize === 'A4' || qrDataUrlOrPaperSize === 'A5') {
    paperSize = qrDataUrlOrPaperSize;
  } else {
    qrDataUrl = qrDataUrlOrPaperSize;
    if (paperSizeParam) paperSize = paperSizeParam;
  }

  const t = inv.totals;
  const intra = inv.supplyType === 'INTRA';
  const simple = inv.mode === 'SIMPLE';

  const folioRows = inv.items.map(it => {
    const neg = it.qty * it.rate < 0;
    const style = neg ? ' style="color:var(--maroon)"' : '';
    return `
    <tr>
      <td class="mono">${fmtDate(it.date).slice(0, 6)}</td>
      <td class="dsc"${style}>${esc(it.description)}${simple ? '' : `<span class="sac">SAC ${it.sac}${it.notes ? ' · ' + esc(it.notes) : ''}</span>`}</td>
      <td class="r mono">${it.qty}</td>
      <td class="r mono"${style}>${formatINR(it.rate)}</td>
      <td class="r mono"${style}>${formatINR(it.qty * it.rate)}</td>
      ${simple ? '' : `<td class="r mono">${it.gstRate}%</td>`}
    </tr>`;
  }).join('');

  const slabHead = `<tr><th class="sc">Slab</th><th class="sc">Taxable ₹</th><th class="sc">${intra ? 'CGST' : 'IGST'} ₹</th>${intra ? '<th class="sc">SGST ₹</th>' : ''}</tr>`;
  const slabRows = t.slabs.map(s => `
    <tr><td>${s.rate}%</td><td class="mono">${formatINR(s.taxable)}</td><td class="mono">${formatINR(intra ? s.cgst : s.igst)}</td>${intra ? `<td class="mono">${formatINR(s.sgst)}</td>` : ''}</tr>`).join('');

  const payRows = inv.payment.entries.map(e =>
    `<div>Received ₹${formatINR(e.amount, 0)} via ${esc(e.mode)} (${fmtDate(e.date)}${e.ref ? ', ref ' + esc(e.ref) : ''})</div>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tax Invoice ${esc(inv.invoiceNumber)}</title>
<style>${getCSS(paperSize)}</style></head><body>
<div class="page">
  <div class="head">
    ${cfg.deityDataUrl ? `<img class="deity" src="${cfg.deityDataUrl}" alt="">` : ''}
    ${cfg.blessingLine ? `<div class="bless">${esc(cfg.blessingLine)}</div>` : ''}
    <div class="wm serif">${esc(cfg.hotelName)}</div>
    <div class="legal sc">${esc(cfg.legalName)}</div>
    <div class="addr">${esc(cfg.address)} · <b>${esc(cfg.phone)}</b> · <b>GSTIN ${esc(cfg.gstin)}</b> · State ${esc(cfg.stateName)} (${esc(cfg.stateCode)})${cfg.pan ? ` · PAN ${esc(cfg.pan)}` : ''}</div>
  </div>
  <div class="rule"><i></i><s></s><i></i></div>
  <div class="titlerow">
    <div><div class="t1 serif">${simple ? 'BILL' : 'TAX INVOICE'}</div><div class="t2 sc">${simple ? 'Original for Recipient' : 'Issued under Rule 46, CGST Rules 2017 · Original for Recipient'}</div></div>
    <div class="no"><div class="n mono">${esc(inv.invoiceNumber)}</div><div class="d">${fmtDate(inv.issueDate)} · FY ${esc(inv.fiscalYear)}</div></div>
  </div>
  <div class="meta sc">
    <span>Booking <b class="mono">${esc(inv.bookingRef ?? '—')}</b></span>
    <span>Folio <b class="mono">${esc(inv.folioNumber ?? '—')}</b></span>
    ${simple ? '' : `<span>Place of supply <b>${esc(inv.placeOfSupply)}</b></span>
    <span><b>${intra ? 'Intra-State' : 'Inter-State'}</b> · ${intra ? 'CGST + SGST' : 'IGST'}</span>`}
  </div>
  <div class="parties">
    <div>
      <div class="lbl sc">Billed To</div>
      <div class="pname serif">${esc(inv.guest.name)}</div>
      ${inv.guest.address ? `<div class="pln">${esc(inv.guest.address)}</div>` : ''}
      <div class="pln"><b>M</b> ${esc(inv.guest.phone)}${inv.guest.email ? ` · <b>E</b> ${esc(inv.guest.email)}` : ''}</div>
      <div class="pln">${inv.guest.gstin ? 'GSTIN ' + esc(inv.guest.gstin) : 'UNREGISTERED RECIPIENT'}</div>
    </div>
    <div>
      <div class="lbl sc">Stay Summary</div>
      ${inv.stay ? `
      <div class="pname serif">Room ${esc(inv.stay.roomNumber)} · ${esc(inv.stay.roomType)}</div>
      <div class="pln">${fmtDT(inv.stay.checkIn)} → ${fmtDT(inv.stay.checkOut)}</div>
      <div class="pln"><b>${inv.stay.nights} nights</b> @ ₹${formatINR(inv.stay.tariffPerNight, 0)} / night</div>` : '<div class="pln">—</div>'}
    </div>
  </div>
  <table class="f">
    <thead><tr><th style="width:14mm" class="sc">Date</th><th class="sc">Particulars</th><th style="width:11mm" class="r sc">Qty</th><th style="width:20mm" class="r sc">Rate ₹</th><th style="width:22mm" class="r sc">${simple ? 'Amount' : 'Taxable'} ₹</th>${simple ? '' : '<th style="width:11mm" class="r sc">GST</th>'}</tr></thead>
    <tbody>${folioRows}</tbody>
  </table>
  <div class="bottom">
    ${simple ? '<div class="slabs"></div>' : `<div class="slabs"><table>${slabHead}${slabRows}</table></div>`}
    <div class="tot">
      <div class="row"><span>${simple ? 'Subtotal' : 'Taxable value'}</span><span class="v mono">${formatINR(t.taxable)}</span></div>
      ${simple
        ? '<div class="row"><span>Tax</span><span class="v mono">—</span></div>'
        : `${intra
            ? `<div class="row"><span>CGST</span><span class="v mono">${formatINR(t.cgst)}</span></div><div class="row"><span>SGST</span><span class="v mono">${formatINR(t.sgst)}</span></div>`
            : `<div class="row"><span>IGST</span><span class="v mono">${formatINR(t.igst)}</span></div>`}
          <div class="row"><span>Round off</span><span class="v mono">${t.roundOff >= 0 ? '+' : ''}${formatINR(t.roundOff)}</span></div>`}
      <div class="grand"><span class="k sc">Grand Total</span><span class="v serif mono">₹${formatINR(t.grandTotal, 0)}</span></div>
      <div class="paid sc">${inv.payment.balanceDue <= 0 ? 'Paid in full' : 'Balance due ₹' + formatINR(inv.payment.balanceDue, 0)}</div>
    </div>
  </div>
  <div class="words"><span class="wl sc">In words ·</span> <i>${esc(t.totalInWords)}</i></div>
  <div class="payrow">
    <div class="l">
      <div class="qrbox">${qrDataUrl ? `<img src="${qrDataUrl}" alt="UPI QR">` : QR_PLACEHOLDER}</div>
      <div class="bank"><b>UPI</b> ${esc(inv.payment.upiVpa)}${cfg.bank ? ` · <b>${esc(cfg.bank.name)}</b> ${esc(cfg.bank.branch)}<br><b>A/c</b> ${esc(cfg.bank.account)} · <b>IFSC</b> ${esc(cfg.bank.ifsc)}` : ''}<br>${payRows}<b>${inv.payment.balanceDue <= 0 ? 'Balance ₹0 — settled in full' : 'Balance due ₹' + formatINR(inv.payment.balanceDue, 0)}</b></div>
    </div>
    <div class="sign"><div class="for">For ${esc(cfg.legalName)}</div><div class="sp"></div><div class="rl">Authorised Signatory · ${esc(cfg.signatoryName)}, ${esc(cfg.signatoryTitle)}</div></div>
  </div>
  <div class="foot"><span>${esc(cfg.terms.slice(0, 3).join('  ·  '))}</span><span class="mono">${esc(inv.invoiceNumber)} · Page 1 of 1</span></div>
</div>
</body></html>`;
}
