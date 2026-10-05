import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

/**
 * Registers fonts for PDF generation.
 * Registers Cormorant Garamond, Inter/Roboto, and Noto Serif Devanagari.
 * Fallbacks gracefully if running in constrained offline environments.
 */
export function registerInvoiceFonts(): void {
  if (fontsRegistered) return;

  // Disable automatic hyphenation for predictable currency & code wrapping
  Font.registerHyphenationCallback((word) => [word]);

  try {
    // Register CormorantGaramond with normal and bold
    Font.register({
      family: 'CormorantGaramond',
      fonts: [
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-400-normal.ttf',
          fontWeight: 'normal',
        },
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/cormorant-garamond@latest/latin-700-normal.ttf',
          fontWeight: 'bold',
        },
      ],
    });

    // Register Inter with normal, italic, semibold, and bold variants
    Font.register({
      family: 'Inter',
      fonts: [
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-normal.ttf',
          fontWeight: 'normal',
          fontStyle: 'normal',
        },
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-400-italic.ttf',
          fontWeight: 'normal',
          fontStyle: 'italic',
        },
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-600-normal.ttf',
          fontWeight: 600,
          fontStyle: 'normal',
        },
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-normal.ttf',
          fontWeight: 'bold',
          fontStyle: 'normal',
        },
        {
          src: 'https://cdn.jsdelivr.net/fontsource/fonts/inter@latest/latin-700-italic.ttf',
          fontWeight: 'bold',
          fontStyle: 'italic',
        },
      ],
    });

    Font.register({
      family: 'Devanagari',
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-devanagari@latest/devanagari-400-normal.ttf',
    });

    fontsRegistered = true;
  } catch (err) {
    console.warn('Font registration fallback to standard system PDF fonts:', err);
  }
}
