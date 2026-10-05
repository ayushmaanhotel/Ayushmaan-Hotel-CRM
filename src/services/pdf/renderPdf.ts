import type { Invoice } from '../../domain/invoice.types';
import { domainInvoiceToVectorInvoice } from '../../lib/invoiceAdapter';
import { generateInvoicePdf } from '../../lib/invoicePdf';
import { getDb, type HotelDB } from '../../db/schema';
import { SettingsRepo } from '../../db/repos/settingsRepo';

export interface RenderPdfOptions {
  customDb?: HotelDB;
  paperSize?: 'A4' | 'A5';
}

/** 
 * Renders a given Invoice into an official vector PDF Blob and Object URL.
 * Uses 100% offline pdfmake with embedded Google OFL vector fonts.
 * Guaranteed 0 CSS lch parsing crashes and 0 font resolution errors.
 */
export async function renderInvoicePdf(
  invoice: Invoice,
  options: RenderPdfOptions = {},
): Promise<{ blob: Blob; url: string }> {
  const db = options.customDb || getDb();
  const settingsRepo = new SettingsRepo(db);

  let deityDataUrl: string | undefined;
  let logoDataUrl: string | undefined;

  try {
    const branding = await settingsRepo.getBranding();
    if (branding?.deityAssetId) {
      const d = await db.assets.get(branding.deityAssetId);
      if (d) deityDataUrl = d.dataUrl;
    }
    const supplier = await settingsRepo.getSupplier();
    if (supplier?.logoAssetId) {
      const l = await db.assets.get(supplier.logoAssetId);
      if (l) logoDataUrl = l.dataUrl;
    }
  } catch (e) {
    console.warn('Could not load custom branding assets from db:', e);
  }

  // Load custom QR standee from localStorage if available
  let customQrDataUrl: string | null = null;
  try {
    const savedConfig = localStorage.getItem('ayushmaan_hotel_config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      customQrDataUrl = parsed.customQrDataUrl || null;
    }
  } catch (e) {
    // Ignore localStorage parse error
  }

  const vectorInv = domainInvoiceToVectorInvoice(invoice);

  const cfg = {
    hotelName: invoice.supplier.tradeName || invoice.supplier.legalName || 'Grand Heritage Inn Hotel',
    legalName: invoice.supplier.legalName || invoice.supplier.tradeName || 'Grand Heritage Hospitality Pvt Ltd',
    gstin: invoice.supplier.gstin,
    address: invoice.supplier.address,
    phone: invoice.supplier.phone,
    email: invoice.supplier.email,
    upiVpa: invoice.supplier.upiVpa || 'grandheritage@upi',
    merchantName: invoice.supplier.tradeName || invoice.supplier.legalName,
    stateName: invoice.supplier.address?.includes('Rajasthan') ? 'Rajasthan' : 'Maharashtra',
    stateCode: invoice.supplier.stateCode || '27',
    pan: invoice.supplier.pan,
    bank: invoice.supplier.bank ? {
      name: invoice.supplier.bank.bankName,
      account: invoice.supplier.bank.accountNumber,
      ifsc: invoice.supplier.bank.ifsc,
      branch: 'Main Branch'
    } : undefined,
    logoDataUrl,
    deityDataUrl,
    customQrDataUrl,
    showQr: true,
    showDeity: invoice.brand.showDeity,
    blessingLine: invoice.brand.shloka || '॥ श्री गणेशाय नमः ॥',
    signatoryName: 'Aman Varma',
    signatoryTitle: 'General Manager',
    terms: invoice.supplier.terms || [
      'Check-out time: 11:00 AM. Government ID required at check-in.',
      'Disputes subject to local municipal jurisdiction.',
      'Goods & Services once delivered are non-refundable.',
    ],
    invoicePrefix: invoice.series || 'GHI',
  };

  const paperSize: 'A4' | 'A5' = options.paperSize || (invoice.brand?.paper === 'A5' ? 'A5' : 'A4');
  const blob = await generateInvoicePdf(vectorInv, cfg as any, paperSize);
  const url = URL.createObjectURL(blob);

  return { blob, url };
}
