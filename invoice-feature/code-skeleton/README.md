# Invoice Feature — Drop-in Code Skeleton

Companion code for `INVOICE_FEATURE_STRATEGY.md`. Copy these files into your repo
(`ayushmaan-hotel-crm`) at the same relative paths, then follow the integration steps.

```
code-skeleton/
├── scripts/build-fonts.mjs                  # generates src/lib/vfs-fonts.ts from ./fonts/*.ttf
└── src/
    ├── types/invoice.ts                     # Invoice / FolioItem / HotelInvoiceConfig models
    ├── lib/invoiceEngine.ts                 # GST slabs, totals, sequential numbering, words-in-₹
    ├── lib/invoicePdf.ts                    # pdfmake vector-PDF renderer (the premium template)
    ├── lib/invoicePreview.ts                # on-screen + print HTML renderer (same design)
    ├── lib/setupFonts.ts                    # font registration (₹ + Devanagari safe)
    ├── lib/sharePdf.ts                      # Web Share L2 → WhatsApp, download & print fallbacks
    └── components/finance/PremiumInvoiceModal.tsx
```

## 0. One-time setup

```bash
npm i pdfmake
npm i -D @types/pdfmake          # optional, nicer DX

mkdir -p fonts && cd fonts       # fetch OFL-licensed TTFs (free for commercial use):
#   Inter-Regular/SemiBold/Italic/SemiBoldItalic.ttf            (rsms.me/inter)
#   PlayfairDisplay-Regular/SemiBold/Italic/SemiBoldItalic.ttf  (fonts.google.com)
#   NotoSansDevanagari-Regular/SemiBold.ttf                     (fonts.google.com)
cd .. && node scripts/build-fonts.mjs
```

Assets: put your licensed deity artwork + logo in `src/assets/invoice/`
(e.g. `ganesha.jpg` ≤ 80 KB). In Vite, import as a data-URI string:

```ts
import ganesha from '../../assets/invoice/ganesha.jpg?inline';  // → "data:image/jpeg;base64,…"
```

and store it in config: `invoiceConfig.deityDataUrl = ganesha`.

## 1. Extend the store (`src/hooks/useHotelStore.ts`)

Add to `HotelConfig` consumers a new persisted slice:

```ts
const [invoiceConfig, setInvoiceConfig] = useState<HotelInvoiceConfig>(() => {
  const saved = localStorage.getItem('ayushmaan_invoice_config');
  return saved ? JSON.parse(saved) : DEFAULT_INVOICE_CONFIG;
});
useEffect(() => {
  localStorage.setItem('ayushmaan_invoice_config', JSON.stringify(invoiceConfig));
}, [invoiceConfig]);

const [invoices, setInvoices] = useState<Invoice[]>(() =>
  JSON.parse(localStorage.getItem('ayushmaan_invoices') ?? '[]'));
useEffect(() => {
  localStorage.setItem('ayushmaan_invoices', JSON.stringify(invoices));
}, [invoices]);
```

`DEFAULT_INVOICE_CONFIG` example:

```ts
export const DEFAULT_INVOICE_CONFIG: HotelInvoiceConfig = {
  invoicePrefix: 'GHI',
  legalName: 'Grand Heritage Inn Hospitality Pvt Ltd',
  stateName: 'Maharashtra', stateCode: '27', pan: 'AABCG1234H',
  bank: { name: 'HDFC Bank', account: '50200011223344', ifsc: 'HDFC0000123', branch: 'Bandra West Br.' },
  deityDataUrl: null,            // set from ?inline import
  blessingLine: '॥ श्री गणेशाय नमः ॥',
  signatoryName: 'Aman Varma', signatoryTitle: 'General Manager',
  terms: [
    'Goods/services once sold are not returnable. Disputes subject to Mumbai jurisdiction only.',
    'This invoice is issued under Section 31 read with Rule 46 of the CGST Rules, 2017.',
    'Cheques/drafts in favour of “Grand Heritage Inn Hospitality Pvt Ltd”, payable at Mumbai.',
    'Interest @18% p.a. chargeable on bills unpaid beyond 15 days of issue.',
    'E. & O.E. — subject to realisation of cheques/UPI settlements.',
    'Please quote invoice number in all correspondences.',
  ],
};
```

## 2. Issue an invoice at checkout / from Finance

```ts
import { buildInvoice } from './lib/invoiceEngine';

const invoice = buildInvoice({
  config: invoiceConfig,
  guest: { name: tx.guestName, phone: guestPhone, stateName: 'Maharashtra', stateCode: '27' },
  stay: { roomNumber: tx.roomNumber, roomType: 'Deluxe Ocean View',
          checkIn: isoIn, checkOut: isoOut, nights: 2, tariffPerNight: 6500 },
  items: folioItems,               // build from booking charges; engine fixes gstRate per slab
  payment: { method: tx.type, received: tx.amount, balanceDue: 0,
             entries: [{ date: tx.date, mode: tx.type, amount: tx.amount, ref: upiRef }],
             upiVpa: hotelConfig.upiVpa },
  bookingRef: booking?.bookingRef,
  issuedBy: currentStaff?.name ?? 'Front Desk',
});
setInvoices(prev => [invoice, ...prev]);   // persist BEFORE opening the modal
setSelectedInvoice(invoice);               // opens PremiumInvoiceModal
```

> Keep the old `Transaction` row untouched — it stays your payment ledger.
> `Invoice` is the legal document; link them via `invoice.bookingRef` / a new
> `transactionId` field if you need it.

## 3. Swap the modal in `App.tsx`

```diff
- import { GSTInvoiceModal } from './components/finance/GSTInvoiceModal';
+ import { PremiumInvoiceModal } from './components/finance/PremiumInvoiceModal';

- <GSTInvoiceModal isOpen={...} onClose={...} transaction={...} />
+ <PremiumInvoiceModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)}
+     invoice={selectedInvoice} hotelConfig={hotelConfig} invoiceConfig={invoiceConfig} />
```

## 4. Verify

```bash
npm run dev          # desktop: issue invoice → Share falls back to Download (expected)
npm run build
```

On a real Android phone (Phase 3 of the strategy): install the PWA, issue an
invoice, tap **Share PDF on WhatsApp** → the share sheet must show WhatsApp with
the PDF attached. That single test proves the whole on-device pipeline.

## Notes & known simplifications in this skeleton

- `folioItems` construction (pulling restaurant/laundry charges from a booking)
  is hotel-specific; the strategy doc (§6) specifies the folio capture UI.
- Credit notes / amended invoices (Phase 4) reuse `buildInvoice` with negative
  items and a `CN-` prefix counter.
- pdfmake is lazily imported in `invoicePdf.ts`; consider dynamic
  `import('./invoicePdf')` inside `withPdf()` to keep the first-load bundle small.
