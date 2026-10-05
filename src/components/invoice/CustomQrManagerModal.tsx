import React, { useState, useRef, useEffect } from 'react';
import { X, QrCode, Upload, Trash2, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { useHotelStore } from '../../hooks/useHotelStore';
import { buildUPIUri } from '../../services/qr';
import QRCode from 'qrcode';

interface CustomQrManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQrUpdated?: () => void;
}

export const CustomQrManagerModal: React.FC<CustomQrManagerModalProps> = ({
  isOpen,
  onClose,
  onQrUpdated,
}) => {
  const { hotelConfig, updateHotelConfig } = useHotelStore();
  const [activeTab, setActiveTab] = useState<'standee' | 'dynamic'>('standee');
  const [dynamicQrDataUrl, setDynamicQrDataUrl] = useState<string>('');
  const [testAmount, setTestAmount] = useState<number>(1000);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customQr = hotelConfig.customQrDataUrl;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Generate live dynamic UPI QR code
  useEffect(() => {
    if (!isOpen) return;

    const uri = buildUPIUri({
      pa: hotelConfig.upiVpa || 'grandheritage@upi',
      pn: hotelConfig.merchantName || hotelConfig.hotelName || 'Grand Heritage Inn',
      am: testAmount,
      tn: 'Test Payment',
    });

    QRCode.toDataURL(uri, {
      width: 220,
      margin: 1,
      color: {
        dark: '#1C1917',
        light: '#FFFFFF',
      },
    })
      .then(url => setDynamicQrDataUrl(url))
      .catch(err => console.error('Failed to generate dynamic QR:', err));
  }, [isOpen, hotelConfig.upiVpa, hotelConfig.merchantName, hotelConfig.hotelName, testAmount]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      showToast('Image is larger than 800 KB. Please upload a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateHotelConfig({ customQrDataUrl: dataUrl });
      showToast('Counter Standee QR image saved ✔');
      onQrUpdated?.();
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveStandee = () => {
    updateHotelConfig({ customQrDataUrl: null });
    showToast('Removed custom standee image. Now using dynamic UPI QR ✔');
    onQrUpdated?.();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#FAF8F5] border border-[#E5DDD0] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5DDD0] bg-[#F4EFE6] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#7A1F2B]/10 flex items-center justify-center text-[#7A1F2B]">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#2D241E]">UPI & Standee QR Manager</h3>
              <p className="text-[11px] text-[#6F6759]">
                Choose how guests pay: real counter standee or dynamic bill QR
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#6F6759] hover:text-[#2D241E] rounded-lg hover:bg-[#EAE4D9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-5 pt-3 pb-0 flex border-b border-[#E5DDD0] bg-[#FAF8F5] gap-4">
          <button
            onClick={() => setActiveTab('standee')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'standee'
                ? 'border-[#7A1F2B] text-[#7A1F2B]'
                : 'border-transparent text-[#6F6759] hover:text-[#2D241E]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Custom Standee Photo
            {customQr && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('dynamic')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'dynamic'
                ? 'border-[#7A1F2B] text-[#7A1F2B]'
                : 'border-transparent text-[#6F6759] hover:text-[#2D241E]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Dynamic UPI Vector QR
            {!customQr && (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {toast && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {activeTab === 'standee' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#F4EFE6] border border-[#E5DDD0] rounded-xl text-xs text-[#2D241E] space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-[#7A1F2B]">
                  <ShieldCheck className="w-4 h-4" />
                  Real Counter QR Standee
                </div>
                <p className="text-[11px] text-[#6F6759]">
                  Take a photo or upload an image of your hotel's physical QR standee (PhonePe, Google Pay, Paytm, BHIM, Bank scanner). It will be printed directly in the payment section of every A4 & A5 tax invoice.
                </p>
              </div>

              {customQr ? (
                <div className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5DDD0] rounded-xl space-y-3">
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ✓ Custom Standee Active on All Invoices
                  </div>
                  <div className="relative group max-w-[200px] max-h-[220px] rounded-lg overflow-hidden border border-[#E5DDD0] shadow-sm">
                    <img
                      src={customQr}
                      alt="Counter Standee QR"
                      className="w-full h-auto object-contain max-h-[200px]"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#F4EFE6] hover:bg-[#EAE4D9] text-[#2D241E] text-xs font-medium rounded-lg border border-[#E5DDD0] flex items-center gap-1.5 transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Replace Photo
                    </button>
                    <button
                      onClick={handleRemoveStandee}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium rounded-lg border border-red-200 flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#D9CEBC] hover:border-[#7A1F2B] bg-white/70 hover:bg-[#FAF8F5] transition-colors rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer space-y-2"
                >
                  <div className="w-12 h-12 rounded-full bg-[#7A1F2B]/10 flex items-center justify-center text-[#7A1F2B]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#2D241E]">
                      Upload Photo of Counter QR Standee
                    </div>
                    <div className="text-[11px] text-[#6F6759] mt-0.5">
                      JPG, PNG, or WebP up to 800 KB
                    </div>
                  </div>
                  <span className="mt-2 px-3 py-1 bg-[#7A1F2B] text-white text-[11px] font-semibold rounded-lg shadow-sm">
                    Browse File
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#F4EFE6] border border-[#E5DDD0] rounded-xl text-xs text-[#2D241E] space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-[#7A1F2B]">
                  <Sparkles className="w-4 h-4" />
                  Dynamic UPI Payment QR
                </div>
                <p className="text-[11px] text-[#6F6759]">
                  Standard NPCI vector QR code generated on-device with exact invoice amount prefilled. When scanned by guest via any UPI app, payee and bill total are automatic.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-white border border-[#E5DDD0] rounded-xl space-y-3">
                {dynamicQrDataUrl ? (
                  <img
                    src={dynamicQrDataUrl}
                    alt="Dynamic UPI QR"
                    className="w-44 h-44 rounded-lg border border-[#E5DDD0] p-1"
                  />
                ) : (
                  <div className="w-44 h-44 bg-[#F4EFE6] animate-pulse rounded-lg" />
                )}

                <div className="text-center space-y-0.5">
                  <div className="text-xs font-mono font-bold text-[#2D241E]">
                    {hotelConfig.upiVpa || 'grandheritage@upi'}
                  </div>
                  <div className="text-[11px] text-[#6F6759]">
                    Merchant: {hotelConfig.merchantName || hotelConfig.hotelName}
                  </div>
                </div>

                <div className="w-full max-w-xs flex items-center gap-2 pt-1">
                  <label className="text-[11px] font-medium text-[#6F6759] shrink-0">Test Amount:</label>
                  <input
                    type="number"
                    value={testAmount}
                    onChange={(e) => setTestAmount(Number(e.target.value) || 0)}
                    className="w-full px-2 py-1 bg-[#FAF8F5] border border-[#E5DDD0] rounded text-xs text-[#2D241E]"
                  />
                </div>
              </div>

              {customQr && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                  <span>Currently, your uploaded standee image takes precedence.</span>
                  <button
                    onClick={handleRemoveStandee}
                    className="text-xs font-bold text-amber-900 underline hover:no-underline"
                  >
                    Switch to Dynamic
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5DDD0] bg-[#F4EFE6] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#7A1F2B] hover:bg-[#5D1620] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
