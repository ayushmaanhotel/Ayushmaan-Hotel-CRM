import type { PermissionScope } from './scopes';

export type RoomStatus = 'occupied' | 'cleaning' | 'vacant' | 'maintenance';
export type RoomType = 'Standard King' | 'Deluxe Ocean View' | 'Executive Suite' | 'Presidential Suite';

export interface HotelConfig {
  hotelName: string;
  upiVpa: string;
  merchantName: string;
  gstin: string;
  address: string;
  phone: string;
  email?: string;
  stateName?: string;
  stateCode?: string;
  pan?: string;
  customQrDataUrl?: string | null;
  logoDataUrl?: string | null;
  deityDataUrl?: string | null;
  blessingLine?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  terms?: string[];
  bank?: { name: string; account: string; ifsc: string; branch: string };
}

export interface StaffAccount {
  id: string;
  name: string;
  phone: string;
  roleTitle: string;
  pin: string;
  scopes: PermissionScope[];
  active: boolean;
}

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email: string;
  visits: number;
  totalSpent: number;
  lastStay: string;
  preferredRoomType: RoomType;
  birthday?: string;
  notes?: string;
  isVIP: boolean;
  isForeigner?: boolean;      // triggers C-Form / FRRO reminder (24h compliance)
  cFormDone?: boolean;
  aadhaarVerified: boolean;
  pendingBalance: number;
  avatarUrl?: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  pricePerNight: number;
  status: RoomStatus;
  currentGuest?: Guest;
  checkInTime?: string;
  checkOutTime?: string;
  cleaningProgress?: number;
  readyInMinutes?: number;
  housekeeperAssigned?: string;
  maintenanceNote?: string;
}

export interface Booking {
  id: string;
  bookingRef: string;
  guest: Guest;
  room: Room;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  totalAmount: number;
  paidAmount: number;
  paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Pending';
  status: 'Confirmed' | 'CheckedIn' | 'CheckedOut' | 'Cancelled';
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  time: string;
  guestName: string;
  roomNumber: string;
  amount: number;
  type: 'UPI' | 'Cash' | 'Card';
  status: 'Success' | 'Pending' | 'Refunded';
  gstInvoiceNumber: string;
}

/** Walk-in / phone / OTA enquiry — the lead pipeline small hotels lose money on. */
export interface Inquiry {
  id: string;
  name: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  quotedRate: number;
  source: 'Walk-in' | 'Phone' | 'WhatsApp' | 'OTA';
  status: 'NEW' | 'FOLLOWED' | 'WON' | 'LOST';
  createdAt: string;
  notes?: string;
}

export interface DayClose {
  date: string;                 // yyyy-mm-dd
  expectedCash: number;
  countedCash: number;
  diff: number;
  note: string;
  closedBy: string;
  at: string;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  housekeeperName: string;
  stage: 'dirty' | 'cleaning' | 'inspection' | 'ready';
  priority: 'Normal' | 'High' | 'VIP Urgent';
  updatedAt: string;
}
