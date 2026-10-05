import Dexie, { type EntityTable } from 'dexie';
import type { Invoice } from '../domain/invoice.types';
import type { Expense } from '../domain/expense.types';

export interface SequenceRow {
  /** `${docType}|${fy}|${device}` */
  key: string;
  value: number;
}

export interface SettingRow {
  key: string;
  value: unknown;
}

export interface AssetRow {
  /** SHA-256 of the data URL, so identical images are stored once. */
  id: string;
  mime: string;
  dataUrl: string;
  bytes: number;
  createdAt: string;
}

export const DEFAULT_DB_NAME = 'ayushman_hotel_os';

export class HotelDB extends Dexie {
  invoices!: EntityTable<Invoice, 'id'>;
  sequences!: EntityTable<SequenceRow, 'key'>;
  settings!: EntityTable<SettingRow, 'key'>;
  assets!: EntityTable<AssetRow, 'id'>;
  expenses!: EntityTable<Expense, 'id'>;

  constructor(name: string = DEFAULT_DB_NAME) {
    super(name);
    this.version(1).stores({
      // `&number` makes a duplicate invoice number physically impossible on a device.
      invoices: 'id, &number, issuedAt, fy, status, docType, creditNoteOf, [fy+docType]',
      sequences: 'key',
      settings: 'key',
      assets: 'id',
    });
    this.version(2).stores({
      expenses: 'id, &voucherNumber, date, category, status, createdAt, paymentMode, [date+status]',
    });
  }
}

let shared: HotelDB | null = null;

/** App-wide database. Tests construct their own `HotelDB` with a unique name. */
export function getDb(): HotelDB {
  if (!shared) shared = new HotelDB();
  return shared;
}
