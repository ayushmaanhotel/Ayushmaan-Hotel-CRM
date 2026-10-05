import { assertPaise, roundDiv, MoneyError, type Paise } from '../money';
import type { DraftLine, InvoiceLine, InvoiceTotals, PriceMode } from '../invoice.types';
import {
  SAC_OTHER_SERVICE,
  SAC_RESTAURANT,
  SAC_ROOM,
  TAX_RULES,
  type RoomSlab,
  type TaxRuleVersion,
} from './rules';

export interface ComputeOptions {
  priceMode: PriceMode;
  ruleVersion: TaxRuleVersion;
  /** true => IGST only (e.g. SEZ buyer). Hotel stays are otherwise intra-state (CGST + SGST). */
  interState?: boolean;
}

export interface ComputeResult {
  lines: InvoiceLine[];
  totals: InvoiceTotals;
  warnings: string[];
}

export const WARN_SLAB_GAP = 'INCLUSIVE_PRICE_IN_SLAB_GAP';

function validateDraft(line: DraftLine): void {
  if (!Number.isSafeInteger(line.qty) || line.qty < 1) {
    throw new MoneyError(`Line "${line.description}": qty must be a positive integer`);
  }
  assertPaise(line.unitPrice, `Line "${line.description}" unitPrice`);
  assertPaise(line.discount, `Line "${line.description}" discount`);
  if (line.unitPrice < 0 || line.discount < 0) {
    throw new MoneyError(`Line "${line.description}": negative price or discount`);
  }
  if (line.discount > line.qty * line.unitPrice) {
    throw new MoneyError(`Line "${line.description}": discount exceeds line value`);
  }
}

/**
 * Picks the room slab for a per-night value.
 * - exclusive: the supplied value IS the pre-tax value, so choose the first slab whose cap contains it.
 * - inclusive: the supplied value includes tax. Walk slabs ascending and take the first whose derived
 *   pre-tax value fits under its cap. If the price falls in the unsolvable gap between slabs
 *   (e.g. 7,876-8,850 all-in) the result is the higher slab, flagged with a warning.
 */
export function pickRoomRate(
  perNightValue: Paise,
  slabs: readonly RoomSlab[],
  mode: PriceMode,
): { rateBp: number; gap: boolean } {
  if (mode === 'exclusive') {
    const slab = slabs.find((s) => perNightValue <= s.upToPaise) ?? slabs[slabs.length - 1];
    return { rateBp: slab.rateBp, gap: false };
  }
  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];
    const base = roundDiv(perNightValue * 10_000, 10_000 + slab.rateBp);
    if (base <= slab.upToPaise) {
      const prevCap = i > 0 ? slabs[i - 1].upToPaise : -1;
      // Consistent only if the derived base is also above the previous cap.
      return { rateBp: slab.rateBp, gap: base <= prevCap };
    }
  }
  return { rateBp: slabs[slabs.length - 1].rateBp, gap: false };
}

function defaultSac(kind: DraftLine['kind']): string {
  if (kind === 'room' || kind === 'extra-bed') return SAC_ROOM;
  if (kind === 'food') return SAC_RESTAURANT;
  return SAC_OTHER_SERVICE;
}

function splitTax(
  taxable: Paise,
  rateBp: number,
  interState: boolean,
): { cgst: Paise; sgst: Paise; igst: Paise } {
  if (interState) return { cgst: 0, sgst: 0, igst: roundDiv(taxable * rateBp, 10_000) };
  const half = rateBp / 2;
  const each = roundDiv(taxable * half, 10_000);
  return { cgst: each, sgst: each, igst: 0 };
}

export function computeInvoice(draft: readonly DraftLine[], opts: ComputeOptions): ComputeResult {
  if (draft.length === 0) throw new MoneyError('An invoice needs at least one line');
  const rules = TAX_RULES[opts.ruleVersion];
  const interState = opts.interState ?? false;
  const warnings: string[] = [];
  draft.forEach(validateDraft);

  // Pass 1: room lines establish the accommodation rate.
  const roomRates = new Map<string, number>();
  for (const line of draft) {
    if (line.kind !== 'room') continue;
    const gross = line.qty * line.unitPrice - line.discount;
    const perNight = roundDiv(gross, line.qty);
    const { rateBp, gap } = pickRoomRate(perNight, rules.room, opts.priceMode);
    roomRates.set(line.id, rateBp);
    if (gap) warnings.push(`${WARN_SLAB_GAP}:${line.id}`);
  }
  const invoiceRoomRate = roomRates.size > 0 ? Math.max(...roomRates.values()) : rules.fallbackRoomRateBp;

  // Pass 2: derive every line.
  const lines: InvoiceLine[] = draft.map((line) => {
    let rateBp: number;
    switch (line.kind) {
      case 'room':
        rateBp = roomRates.get(line.id) ?? invoiceRoomRate;
        break;
      case 'extra-bed':
        rateBp = invoiceRoomRate; // accommodation add-on follows the room slab
        break;
      case 'food':
        rateBp = rules.restaurantRateBp;
        break;
      default:
        rateBp = line.rateBpOverride ?? rules.defaultServiceRateBp;
    }
    if (!Number.isInteger(rateBp) || rateBp < 0 || rateBp % 2 !== 0) {
      throw new MoneyError(`Line "${line.description}": invalid tax rate ${rateBp}`);
    }

    const gross = line.qty * line.unitPrice - line.discount;
    let taxable: Paise;
    let cgst: Paise;
    let sgst: Paise;
    let igst: Paise;
    let total: Paise;
    if (opts.priceMode === 'exclusive') {
      taxable = gross;
      ({ cgst, sgst, igst } = splitTax(taxable, rateBp, interState));
      total = taxable + cgst + sgst + igst;
    } else {
      total = gross;
      taxable = roundDiv(gross * 10_000, 10_000 + rateBp);
      const tax = total - taxable;
      if (interState) {
        cgst = 0;
        sgst = 0;
        igst = tax;
      } else {
        cgst = roundDiv(tax, 2);
        sgst = tax - cgst; // keeps taxable + tax == total exactly
        igst = 0;
      }
    }
    return {
      id: line.id,
      kind: line.kind,
      description: line.description,
      sac: line.sac ?? defaultSac(line.kind),
      qty: line.qty,
      unitPrice: roundDiv(taxable + line.discount, line.qty),
      discount: line.discount,
      taxRateBp: rateBp,
      taxable,
      cgst,
      sgst,
      igst,
      total,
    };
  });

  const sum = (pick: (l: InvoiceLine) => Paise) => lines.reduce((acc, l) => acc + pick(l), 0);
  const raw = sum((l) => l.total);
  const grandTotal = roundDiv(raw, 100) * 100;
  const totals: InvoiceTotals = {
    taxable: sum((l) => l.taxable),
    cgst: sum((l) => l.cgst),
    sgst: sum((l) => l.sgst),
    igst: sum((l) => l.igst),
    roundOff: grandTotal - raw,
    grandTotal,
  };
  return { lines, totals, warnings };
}
