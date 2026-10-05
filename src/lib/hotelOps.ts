/**
 * Ayushmaan OS v2 — small-hotel operations helpers (pure, unit-tested)
 * src/lib/hotelOps.ts
 *
 * Born from field problems of 5–30 room Indian hotels:
 *  · owner anxiety every morning ("kal kitna hua? aaj kya hai?")
 *  · cash-trust between owner and front-desk shifts
 *  · enquiries dying in notebooks and WhatsApp chats
 *  · C-Form/FRRO fines for foreign guests forgotten at reception
 *  · reviews never asked at the happy moment (checkout)
 */
import type { Room, Guest, Transaction, Inquiry } from '../types/hotel';
import type { Invoice } from '../types/invoice';

export interface DailyBrief {
  date: string;
  occupied: number;
  vacant: number;
  cleaning: number;
  maintenance: number;
  occupancyPct: number;
  collected: number;
  upi: number;
  cash: number;
  card: number;
  outstanding: number;          // invoice balances still due
  cFormDue: number;             // foreign guests without C-Form submitted
  openInquiries: number;
  vipInHouse: number;
}

export function computeDailyBrief(input: {
  date: string;
  rooms: Room[];
  transactions: Transaction[];
  invoices: Invoice[];
  guests: Guest[];
  inquiries: Inquiry[];
}): DailyBrief {
  const { date, rooms, transactions, invoices, guests, inquiries } = input;
  const todays = transactions.filter(t => t.date === date);
  const occupiedRooms = rooms.filter(r => r.status === 'occupied');
  return {
    date,
    occupied: occupiedRooms.length,
    vacant: rooms.filter(r => r.status === 'vacant').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    occupancyPct: rooms.length ? Math.round((occupiedRooms.length / rooms.length) * 100) : 0,
    collected: todays.reduce((a, t) => a + t.amount, 0),
    upi: todays.filter(t => t.type === 'UPI').reduce((a, t) => a + t.amount, 0),
    cash: todays.filter(t => t.type === 'Cash').reduce((a, t) => a + t.amount, 0),
    card: todays.filter(t => t.type === 'Card').reduce((a, t) => a + t.amount, 0),
    outstanding: invoices
      .filter(i => i.status !== 'CANCELLED')
      .reduce((a, i) => a + i.payment.balanceDue, 0),
    cFormDue: guests.filter(g => g.isForeigner && !g.cFormDone).length,
    openInquiries: inquiries.filter(i => i.status === 'NEW' || i.status === 'FOLLOWED').length,
    vipInHouse: occupiedRooms.filter(r => r.currentGuest?.isVIP).length,
  };
}

/** Owner's morning/evening WhatsApp brief — Hinglish, the way it's actually spoken. */
export function briefWhatsAppText(b: DailyBrief, hotelName: string): string {
  return [
    `🏨 *${hotelName} — Day Brief (${b.date})*`,
    ``,
    `🛏 Occupancy: ${b.occupied}/${b.occupied + b.vacant + b.cleaning + b.maintenance} rooms (${b.occupancyPct}%)`,
    `🧹 Cleaning: ${b.cleaning} · 🔧 Maintenance: ${b.maintenance} · ✅ Vacant ready: ${b.vacant}`,
    ``,
    `💰 Collected today: ₹${b.collected.toLocaleString('en-IN')}`,
    `   UPI ₹${b.upi.toLocaleString('en-IN')} · Cash ₹${b.cash.toLocaleString('en-IN')} · Card ₹${b.card.toLocaleString('en-IN')}`,
    b.outstanding > 0 ? `️ Balance still due: ₹${b.outstanding.toLocaleString('en-IN')}` : `✅ No pending balances`,
    b.cFormDue > 0 ? `🚨 C-Form pending for ${b.cFormDue} foreign guest(s) — submit within 24h` : ``,
    b.openInquiries > 0 ? `📞 ${b.openInquiries} open enquiry(ies) — follow up today` : ``,
    b.vipInHouse > 0 ? `👑 ${b.vipInHouse} VIP guest(s) in house` : ``,
  ].filter(Boolean).join('\n');
}

/** Cash-drawer trust check: what the system expects vs what the shift counted. */
export function dayCloseDiff(expectedCash: number, countedCash: number): number {
  return Math.round((countedCash - expectedCash) * 100) / 100;
}

/** Enquiry follow-up that sounds like the hotel, not a robot. */
export function inquiryFollowUpText(inq: Inquiry, hotelName: string): string {
  return [
    `Namaste ${inq.name} Ji! 🙏`,
    `Thank you for enquiring at *${hotelName}* (${inq.source}).`,
    ``,
    `📅 Stay: ${inq.checkIn} → ${inq.checkOut}`,
    `💰 Quoted: ₹${inq.quotedRate.toLocaleString('en-IN')} per night`,
    ``,
    `Rooms are filling fast for these dates — shall we block one for you?`,
    `Reply YES and we will hold it for 2 hours.`,
  ].join('\n');
}

/** The review ask, timed at the happy moment (checkout). */
export function reviewRequestText(guestName: string, hotelName: string, reviewUrl: string): string {
  return [
    `Dear ${guestName} Ji, 🙏`,
    `It was a pleasure hosting you at *${hotelName}*.`,
    `If your stay was comfortable, a 1-minute Google review helps our small family hotel a lot:`,
    reviewUrl,
    ``,
    `Thank you — come back soon! 🌼`,
  ].join('\n');
}
