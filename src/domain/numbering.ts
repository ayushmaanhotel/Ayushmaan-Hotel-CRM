/**
 * Invoice numbering. GST requires a unique, consecutive serial of at most 16 characters
 * drawn from letters, digits, "/" and "-", per financial year. We run one series per
 * (document kind, FY, device) so offline phones can never collide.
 */
export type DocType = 'invoice' | 'credit-note';

export class NumberingError extends Error {}

const VALID_NUMBER = /^[A-Za-z0-9/-]{1,16}$/;
const VALID_PREFIX = /^[A-Z0-9]{1,4}$/;
const VALID_DEVICE = /^[A-Z]$/;

/** Indian FY (1 April - 31 March) as "25-26". Uses the calendar date in the given ISO string. */
export function financialYear(iso: string): string {
  const year = Number(iso.slice(0, 4));
  const month = Number(iso.slice(5, 7));
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new NumberingError(`Cannot derive financial year from "${iso}"`);
  }
  const start = month >= 4 ? year : year - 1;
  const yy = (n: number) => String(n % 100).padStart(2, '0');
  return `${yy(start)}-${yy(start + 1)}`;
}

export interface SeriesSpec {
  docType: DocType;
  prefix: string;
  fy: string;
  device: string;
}

export function seriesKey(spec: SeriesSpec): string {
  return `${spec.docType}|${spec.fy}|${spec.device}`;
}

/** Human-readable series, e.g. "GHI/25-26/A". */
export function seriesLabel(spec: SeriesSpec): string {
  return spec.docType === 'invoice'
    ? `${spec.prefix}/${spec.fy}/${spec.device}`
    : `${spec.prefix}/${spec.fy}/CN${spec.device}`;
}

export function formatNumber(spec: SeriesSpec, seq: number): string {
  if (!VALID_PREFIX.test(spec.prefix)) throw new NumberingError(`Prefix must be 1-4 of A-Z/0-9: "${spec.prefix}"`);
  if (!VALID_DEVICE.test(spec.device)) throw new NumberingError(`Device letter must be A-Z: "${spec.device}"`);
  if (!/^\d{2}-\d{2}$/.test(spec.fy)) throw new NumberingError(`Bad financial year: "${spec.fy}"`);
  if (!Number.isSafeInteger(seq) || seq < 1) throw new NumberingError(`Sequence must be a positive integer: ${seq}`);
  const padded = String(seq).padStart(spec.docType === 'invoice' ? 4 : 3, '0');
  const number = `${seriesLabel(spec)}${padded}`;
  if (!VALID_NUMBER.test(number)) {
    throw new NumberingError(`Invoice number "${number}" exceeds 16 characters or has invalid characters`);
  }
  return number;
}
