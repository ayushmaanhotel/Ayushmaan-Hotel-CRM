import QRCode from 'qrcode';

export interface GenerateUPIUriParams {
  pa: string; // VPA
  pn: string; // Payee Name
  am?: number; // Amount in Rupees
  tn?: string; // Note/Ref
  cu?: string; // Currency
}

/** Formats a standard RBI/NPCI-compliant UPI payment URI. */
export function buildUPIUri(params: GenerateUPIUriParams): string {
  const vpa = params.pa.trim();
  const name = params.pn.trim();
  const searchParams = new URLSearchParams();
  searchParams.set('pa', vpa);
  searchParams.set('pn', name);
  if (params.am !== undefined && params.am > 0) {
    searchParams.set('am', params.am.toFixed(2));
  }
  if (params.tn) {
    searchParams.set('tn', params.tn.trim());
  }
  searchParams.set('cu', params.cu || 'INR');
  return `upi://pay?${searchParams.toString()}`;
}

export interface QRCodeDataUrlOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/** Generates a local, offline data-URL PNG of any string (e.g. UPI URI or check-in token). */
export async function generateQrDataUrl(
  text: string,
  options: QRCodeDataUrlOptions = {},
): Promise<string> {
  const { width = 240, margin = 1, errorCorrectionLevel = 'M' } = options;
  return QRCode.toDataURL(text, {
    width,
    margin,
    errorCorrectionLevel,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
