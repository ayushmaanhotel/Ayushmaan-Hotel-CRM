/** GSTIN validation: 15 chars, structural regex + mod-36 checksum. */

export const GST_STATE_CODES: Readonly<Record<string, string>> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh', '13': 'Nagaland', '14': 'Manipur',
  '15': 'Mizoram', '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal',
  '20': 'Jharkhand', '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli and Daman & Diu', '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry',
  '35': 'Andaman & Nicobar Islands', '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
  '97': 'Other Territory', '99': 'Centre Jurisdiction',
};

const CHARSET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const STRUCTURE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Returns the expected 15th (check) character for the first 14 characters. */
export function gstinCheckChar(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = CHARSET.indexOf(first14[i]);
    if (value < 0) throw new Error(`Invalid GSTIN character "${first14[i]}"`);
    const product = value * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET[(36 - (sum % 36)) % 36];
}

export type GstinResult =
  | { valid: true; gstin: string; stateCode: string; stateName: string; pan: string }
  | { valid: false; reason: 'format' | 'state' | 'checksum' };

export function normalizeGstin(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase();
}

export function validateGstin(input: string): GstinResult {
  const gstin = normalizeGstin(input);
  if (!STRUCTURE.test(gstin)) return { valid: false, reason: 'format' };
  const stateCode = gstin.slice(0, 2);
  const stateName = GST_STATE_CODES[stateCode];
  if (!stateName) return { valid: false, reason: 'state' };
  if (gstinCheckChar(gstin.slice(0, 14)) !== gstin[14]) return { valid: false, reason: 'checksum' };
  return { valid: true, gstin, stateCode, stateName, pan: gstin.slice(2, 12) };
}
