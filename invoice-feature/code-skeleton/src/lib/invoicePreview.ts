/**
 * Ayushmaan OS v2 — on-screen / print HTML renderer for the premium invoice
 * Drop into: src/lib/invoicePreview.ts
 *
 * Returns a FULL self-contained HTML document of the A4 invoice using the same
 * brand tokens as the PDF. Used for:
 *   • the in-app preview sheet (iframe srcdoc)
 *   • window printing (Android print dialog → any printer / Save as PDF)
 *
 * The shareable PDF is produced separately by invoicePdf.ts (pdfmake).
 * Both renderers consume the SAME Invoice object + brand tokens, and the
 * strategy doc keeps a visual parity check in the test plan.
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

export function invoicePreviewHtml(inv: Invoice, cfg: InvoicePreviewConfig): string {
  const t = inv.totals;
  const intra = inv.supplyType === 'INTRA';

  const folioRows = inv.items.map((it, i) => `
    <tr>
      <td class="mono">${i + 1}</td>
      <td class="mono">${fmtDate(it.date)}</td>
      <td class="desc">${esc(it.description)}<span class="sac">SAC ${it.sac}${it.notes ? ' · ' + esc(it.notes) : ''}</span></td>
      <td class="r mono">${it.qty}</td>
      <td class="r mono">${formatINR(it.rate)}</td>
      <td class="r mono">${formatINR(it.qty * it.rate)}</td>
      <td class="r mono">${it.gstRate}%</td>
    </tr>`).join('');

  const slabRows = t.slabs.map(s => `
    <tr>
      <td>${s.rate}%</td>
      <td class="mono">${formatINR(s.taxable)}</td>
      <td class="mono">${intra ? formatINR(s.cgst) : formatINR(s.igst)}</td>
      ${intra ? `<td class="mono">${formatINR(s.sgst)}</td>` : ''}
      <td class="mono">${formatINR(s.total)}</td>
    </tr>`).join('');

  const payRows = inv.payment.entries.map(e =>
    `<div>Received <b>₹${formatINR(e.amount, 0)}</b> via ${esc(e.mode)} (${fmtDate(e.date)}${e.ref ? ', ref ' + esc(e.ref) : ''})</div>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tax Invoice ${esc(inv.invoiceNumber)}</title>
<style>
:root{--ink:#1c1917;--muted:#6f6759;--hair:#e6dcc6;--maroon:#7a1f2b;--maroon-d:#5d1620;
--gold:#b98a2f;--gold-s:#d9bd7f;--gold-p:#f3ead6;--ivory:#fffdf8;--slab:#fbf7ee}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,'Segoe UI',system-ui,sans-serif;color:var(--ink);background:#fff;
-webkit-print-color-adjust:exact;print-color-adjust:exact}
.serif{font-family:'Playfair Display',Georgia,serif}
.mono{font-variant-numeric:tabular-nums;font-family:'JetBrains Mono',Consolas,monospace}
.page{width:210mm;min-height:297mm;margin:0 auto;background:var(--ivory);padding:9mm 10mm 8mm}
.frame{border:1px solid var(--gold-s);outline:1px solid var(--hair);outline-offset:2px;
min-height:277mm;padding:7mm 8mm 6mm;display:flex;flex-direction:column}
.blessing{text-align:center;color:var(--maroon);font-size:8.5pt;letter-spacing:.14em}
.deity{display:block;width:26mm;height:26mm;margin:2mm auto 1mm;object-fit:contain}
.hname{text-align:center;font-size:21pt;letter-spacing:.22em;color:var(--maroon-d);text-transform:uppercase;font-weight:600}
.hlegal{text-align:center;font-size:8pt;color:var(--muted);letter-spacing:.08em;margin-top:1mm}
.hmeta{text-align:center;font-size:7.6pt;color:var(--muted);margin-top:1.6mm;line-height:1.55}
.hmeta b{color:var(--ink)}
.orn{display:flex;align-items:center;gap:3mm;margin:3.2mm 0 3mm}
.orn .l{flex:1;height:1px;background:linear-gradient(90deg,transparent,var(--gold) 18%,var(--gold) 82%,transparent)}
.orn .d{width:5px;height:5px;background:var(--gold);transform:rotate(45deg)}
.orn .d.big{width:7px;height:7px;box-shadow:0 0 0 2px var(--ivory),0 0 0 3px var(--gold)}
.band{display:flex;justify-content:space-between;gap:4mm}
.dtitle{font-size:15pt;letter-spacing:.34em;font-weight:600}
.dsub{font-size:7.4pt;color:var(--muted);letter-spacing:.18em;margin-top:.8mm;text-transform:uppercase}
.invno{margin-top:2.6mm;font-size:12pt;color:var(--maroon);font-weight:700;letter-spacing:.06em}
.invno .lbl{font-size:7.4pt;color:var(--muted);letter-spacing:.12em;font-weight:400}
.mright{width:64mm;border:1px solid var(--hair);background:var(--slab);padding:2.6mm 3mm;font-size:7.6pt}
.mright .row{display:flex;justify-content:space-between;padding:.9mm 0;border-bottom:1px dotted var(--hair)}
.mright .row:last-child{border-bottom:0}
.mright .k{color:var(--muted)}
.mright .v{font-weight:600}
.parties{display:flex;gap:4mm;margin-top:3.6mm}
.card{flex:1;border:1px solid var(--hair);border-top:2.5px solid var(--gold);padding:2.8mm 3.2mm;background:#fff}
.card h4{font-size:7pt;letter-spacing:.2em;color:var(--gold);font-weight:700;margin-bottom:1.6mm;text-transform:uppercase}
.card .name{font-size:10.5pt;font-weight:700}
.card .ln{font-size:7.8pt;color:var(--muted);line-height:1.6}
.card .ln b{color:var(--ink)}
.chip{display:inline-block;font-size:6.6pt;letter-spacing:.1em;padding:.7mm 2mm;border:1px solid var(--gold-s);
color:var(--maroon);background:var(--gold-p);border-radius:1mm;font-weight:600;margin-top:1.6mm}
table.folio{width:100%;border-collapse:collapse;margin-top:3.6mm;font-size:8pt}
table.folio th{background:var(--maroon);color:#f7efe0;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;
font-weight:600;padding:2.1mm 2.4mm;text-align:left}
table.folio td{padding:2mm 2.4mm;border-bottom:1px solid var(--hair);vertical-align:top;line-height:1.45}
table.folio tr:nth-child(even) td{background:var(--slab)}
.r{text-align:right}
.sac{display:block;font-size:6.6pt;color:var(--muted);margin-top:.5mm}
td.desc{font-weight:600}
.sums{display:flex;gap:4mm;margin-top:3.4mm}
.slabs{flex:1;border:1px solid var(--hair);background:#fff}
.slabs h5,.totals h5{font-size:7pt;letter-spacing:.18em;color:var(--gold);font-weight:700;padding:2mm 3mm 1.4mm;text-transform:uppercase}
.slabs table{width:100%;border-collapse:collapse;font-size:7.4pt}
.slabs th{font-size:6.6pt;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;font-weight:600;
padding:1.2mm 3mm;border-bottom:1px solid var(--hair);text-align:right}
.slabs th:first-child{text-align:left}
.slabs td{padding:1.5mm 3mm;border-bottom:1px dotted var(--hair);text-align:right}
.slabs td:first-child{text-align:left;font-weight:600}
.totals{width:78mm;border:1px solid var(--hair);background:#fff}
.trow{display:flex;justify-content:space-between;font-size:8pt;padding:1.5mm 3mm;border-bottom:1px dotted var(--hair)}
.trow .k{color:var(--muted)}
.grand{background:var(--maroon);color:#f9f1e2;display:flex;justify-content:space-between;padding:2.6mm 3mm;align-items:baseline}
.grand .k{font-size:8pt;letter-spacing:.16em;font-weight:600}
.grand .v{font-size:13pt;font-weight:800}
.words{margin-top:2.6mm;border:1px dashed var(--gold-s);background:var(--gold-p);padding:2.2mm 3mm;font-size:8pt;color:var(--maroon-d)}
.words .lbl{font-size:6.6pt;letter-spacing:.16em;color:var(--gold);font-weight:700;display:block;margin-bottom:.8mm}
.words i{font-family:Georgia,serif;font-size:8.6pt}
.pay{display:flex;gap:4mm;margin-top:3.6mm}
.pay .left{flex:1;display:flex;gap:3mm}
.qr{width:24mm;border:1px solid var(--hair);background:#fff;padding:1.4mm}
.qr img,.qr svg{width:100%;display:block}
.qr .cap{font-size:6.2pt;color:var(--muted);text-align:center;margin-top:.8mm}
.bank{font-size:7.6pt;line-height:1.65;color:var(--muted)}
.bank b{color:var(--ink)}
.bank h4{font-size:7pt;letter-spacing:.2em;color:var(--gold);font-weight:700;margin-bottom:1.4mm;text-transform:uppercase}
.sign{width:64mm;text-align:right}
.sign .for{font-size:8pt;font-weight:700}
.sign .space{height:16mm}
.sign .rule{border-top:1px solid var(--ink);width:52mm;margin-left:auto;padding-top:1.2mm;font-size:7.2pt;color:var(--muted)}
.foot{margin-top:auto;padding-top:3mm;border-top:1px solid var(--gold-s)}
.terms{font-size:6.6pt;color:var(--muted);line-height:1.6;columns:2;column-gap:6mm}
.footline{display:flex;justify-content:space-between;align-items:center;margin-top:2.4mm;font-size:6.8pt;color:var(--muted)}
.footline .orig{border:1px solid var(--gold-s);background:var(--gold-p);color:var(--maroon);padding:.6mm 2.2mm;letter-spacing:.14em;font-weight:700}
@media screen{body{background:#23211e;padding:16px}.page{box-shadow:0 16px 60px rgba(0,0,0,.5)}}
@page{size:A4;margin:0}
@media print{body{background:#fff;padding:0}.page{box-shadow:none;width:auto;min-height:0}}
</style></head><body>
<div class="page"><div class="frame">
  ${cfg.blessingLine ? `<div class="blessing serif">${esc(cfg.blessingLine)}</div>` : ''}
  ${cfg.deityDataUrl ? `<img class="deity" src="${cfg.deityDataUrl}" alt="">` : ''}
  <div class="hname serif">${esc(cfg.hotelName)}</div>
  <div class="hlegal">${esc(cfg.legalName.toUpperCase())}</div>
  <div class="hmeta">${esc(cfg.address)} &nbsp;·&nbsp; <b>${esc(cfg.phone)}</b><br>
    <b>GSTIN ${esc(cfg.gstin)}</b> &nbsp;·&nbsp; State: ${esc(cfg.stateName)} (${esc(cfg.stateCode)})${cfg.pan ? ` &nbsp;·&nbsp; PAN ${esc(cfg.pan)}` : ''}</div>
  <div class="orn"><span class="l"></span><span class="d"></span><span class="d big"></span><span class="d"></span><span class="l"></span></div>

  <div class="band">
    <div>
      <div class="dtitle serif">TAX INVOICE</div>
      <div class="dsub">Issued under Rule 46, CGST Rules 2017 · Original for Recipient</div>
      <div class="invno mono"><span class="lbl">INVOICE No.</span> ${esc(inv.invoiceNumber)}
        <span class="lbl" style="margin-left:4mm">DATED</span>
        <span style="font-size:9.5pt;color:var(--ink);font-weight:600">${fmtDate(inv.issueDate)}</span></div>
    </div>
    <div class="mright">
      <div class="row"><span class="k">Fiscal Year</span><span class="v mono">${esc(inv.fiscalYear)}</span></div>
      <div class="row"><span class="k">Booking Ref</span><span class="v mono">${esc(inv.bookingRef ?? '—')}</span></div>
      <div class="row"><span class="k">Folio No.</span><span class="v mono">${esc(inv.folioNumber ?? '—')}</span></div>
      <div class="row"><span class="k">Place of Supply</span><span class="v">${esc(inv.placeOfSupply)}</span></div>
      <div class="row"><span class="k">Supply Type</span><span class="v">${intra ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'}</span></div>
      <div class="row"><span class="k">Payment Mode</span><span class="v">${esc(inv.payment.method)}</span></div>
    </div>
  </div>

  <div class="parties">
    <div class="card">
      <h4>Billed To</h4>
      <div class="name serif">${esc(inv.guest.name)}</div>
      ${inv.guest.address ? `<div class="ln">${esc(inv.guest.address)}</div>` : ''}
      <div class="ln"><b>M:</b> ${esc(inv.guest.phone)}${inv.guest.email ? ` &nbsp;·&nbsp; <b>E:</b> ${esc(inv.guest.email)}` : ''}</div>
      <span class="chip">${inv.guest.gstin ? 'GSTIN ' + esc(inv.guest.gstin) : 'UNREGISTERED — NO GSTIN'}</span>
    </div>
    <div class="card">
      <h4>Stay Summary</h4>
      ${inv.stay ? `
      <div class="name serif">Room ${esc(inv.stay.roomNumber)} · ${esc(inv.stay.roomType)}</div>
      <div class="ln"><b>Check-in:</b> ${esc(inv.stay.checkIn)} &nbsp;→&nbsp; <b>Check-out:</b> ${esc(inv.stay.checkOut)}</div>
      <div class="ln"><b>Nights:</b> ${inv.stay.nights} &nbsp;·&nbsp; <b>Tariff:</b> ₹${formatINR(inv.stay.tariffPerNight, 0)} / night</div>
      <span class="chip">SETTLED · ${esc(inv.payment.method.toUpperCase())}</span>` : '<div class="ln">—</div>'}
    </div>
  </div>

  <table class="folio">
    <thead><tr><th style="width:8mm">#</th><th style="width:16mm">Date</th><th>Particulars</th>
    <th class="r" style="width:10mm">Qty</th><th class="r" style="width:20mm">Rate (₹)</th>
    <th class="r" style="width:22mm">Taxable (₹)</th><th class="r" style="width:12mm">GST</th></tr></thead>
    <tbody>${folioRows}</tbody>
  </table>

  <div class="sums">
    <div class="slabs">
      <h5>Tax-Rate Slab Summary</h5>
      <table><thead><tr><th>GST Rate</th><th>Taxable (₹)</th><th>${intra ? 'CGST' : 'IGST'} (₹)</th>${intra ? '<th>SGST (₹)</th>' : ''}<th>Total (₹)</th></tr></thead>
      <tbody>${slabRows}</tbody></table>
    </div>
    <div class="totals">
      <h5>Invoice Totals</h5>
      <div class="trow"><span class="k">Taxable Value</span><span class="mono">${formatINR(t.taxable)}</span></div>
      ${intra ? `<div class="trow"><span class="k">CGST</span><span class="mono">${formatINR(t.cgst)}</span></div>
      <div class="trow"><span class="k">SGST</span><span class="mono">${formatINR(t.sgst)}</span></div>`
      : `<div class="trow"><span class="k">IGST</span><span class="mono">${formatINR(t.igst)}</span></div>`}
      <div class="trow"><span class="k">Round Off</span><span class="mono">${t.roundOff >= 0 ? '+' : ''}${formatINR(t.roundOff)}</span></div>
      <div class="grand"><span class="k">GRAND TOTAL</span><span class="v mono">₹${formatINR(t.grandTotal, 0)}</span></div>
    </div>
  </div>

  <div class="words"><span class="lbl">AMOUNT IN WORDS (INR)</span><i>${esc(t.totalInWords)}</i></div>

  <div class="pay">
    <div class="left">
      <div class="bank">
        <h4>Payment Details</h4>
        <div><b>UPI VPA:</b> ${esc(inv.payment.upiVpa)}</div>
        ${cfg.bank ? `<div><b>Bank:</b> ${esc(cfg.bank.name)}, ${esc(cfg.bank.branch)}<br><b>A/c:</b> ${esc(cfg.bank.account)} · <b>IFSC:</b> ${esc(cfg.bank.ifsc)}</div>` : ''}
        ${payRows}
        <div><b>${t.balanceDue <= 0 ? 'Balance Due: ₹0 — Settled in full' : 'Balance Due: ₹' + formatINR(t.balanceDue, 0)}</b></div>
      </div>
    </div>
    <div class="sign">
      <div class="for">For ${esc(cfg.legalName)}</div>
      <div class="space"></div>
      <div class="rule">Authorised Signatory<br>${esc(cfg.signatoryName)} · ${esc(cfg.signatoryTitle)}</div>
    </div>
  </div>

  <div class="foot">
    <div class="terms">${cfg.terms.slice(0, 6).map((x, i) => `${i + 1}. ${esc(x)}`).join(' ')}</div>
    <div class="footline">
      <span class="orig">ORIGINAL FOR RECIPIENT</span>
      <span>Computer-generated tax invoice — valid without physical seal</span>
      <span class="mono">${esc(inv.invoiceNumber)} · Page 1 of 1</span>
    </div>
  </div>
</div></div>
</body></html>`;
}
