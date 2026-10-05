/**
 * Registers embedded fonts so the ₹ glyph, Devanagari blessing line and the
 * premium serif render identically on EVERY device (a phone's system fonts
 * are never trusted — that is how invoices end up with tofu boxes □□□).
 *
 * Generate src/lib/vfs-fonts.ts once with:   node scripts/build-fonts.mjs
 */
import pdfMake from 'pdfmake/build/pdfmake';
import { vfs } from './vfs-fonts';

const fonts = {
  Inter: {
    normal: 'Inter-Regular.ttf',
    bold: 'Inter-SemiBold.ttf',
    italics: 'Inter-Italic.ttf',
    bolditalics: 'Inter-SemiBoldItalic.ttf',
  },
  Playfair: {
    normal: 'PlayfairDisplay-Regular.ttf',
    bold: 'PlayfairDisplay-SemiBold.ttf',
    italics: 'PlayfairDisplay-Italic.ttf',
    bolditalics: 'PlayfairDisplay-SemiBoldItalic.ttf',
  },
  NotoDevanagari: {
    normal: 'NotoSansDevanagari-Regular.ttf',
    bold: 'NotoSansDevanagari-Regular.ttf',   // blessing line never bolds; keeps bundle small
    italics: 'NotoSansDevanagari-Regular.ttf',
    bolditalics: 'NotoSansDevanagari-Regular.ttf',
  },
};

/* pdfmake 0.2.x API */
(pdfMake as any).vfs = vfs;
(pdfMake as any).fonts = fonts;

/* pdfmake 0.3.x API (harmless no-op on 0.2.x) */
const pm = pdfMake as any;
if (typeof pm.addVirtualFileSystem === 'function') pm.addVirtualFileSystem(vfs);
if (typeof pm.addFonts === 'function') pm.addFonts(fonts);

export {};
