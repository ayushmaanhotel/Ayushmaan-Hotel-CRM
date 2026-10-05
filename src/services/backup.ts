import { getDb, type HotelDB } from '../db/schema';
import type { Invoice } from '../domain/invoice.types';

export interface BackupData {
  version: 1;
  exportedAt: string;
  invoices: Invoice[];
  sequences: Array<{ key: string; value: number }>;
  settings: Array<{ key: string; value: unknown }>;
  assets: Array<{ id: string; mime: string; dataUrl: string; bytes: number; createdAt: string }>;
}

export async function exportDatabaseToJson(customDb?: HotelDB): Promise<string> {
  const db = customDb || getDb();
  const invoices = await db.invoices.toArray();
  const sequences = await db.sequences.toArray();
  const settings = await db.settings.toArray();
  const assets = await db.assets.toArray();

  const backup: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    invoices,
    sequences,
    settings,
    assets,
  };

  return JSON.stringify(backup, null, 2);
}

export async function importDatabaseFromJson(
  jsonString: string,
  customDb?: HotelDB,
): Promise<{ invoicesImported: number }> {
  const db = customDb || getDb();
  const data: BackupData = JSON.parse(jsonString);

  if (data.version !== 1 || !Array.isArray(data.invoices)) {
    throw new Error('Invalid or unsupported backup file format');
  }

  await db.transaction('rw', db.invoices, db.sequences, db.settings, db.assets, async () => {
    if (data.invoices.length > 0) {
      await db.invoices.bulkPut(data.invoices);
    }
    if (data.sequences?.length > 0) {
      await db.sequences.bulkPut(data.sequences);
    }
    if (data.settings?.length > 0) {
      await db.settings.bulkPut(data.settings);
    }
    if (data.assets?.length > 0) {
      await db.assets.bulkPut(data.assets);
    }
  });

  return { invoicesImported: data.invoices.length };
}

/** Triggers a browser download of the exported JSON backup file. */
export function downloadBackupFile(jsonString: string, filename?: string): void {
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `ayushman_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
