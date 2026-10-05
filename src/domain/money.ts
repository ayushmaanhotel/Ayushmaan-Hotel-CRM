/**
 * Money primitives. All amounts are INTEGER PAISE. Floats never touch a ledger.
 */
export type Paise = number;

export class MoneyError extends Error {}

export function assertPaise(value: number, label = 'amount'): asserts value is Paise {
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} must be an integer number of paise, got ${value}`);
  }
}

export function rupeesToPaise(rupees: number): Paise {
  if (!Number.isFinite(rupees)) throw new MoneyError(`Invalid rupee value: ${rupees}`);
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: Paise): number {
  return paise / 100;
}

/** Integer division rounded half away from zero. `den` must be a positive integer. */
export function roundDiv(num: number, den: number): number {
  if (!Number.isSafeInteger(num) || !Number.isSafeInteger(den) || den <= 0) {
    throw new MoneyError(`roundDiv needs integer num and positive integer den (${num}/${den})`);
  }
  const sign = num < 0 ? -1 : 1;
  const abs = Math.abs(num);
  const res = sign * Math.floor((abs * 2 + den) / (den * 2));
  return res === 0 ? 0 : res;
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const inrWholeFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** "₹1,23,456.00" (lakh/crore grouping). */
export function formatINR(paise: Paise, opts: { decimals?: boolean } = {}): string {
  assertPaise(paise);
  const decimals = opts.decimals ?? true;
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const body = decimals ? inrFormatter.format(abs / 100) : inrWholeFormatter.format(Math.round(abs / 100));
  return `${negative ? '-' : ''}\u20B9${body}`;
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  const t = TENS[Math.floor(n / 10)];
  const o = ONES[n % 10];
  return o ? `${t} ${o}` : t;
}

function below1000(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h) parts.push(`${ONES[h]} Hundred`);
  if (rest) parts.push(below100(rest));
  return parts.join(' ');
}

/** Indian-system words for a whole number of rupees (crore / lakh / thousand). */
export function rupeesInWords(rupees: number): string {
  if (!Number.isSafeInteger(rupees) || rupees < 0) throw new MoneyError(`Invalid rupees: ${rupees}`);
  if (rupees === 0) return 'Zero';
  const parts: string[] = [];
  let n = rupees;
  const crore = Math.floor(n / 10_000_000);
  n %= 10_000_000;
  const lakh = Math.floor(n / 100_000);
  n %= 100_000;
  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (crore) parts.push(`${rupeesInWords(crore)} Crore`);
  if (lakh) parts.push(`${below100(lakh)} Lakh`);
  if (thousand) parts.push(`${below100(thousand)} Thousand`);
  if (n) parts.push(below1000(n));
  return parts.join(' ');
}

/** "Rupees Six Thousand Three Hundred And Fifty Paise Only". Negative amounts are rejected. */
export function amountInWords(paise: Paise): string {
  assertPaise(paise);
  if (paise < 0) throw new MoneyError('amountInWords does not accept negative amounts');
  const rupees = Math.floor(paise / 100);
  const ps = paise % 100;
  const rupeePart = `Rupees ${rupeesInWords(rupees)}`;
  if (ps === 0) return `${rupeePart} Only`;
  const paisePart = `${below100(ps)} Paise`;
  return rupees === 0 ? `${paisePart} Only` : `${rupeePart} And ${paisePart} Only`;
}
