import { getDb, type HotelDB } from './schema';
import { SettingsRepo } from './repos/settingsRepo';
import { DexieInvoiceRepo } from './repos/invoiceRepo';
import { issueInvoice } from '../services/invoiceService';
import { INITIAL_TRANSACTIONS } from '../data/mockData';
import type { Transaction } from '../types/hotel';

/**
 * Reads legacy localStorage transactions and writes them into Dexie.
 * Always ensures Ayush's VIP invoice and foundational guest invoices exist.
 */
export async function migrateLegacyDataIfNeeded(customDb?: HotelDB): Promise<{ migratedCount: number }> {
  const db = customDb || getDb();
  const settingsRepo = new SettingsRepo(db);
  const invoiceRepo = new DexieInvoiceRepo(db);

  // Ensure initial supplier settings exist
  let supplier = await settingsRepo.getSupplier();
  if (!supplier) {
    const rawSavedConfig = localStorage.getItem('ayushmaan_hotel_config');
    const config = rawSavedConfig ? JSON.parse(rawSavedConfig) : null;
    supplier = await settingsRepo.saveSupplier({
      legalName: config?.merchantName || 'Grand Heritage Inn Hospitality Pvt Ltd',
      tradeName: config?.hotelName || 'Grand Heritage Inn Hotel',
      address: config?.address || 'Beach Road, Bandra West, Mumbai 400050',
      gstin: '27AAPFU0939F1ZV', // Valid Maharashtra test GSTIN
      phone: config?.phone || '+91 98765 43210',
      upiVpa: config?.upiVpa || 'grandheritage@upi',
      invoicePrefix: 'GHI',
      terms: ['Standard check-in: 12:00 PM, Check-out: 11:00 AM.'],
    });
  }

  const branding = await settingsRepo.getBranding();
  const device = await settingsRepo.getDevice();

  let migratedCount = 0;
  const flag = await db.settings.get('migrated_legacy_transactions');

  if (flag?.value !== true) {
    const rawTx = localStorage.getItem('ayushmaan_transactions');
    let txList: Transaction[] = [];
    if (rawTx) {
      try {
        txList = JSON.parse(rawTx);
      } catch {
        txList = [];
      }
    }
    if (txList.length === 0) {
      txList = INITIAL_TRANSACTIONS;
    }

    for (const tx of txList) {
      const parsedDate = new Date(`${tx.date}T${tx.time || '12:00:00'}`);
      const now = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      try {
        await issueInvoice(invoiceRepo, {
          supplier,
          branding,
          device,
          createdBy: 'MIGRATION',
          buyer: {
            name: tx.guestName || 'Guest',
          },
          stay: {
            roomNo: tx.roomNumber,
            nights: 1,
          },
          lines: [
            {
              id: `legacy-${tx.id}`,
              kind: 'room',
              description: `Room ${tx.roomNumber} Accommodation`,
              qty: 1,
              unitPrice: tx.amount * 100, // paise
              discount: 0,
            },
          ],
          payments: [
            {
              mode: (tx.type as any) || 'UPI',
              amount: tx.amount * 100,
              at: now.toISOString(),
            },
          ],
          now,
        });
        migratedCount++;
      } catch {
        // Continue migrating other records if one fails
      }
    }
    await db.settings.put({ key: 'migrated_legacy_transactions', value: true });
  }

  // Ensure Ayush's VIP invoice is present in Dexie
  try {
    const allInvoices = await invoiceRepo.list();
    const hasAyush = allInvoices.some(inv => inv.buyer.name.toLowerCase().includes('ayush'));
    if (!hasAyush) {
      await issueInvoice(invoiceRepo, {
        supplier,
        branding,
        device,
        createdBy: 'VIP_DESK',
        buyer: {
          name: 'Ayush',
          phone: '+91 99999 88888',
          address: 'Presidential Penthouse Suite 301, Grand Heritage Inn, Mumbai',
        },
        stay: {
          roomNo: '301',
          checkIn: '2026-07-23',
          checkOut: '2026-07-25',
          nights: 2,
        },
        lines: [
          {
            id: 'line-ayush-room',
            kind: 'room',
            description: 'Presidential Royal Suite 301 (2 Nights Stay)',
            qty: 2,
            unitPrice: 1250000, // ₹12,500.00 / night
            discount: 0,
          },
          {
            id: 'line-ayush-dining',
            kind: 'food',
            description: 'Chef Curated In-Room Royal Degustation Menu',
            qty: 1,
            unitPrice: 350000, // ₹3,500.00
            discount: 0,
          },
          {
            id: 'line-ayush-chauffeur',
            kind: 'service',
            description: 'VIP Luxury Chauffeur Airport Transfer',
            qty: 1,
            unitPrice: 150000, // ₹1,500.00
            discount: 0,
          },
        ],
        payments: [
          {
            mode: 'UPI',
            amount: 3000000, // ₹30,000.00
            at: new Date().toISOString(),
          },
        ],
      });
      migratedCount++;
    }
  } catch (err) {
    console.warn('Failed to seed Ayush invoice:', err);
  }

  return { migratedCount };
}
