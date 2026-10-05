import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import type { Invoice } from './invoice.types';

/** Deterministic JSON: object keys sorted, `undefined` dropped. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error('Cannot canonicalise a non-finite number');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v === undefined ? null : v)).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
  return `{${entries.join(',')}}`;
}

export function sha256Hex(text: string): string {
  return bytesToHex(sha256(utf8ToBytes(text)));
}

export type HashableInvoice = Omit<Invoice, 'hash' | 'status'>;

/** Hash over every invoice field except `status` (mutable lifecycle flag) and `hash` itself. */
export function hashInvoice(invoice: HashableInvoice | Invoice): string {
  const { hash: _hash, status: _status, ...rest } = invoice as Invoice;
  void _hash;
  void _status;
  return sha256Hex(canonicalJson(rest));
}

export function verifyInvoiceHash(invoice: Invoice): boolean {
  return hashInvoice(invoice) === invoice.hash;
}
