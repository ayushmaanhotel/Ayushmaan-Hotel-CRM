# Invoice Template Research, Critique & Redesign Brief
### Ayushmaan OS v2 · premium template system · 03-Oct-2026
Companion files: `template/premium-gallery.html` (4 live variants, tabbed, print-exact A4) ·
`template/invoice-template-preview.html` (v1) · `template/assets/` (deity art, lobby photo) ·
references in `image-search/` (workspace root).

---

## 1. Research — what "premium" invoices actually do (Pinterest + market teardown)

Sources scanned: Pinterest idea boards *Modern Invoice Design*, *Minimalist Invoice Design*,
*Corporate Invoice Design*, *Modern Typography Invoice* [1](https://www.pinterest.com/ideas/modern-invoice-design/955426951937/) [5](https://www.pinterest.com/ideas/minimalist-invoice-design/957667477933/) [4](https://www.pinterest.com/ideas/corporate-invoice-design/893925588644/) [3](https://www.pinterest.com/ideas/modern-typography-invoice/954073008887/),
plus hotel-invoice references from GooDocs/Freepik teardowns (`image-search/*.jpeg`).

Recurring patterns in every board (the "premium essence"):
1. **One hero, everything else quiet.** A single dominant gesture per sheet — a full-height
   photo rail, an oversized wordmark, a script/display title, or a rich header band. Never two.
2. **Whitespace is the luxury signal.** Margins ≥ 15 mm, line-height ≥ 1.6 for prose,
   ≥ 2.3 mm row padding in folios. Cheap templates fill; premium templates breathe.
3. **Hairlines, not boxes.** 0.5–1 px rules and dotted leaders replace bordered cards/panels.
   Boxes read as "form UI"; hairlines read as "letterhead".
4. **Editorial type scale.** 3 deliberate sizes: display (16–30 pt), body (7.5–8.5 pt),
   micro-labels (6–6.8 pt, ALL-SMALL-CAPS, letterspaced .14–.3em). Nothing in between.
5. **Tabular numerals, right-aligned money column, one accent colour for totals.**
6. **Restrained palette:** paper (white/ivory/cream) + ink + ONE brand accent + ONE metal (gold/copper).
7. **Signature footer:** monogram or seal + signature rule + single-line micro-terms.
   Term walls (2 columns of 6 pt grey) are the fastest "cheap template" tell.
8. **Cultural marks used sparingly:** a deity motif works best as a *seal/medallion* (small,
   framed, intentional), not as a large floating image competing with the wordmark.

## 2. Honest critique of v1 (`invoice-template-preview.html`) — why it felt "not very good"
| Problem | Evidence in v1 | Fix in gallery |
|---|---|---|
| Box soup | 2 bordered party cards + meta box + slabs box + totals box + words plaque + QR box = 7 containers | A: 0 boxes (hairlines); B: 0; C: 1 panel (totals, intentional); D: 0 |
| No hierarchy | type sizes 6.6–10.5 pt, 9 different sizes, all similar weight | 3-size editorial scale per variant |
| Crowded top | blessing + 26 mm deity + wordmark + legal + address + ornament + frame = 60 mm of noise | hero = one gesture; deity → 15–24 mm medallion/seal |
| Gimmicks | rotated PAID stamp, chip pills | flat small-caps "PAID IN FULL" in accent |
| Heavy folio | maroon header band + zebra + 7 boxed columns | hairline tables / dotted ledger leaders |
| Term wall | 2-column 6.6 pt grey block | single 6.2–6.4 pt line, 3 clauses max |
| Double frame | outer + offset outline | removed (C uses a header band instead) |

## 3. The four variants (live in `premium-gallery.html`)
Same GST fixture on all four, so judgement is purely design.

| | **A · Heritage Luxe v2** | **B · Editorial Photo Rail** | **C · Mughal Jewel** | **D · Swiss Minimal Ink** |
|---|---|---|---|---|
| Essence | Refined classic letterhead | Travel-magazine editorial | Regal Indian heritage | Modern executive grid |
| Paper | ivory `#FFFDF8` | warm white `#FDFCF9` | cream `#FBF6EC` | pure white |
| Ink | `#1C1917` | `#22201C` | `#2A2118` | `#111111` |
| Accent | maroon `#7A1F2B` | maroon `#7A1F2B` | emerald `#0D3B33` | sindoor `#C6362B` |
| Metal | gold `#B98A2F` | gold `#C9A24B` | gold `#C9A24B`/`#E7C877` | gold (seal only) |
| Hero | centred seal-deity + letterspaced wordmark | 40 mm lobby photo rail + gold divider | emerald jali band + cusped-arch deity medallion | 24 pt stacked grotesque wordmark + 2.4 mm ink rule |
| Folio | hairline rows, gold small-caps head | dotted-leader ledger list | emerald head band + cream zebra | open grid, 1.2 px ink head rule |
| Totals | double-rule grand line, serif ₹ | right column, top-rule grand | emerald panel, gold numerals | sindoor 2.4 mm rule + 17 pt bold |
| Deity treatment | 20 mm centred medallion | 15 mm beside blessing line | 24 mm inside gold arch | 22 mm circular gold seal at foot |
| Best for | heritage/luxury city hotels | resorts, boutique properties | palaces, heritage havelis, wedding venues | business/corporate hotels, chains |
| Print risk | none | photo strip needs `print-color-adjust` | band needs `print-color-adjust` | none |

**Recommendation:** ship **A as default** (safest ink coverage, closest to v1 brand),
offer **C as the "Heritage Property" theme** and **D as "Corporate"**; B is the marketing
showpiece (photo must be the hotel's own lobby shot in production — the bundled photo is
AI-generated placeholder, same licensing rule as the deity art).

## 4. Design-system rules (apply to ANY future variant)
- Grid: A4 210×297 mm; margins 14–18 mm; 12-column mental grid; folio money columns right-aligned, tabular-nums.
- Type: display serif (Playfair Display) OR grotesque (Inter 800); body Inter 7.5–8.2 pt;
  micro-labels 6.2–6.8 pt small-caps ls .14–.3em; money = JetBrains Mono / tabular Inter.
- Rules: hairline = 1 px `#E6DCC6`-family; strong rule = 1.2 px ink; band = 2–2.4 mm accent.
- Containers: max ONE filled panel per sheet; everything else hairline or open.
- Colour budget: paper + ink + 1 accent + 1 metal; grey only for micro-text (`#6F–#9A` family).
- Deity/logo: always framed (circle/arch/medallion), 15–24 mm, never overlapping type.
- "PAID": flat small-caps in accent, right of grand total. No rotations, no stamps.
- Terms: one line, ≤ 3 clauses, 6.2–6.4 pt, footer.
- Whitespace minimums: 4 mm before folio, 5 mm before totals, 6 mm before signature block.

## 5. AGENT BRIEF — implementing the theme system in the repo
Hand this section to any coding agent (it is self-contained).

### 5.1 Architecture
1. New `src/lib/invoiceThemes.ts`:
   ```ts
   export type InvoiceThemeId = 'heritage' | 'editorial' | 'mughal' | 'swiss';
   export interface InvoiceTheme {
     id: InvoiceThemeId; label: string;
     tokens: { paper, ink, muted, accent, accentDark, metal, hair } ;
     fonts: { display, body, mono, devanagari };       // names registered in setupFonts
     pdf: (inv: Invoice, cfg: InvoicePdfConfig) => TDocumentDefinitions;  // variant layout
     css: string;                                       // variant CSS for the HTML renderer
   }
   export const THEMES: Record<InvoiceThemeId, InvoiceTheme>
   ```
2. `HotelInvoiceConfig` gains `theme: InvoiceThemeId` (default `'heritage'`).
3. `invoicePdf.ts` becomes a dispatcher: `invoiceDocumentDefinition(inv, cfg)` →
   `THEMES[cfg.theme].pdf(inv, cfg)`. Move current layout in as `heritage` **replaced by
   variant A** (v1 layout is retired).
4. `invoicePreview.ts` renders `<style>${theme.css}</style>` + a shared semantic markup
   builder (`folioRowsHtml(inv)`, `totalsHtml(inv)`…) so all themes reuse one markup source.
5. Settings → Invoice Branding gets a **theme picker** (4 radio cards with mini-previews).

### 5.2 HTML → pdfmake mapping (per construct)
| HTML construct | pdfmake node |
|---|---|
| photo rail (B) | page `background` image via `pageMargins` + absolute-positioned `image` in `content[0]` with `absolutePosition:{x:0,y:0}`, `fit:[113,842]` |
| jali band (C) | `canvas` rect fill + tiled pattern: pre-render band as ONE base64 PNG (≤ 40 KB) and `image` with `fit:[595,180]` — do NOT tile SVG in pdfmake |
| arch medallion (C) | pre-rendered PNG (arch+deity fused, transparent) `fit:[85,90]` |
| hairline table | `table.layout` with `hLineWidth:()=>0.7, vLineWidth:()=>0, hLineColor:()=>tokens.hair` |
| dotted leaders (B) | per-row `columns:[desc,{text:'. . .',width:'*'},amt]` OR `canvas` dotted line; leaders are decorative — omit in PDF if fragile |
| small-caps label | `characterSpacing` + uppercase text (pdfmake has no small-caps) |
| grand-total rule (A/D) | `canvas` line above/below the totals `stack`, or `border:[false,true,false,true]` on the node |
| circular seal (D) | pre-rendered PNG circle seal `fit:[62,62]` |
| filled panel (C totals) | node `background` + child margins for padding (pdfmake ignores `padding` off-table) |

### 5.3 Procedure
1. Port variant A from `premium-gallery.html` → `themes/heritage.ts` (pdf) + css string;
   visual-parity test against the gallery sheet (screenshot triptych).
2. Repeat for C and D (skip B until hotel supplies a real lobby photo; keep B in gallery as spec).
3. Pre-render C's band/medallion and D's seal as PNGs via `scripts/render-theme-assets.mjs`
   (node-canvas) OR commit hand-made PNGs ≤ 40 KB each into `src/assets/invoice/themes/`.
4. Theme picker UI + persistence (`invoiceConfig.theme`).
5. Tests: extend `invoiceEngine.test.ts` parity fixture; add `themes.test.ts` asserting every
   theme's doc-def produces identical totals blocks (numbers never drift between themes).
6. Acceptance: each theme → PDF ≤ 200 KB, 1 page for ≤ 12 folio lines, crisp at 400 %,
   `print-color-adjust` respected on Android Chrome print dialog, offline (SW) generation.

### 5.4 Do / Don't
- DO keep all GST blocks identical across themes (slab table, words, QR, signature) — compliance is not themeable.
- DO reuse the fixture in `premium-gallery.html` for parity screenshots.
- DON'T introduce new fonts per theme (Inter/Playfair/NotoDevanagari only — bundle budget).
- DON'T theme the PDF via HTML rasterisation (html2canvas) — vector pdfmake only.
- DON'T let any theme exceed ONE filled panel or TWO accent colours.

## 6. Asset & reference inventory
- `template/premium-gallery.html` — 4 variants, tabbed, self-contained (deity + lobby embedded), prints active sheet at true A4.
- `template/assets/ganesha-600.jpg` / `ganesha-header.png` — deity art (project-licensed).
- `template/assets/lobby-strip.jpg` / `-web.jpg` — AI placeholder lobby photo (replace with hotel's own photo in production).
- `image-search/premium-luxury-invoice-design-layout-ele-1..4.jpeg` — market references (photo-rail & resort layouts).
- Pinterest boards: modern-invoice [1], minimalist [5], corporate [4], typography [3].
