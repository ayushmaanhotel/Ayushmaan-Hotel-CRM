import { useState, useEffect } from 'react';
import type { Room, Guest, Transaction, HousekeepingTask, RoomStatus, HotelConfig, StaffAccount } from '../types/hotel';
import type { PermissionScope } from '../types/scopes';
import { ROLE_DEFAULT_SCOPES } from '../types/scopes';
import { INITIAL_ROOMS, MOCK_GUESTS, INITIAL_TRANSACTIONS, INITIAL_TASKS } from '../data/mockData';
import type { Invoice, HotelInvoiceConfig, FolioItem, InvoiceDraft } from '../types/invoice';
import { buildInvoice, accommodationGstRate, taxableFromInclusive, round2, derivePaymentStatus } from '../lib/invoiceEngine';
import ganeshaArt from '../assets/invoice/ganesha.jpg?inline';

export type UserRole = 'owner' | 'manager' | 'receptionist' | 'housekeeper' | 'guest';

export const DEFAULT_HOTEL_CONFIG: HotelConfig = {
  hotelName: 'Grand Heritage Inn Hotel',
  upiVpa: 'grandheritage@upi',
  merchantName: 'Grand Heritage Inn Hospitality Pvt Ltd',
  gstin: '27AABCG1234H1Z5',
  address: 'Beach Road, Bandra West, Mumbai 400050',
  phone: '+91 98765 43210'
};

export const DEFAULT_INVOICE_CONFIG: HotelInvoiceConfig = {
  invoicePrefix: 'GHI',
  gstEnabled: true,
  legalName: 'Grand Heritage Inn Hospitality Pvt Ltd',
  stateName: 'Maharashtra',
  stateCode: '27',
  pan: 'AABCG1234H',
  bank: { name: 'HDFC Bank', account: '50200011223344', ifsc: 'HDFC0000123', branch: 'Bandra West Br.' },
  logoDataUrl: null,
  deityDataUrl: ganeshaArt,
  blessingLine: '॥ श्री गणेशाय नमः ॥',
  signatoryName: 'Aman Varma',
  signatoryTitle: 'General Manager',
  terms: [
    'Goods/services once sold are not returnable. Service disputes, if any, subject to Mumbai jurisdiction only.',
    'This invoice is issued under Section 31 read with Rule 46 of the CGST Rules, 2017.',
    'Cheques/drafts in favour of “Grand Heritage Inn Hospitality Pvt Ltd”, payable at Mumbai.',
    'Interest @18% p.a. chargeable on bills unpaid beyond 15 days of issue.',
    'E.& O.E. — subject to realisation of cheques/UPI settlements.',
    'Please quote invoice number in all correspondences.',
  ],
};

export const DEFAULT_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'STF-101',
    name: 'Aman Varma (Admin / Owner)',
    phone: '+91 98765 43210',
    roleTitle: 'Hotel Owner & General Manager',
    pin: '9999',
    scopes: [...ROLE_DEFAULT_SCOPES.owner],
    active: true
  },
  {
    id: 'STF-102',
    name: 'Priya Nair (Front Desk Lead)',
    phone: '+91 98200 11223',
    roleTitle: 'Senior Receptionist',
    pin: '2222',
    scopes: [...ROLE_DEFAULT_SCOPES.receptionist],
    active: true
  },
  {
    id: 'STF-103',
    name: 'Suresh Kumar (Housekeeping)',
    phone: '+91 97411 22334',
    roleTitle: 'Housekeeper Staff',
    pin: '1111',
    scopes: [...ROLE_DEFAULT_SCOPES.housekeeper],
    active: true
  }
];

export function useHotelStore() {
  const [hotelConfig, setHotelConfig] = useState<HotelConfig>(() => {
    const saved = localStorage.getItem('ayushmaan_hotel_config');
    return saved ? JSON.parse(saved) : DEFAULT_HOTEL_CONFIG;
  });

  const [staffAccounts, setStaffAccounts] = useState<StaffAccount[]>(() => {
    const saved = localStorage.getItem('ayushmaan_staff_accounts');
    return saved ? JSON.parse(saved) : DEFAULT_STAFF_ACCOUNTS;
  });

  const [currentStaff, setCurrentStaff] = useState<StaffAccount | null>(() => {
    const saved = localStorage.getItem('ayushmaan_current_staff');
    return saved ? JSON.parse(saved) : DEFAULT_STAFF_ACCOUNTS[0];
  });

  const [activeRole, setActiveRole] = useState<UserRole>(() => {
    return (localStorage.getItem('ayushmaan_role') as UserRole) || 'owner';
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('ayushmaan_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [guests, setGuests] = useState<Guest[]>(() => {
    const saved = localStorage.getItem('ayushmaan_guests');
    return saved ? JSON.parse(saved) : MOCK_GUESTS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ayushmaan_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [tasks, setTasks] = useState<HousekeepingTask[]>(() => {
    const saved = localStorage.getItem('ayushmaan_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // ---- Premium invoicing (Phase 1) ----
  const [invoiceConfig, setInvoiceConfig] = useState<HotelInvoiceConfig>(() => {
    const saved = localStorage.getItem('ayushmaan_invoice_config');
    return saved ? { ...DEFAULT_INVOICE_CONFIG, ...JSON.parse(saved) } : DEFAULT_INVOICE_CONFIG;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('ayushmaan_invoices');
    return saved ? JSON.parse(saved) : [];
  });

  // LocalStorage Persistence Sync
  useEffect(() => {
    localStorage.setItem('ayushmaan_hotel_config', JSON.stringify(hotelConfig));
  }, [hotelConfig]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_staff_accounts', JSON.stringify(staffAccounts));
  }, [staffAccounts]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_current_staff', JSON.stringify(currentStaff));
  }, [currentStaff]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_role', activeRole);
  }, [activeRole]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_guests', JSON.stringify(guests));
  }, [guests]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_invoice_config', JSON.stringify(invoiceConfig));
  }, [invoiceConfig]);

  useEffect(() => {
    localStorage.setItem('ayushmaan_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Check Scope Utility
  const hasScope = (scope: PermissionScope): boolean => {
    if (activeRole === 'owner') return true;
    if (!currentStaff) return false;
    return currentStaff.scopes.includes(scope);
  };

  const updateHotelConfig = (newConfig: Partial<HotelConfig>) => {
    setHotelConfig(prev => ({ ...prev, ...newConfig }));
  };

  const saveStaffAccount = (staff: StaffAccount) => {
    setStaffAccounts(prev => {
      const idx = prev.findIndex(s => s.id === staff.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = staff;
        return copy;
      }
      return [...prev, staff];
    });
  };

  const updateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
  };

  const addBooking = (details: {
    room: Room;
    guestName: string;
    phone: string;
    nights: number;
    paymentMode: 'UPI' | 'Cash' | 'Card';
    totalAmount: number;
  }) => {
    const bookingRef = `AYU-${Date.now().toString().slice(-4)}`;

    const existingGuest = guests.find(g => g.phone.includes(details.phone));
    const guestObj: Guest = existingGuest ? {
      ...existingGuest,
      visits: existingGuest.visits + 1,
      totalSpent: existingGuest.totalSpent + details.totalAmount,
      lastStay: '2026-07-24'
    } : {
      id: `g-${Date.now()}`,
      name: details.guestName,
      phone: details.phone,
      email: 'guest@hotel.in',
      visits: 1,
      totalSpent: details.totalAmount,
      lastStay: '2026-07-24',
      preferredRoomType: details.room.type,
      isVIP: false,
      aadhaarVerified: true,
      pendingBalance: 0
    };

    if (!existingGuest) {
      setGuests(prev => [guestObj, ...prev]);
    } else {
      setGuests(prev => prev.map(g => g.id === guestObj.id ? guestObj : g));
    }

    setRooms(prev => prev.map(r => {
      if (r.id === details.room.id) {
        return {
          ...r,
          status: 'occupied',
          currentGuest: guestObj,
          checkInTime: 'Just Now',
          checkOutTime: `${details.nights} Night(s) Stay`
        };
      }
      return r;
    }));

    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: '2026-07-24',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      guestName: details.guestName,
      roomNumber: details.room.number,
      amount: details.totalAmount,
      type: details.paymentMode,
      status: 'Success',
      gstInvoiceNumber: `INV-2026-0${Math.floor(100 + Math.random() * 900)}`
    };
    setTransactions(prev => [newTx, ...prev]);

    return { bookingRef, guestObj, newTx };
  };

  const updateTaskStage = (taskId: string, newStage: 'dirty' | 'cleaning' | 'inspection' | 'ready') => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        if (newStage === 'ready') {
          setRooms(rPrev => rPrev.map(r => r.number === t.roomNumber ? { ...r, status: 'vacant' } : r));
        }
        return { ...t, stage: newStage, updatedAt: 'Just Now' };
      }
      return t;
    }));
  };

  const updateInvoiceConfig = (patch: Partial<HotelInvoiceConfig>) => {
    setInvoiceConfig(prev => ({ ...prev, ...patch }));
  };

  /**
   * Issue a legal GST tax invoice from a collected (GST-inclusive) amount.
   * Taxable value is derived forward-compliantly per slab; the guest-facing
   * total never changes versus what was quoted/collected.
   */
  const issueInvoice = (input: {
    guestName: string;
    phone: string;
    email?: string;
    address?: string;
    gstin?: string | null;
    stateName?: string;
    stateCode?: string;
    stay?: {
      roomNumber: string; roomType: string;
      checkIn: string; checkOut: string;
      nights: number; tariffPerNight: number;
    };
    inclusiveAmount: number;
    paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Mixed';
    paymentRef?: string;
    bookingRef?: string;
    transactionId?: string;
    items?: FolioItem[];          // composer-supplied folio (full billing mode)
    mode?: 'SIMPLE' | 'GST';      // override config default (progressive disclosure)
    settled?: boolean;            // true ⇒ mark fully received at issue (legacy paths)
    received?: number;            // explicit amount received (composer partial payments)
  }): Invoice => {
    const stateCode = input.stateCode ?? invoiceConfig.stateCode;
    const stateName = input.stateName ?? invoiceConfig.stateName;
    const mode: 'SIMPLE' | 'GST' = input.mode ?? (invoiceConfig.gstEnabled === false ? 'SIMPLE' : 'GST');
    const tariff = input.stay?.tariffPerNight ?? input.inclusiveAmount;
    const slab = accommodationGstRate(tariff);
    const nights = Math.max(1, input.stay?.nights ?? 1);
    const taxable = taxableFromInclusive(input.inclusiveAmount, slab);

    const items: FolioItem[] = input.items && input.items.length > 0 ? input.items : [{
      id: `fi-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      description: input.stay
        ? `Room Tariff — ${input.stay.roomType} (Room ${input.stay.roomNumber})`
        : 'Hotel Room Accommodation',
      category: 'ROOM',
      sac: '996311',
      qty: nights,
      rate: round2(taxable / nights),
      gstRate: slab,
      amount: taxable,
      notes: mode === 'SIMPLE' ? undefined : `slab ${slab}% (tariff ₹${tariff.toLocaleString('en-IN')}/night)`,
    }];

    const nowIso = new Date().toISOString().slice(0, 10);
    const invoice = buildInvoice({
      config: invoiceConfig,
      mode,
      guest: {
        name: input.guestName,
        phone: input.phone,
        email: input.email,
        address: input.address,
        gstin: input.gstin ?? null,
        stateName,
        stateCode,
      },
      stay: input.stay,
      items,
      payment: {
        method: input.paymentMethod,
        status: 'UNPAID' as const,   // recomputed by buildInvoice from received vs total
        received: input.received ?? input.inclusiveAmount,
        balanceDue: 0,
        entries: [{ date: nowIso, mode: input.paymentMethod, amount: input.received ?? input.inclusiveAmount, ref: input.paymentRef }],
        upiVpa: hotelConfig.upiVpa,
      },
      bookingRef: input.bookingRef,
      issuedBy: currentStaff?.name ?? 'Front Desk',
    });

    if (input.settled !== false) {
      // settle against the computed grand total (round-off safe)
      invoice.payment = {
        ...invoice.payment,
        status: 'PAID',
        received: invoice.totals.grandTotal,
        balanceDue: 0,
        entries: invoice.payment.entries.map(e => ({ ...e, amount: invoice.totals.grandTotal })),
      };
    }
    invoice.transactionId = input.transactionId;

    setInvoices(prev => [invoice, ...prev]);
    return invoice;
  };

  /* ---------- drafts (crash recovery) ---------- */
  const saveDraft = (draft: InvoiceDraft) => {
    localStorage.setItem('ayushmaan_invoice_draft', JSON.stringify({ ...draft, updatedAt: new Date().toISOString() }));
  };
  const readDraft = (): InvoiceDraft | null => {
    try {
      const raw = localStorage.getItem('ayushmaan_invoice_draft');
      return raw ? (JSON.parse(raw) as InvoiceDraft) : null;
    } catch { return null; }
  };
  const clearDraft = () => localStorage.removeItem('ayushmaan_invoice_draft');

  /* ---------- payment lifecycle ---------- */
  const recordPayment = (invoiceId: string, amount: number, mode: 'UPI' | 'Cash' | 'Card') => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== invoiceId || inv.status === 'CANCELLED') return inv;
      const received = round2(inv.payment.received + amount);
      const balanceDue = round2(Math.max(0, inv.totals.grandTotal - received));
      return {
        ...inv,
        payment: {
          ...inv.payment,
          method: inv.payment.method === mode ? inv.payment.method : 'Mixed',
          received,
          balanceDue,
          status: derivePaymentStatus(received, inv.totals.grandTotal),
          entries: [...inv.payment.entries, { date: new Date().toISOString().slice(0, 10), mode, amount }],
        },
      };
    }));
  };

  /** Safeguarded cancel: issued invoices are never deleted, only cancelled with a reason. */
  const cancelInvoice = (invoiceId: string, reason: string) => {
    setInvoices(prev => prev.map(inv =>
      inv.id === invoiceId && inv.status === 'ISSUED'
        ? { ...inv, status: 'CANCELLED', cancelledBy: reason }
        : inv
    ));
  };

  const deleteDraftInvoice = (invoiceId: string) => {
    // hard delete allowed ONLY for drafts (nothing legal was issued yet)
    setInvoices(prev => prev.filter(inv => !(inv.id === invoiceId && inv.status === 'DRAFT')));
  };

  /** Full data-ownership export: everything needed to leave the app. */
  const exportBackup = (): string => JSON.stringify({
    app: 'ayushmaan-os-v2', exportedAt: new Date().toISOString(),
    invoiceConfig, invoices, transactions, guests,
  }, null, 2);

  const resetDemoData = () => {
    localStorage.clear();
    setHotelConfig(DEFAULT_HOTEL_CONFIG);
    setStaffAccounts(DEFAULT_STAFF_ACCOUNTS);
    setCurrentStaff(DEFAULT_STAFF_ACCOUNTS[0]);
    setRooms(INITIAL_ROOMS);
    setGuests(MOCK_GUESTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setTasks(INITIAL_TASKS);
    setInvoices([]);
    setInvoiceConfig(DEFAULT_INVOICE_CONFIG);
    localStorage.removeItem('ayushmaan_invoice_counter_' + new Date().getFullYear() + '-' + String((new Date().getFullYear() + 1) % 100).padStart(2, '0'));
    setActiveRole('owner');
  };

  return {
    hotelConfig,
    updateHotelConfig,
    staffAccounts,
    saveStaffAccount,
    currentStaff,
    setCurrentStaff,
    activeRole,
    setActiveRole,
    rooms,
    guests,
    transactions,
    tasks,
    hasScope,
    updateRoomStatus,
    addBooking,
    updateTaskStage,
    resetDemoData,
    invoiceConfig,
    updateInvoiceConfig,
    invoices,
    issueInvoice,
    saveDraft,
    readDraft,
    clearDraft,
    recordPayment,
    cancelInvoice,
    deleteDraftInvoice,
    exportBackup
  };
}
