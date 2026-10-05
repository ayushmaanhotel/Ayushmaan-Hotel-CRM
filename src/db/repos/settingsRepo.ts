import { z } from 'zod';
import type { HotelDB, AssetRow } from '../schema';
import type { SupplierSnapshot, BrandSnapshot } from '../../domain/invoice.types';
import { normalizeGstin, validateGstin } from '../../domain/gst/gstin';
import { newId } from '../../domain/id';
import { sha256Hex } from '../../domain/hash';

const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : undefined), z.string().max(max).optional());

export const SupplierProfileSchema = z.object({
  legalName: z.string().trim().min(2, 'Legal name is required').max(120),
  tradeName: z.string().trim().min(2, 'Hotel name is required').max(80),
  address: z.string().trim().min(5, 'Address is required').max(300),
  gstin: z
    .string()
    .transform(normalizeGstin)
    .refine((g) => validateGstin(g).valid, 'Enter a valid 15-character GSTIN'),
  phone: z.string().trim().min(7, 'Phone is required').max(20),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || z.email().safeParse(v).success, 'Invalid email'),
  upiVpa: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => v === undefined || /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(v), 'Invalid UPI ID'),
  bank: z
    .object({
      accountName: z.string().trim().min(2).max(100),
      accountNumber: z.string().trim().regex(/^\d{6,18}$/, 'Account number must be 6-18 digits'),
      ifsc: z.string().trim().toUpperCase().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC'),
      bankName: z.string().trim().min(2).max(80),
    })
    .optional(),
  /** Invoice-number prefix, 1-4 chars of A-Z / 0-9. */
  invoicePrefix: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,4}$/, 'Prefix must be 1-4 letters or digits'),
  logoAssetId: optionalText(80),
  signatureAssetId: optionalText(80),
  stampAssetId: optionalText(80),
  terms: z.array(z.string().trim().min(1).max(200)).max(8).default([]),
});
export type SupplierProfile = z.infer<typeof SupplierProfileSchema>;

export const BrandingSchema = z.object({
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Use a 6-digit hex colour').default('#5B1A1A'),
  showDeity: z.boolean().default(true),
  deityAssetId: optionalText(80),
  shloka: z.string().trim().max(60).default('\u0965 \u0936\u094D\u0930\u0940 \u0917\u0923\u0947\u0936\u093E\u092F \u0928\u092E\u0903 \u0965'),
  paper: z.enum(['A4', 'A5', 'T80', 'T58']).default('A4'),
  templateId: z.string().default('heritage'),
  priceMode: z.enum(['inclusive', 'exclusive']).default('inclusive'),
});
export type BrandingSettings = z.infer<typeof BrandingSchema>;

export const DEFAULT_BRANDING: BrandingSettings = BrandingSchema.parse({});

export interface DeviceIdentity {
  deviceId: string;
  /** Single letter A-Z naming this phone's invoice series. */
  deviceLetter: string;
}

const MAX_ASSET_BYTES = 300 * 1024;
const ASSET_MIME = /^data:(image\/(?:png|jpeg|webp));base64,[A-Za-z0-9+/=]+$/;

export class SettingsError extends Error {}

export function toSupplierSnapshot(p: SupplierProfile): SupplierSnapshot {
  const g = validateGstin(p.gstin);
  if (!g.valid) throw new SettingsError('Supplier GSTIN is invalid');
  return {
    legalName: p.legalName,
    tradeName: p.tradeName,
    address: p.address,
    gstin: g.gstin,
    stateCode: g.stateCode,
    pan: g.pan,
    phone: p.phone,
    email: p.email,
    upiVpa: p.upiVpa,
    bank: p.bank,
    logoAssetId: p.logoAssetId,
    signatureAssetId: p.signatureAssetId,
    stampAssetId: p.stampAssetId,
    terms: p.terms,
  };
}

export function toBrandSnapshot(b: BrandingSettings): BrandSnapshot {
  return {
    accent: b.accent,
    showDeity: b.showDeity && Boolean(b.deityAssetId),
    deityAssetId: b.deityAssetId,
    shloka: b.shloka,
    paper: b.paper,
  };
}

export class SettingsRepo {
  private readonly db: HotelDB;

  constructor(db: HotelDB) {
    this.db = db;
  }

  async getSupplier(): Promise<SupplierProfile | undefined> {
    const row = await this.db.settings.get('supplier');
    if (!row) return undefined;
    const parsed = SupplierProfileSchema.safeParse(row.value);
    return parsed.success ? parsed.data : undefined;
  }

  /** Validates before writing. Throws a ZodError listing every bad field. */
  async saveSupplier(input: unknown): Promise<SupplierProfile> {
    const data = SupplierProfileSchema.parse(input);
    await this.db.settings.put({ key: 'supplier', value: data });
    return data;
  }

  async getBranding(): Promise<BrandingSettings> {
    const row = await this.db.settings.get('branding');
    const parsed = BrandingSchema.safeParse(row?.value ?? {});
    return parsed.success ? parsed.data : DEFAULT_BRANDING;
  }

  async saveBranding(input: unknown): Promise<BrandingSettings> {
    const data = BrandingSchema.parse(input);
    await this.db.settings.put({ key: 'branding', value: data });
    return data;
  }

  async getDevice(): Promise<DeviceIdentity> {
    return this.db.transaction('rw', this.db.settings, async () => {
      const row = await this.db.settings.get('device');
      const v = row?.value as Partial<DeviceIdentity> | undefined;
      if (v?.deviceId && v.deviceLetter && /^[A-Z]$/.test(v.deviceLetter)) {
        return { deviceId: v.deviceId, deviceLetter: v.deviceLetter };
      }
      const created: DeviceIdentity = { deviceId: newId(), deviceLetter: 'A' };
      await this.db.settings.put({ key: 'device', value: created });
      return created;
    });
  }

  /** Locked once this device has issued anything, because a letter change would fork the series. */
  async setDeviceLetter(letter: string): Promise<DeviceIdentity> {
    if (!/^[A-Z]$/.test(letter)) throw new SettingsError('Device letter must be a single A-Z character');
    const current = await this.getDevice();
    if (current.deviceLetter === letter) return current;
    const issued = await this.db.invoices.filter((i) => i.deviceId === current.deviceId).count();
    if (issued > 0) throw new SettingsError('This device has already issued invoices; its series letter is locked');
    const next = { ...current, deviceLetter: letter };
    await this.db.settings.put({ key: 'device', value: next });
    return next;
  }

  /** Stores a small image once, keyed by content hash. */
  async putAsset(dataUrl: string): Promise<AssetRow> {
    const m = ASSET_MIME.exec(dataUrl);
    if (!m) throw new SettingsError('Only PNG, JPEG or WebP images are supported');
    const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
    const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
    if (bytes > MAX_ASSET_BYTES) {
      throw new SettingsError(`Image is ${Math.round(bytes / 1024)} KB; the limit is ${MAX_ASSET_BYTES / 1024} KB`);
    }
    const row: AssetRow = {
      id: sha256Hex(dataUrl),
      mime: m[1],
      dataUrl,
      bytes,
      createdAt: new Date().toISOString(),
    };
    await this.db.assets.put(row);
    return row;
  }

  getAsset(id: string): Promise<AssetRow | undefined> {
    return this.db.assets.get(id);
  }
}
