import type { HotelDB } from '../schema';
import type { Invoice } from '../../domain/invoice.types';
import { hashInvoice, verifyInvoiceHash, type HashableInvoice } from '../../domain/hash';
import { formatNumber, seriesKey, seriesLabel, type SeriesSpec } from '../../domain/numbering';

export interface Allocation {
  seq: number;
  number: string;
  series: string;
  fy: string;
}

export interface IssueOptions {
  /** If set, the referenced invoice is flipped to `cancelled` in the SAME transaction (credit-note flow). */
  cancels?: string;
}

export interface ListFilter {
  fy?: string;
  docType?: Invoice['docType'];
  status?: Invoice['status'];
  /** Inclusive ISO date (YYYY-MM-DD) bounds on `issuedAt`. */
  fromDate?: string;
  toDate?: string;
  /** Case-insensitive match on number, buyer name, buyer phone, room. */
  query?: string;
}

export class InvoiceRepoError extends Error {}

/** Storage contract. A Firestore implementation can replace this without touching UI or services. */
export interface InvoiceRepo {
  issue(
    spec: SeriesSpec,
    make: (alloc: Allocation) => HashableInvoice,
    opts?: IssueOptions,
  ): Promise<Invoice>;
  get(id: string): Promise<Invoice | undefined>;
  getByNumber(number: string): Promise<Invoice | undefined>;
  list(filter?: ListFilter): Promise<Invoice[]>;
  creditNotesFor(invoiceId: string): Promise<Invoice[]>;
  verify(id: string): Promise<boolean>;
}

export class DexieInvoiceRepo implements InvoiceRepo {
  private readonly db: HotelDB;

  constructor(db: HotelDB) {
    this.db = db;
  }

  async issue(
    spec: SeriesSpec,
    make: (alloc: Allocation) => HashableInvoice,
    opts: IssueOptions = {},
  ): Promise<Invoice> {
    const { db } = this;
    // Everything below runs in ONE transaction: if `make` throws or the write fails, the
    // sequence counter is not advanced, so numbers stay gapless.
    return db.transaction('rw', db.sequences, db.invoices, async () => {
      if (opts.cancels) {
        const target = await db.invoices.get(opts.cancels);
        if (!target) throw new InvoiceRepoError(`Invoice ${opts.cancels} not found`);
        if (target.docType !== 'invoice') throw new InvoiceRepoError('Only invoices can be cancelled');
        if (target.status === 'cancelled') throw new InvoiceRepoError(`Invoice ${target.number} is already cancelled`);
      }
      const key = seriesKey(spec);
      const row = await db.sequences.get(key);
      const seq = (row?.value ?? 0) + 1;
      const number = formatNumber(spec, seq);
      const draft = make({ seq, number, series: seriesLabel(spec), fy: spec.fy });
      if (draft.number !== number || draft.seq !== seq) {
        throw new InvoiceRepoError('Invoice factory must use the allocated number and sequence');
      }
      const invoice: Invoice = { ...draft, status: 'issued', hash: hashInvoice(draft) };
      await db.invoices.add(invoice);
      await db.sequences.put({ key, value: seq });
      if (opts.cancels) await db.invoices.update(opts.cancels, { status: 'cancelled' });
      return invoice;
    });
  }

  get(id: string): Promise<Invoice | undefined> {
    return this.db.invoices.get(id);
  }

  getByNumber(number: string): Promise<Invoice | undefined> {
    return this.db.invoices.where('number').equals(number).first();
  }

  async list(filter: ListFilter = {}): Promise<Invoice[]> {
    let rows = await this.db.invoices.orderBy('issuedAt').reverse().toArray();
    if (filter.fy) rows = rows.filter((r) => r.fy === filter.fy);
    if (filter.docType) rows = rows.filter((r) => r.docType === filter.docType);
    if (filter.status) rows = rows.filter((r) => r.status === filter.status);
    if (filter.fromDate) rows = rows.filter((r) => r.issuedAt.slice(0, 10) >= filter.fromDate!);
    if (filter.toDate) rows = rows.filter((r) => r.issuedAt.slice(0, 10) <= filter.toDate!);
    if (filter.query) {
      const q = filter.query.trim().toLowerCase();
      if (q) {
        rows = rows.filter((r) =>
          [r.number, r.buyer.name, r.buyer.phone ?? '', r.stay?.roomNo ?? '']
            .some((field) => field.toLowerCase().includes(q)),
        );
      }
    }
    return rows;
  }

  creditNotesFor(invoiceId: string): Promise<Invoice[]> {
    return this.db.invoices.where('creditNoteOf').equals(invoiceId).toArray();
  }

  async verify(id: string): Promise<boolean> {
    const inv = await this.db.invoices.get(id);
    return inv ? verifyInvoiceHash(inv) : false;
  }
}
