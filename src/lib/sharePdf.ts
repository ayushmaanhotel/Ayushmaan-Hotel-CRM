/**
 * Ayushmaan OS v2 — on-device PDF sharing / saving (Android-first)
 * Drop into: src/lib/sharePdf.ts
 *
 * Primary path: Web Share API Level 2 (Chrome on Android) → the system share
 * sheet opens with the PDF attached; picking WhatsApp hands the real PDF file
 * to the guest. No server, no upload, works in airplane mode.
 */

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled' | 'failed';

export async function shareInvoicePdf(
  blob: Blob,
  fileName: string,
  title = 'Tax Invoice'
): Promise<ShareOutcome> {
  const file = new File([blob], fileName, { type: 'application/pdf' });

  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title, text: title });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'cancelled';
      // fall through to download
    }
  }
  downloadBlob(blob, fileName);
  return 'downloaded';
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** WhatsApp deep-link fallback (text message; attach the PDF from Downloads). */
export function whatsAppLink(phoneDigits: string, message: string): string {
  const p = phoneDigits.replace(/\D/g, '');
  const cc = p.length === 10 ? '91' : '';
  return `https://wa.me/${cc}${p}?text=${encodeURIComponent(message)}`;
}

/** System print dialog (Android: Save-as-PDF / any installed printer). */
export function printHtml(html: string): void {
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(frame);
  const doc = frame.contentDocument!;
  doc.open();
  doc.write(html);
  doc.close();
  frame.onload = () => {
    frame.contentWindow!.focus();
    frame.contentWindow!.print();
    setTimeout(() => frame.remove(), 1500);
  };
}

export { invoicePdfFileName as invoiceFileName } from './invoiceEngine';
