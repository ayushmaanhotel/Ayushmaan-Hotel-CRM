import type { Invoice } from '../domain/invoice.types';
import { formatINR } from '../domain/money';

export interface ShareInvoiceOptions {
  invoice: Invoice;
  pdfBlob: Blob;
}

/**
 * Dispatches an official GST Invoice PDF to the guest.
 * 1. Checks for Web Share API file sharing (works on Android Chrome, Samsung Internet, and Capacitor WebView).
 * 2. Falls back to downloading the PDF + opening WhatsApp Web / App (`wa.me`).
 */
export async function shareInvoicePdf(options: ShareInvoiceOptions): Promise<{ sharedVia: 'native' | 'fallback' }> {
  const { invoice, pdfBlob } = options;
  const filename = `${invoice.number.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });

  const guestTitle = invoice.buyer.name ? `${invoice.buyer.name} Ji` : 'Guest';
  const whatsappText =
    `Namaste ${guestTitle}! 🙏\n\n` +
    `Here is your official GST Tax Invoice from *${invoice.supplier.tradeName}*.\n\n` +
    `🧾 *Invoice No:* ${invoice.number}\n` +
    `📅 *Date:* ${invoice.issuedAt.slice(0, 10)}\n` +
    (invoice.stay ? `🏨 *Room:* ${invoice.stay.roomNo} (${invoice.stay.nights} Night(s))\n` : '') +
    `💰 *Grand Total:* ${formatINR(invoice.totals.grandTotal)}\n` +
    (invoice.balanceDue > 0
      ? `⚠️ *Balance Due:* ${formatINR(invoice.balanceDue)}\n`
      : `✅ *Status:* Paid & Settled\n`) +
    `\nThank you for choosing to stay with us! Have a safe onward journey. ✨`;

  // 1. Try Native Share with File attachment
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Invoice ${invoice.number}`,
        text: whatsappText,
        files: [file],
      });
      return { sharedVia: 'native' };
    } catch (e: any) {
      if (e.name === 'AbortError') {
        return { sharedVia: 'native' }; // User cancelled share sheet
      }
      console.warn('Native file share failed, falling back to download + wa.me:', e);
    }
  }

  // 2. Fallback: Trigger browser file download
  const blobUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);

  // 3. Open WhatsApp link if phone number is available
  if (invoice.buyer.phone) {
    const rawDigits = invoice.buyer.phone.replace(/[^0-9]/g, '');
    const cleanPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  return { sharedVia: 'fallback' };
}

/** Triggers native print preview dialog for the PDF Blob. */
export function printInvoicePdf(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.src = url;

  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 60_000);
  };

  document.body.appendChild(iframe);
}
