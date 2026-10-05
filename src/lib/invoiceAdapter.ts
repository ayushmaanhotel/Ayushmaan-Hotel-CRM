/**
 * Ayushmaan OS v2 — Invoice Domain Adapter
 * Converts between Dexie database Invoice (src/domain/invoice.types.ts)
 * and Vector PDF / HTML Preview Invoice (src/types/invoice.ts).
 */
import type { Invoice as DomainInvoice } from '../domain/invoice.types';
import type { Invoice as VectorInvoice, FolioItem, FolioCategory, GstRate } from '../types/invoice';
import type { HotelConfig } from '../types/hotel';
import { paiseToRupees } from '../domain/money';
import { computeTotals } from './invoiceEngine';

export function domainInvoiceToVectorInvoice(
  inv: DomainInvoice,
  hotelConfig?: Partial<HotelConfig>
): VectorInvoice {
  const isInterState = inv.interState ?? false;
  const supplyType = isInterState ? 'INTER' : 'INTRA';

  // Map lines to FolioItems
  const items: FolioItem[] = inv.lines.map((l, index) => {
    let category: FolioCategory = 'ROOM';
    if (l.kind === 'food') category = 'FNB';
    else if (l.kind === 'laundry') category = 'LAUNDRY';
    else if (l.kind === 'service') category = 'EXTRA';
    else if (l.kind === 'other') category = 'EXTRA';

    const gstRate = ((l.taxRateBp || 0) / 100) as GstRate;
    const rateRupees = paiseToRupees(l.unitPrice);
    const taxableRupees = paiseToRupees(l.taxable);

    return {
      id: l.id || `item-${index + 1}`,
      date: inv.issuedAt ? inv.issuedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
      description: l.description,
      category,
      sac: l.sac || '996311',
      qty: l.qty || 1,
      rate: rateRupees,
      gstRate,
      amount: taxableRupees,
      roomId: inv.stay?.roomNo,
    };
  });

  // Calculate full slab breakdown and totals
  const totals = computeTotals(items, supplyType);

  // Parse issue date & time
  const issueDate = inv.issuedAt ? inv.issuedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const issueTime = inv.issuedAt && inv.issuedAt.length >= 16 ? inv.issuedAt.slice(11, 16) : '12:00';

  // Extract payment details
  const grandTotalRupees = paiseToRupees(inv.totals.grandTotal);
  const balanceDueRupees = paiseToRupees(inv.balanceDue ?? 0);
  const receivedRupees = Math.max(0, grandTotalRupees - balanceDueRupees);

  const primaryPayment = inv.payments?.[0];
  const paymentMethod = primaryPayment?.mode === 'Cash' 
    ? 'Cash' 
    : primaryPayment?.mode === 'Card' 
    ? 'Card' 
    : 'UPI';

  const paymentEntries = (inv.payments || []).map((p) => ({
    date: p.at ? p.at.slice(0, 10) : issueDate,
    mode: p.mode,
    amount: paiseToRupees(p.amount),
    ref: p.ref,
  }));

  const paperSize = (inv.brand?.paper === 'A5' ? 'A5' : 'A4') as 'A4' | 'A5';

  return {
    id: inv.id,
    invoiceNumber: inv.number,
    fiscalYear: inv.fy || '2025-26',
    issueDate,
    issueTime,
    bookingRef: inv.stay?.bookingRef,
    guest: {
      name: inv.buyer?.name || 'Valued Guest',
      phone: inv.buyer?.phone || '',
      gstin: inv.buyer?.gstin || null,
      address: inv.buyer?.address || '',
      stateName: hotelConfig?.stateName || 'Maharashtra',
      stateCode: inv.supplier?.stateCode || hotelConfig?.stateCode || '27',
    },
    stay: inv.stay
      ? {
          roomNumber: inv.stay.roomNo,
          roomType: inv.stay.roomType || 'Standard',
          checkIn: inv.stay.checkIn || issueDate,
          checkOut: inv.stay.checkOut || issueDate,
          nights: inv.stay.nights || 1,
          tariffPerNight: items[0]?.rate || 3500,
        }
      : undefined,
    items,
    payment: {
      method: paymentMethod,
      status: balanceDueRupees <= 0 ? 'PAID' : receivedRupees > 0 ? 'PARTIAL' : 'UNPAID',
      received: receivedRupees,
      balanceDue: balanceDueRupees,
      entries: paymentEntries.length > 0 ? paymentEntries : [{
        date: issueDate,
        mode: paymentMethod,
        amount: receivedRupees,
      }],
      upiVpa: inv.supplier?.upiVpa || hotelConfig?.upiVpa || 'grandheritage@upi',
    },
    supplyType,
    placeOfSupply: `${hotelConfig?.stateName || 'Maharashtra'} (${inv.supplier?.stateCode || hotelConfig?.stateCode || '27'})`,
    totals,
    mode: 'GST',
    status: inv.status === 'cancelled' ? 'CANCELLED' : 'ISSUED',
    issuedBy: inv.createdBy || 'Front Desk',
    paperSize,
    originalFor: 'RECIPIENT',
  };
}
