import type { Paise } from '../money';

/**
 * Hotel GST slabs as DATA. Provisional until confirmed by the hotel's CA / CBIC notification text.
 *
 * Room slabs are keyed on the actual per-room, per-night value of supply (after discount, before tax).
 */
export type TaxRuleVersion = '2025-09-22' | '2017-07-01';

export interface RoomSlab {
  /** Inclusive upper bound of the pre-tax per-night value, in paise. `Infinity` = no cap. */
  upToPaise: Paise;
  /** Total GST rate in basis points (500 = 5%). */
  rateBp: number;
}

export interface TaxRuleSet {
  version: TaxRuleVersion;
  /** First calendar date (YYYY-MM-DD) this rule set applies to. */
  effectiveFrom: string;
  room: readonly RoomSlab[];
  restaurantRateBp: number;
  /** Rate applied to services with no explicit override (laundry, misc). */
  defaultServiceRateBp: number;
  /** Rate used for extra-bed style lines when the invoice has no room line. */
  fallbackRoomRateBp: number;
}

export const SAC_ROOM = '996311';
export const SAC_RESTAURANT = '996331';
export const SAC_OTHER_SERVICE = '999799';

export const TAX_RULES: Readonly<Record<TaxRuleVersion, TaxRuleSet>> = {
  '2025-09-22': {
    version: '2025-09-22',
    effectiveFrom: '2025-09-22',
    room: [
      { upToPaise: 100_000, rateBp: 0 },
      { upToPaise: 750_000, rateBp: 500 },
      { upToPaise: Number.POSITIVE_INFINITY, rateBp: 1800 },
    ],
    restaurantRateBp: 500,
    defaultServiceRateBp: 1800,
    fallbackRoomRateBp: 1800,
  },
  '2017-07-01': {
    version: '2017-07-01',
    effectiveFrom: '2017-07-01',
    room: [
      { upToPaise: 100_000, rateBp: 0 },
      { upToPaise: 750_000, rateBp: 1200 },
      { upToPaise: Number.POSITIVE_INFINITY, rateBp: 1800 },
    ],
    restaurantRateBp: 500,
    defaultServiceRateBp: 1800,
    fallbackRoomRateBp: 1800,
  },
};

/** Picks the rule set in force on `isoDate` (YYYY-MM-DD or full ISO). */
export function ruleVersionFor(isoDate: string): TaxRuleVersion {
  const day = isoDate.slice(0, 10);
  return day >= TAX_RULES['2025-09-22'].effectiveFrom ? '2025-09-22' : '2017-07-01';
}
