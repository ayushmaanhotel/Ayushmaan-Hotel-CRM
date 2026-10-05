import { describe, it, expect } from 'vitest';
import { computeDailyBrief, briefWhatsAppText, dayCloseDiff, inquiryFollowUpText, reviewRequestText } from './hotelOps';
import type { Inquiry } from '../types/hotel';

const rooms = [
  { id: 'r1', number: '101', floor: 1, type: 'Standard King', pricePerNight: 3000, status: 'occupied', currentGuest: { isVIP: true } },
  { id: 'r2', number: '102', floor: 1, type: 'Standard King', pricePerNight: 3000, status: 'vacant' },
  { id: 'r3', number: '103', floor: 1, type: 'Standard King', pricePerNight: 3000, status: 'cleaning' },
  { id: 'r4', number: '104', floor: 1, type: 'Standard King', pricePerNight: 3000, status: 'occupied', currentGuest: { isForeigner: true, cFormDone: false } },
] as any;

const tx = [
  { id: 't1', date: '2026-10-03', time: '10:00', guestName: 'A', roomNumber: '101', amount: 1000, type: 'UPI', status: 'Success', gstInvoiceNumber: 'x' },
  { id: 't2', date: '2026-10-03', time: '11:00', guestName: 'B', roomNumber: '101', amount: 500, type: 'Cash', status: 'Success', gstInvoiceNumber: 'y' },
  { id: 't3', date: '2026-10-02', time: '11:00', guestName: 'C', roomNumber: '101', amount: 900, type: 'Cash', status: 'Success', gstInvoiceNumber: 'z' },
] as any;

const invoices = [{ id: 'i1', status: 'ISSUED', payment: { balanceDue: 2500 } }, { id: 'i2', status: 'CANCELLED', payment: { balanceDue: 9999 } }] as any;
const guests = [{ id: 'g1', isForeigner: true, cFormDone: false }, { id: 'g2', name: 'Foreign In-House', isForeigner: true, cFormDone: false }] as any;
const inquiries = [{ id: 'q1', status: 'NEW' }, { id: 'q2', status: 'WON' }] as any;

describe('daily brief (owner anxiety fix)', () => {
  const b = computeDailyBrief({ date: '2026-10-03', rooms, transactions: tx, invoices, guests, inquiries });
  it('aggregates live ops numbers', () => {
    expect(b.occupied).toBe(2);
    expect(b.vacant).toBe(1);
    expect(b.occupancyPct).toBe(50);
    expect(b.collected).toBe(1500);          // today only, not yesterday
    expect(b.cash).toBe(500);
    expect(b.outstanding).toBe(2500);        // cancelled invoices excluded
    expect(b.cFormDue).toBe(2);              // both foreign guests pending
    expect(b.openInquiries).toBe(1);
    expect(b.vipInHouse).toBe(1);
  });
  it('whatsapp brief is human, Hinglish, and complete', () => {
    const txt = briefWhatsAppText(b, 'Grand Heritage Inn');
    expect(txt).toContain('Day Brief');
    expect(txt).toContain('50%');
    expect(txt).toContain('C-Form pending');
    expect(txt).toContain('₹1,500');
  });
});

describe('cash trust (day close)', () => {
  it('diff math', () => {
    expect(dayCloseDiff(5000, 5000)).toBe(0);
    expect(dayCloseDiff(5000, 4800)).toBe(-200);
    expect(dayCloseDiff(5000, 5000.004)).toBe(0);   // paisa rounding
  });
});

describe('lead & review messages', () => {
  const inq: Inquiry = { id: '1', name: 'Rahul', phone: '98000', checkIn: '2026-10-10', checkOut: '2026-10-12', quotedRate: 2500, source: 'Phone', status: 'NEW', createdAt: '' };
  it('follow-up quotes the rate and creates urgency', () => {
    const t = inquiryFollowUpText(inq, 'Grand Heritage Inn');
    expect(t).toContain('₹2,500');
    expect(t).toContain('hold it for 2 hours');
  });
  it('review ask lands at checkout with a link', () => {
    const t = reviewRequestText('Rohan', 'Grand Heritage Inn', 'https://g.page/r/x/review');
    expect(t).toContain('https://g.page/r/x/review');
    expect(t).toContain('Rohan');
  });
});
