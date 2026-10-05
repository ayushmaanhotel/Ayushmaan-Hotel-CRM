import React, { useState, useEffect } from 'react';
import { X, Save, Building, ShieldCheck, Image, Check, AlertCircle } from 'lucide-react';
import { getDb } from '../../db/schema';
import { SettingsRepo, type SupplierProfile, type BrandingSettings } from '../../db/repos/settingsRepo';
import { validateGstin } from '../../domain/gst/gstin';

interface BrandingSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const BrandingSettingsModal: React.FC<BrandingSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [supplier, setSupplier] = useState<SupplierProfile>({
    legalName: '',
    tradeName: '',
    address: '',
    gstin: '',
    phone: '',
    email: '',
    upiVpa: '',
    invoicePrefix: 'GHI',
    logoAssetId: undefined,
    signatureAssetId: undefined,
    stampAssetId: undefined,
    terms: ['Check-out time: 11:00 AM. Government ID required at check-in.'],
    bank: {
      accountName: '',
      accountNumber: '',
      ifsc: '',
      bankName: '',
    },
  });

  const [branding, setBranding] = useState<BrandingSettings>({
    accent: '#5B1A1A',
    showDeity: true,
    deityAssetId: undefined,
    shloka: '॥ श्री गणेशाय नमः ॥',
    paper: 'A4',
    templateId: 'heritage',
    priceMode: 'inclusive',
  });

  const [deityPreview, setDeityPreview] = useState<string>('');
  const [signaturePreview, setSignaturePreview] = useState<string>('');
  const [stampPreview, setStampPreview] = useState<string>('');
  const [customQrPreview, setCustomQrPreview] = useState<string>('');
  const [deviceLetter, setDeviceLetter] = useState<string>('A');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    const db = getDb();
    const repo = new SettingsRepo(db);

    // Load custom QR standee from hotel config
    try {
      const savedConfig = localStorage.getItem('ayushmaan_hotel_config');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.customQrDataUrl) setCustomQrPreview(parsed.customQrDataUrl);
      }
    } catch (e) {
      // ignore parse error
    }

    Promise.all([
      repo.getSupplier(),
      repo.getBranding(),
      repo.getDevice(),
    ]).then(async ([supp, brand, dev]) => {
      if (supp) setSupplier(supp);
      if (brand) {
        setBranding(brand);
        if (brand.deityAssetId) {
          const asset = await repo.getAsset(brand.deityAssetId);
          if (asset) setDeityPreview(asset.dataUrl);
        }
      }
      if (dev) setDeviceLetter(dev.deviceLetter);
      if (supp?.signatureAssetId) {
        const asset = await repo.getAsset(supp.signatureAssetId);
        if (asset) setSignaturePreview(asset.dataUrl);
      }
      if (supp?.stampAssetId) {
        const asset = await repo.getAsset(supp.stampAssetId);
        if (asset) setStampPreview(asset.dataUrl);
      }
      setLoading(false);
    });
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'deity' | 'signature' | 'stamp' | 'customQr',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      setErrorMsg('Image size must be less than 800 KB for mobile performance.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      if (type === 'customQr') {
        setCustomQrPreview(dataUrl);
        try {
          const cfg = localStorage.getItem('ayushmaan_hotel_config');
          const obj = cfg ? JSON.parse(cfg) : {};
          obj.customQrDataUrl = dataUrl;
          localStorage.setItem('ayushmaan_hotel_config', JSON.stringify(obj));
        } catch (e) {}
        setErrorMsg('');
        return;
      }

      const db = getDb();
      const repo = new SettingsRepo(db);
      try {
        const asset = await repo.putAsset(dataUrl);
        if (type === 'deity') {
          setDeityPreview(dataUrl);
          setBranding((b) => ({ ...b, deityAssetId: asset.id }));
        } else if (type === 'signature') {
          setSignaturePreview(dataUrl);
          setSupplier((s) => ({ ...s, signatureAssetId: asset.id }));
        } else if (type === 'stamp') {
          setStampPreview(dataUrl);
          setSupplier((s) => ({ ...s, stampAssetId: asset.id }));
        }
        setErrorMsg('');
      } catch (err: any) {
        setErrorMsg(err.message || 'Error saving image');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomQr = () => {
    setCustomQrPreview('');
    try {
      const cfg = localStorage.getItem('ayushmaan_hotel_config');
      const obj = cfg ? JSON.parse(cfg) : {};
      obj.customQrDataUrl = null;
      localStorage.setItem('ayushmaan_hotel_config', JSON.stringify(obj));
    } catch (e) {}
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Pre-validate GSTIN
    const gCheck = validateGstin(supplier.gstin);
    if (!gCheck.valid) {
      setErrorMsg('GSTIN is invalid. Please check the 15-character code.');
      return;
    }

    try {
      const db = getDb();
      const repo = new SettingsRepo(db);
      await repo.saveSupplier(supplier);
      await repo.saveBranding(branding);
      await repo.setDeviceLetter(deviceLetter);

      setSuccessMsg('Settings and Branding saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        onSaved?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save settings.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#F8F5EE] border border-[#DDD6C8] rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-white border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Hotel Official Branding & GST Settings</h3>
              <p className="text-[11px] text-stone-600">Configure legal invoice stationery, sacred deity header & bank info</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-stone-500 text-xs">Loading configuration...</div>
        ) : (
          <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto flex-1 font-sans text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Hotel Legal & Trade Info */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-xs">
              <h4 className="font-semibold text-stone-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Hotel Legal & GST Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Hotel Brand Name (Trade Name)*</label>
                  <input
                    type="text"
                    required
                    value={supplier.tradeName}
                    onChange={(e) => setSupplier({ ...supplier, tradeName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. Grand Heritage Inn Hotel"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Legal Entity Name*</label>
                  <input
                    type="text"
                    required
                    value={supplier.legalName}
                    onChange={(e) => setSupplier({ ...supplier, legalName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. Grand Heritage Hospitality Pvt Ltd"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Hotel GSTIN (15 Chars)*</label>
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={supplier.gstin}
                    onChange={(e) => setSupplier({ ...supplier, gstin: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-emerald-700 font-mono font-medium placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. 27AAPFU0939F1ZV"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Invoice Series Prefix (1-4 Chars)*</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={supplier.invoicePrefix}
                    onChange={(e) => setSupplier({ ...supplier, invoicePrefix: e.target.value.toUpperCase() })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-amber-700 font-mono font-medium placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="e.g. GHI"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-600 block mb-1">Hotel Physical Address*</label>
                <input
                  type="text"
                  required
                  value={supplier.address}
                  onChange={(e) => setSupplier({ ...supplier, address: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                  placeholder="e.g. Beach Road, Bandra West, Mumbai 400050"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Official Phone*</label>
                  <input
                    type="text"
                    required
                    value={supplier.phone}
                    onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={supplier.email || ''}
                    onChange={(e) => setSupplier({ ...supplier, email: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Merchant UPI VPA ID</label>
                  <input
                    type="text"
                    value={supplier.upiVpa || ''}
                    onChange={(e) => setSupplier({ ...supplier, upiVpa: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-emerald-700 font-mono font-medium placeholder:text-stone-400 focus:bg-white focus:border-indigo-500 outline-none"
                    placeholder="hotel@upi"
                  />
                </div>
              </div>

              {/* Hotel Counter Standee QR Image */}
              <div className="pt-2 border-t border-[#E5DFD3]">
                <label className="text-[10px] font-semibold text-stone-600 block mb-1">
                  Physical Counter Standee Photo (PhonePe / Google Pay / Paytm / Bank QR)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {customQrPreview ? (
                    <div className="flex items-center gap-2 bg-[#FAF8F5] p-2 rounded-xl border border-stone-200">
                      <img
                        src={customQrPreview}
                        alt="Standee QR"
                        className="w-12 h-12 object-contain bg-white rounded border border-stone-300 p-0.5"
                      />
                      <div>
                        <div className="text-[11px] font-semibold text-emerald-700">✓ Standee Image Active</div>
                        <button
                          type="button"
                          onClick={handleRemoveCustomQr}
                          className="text-[10px] text-red-600 hover:underline font-medium"
                        >
                          Remove Standee (Revert to Dynamic QR)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-stone-500">
                      Currently using automatic on-device dynamic UPI vector QR.
                    </span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'customQr')}
                    className="text-[10px] text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                  />
                </div>
              </div>
            </div>

            {/* Sacred Deity Header & Template Styling */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-xs">
              <h4 className="font-semibold text-stone-900 text-xs flex items-center gap-1.5">
                <Image className="w-4 h-4 text-amber-600" /> Sacred Header & Template Settings
              </h4>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showDeityCheck"
                  checked={branding.showDeity}
                  onChange={(e) => setBranding({ ...branding, showDeity: e.target.checked })}
                  className="rounded border-stone-300 w-4 h-4 accent-amber-600"
                />
                <label htmlFor="showDeityCheck" className="text-stone-700 font-medium cursor-pointer">
                  Display Sacred Arch & Shloka on Heritage Stationery (omitted on credit notes & thermal)
                </label>
              </div>

              {branding.showDeity && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Devanagari Shloka Text</label>
                    <input
                      type="text"
                      value={branding.shloka || ''}
                      onChange={(e) => setBranding({ ...branding, shloka: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 outline-none"
                      placeholder="॥ श्री गणेशाय नमः ॥"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Deity Image (Max 250 KB)</label>
                    <div className="flex items-center gap-2">
                      {deityPreview && (
                        <img src={deityPreview} alt="Deity" className="w-9 h-9 rounded-full object-cover border border-amber-300 shadow-2xs" />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(e) => handleFileUpload(e, 'deity')}
                        className="text-[10px] text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E5DFD3]">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Default Template</label>
                  <select
                    value={branding.templateId}
                    onChange={(e) => setBranding({ ...branding, templateId: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="advanced-gst">CBIC Advanced GST (Official 8-Col Matrix)</option>
                    <option value="royal-heritage">Royal Heritage Arch (Ganesha Shloka)</option>
                    <option value="stylish-modern">Stylish Modern (Executive Duo-Tone)</option>
                    <option value="thermal-80mm">Thermal 80mm (POS Cashier Slip)</option>
                    <option value="heritage">Heritage (Legacy Ivory)</option>
                    <option value="modern">Modern (Legacy Corporate)</option>
                    <option value="thermal">Thermal (Legacy POS)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Default Paper Size</label>
                  <select
                    value={branding.paper}
                    onChange={(e) => setBranding({ ...branding, paper: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="A4">A4 (Standard)</option>
                    <option value="A5">A5 (Compact)</option>
                    <option value="T80">80mm Thermal</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Price Input Mode</label>
                  <select
                    value={branding.priceMode}
                    onChange={(e) => setBranding({ ...branding, priceMode: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 focus:bg-white focus:border-indigo-500 outline-none"
                  >
                    <option value="inclusive">Tax Inclusive (Walk-in Standard)</option>
                    <option value="exclusive">Tax Exclusive (+ GST)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Signature & Stamp */}
            <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#E5DFD3] shadow-xs">
              <h4 className="font-semibold text-stone-900 text-xs">Scanned Authorized Signatory & Rubber Stamp</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Scanned Signature (PNG/JPG)</label>
                  <div className="flex items-center gap-2">
                    {signaturePreview && (
                      <img src={signaturePreview} alt="Sign" className="w-12 h-6 object-contain bg-white rounded border border-stone-200 p-0.5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'signature')}
                      className="text-[10px] text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-stone-600 block mb-1">Hotel Round Stamp (PNG/JPG)</label>
                  <div className="flex items-center gap-2">
                    {stampPreview && (
                      <img src={stampPreview} alt="Stamp" className="w-8 h-8 object-contain bg-white rounded-full border border-stone-200 p-0.5" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'stamp')}
                      className="text-[10px] text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5DFD3]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm"
              >
                <Save className="w-4 h-4" /> Save Official Configuration
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
