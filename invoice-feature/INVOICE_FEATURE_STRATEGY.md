#  Premium Invoice Generation — Strategy & Implementation Plan
### For `ayushmaan-hotel-crm` (Ayushmaan OS v2) · on-device, Android-first, GST-compliant
**Version 1.0 · 03-Oct-2026 · Prepared against repo commit `13bdd9f` (main)**

---

## 0. Executive summary — the decisions, in one screen

| Question | Decision | Why |
|---|---|---|
| Where is the PDF generated? | **On the phone, in the browser/PWA** (pdfmake, vector PDF) | Your app has no backend; server generation would need auth, hosting, and breaks offline. Client-side = zero infra, instant, works in airplane mode. |
| PDF engine | **pdfmake** (not html2canvas+jsPDF, not server) | True vector output: razor-sharp text at any zoom, selectable, ~60–120 KB files, perfect print. html2canvas produces a blurry screenshot — the #1 killer of "premium" invoices. |
| Invoice layout | **One design, two renderers**: pdfmake definition (for the shareable PDF) + HTML renderer (for on-screen preview & printing), sharing the same brand tokens | Screen preview must be pixel-faithful to the PDF; a single token set prevents drift. |
| Template design | **I designed it for you** — "Heritage Luxury" (ivory + maroon + antique gold, Playfair serif, deity header) | See `template/invoice-template-preview.html` + §9. You only swap artwork/logo/config. |
| Deity photo (Ganesha) | Included: generated artwork in `template/assets/`, header placement + size rules in §9.3 | Traditional Indian letterhead style; must be *licensed* artwork, kept ≤ 80 KB, embedded as base64 so it works offline and inside the PDF. |
| Android delivery | **Phase 1: PWA** (install from Chrome, offline). **Phase 2 (optional): Capacitor APK** if you want Play Store presence | PWA gives home-screen icon + offline + Web Share with ~1 day of work; APK adds store review & native plugins you don't strictly need. Full comparison in §7. |
| Sharing to WhatsApp | **Web Share API Level 2** (`navigator.share({files})`) → real PDF into WhatsApp chat; `wa.me` text-link fallback | Native sheet, no server, works offline. |
| GST correctness | **Slab engine** (0% / 5% / 18% by per-night tariff, post 22-Sep-2025 rules) + slab-wise CGST/SGST breakup + sequential FY numbering | Your current code hard-codes 12% back-calculation and random invoice numbers — both non-compliant (§5). |
| Invoice content | **Full folio**: room nights, F&B, laundry, transfers, extras, discounts — itemised with SAC codes | Matches real hotel bills and your chosen scope. |

**Definition of "premium grade" (acceptance bar for this feature):**
1. Vector PDF, crisp at 400% zoom, ≤ 150 KB, opens in WhatsApp/Drive/Chrome without artifacts.
2. Legally complete GST tax invoice (Rule 46 checklist, §5.3) — passes a CA's review.
3. Branded: hotel identity, deity artwork, gold/maroon heritage styling — looks like a ₹10k/night property's letterhead, not a spreadsheet dump.
4. Generated on a ₹8k Android phone, offline, in < 2 seconds, tap-to-WhatsApp in one action.
5. Numbers are always right: slab-wise tax, round-off disclosed, amount-in-words (Indian lakh/crore), zero manual math.
6. Sequential, gap-free, fiscal-year invoice numbers that survive app restarts.

---

## 1. Audit — what exists today (and what silently breaks)

Repo: React 19 + Vite + Tailwind 4 SPA, **no backend**, all state in `localStorage` via `src/hooks/useHotelStore.ts`.

| File | Status quo | Problem |
|---|---|---|
| `src/components/finance/GSTInvoiceModal.tsx` | Dark on-screen mock | "Send PDF on WhatsApp" is `alert()`; Print calls `window.print()` on the **dark app UI**, not an invoice; hotel details hard-coded (ignores `hotelConfig`); single-line bill only |
| GST math | `amount / 1.12` hard-coded 12% | **Wrong since 22-Sep-2025**: slabs are 0% / 5% / 18% by tariff (§5.1). Also back-calculation hides the taxable value from records |
| Invoice number | `INV-2026-0${random}` | Random ⇒ duplicates & gaps ⇒ violates Rule 46 sequential-numbering requirement |
| `types/hotel.ts` → `Transaction` | Single `amount`, no line items | Cannot express a folio (room + restaurant + laundry…), no guest GSTIN/address/state |
| `index.html` / `public/` | No web manifest, no service worker | Not installable on Android, no offline → "done via the actual Android phone" is fragile today |
| Bundles/fonts | Inter via system, no embedded fonts | ₹ and Devanagari glyphs depend on device fonts → tofu boxes on cheap phones |

Everything else in the repo (roles/scopes, UPI engine, WhatsApp simulator, Kanban) is solid and untouched by this plan except where noted.

---

## 2. Target architecture

```
┌──────────────────────────── Android phone (Chrome / installed PWA) ───────────────────────────┐
│                                                                                               │
│  Front Desk / Finance UI                                                                      │
│        │  checkout or tap-transaction                                                         │
│        ▼                                                                                      │
│  Folio builder  ──►  invoiceEngine.buildInvoice()                                             │
│  (line items)          • slab resolution (0/5/18)          ◄── pure, unit-testable            │
│                        • slab-wise CGST/SGST (or IGST)                                        │
│                        • round-off + amount-in-words                                          │
│                        • reserveInvoiceNumber()  ── localStorage counter (FY key)             │
│        │                                                                                      │
│        ├──► Invoice persisted to localStorage (ayushmaan_invoices)                            │
│        │                                                                                      │
│        ├──► invoicePreview.ts  ──► <iframe srcdoc>  on-screen A4 sheet  ──► printHtml() ──►   │
│        │                                                                   Android print dlg  │
│        └──► invoicePdf.ts (pdfmake, vector) ──► Blob ──► sharePdf.ts                          │
│                                                          • navigator.share({files}) → WhatsApp│
│                                                          • fallback: download + wa.me link    │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
        Assets (deity art, logo, fonts) bundled as base64/data-URI + cached by service worker
        ⇒ entire pipeline works with zero network.
```

**Why two renderers (HTML + pdfmake) instead of one?**
- HTML gives you an instant, zoomable, scrollable preview and free access to the **Android print dialog** (any printer / Save-as-PDF) via an iframe.
- pdfmake gives you the **file you share**: vector, metadata-tagged, identical typography, no browser-print quirks (headers/footers/URLs Chrome injects when printing).
- Both consume the same `Invoice` object and the same token set (`C` in `invoicePdf.ts`, `:root` vars in `invoicePreview.ts`). Parity is enforced by the visual test in §11.

**Rejected alternatives (and why):**
| Option | Verdict |
|---|---|
| html2canvas + jsPDF | Raster screenshot → blurry text, huge files, unselectable. Never for invoices. |
| jsPDF + autotable | Viable vector option, but manual styling for a design this rich is painful; pdfmake's layout engine (columns, tables, qr) matches invoice needs better. |
| pdf-lib | Excellent low-level control, but you'd hand-place every line; slower to build/maintain. Keep as escape hatch for pixel-perfect overlays (e.g., stamping). |
| Server-side (Puppeteer/LaTeX) | Needs backend + auth + hosting; kills offline; adds latency. Your product philosophy is on-device. |
| Browser print only (`window.print`) | Free but output varies by browser/OS, adds URL/date headers, can't attach to WhatsApp. Keep as *print path* only, not the share path. |

---

## 3. Repository changes at a glance

```
NEW  src/types/invoice.ts                 models (FolioItem, Invoice, HotelInvoiceConfig)
NEW  src/lib/invoiceEngine.ts             slabs, totals, words, numbering, UPI URI
NEW  src/lib/invoicePdf.ts                pdfmake document definition (= premium template)
NEW  src/lib/invoicePreview.ts            HTML renderer (preview + print)
NEW  src/lib/setupFonts.ts + vfs-fonts.ts embedded fonts (₹, Devanagari, Playfair)
NEW  src/lib/sharePdf.ts                  Web Share L2 / download / print helpers
NEW  src/components/finance/PremiumInvoiceModal.tsx
NEW  public/manifest.webmanifest, public/sw.js (or vite-plugin-pwa)   ← Phase 3
NEW  src/assets/invoice/ganesha.jpg, logo.png                          ← your licensed art
MOD  src/hooks/useHotelStore.ts            + invoiceConfig slice, + invoices ledger
MOD  src/App.tsx                           swap GSTInvoiceModal → PremiumInvoiceModal
MOD  src/components/modules/FinanceModule.tsx   issue-invoice action per transaction
MOD  src/components/modules/QuickBookingModal.tsx  checkout → folio capture → issue
MOD  index.html                            manifest link, theme-color, title
DEL  (after parity) src/components/finance/GSTInvoiceModal.tsx
```

All of the NEW files exist ready-to-copy in **`code-skeleton/`** next to this document.

---

## 4. The premium template (design spec)

### 4.1 Design language — "Heritage Luxury"
- **Canvas:** A4 portrait, ivory `#FFFDF8`, double-ruled frame (gold hairline + inner offset).
- **Palette:** maroon `#7A1F2B` (authority), antique gold `#B98A2F`/`#D9BD7F` (ornament), ink `#1C1917`, muted `#6F6759`, slab tint `#FBF7EE`.
- **Type:** Playfair Display (hotel name, party names, amount-in-words — serif = heritage), Inter (body, 7.4–8 pt print sizes), tabular figures for all money. Devanagari: Noto Sans Devanagari for the blessing line.
- **Signature details:** ॥ श्री गणेशाय नमः ॥ + Ganesha artwork centred above the wordmark; gold ornament rule (line–diamond–diamond–diamond–line); maroon folio header band; zebra rows; gold-topped party cards; maroon grand-total bar; dashed gold "amount in words" plaque; UPI QR with verify caption; right-aligned signature block; two-column micro-terms; "ORIGINAL FOR RECIPIENT" chip.

**See it:** open `template/premium-gallery.html` (tab **A · Heritage Luxe v2** — the production design now implemented in `src/lib/invoicePdf.ts` + `invoicePreview.ts`); `template/invoice-template-preview.html` remains as the v1 history; redesign rationale & variants in `TEMPLATE_DESIGN_RESEARCH.md`.

### 4.2 Anatomy (top → bottom)
1. Blessing line · deity artwork (26 mm) · hotel wordmark · legal name · address/GSTIN/PAN/state
2. Ornament rule
3. Title band: TAX INVOICE + Rule 46 line + invoice no./date ‖ meta box (FY, booking ref, folio, place of supply, supply type, payment mode) ‖ PAID/BALANCE stamp (PDF renderer draws stamp text over totals when `balanceDue>0`)
4. Billed-To card ‖ Stay-Summary card
5. Folio table: # · Date · Particulars(+SAC subline) · Qty · Rate · Taxable · GST%
6. Slab-summary table ‖ totals stack (taxable, CGST, SGST, round-off, **grand-total bar**)
7. Amount-in-words plaque
8. UPI QR + payment/bank details ‖ signature block
9. Terms (2 col) + footer line (original-for-recipient · computer-generated notice · number/page)

### 4.3 Deity artwork — rules that keep it premium (and legal)
- **License first.** Do *not* lift images from Google/temple websites. Use: (a) the generated artwork shipped with this plan (`template/assets/ganesha-header.png/.jpg`), (b) commissioned art, or (c) clearly-licensed stock. The generated file is yours to use in this project.
- **Prep:** square crop, ivory/white background or transparent PNG, **≤ 80 KB** (JPEG q≈90 at 600 px ≈ 66 KB), no text/watermarks.
- **Placement:** centred, 24–28 mm tall, above the wordmark; blessing line optional and configurable (`blessingLine: ''` hides both for secular/chain-hotel mode).
- **Embedding:** import with Vite `?inline` → base64 data-URI → stored in `invoiceConfig.deityDataUrl`. One copy serves HTML preview *and* pdfmake (`image: cfg.deityDataUrl`) → offline-safe, identical in both.
- **Respect:** never overlap it with tables/stamps, never tint it, never stretch (fit, not scale-to-fill).

### 4.4 Customisation surface (Settings → Invoice Branding, Phase 4)
`invoicePrefix`, `legalName`, `stateName/Code`, `pan`, `bank{}`, `logoDataUrl`, `deityDataUrl`, `blessingLine`, `signatoryName/Title`, `terms[]`. Everything else stays locked to preserve the design.

---

## 5. GST compliance — the part that must be boring and correct

### 5.1 Slabs (effective 22-Sep-2025, GST 2.0 rationalisation)
| Service | SAC | Rate |
|---|---|---|
| Room tariff **< ₹1,000/night** | 996311 | **Exempt (0%)** |
| Room tariff **₹1,000 – ₹7,500/night** | 996311 | **5%** (2.5+2.5) |
| Room tariff **> ₹7,500/night** | 996311 | **18%** (9+9) |
| Restaurant / F&B at specified premises | 996331 | **5%** |
| Laundry | 999712 | 18% |
| Guest transport (hotel car) | 996400 | 18% |
| Other extras (minibar, banquet…) | case-wise | default 18% |
| Discount lines | inherit | inherit slab of discounted line (negative qty×rate) |

> ⚠️ Your current `amount / 1.12` must be deleted. Taxable value is **stored per line**, tax is **computed forward** per slab, round-off disclosed as its own line. Have your CA confirm F&B/extra SAC mapping once (§12).

### 5.2 CGST+SGST vs IGST
For hotel accommodation & on-premise services, **place of supply = location of the hotel** (service performed there) ⇒ practically always **intra-state → CGST + SGST**, even for out-of-state guests. The engine therefore defaults `supplyType` by comparing guest state code to hotel state code but lets a finance user override to INTER for edge cases (e.g., billing from a different registered office). IGST column swaps in automatically.

### 5.3 Rule 46 checklist (all present in the template)
✅ supplier name/legal name/address/GSTIN · ✅ sequential invoice number ≤ 16 chars (`GHI/26-27/0142` = 15) · ✅ issue date · ✅ recipient name + address + "Unregistered" marker or GSTIN · ✅ place of supply + state code · ✅ description + SAC · ✅ qty/rate/taxable value · ✅ rate-wise tax breakup · ✅ total + round-off · ✅ amount in words · ✅ signature block (digital, "computer generated — valid without physical seal") · ✅ original-for-recipient · ✅ terms/E&OE.
Missing-by-design today, add in Phase 4: credit-note numbering series (`CN-`), amended-invoice reference, reverse-charge declaration toggle.

### 5.4 Numbering & ledger
- Counter per fiscal year in `localStorage`: `ayushmaan_invoice_counter_2026-27`.
- Number reserved **only at issue** (drafts don't burn numbers); `releaseInvoiceNumber()` on crash-before-persist.
- Ledger array `ayushmaan_invoices` stores every issued invoice (immutable; cancellations append a credit note, never mutate).
- E-invoicing (IRN/QR) is **not mandatory** below ₹5 cr turnover; schema kept IRN-ready (`info.keywords`, reserved field) for future.

---

## 6. Data model & folio capture

Models: `code-skeleton/src/types/invoice.ts` (FolioItem, Invoice, InvoiceTotals, SlabBreakup, HotelInvoiceConfig). Key rules:
- **Money = integer paise internally?** For v1, rupee-float with `round2()` everywhere is acceptable *because* every stored value is already rounded at entry; migrate to paise in Phase 4 if you add partial refunds.
- **Folio capture UI (Phase 2, inside QuickBookingModal checkout step):** auto-seeded lines — Room × nights (slab auto), plus an "Add charge" sheet (category picker F&B/Laundry/Transport/Extra with SAC auto-filled, qty, rate) and "Add discount" (ties to a slab). Staff never sees GST math; the engine does it.
- **Guest tax profile:** on Guest 360 profile add optional `gstin`, `billingAddress`, `stateCode` → auto-flows into invoices; "Unregistered" chip when absent.

---

## 7. Android delivery: PWA vs Capacitor APK vs TWA

| Criterion | **PWA** (recommended first) | **Capacitor APK** | **TWA / Bubblewrap** |
|---|---|---|---|
| Install path | Chrome → Add to Home Screen | sideload APK / Play Store | Play Store (wrapped web) |
| Time to first device test | **~1 day** | ~3–5 days (Android Studio, signing) | ~2 days |
| Offline | Service worker (full) | Full (bundled assets) | Full |
| WhatsApp PDF share | Web Share L2 ✔ | Capacitor Share ✔ | Web Share L2 ✔ |
| Native printing | Android print dialog via iframe ✔ | Plugin (`@capacitor-community/printer`) ✔ | print dialog ✔ |
| Bluetooth thermal printers | Web Bluetooth (flaky) | Native plugin (solid) | flaky |
| Play Store presence | ✖ | ✔ | ✔ |
| App updates | Instant (deploy) | Store review / self-update | Store review |
| Bundle/infra cost | Zero new infra | Zero new infra | Zero new infra |

**Recommendation:** ship **PWA in Phase 3** (it satisfies "done via the actual Android phone" completely: home-screen icon, offline invoice issue, WhatsApp share). Add **Capacitor in Phase 5 only if** you need Play Store listing or Bluetooth thermal printing at scale. Nothing in Phases 1–4 changes when you later wrap with Capacitor — the PDF pipeline is pure web APIs.

**PWA recipe (Phase 3):**
```bash
npm i -D vite-plugin-pwa
```
```ts
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'Ayushmaan OS v2', short_name: 'AyushmaanOS',
      theme_color: '#7a1f2b', background_color: '#09090b', display: 'standalone',
      icons: [/* 192, 512, + maskable */],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      // cache the font vfs chunk aggressively — it's the biggest asset
      runtimeCaching: [{ urlPattern: /\/assets\/vfs-fonts-.*/, handler: 'CacheFirst' }],
    },
  })],
});
```
Then on the phone: open HTTPS URL → ⋮ → *Add to Home screen*. Test offline: airplane mode → issue invoice → share ✔.

---

## 8. On-phone flows (the moments that matter)

1. **Issue:** Finance → tap transaction (or checkout) → folio sheet → **Issue Invoice** (< 3 clicks from module).
2. **Preview:** PremiumInvoiceModal shows the A4 sheet in-app (iframe) — staff verifies before sending.
3. **Share:** *Share PDF on WhatsApp* → pdfmake blob → `navigator.share({files})` → WhatsApp contact/chat with real PDF attached. Fallbacks: download + `wa.me` deep link with message; abort = silent.
4. **Print:** *Print* → hidden iframe with the HTML renderer → Android print dialog → Bluetooth/Wi-Fi printer or Save-as-PDF. Print CSS is A4-exact (`@page{size:A4;margin:0}`), colors forced (`print-color-adjust:exact`).
5. **File naming:** `TaxInvoice-GHI-26-27-0142.pdf` (+ PDF metadata title/author) so WhatsApp/Drive lists look professional.

---

## 9. Phased roadmap

### Phase 0 — Foundations (0.5 day)
- [ ] `npm i pdfmake`; fetch OFL fonts; run `scripts/build-fonts.mjs` → `vfs-fonts.ts`
- [ ] Drop deity/logo art into `src/assets/invoice/`; verify ≤ 80 KB
- [ ] Copy `code-skeleton/src/types/invoice.ts`, `lib/invoiceEngine.ts` into repo
- **Accept:** `npm run build` green; engine unit tests (§11) pass.

### Phase 1 — Engine + store (1 day)
- [ ] Add `invoiceConfig` + `invoices` slices to `useHotelStore` (README §1)
- [ ] Folio capture UI in checkout (auto room line + add-charge/add-discount sheet)
- [ ] `buildInvoice()` wiring; persist ledger before modal opens
- **Accept:** issuing twice yields `…/0001`, `…/0002`; restart app → `0003`; slab boundaries (₹999/1000/7500/7501) correct.

### Phase 2 — PDF + preview (1–1.5 days)
- [ ] Copy `invoicePdf.ts`, `invoicePreview.ts`, `setupFonts.ts`, `PremiumInvoiceModal.tsx`
- [ ] Swap modal in `App.tsx`; lazy-import pdfmake inside actions (`import('./invoicePdf')`)
- [ ] Visual parity check vs `template/invoice-template-preview.html`
- **Accept:** PDF opens in desktop Chrome + phone Chrome: crisp at 400% zoom, ₹ and ॥…॥ render, ≤ 150 KB.

### Phase 3 — Android: PWA + share + print (1 day)
- [ ] vite-plugin-pwa manifest/SW; icons; theme color; title "Ayushmaan OS"
- [ ] `sharePdf.ts` wired; print path via iframe
- [ ] Real-device test matrix (§11.2) on the cheapest phone you own
- **Accept:** installed PWA, airplane mode: issue → share to WhatsApp with PDF attached; print dialog produces A4 PDF identical to template.

### Phase 4 — Finance hardening (2–3 days)
- [ ] Invoice register screen (list/filter/re-open/re-share), day-book totals by slab
- [ ] Credit notes & cancellations (CN- series, never mutate issued invoices)
- [ ] Settings → Invoice Branding panel (logo/deity upload with auto-compress to ≤ 80 KB via canvas)
- [ ] Tally/CSV export of invoice ledger; GSTR-1 helper columns (slab-wise taxable/CGST/SGST)
- **Accept:** CA walkthrough of one issued invoice + one credit note passes §5.3 checklist.

### Phase 5 — Optional scale-out
- [ ] Capacitor APK (Play Store) *only if needed*; native printer plugin for Bluetooth thermals
- [ ] 58 mm thermal receipt variant (simplified layout, same engine)
- [ ] IRN/e-invoice readiness if turnover crosses threshold
- [ ] Cloud sync (Supabase/Firestore) — out of scope today; ledger is device-local by design

**Total to "premium invoice on a real Android phone": ~4 working days.**

---

## 10. Bundle & performance budget
- pdfmake + fonts ≈ 1.6 MB gz — **lazy-loaded** (dynamic import in modal action) and **CacheFirst** in SW ⇒ first app load unaffected; second invoice generation offline-instant.
- Invoice PDF generation target: **< 2 s** on Snapdragon 4-gen-class chips (single A4 page, one embedded image).
- localStorage ledger: ~2 KB/invoice ⇒ ~50k invoices before quota concerns; Phase 5 sync solves beyond that.

---

## 11. Test plan

### 11.1 Unit (vitest, engine only — pure functions)
- Slab boundaries: 999→0%, 1000→5%, 7500→5%, 7501→18%
- Mixed folio: slab breakup sums == grand − roundOff; INTRA vs INTER columns
- Words: 17535 → "Rupees Seventeen Thousand Five Hundred and Thirty-Five Only"; 1,00,00,000 → "One Crore…"
- Numbering: sequential across FY boundary (31-Mar → 01-Apr rolls `26-27`→`27-28`); 16-char guard throws
- Discount line inherits target slab; negative totals clamp to error, not negative invoice

### 11.2 Real-device checklist (Android)
- [ ] Chrome → install PWA; icon + splash correct; launch offline
- [ ] Issue invoice in airplane mode → preview renders (fonts! deity image!)
- [ ] Share → WhatsApp: PDF arrives, opens crisp, zoom 400% text selectable
- [ ] Print → Save as PDF: A4, margins 0, colors present, one page
- [ ] Low-end phone (2 GB RAM): modal open < 1 s, generate < 2 s
- [ ] Dark-mode phone: preview sheet stays ivory (print CSS not overridden)
- [ ] Kill app mid-issue → relaunch: no duplicate/gap in numbering
- [ ] WhatsApp fallback path (old WebView): download + wa.me opens correctly

### 11.3 Visual parity
Render `INV-fixture.json` through (a) template HTML, (b) preview renderer, (c) pdfmake→PDF→PNG; diff by eye (screenshot triptych in PR).

---

## 12. Risks & mitigations
| Risk | Mitigation |
|---|---|
| ₹/Devanagari tofu on cheap devices | Embedded fonts (§2); fixture test on device in Phase 2 |
| Wrong GST mapping for edge services | CA sign-off on SAC table once; slab table lives in **one** function (`defaultGstRate`) |
| localStorage loss (clear-site-data) | Phase 4 export/backup JSON; Phase 5 cloud sync |
| pdfmake bundle bloat | Lazy import + SW CacheFirst (§10) |
| Deity art licensing | §4.3 rules; generated/commissioned art only |
| Number collisions after data reset | `resetDemoData()` must reset counters *and* ledger together |
| Print CSS drift across Chrome versions | Print path is a fallback; the PDF is the source of truth for guests |

---

## 13. Deliverables in this workspace
```
invoice-feature/
├── INVOICE_FEATURE_STRATEGY.md            ← this plan
├── template/
│   ├── invoice-template-preview.html      ← designed premium A4 template (self-contained, printable)
│   └── assets/ganesha-header.png|jpg      ← deity artwork (licensed-for-this-project, 2048px + 600px)
└── code-skeleton/                         ← drop-in implementation (README with wiring steps)
    ├── README.md
    ├── scripts/build-fonts.mjs
    └── src/{types,lib,components}/…
```

**Your next three moves:** ① open the template preview and approve/adjust the design language · ② run Phase 0 (fonts + pdfmake install) · ③ copy the skeleton and wire Phase 1. Everything after that is checklist.
