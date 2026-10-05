# Small-Hotel Reality → UX Decisions
### Ayushmaan OS v2 · why each new surface exists · 04-Oct-2026

Field truths of 5–30 room Indian hotels (family-run, 1–2 shifts, owner often absent,
low-end Android, spotty net). Each problem below maps to a shipped surface.

| # | Real problem (as lived) | Cost of ignoring | UX shipped | Where |
|---|---|---|---|---|
| 1 | **"Kal kitna hua? Aaj kya hai?"** — owner calls the desk 3×/day; numbers live in one staff member's head | owner anxiety, distrust of staff | **Day Brief bar**: live occupancy %, collected split (UPI/cash/card), dues, C-Form alerts + one-tap *"WhatsApp me this brief"* in Hinglish | FrontDesk top bar (`hotelOps.computeDailyBrief`) |
| 2 | **Fake/hard-coded dashboard numbers** erode trust faster than no dashboard | staff stop looking at the app | All counters now **live-derived** (occupied/vacant/cleaning/maintenance/due/VIP/enquiries/C-Form) | FrontDesk counter grid |
| 3 | **Enquiries die in notebooks & WhatsApp chats** — no follow-up ⇒ rooms stay empty | 2–5 lost room-nights/week per desk | **Enquiry Pad**: 6-field log (name/phone/dates/quote/source), status pipeline NEW→FOLLOWED→WON/LOST, one-tap Hinglish follow-up that auto-marks FOLLOWED | FrontDesk left card |
| 4 | **Advances & balances are memory** — guest pays ₹2,000 advance, desk forgets balance at checkout | leakage + checkout arguments | Booking step: **Full vs Advance** with live balance hint; voucher shows advance/balance band; invoice issues as PARTIAL; dues surface in brief + register | QuickBooking step 3, voucher, register |
| 5 | **Checkout queue** — folio scattered across paper chits (restaurant, laundry) | bad last impression, lost charges | Checkout from room card **opens the composer pre-seeded** with guest+room (replaces `alert()`); all charges already logged = one-tap final bill | FrontDesk in-house list → composer |
| 6 | **Cash trust between owner & shifts** — drawer vs system mismatches discovered days late | silent skimming | **Shift Day-Close**: expected cash (system) vs counted cash (drawer), diff + note, closed-by stamp; one close per day | Finance cockpit card |
| 7 | **C-Form/FRRO fines** — foreign guest C-Form due in 24h, forgotten at reception | ₹10k+ fines per guest | `isForeigner` flag → **C-FORM DUE** chips on guest rows + brief counter + brief WhatsApp warning | types, FrontDesk, brief |
| 8 | **Reviews never asked at the happy moment** — small hotels live on Google reviews | invisible occupancy ceiling | Voucher (post-payment happiness peak): **"Ask for Google Review on WhatsApp"** with warm Hinglish template + link | BookingVoucherModal |
| 9 | Language barrier (Hindi/Marathi staff) | training cost | Hinglish message templates now; full i18n architecture is next phase (strings isolated in `hotelOps` templates) | roadmap |
| 10 | OTA calendar chaos / overbooking | double-bookings | NOT built (v1 discipline); enquiry `source: OTA` tag keeps the door open | roadmap |

## Design rules applied
- **No new tabs**: every surface lives where the work happens (front desk / finance).
- **One primary action per card** (log / follow / close / ask).
- **Live numbers only** — a wrong number is worse than no number.
- **Messages sound like the hotel**, not a SaaS robot (Namaste Ji, 🙏, hold-for-2-hours).
- **Trust features are stamps, not dashboards**: day-close shows who closed, when, diff.

## What we deliberately did NOT build (v1 discipline)
Channel manager / OTA sync, inventory, housekeeping payrolls, multi-property,
dynamic pricing ML, loyalty points. Each fails the "shopkeeper with a customer
in front of him" test for v1.
