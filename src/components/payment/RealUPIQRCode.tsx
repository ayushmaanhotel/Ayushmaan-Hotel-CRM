import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Smartphone } from 'lucide-react';
import { buildUPIUri, generateQrDataUrl } from '../../services/qr';

interface RealUPIQRCodeProps {
  upiVpa: string;
  merchantName: string;
  amount: number;
  bookingRef: string;
}

export const RealUPIQRCode: React.FC<RealUPIQRCodeProps> = ({
  upiVpa,
  merchantName,
  amount,
  bookingRef
}) => {
  const [copied, setCopied] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  const cleanVpa = upiVpa || 'grandheritage@upi';
  const cleanMerchant = merchantName || 'Grand Heritage Inn';
  const upiUri = buildUPIUri({
    pa: cleanVpa,
    pn: cleanMerchant,
    am: amount,
    tn: bookingRef,
  });

  useEffect(() => {
    generateQrDataUrl(upiUri, { width: 240 }).then(setQrImageUrl).catch(console.error);
  }, [upiUri]);

  const handleCopyVpa = () => {
    navigator.clipboard.writeText(cleanVpa);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-4 font-sans text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-bold text-stone-900 text-xs">Merchant UPI Payment QR</span>
        </div>
        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
          Real `upi://pay` URI
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E5DFD3]">
        <div className="w-32 h-32 bg-white p-2 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-stone-200">
          <img 
            src={qrImageUrl} 
            alt="Merchant UPI QR Code" 
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        <div className="space-y-2 w-full">
          <div>
            <span className="text-[10px] text-stone-500 block font-medium">Merchant Name</span>
            <span className="font-bold text-stone-900 text-sm">{cleanMerchant}</span>
          </div>

          <div>
            <span className="text-[10px] text-stone-500 block font-medium">UPI VPA ID</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-emerald-700 font-semibold text-xs">{cleanVpa}</span>
              <button 
                onClick={handleCopyVpa}
                className="p-1 hover:bg-stone-200 rounded text-stone-500 hover:text-stone-900"
                title="Copy VPA"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-[#E5DFD3]">
            <span className="text-stone-600 font-medium">Total Payable:</span>
            <span className="font-mono font-extrabold text-emerald-700 text-sm">₹{amount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <span className="text-[10px] text-stone-600 font-semibold block">Tap to pay with mobile UPI app:</span>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={upiUri}
            className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-[11px] font-bold text-indigo-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" /> Open PhonePe / GPay
          </a>
          <a
            href={upiUri}
            className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-emerald-600" /> Open BHIM / Paytm
          </a>
        </div>
      </div>
    </div>
  );
};
