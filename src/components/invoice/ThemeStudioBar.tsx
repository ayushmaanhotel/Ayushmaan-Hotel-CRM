import React from 'react';
import { 
  Check, 
  Palette, 
  Layers, 
  Table2, 
  QrCode, 
  Stamp, 
  Flame 
} from 'lucide-react';
import { 
  THEME_COLOR_PALETTES, 
  TEMPLATE_DEFINITIONS, 
  type TemplateId, 
  type ThemeColorKey 
} from '../../domain/themeTokens';

export interface ThemeStudioBarProps {
  selectedTemplate: TemplateId;
  onSelectTemplate: (t: TemplateId) => void;
  selectedColor: ThemeColorKey;
  onSelectColor: (c: ThemeColorKey) => void;
  showDeity?: boolean;
  onToggleDeity?: (show: boolean) => void;
  showHsnTable?: boolean;
  onToggleHsnTable?: (show: boolean) => void;
  showQr?: boolean;
  onToggleQr?: (show: boolean) => void;
  showStamp?: boolean;
  onToggleStamp?: (show: boolean) => void;
  className?: string;
}

export const ThemeStudioBar: React.FC<ThemeStudioBarProps> = ({
  selectedTemplate,
  onSelectTemplate,
  selectedColor,
  onSelectColor,
  showDeity = true,
  onToggleDeity,
  showHsnTable = true,
  onToggleHsnTable,
  showQr = true,
  onToggleQr,
  showStamp = true,
  onToggleStamp,
  className = '',
}) => {
  const isThermal = selectedTemplate === 'thermal-80mm';

  return (
    <div className={`bg-white border border-[#E5DFD3] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3.5 select-none ${className}`}>
      {/* Top: Template Layout Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bill Layout (इनवॉइस प्रारूप):</span>
          </div>
          <span className="text-[10px] text-stone-500 font-medium">BillBook Style Studio</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TEMPLATE_DEFINITIONS.map((tmpl) => {
            const isActive = selectedTemplate === tmpl.id;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onSelectTemplate(tmpl.id)}
                className={`p-2.5 rounded-xl border text-left transition-all relative ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 shadow-xs ring-1 ring-indigo-500/20 font-semibold'
                    : 'border-[#E5DFD3] bg-[#FAF8F5] text-stone-600 hover:text-stone-900 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">{tmpl.name}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </div>
                <div className="text-[9px] text-stone-500 mt-0.5 truncate">{tmpl.hindiName}</div>
                <div className="mt-1 text-[8px] font-mono tracking-wider text-stone-400 uppercase">
                  {tmpl.badge}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Middle: Color Palette Swatches (Disabled in Thermal) */}
      {!isThermal && (
        <div className="pt-2 border-t border-[#E5DFD3]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 uppercase tracking-wider">
              <Palette className="w-3.5 h-3.5 text-amber-600" />
              <span>Theme Accent Color (रंग थीम):</span>
            </div>
            <span className="text-[10px] font-semibold text-stone-600 font-mono">
              {THEME_COLOR_PALETTES[selectedColor]?.name}
            </span>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
            {(Object.keys(THEME_COLOR_PALETTES) as ThemeColorKey[]).map((cKey) => {
              const pal = THEME_COLOR_PALETTES[cKey];
              const isSelected = selectedColor === cKey;
              return (
                <button
                  key={cKey}
                  type="button"
                  onClick={() => onSelectColor(cKey)}
                  title={`${pal.name} (${pal.hindiName})`}
                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-[#E5DFD3] bg-[#FAF8F5] text-stone-700 hover:border-stone-400 hover:text-stone-900'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 ring-1 ring-black/20 shadow-inner"
                    style={{ backgroundColor: pal.primary }}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </span>
                  <span className="text-[11px] font-medium whitespace-nowrap">{pal.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom: Statutory & Brand Feature Toggles */}
      {!isThermal && (
        <div className="pt-2 border-t border-[#E5DFD3] flex flex-wrap items-center gap-2">
          {onToggleDeity && (
            <button
              type="button"
              onClick={() => onToggleDeity(!showDeity)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 transition-all ${
                showDeity
                  ? 'border-amber-400 bg-amber-50 text-amber-800 shadow-2xs'
                  : 'border-[#E5DFD3] bg-[#FAF8F5] text-stone-500 hover:text-stone-800'
              }`}
            >
              <Flame className="w-3 h-3 text-amber-600" />
              <span>Ganesha Arch ({showDeity ? 'ON' : 'OFF'})</span>
            </button>
          )}

          {onToggleHsnTable && (
            <button
              type="button"
              onClick={() => onToggleHsnTable(!showHsnTable)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 transition-all ${
                showHsnTable
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-800 shadow-2xs'
                  : 'border-[#E5DFD3] bg-[#FAF8F5] text-stone-500 hover:text-stone-800'
              }`}
            >
              <Table2 className="w-3 h-3 text-emerald-600" />
              <span>CBIC HSN Table ({showHsnTable ? 'ON' : 'OFF'})</span>
            </button>
          )}

          {onToggleQr && (
            <button
              type="button"
              onClick={() => onToggleQr(!showQr)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 transition-all ${
                showQr
                  ? 'border-blue-400 bg-blue-50 text-blue-800 shadow-2xs'
                  : 'border-[#E5DFD3] bg-[#FAF8F5] text-stone-500 hover:text-stone-800'
              }`}
            >
              <QrCode className="w-3 h-3 text-blue-600" />
              <span>UPI QR ({showQr ? 'ON' : 'OFF'})</span>
            </button>
          )}

          {onToggleStamp && (
            <button
              type="button"
              onClick={() => onToggleStamp(!showStamp)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1.5 transition-all ${
                showStamp
                  ? 'border-purple-400 bg-purple-50 text-purple-800 shadow-2xs'
                  : 'border-[#E5DFD3] bg-[#FAF8F5] text-stone-500 hover:text-stone-800'
              }`}
            >
              <Stamp className="w-3 h-3 text-purple-600" />
              <span>Seal & Sign ({showStamp ? 'ON' : 'OFF'})</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
