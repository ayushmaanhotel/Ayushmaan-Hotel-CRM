/**
 * BillBook Design Tokens & Theme Palettes
 * Directly modeled from BillBook (com.valorem.flobooks)
 * item_theme_color_chip.xml & voucher theme settings.
 */

export type TemplateId = 'advanced-gst' | 'royal-heritage' | 'stylish-modern' | 'thermal-80mm';

export type ThemeColorKey = 'sapphire' | 'ruby' | 'emerald' | 'terracotta' | 'slate' | 'violet';

export interface ThemePalette {
  key: ThemeColorKey;
  name: string;
  hindiName: string;
  primary: string;       // Main header, borders, prominent badges
  primaryLight: string;  // Header pill, tint backgrounds
  primaryDark: string;   // Deep accents, footer totals
  accent: string;        // Accent highlights, buttons
  border: string;        // Crisp table borders
  tableHeaderBg: string; // Statutory table header background
  text: string;          // Primary text
  cardBg: string;        // Inner card backgrounds
}

export const THEME_COLOR_PALETTES: Record<ThemeColorKey, ThemePalette> = {
  sapphire: {
    key: 'sapphire',
    name: 'Classic Sapphire',
    hindiName: 'शाही नीला',
    primary: '#1E40AF',      // Deep Royal Blue
    primaryLight: '#EFF6FF', // Soft Blue Tint
    primaryDark: '#1E3A8A',  // Midnight Blue
    accent: '#2563EB',       // Vivid Blue
    border: '#BFDBFE',       // Slate Blue Border
    tableHeaderBg: '#F0F7FF',
    text: '#0F172A',
    cardBg: '#F8FAFC',
  },
  ruby: {
    key: 'ruby',
    name: 'Regal Ruby',
    hindiName: 'शाही लाल / महरून',
    primary: '#991B1B',      // Deep Crimson / Maroon
    primaryLight: '#FEF2F2', // Soft Crimson Tint
    primaryDark: '#7F1D1D',  // Wine Red
    accent: '#DC2626',       // Bright Ruby
    border: '#FECACA',       // Crimson Border
    tableHeaderBg: '#FFF1F2',
    text: '#1C1917',
    cardBg: '#FAFAF9',
  },
  emerald: {
    key: 'emerald',
    name: 'Emerald Forest',
    hindiName: 'पन्ना हरा',
    primary: '#065F46',      // Forest Green
    primaryLight: '#ECFDF5', // Mint Tint
    primaryDark: '#064E3B',  // Deep Emerald
    accent: '#059669',       // Vivid Emerald
    border: '#A7F3D0',       // Mint Border
    tableHeaderBg: '#F0FDF4',
    text: '#064E3B',
    cardBg: '#F9FAFB',
  },
  terracotta: {
    key: 'terracotta',
    name: 'Royal Terracotta',
    hindiName: 'गेरुआ / अम्बर',
    primary: '#7C2D12',      // Deep Terracotta Ochre
    primaryLight: '#FFFBEB', // Warm Ivory / Amber Tint
    primaryDark: '#451A03',  // Dark Ochre
    accent: '#D97706',       // Warm Gold / Amber
    border: '#FDE68A',       // Ochre Gold Border
    tableHeaderBg: '#FEF3C7',
    text: '#1C1917',
    cardBg: '#FFFDF9',
  },
  slate: {
    key: 'slate',
    name: 'Executive Slate',
    hindiName: 'कॉर्पोरेट स्लेट',
    primary: '#0F172A',      // Charcoal Slate
    primaryLight: '#F1F5F9', // Pale Slate Tint
    primaryDark: '#020617',  // Deep Black
    accent: '#334155',       // Steel Grey
    border: '#CBD5E1',       // Neutral Slate Border
    tableHeaderBg: '#F8FAFC',
    text: '#020617',
    cardBg: '#FFFFFF',
  },
  violet: {
    key: 'violet',
    name: 'Imperial Violet',
    hindiName: 'शाही बैंगनी',
    primary: '#4C1D95',      // Royal Purple / Violet
    primaryLight: '#F5F3FF', // Lavender Tint
    primaryDark: '#2E1065',  // Deep Violet
    accent: '#7C3AED',       // Vivid Purple
    border: '#DDD6FE',       // Violet Border
    tableHeaderBg: '#FAF5FF',
    text: '#1E1B4B',
    cardBg: '#FAFAFA',
  },
};

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  hindiName: string;
  description: string;
  badge: string;
  isThermal: boolean;
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: 'advanced-gst',
    name: 'Advanced GST',
    hindiName: 'टैली / सीबीआइसी मानक',
    description: 'Double-line statutory B2B accounting grid with CBIC 8-column HSN tax matrix',
    badge: 'TALLY / B2B STANDARD',
    isThermal: false,
  },
  {
    id: 'royal-heritage',
    name: 'Royal Heritage',
    hindiName: 'शाही भारतीय अतिथि',
    description: 'Lord Ganesha arch, Sanskrit shloka, ivory stationery & luxury stay ledger',
    badge: 'LUXURY HOSPITALITY',
    isThermal: false,
  },
  {
    id: 'stylish-modern',
    name: 'Stylish Modern',
    hindiName: 'स्टाइलिश आधुनिक',
    description: 'Full-bleed color banner header, crisp itemized list & scan-to-pay badge',
    badge: 'BOUTIQUE STAYS',
    isThermal: false,
  },
  {
    id: 'thermal-80mm',
    name: 'Thermal 80mm',
    hindiName: 'पीओएस थर्मल रसीद',
    description: '3-inch monospace slip with dashed borders & high-contrast offline UPI QR',
    badge: 'POS CASHIER RECEIPT',
    isThermal: true,
  },
];

/** Resolve palette with fallback to sapphire */
export function getThemePalette(key?: string): ThemePalette {
  if (key && key in THEME_COLOR_PALETTES) {
    return THEME_COLOR_PALETTES[key as ThemeColorKey];
  }
  return THEME_COLOR_PALETTES.sapphire;
}
