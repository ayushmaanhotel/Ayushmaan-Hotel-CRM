import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Printer, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  AlertCircle,
  Download
} from 'lucide-react';
import { getDb } from '../../db/schema';
import { SettingsRepo } from '../../db/repos/settingsRepo';
import { DexieInvoiceRepo } from '../../db/repos/invoiceRepo';
import { issueInvoice } from '../../services/invoiceService';
import { renderInvoicePdf } from '../../services/pdf/renderPdf';
import { shareInvoicePdf } from '../../services/share';
import { validateGstin } from '../../domain/gst/gstin';
import { formatINR, rupeesToPaise, paiseToRupees } from '../../domain/money';
import { buildUPIUri, generateQrDataUrl } from '../../services/qr';
import { HtmlInvoiceView } from './HtmlInvoiceView';
import { ThemeStudioBar } from './ThemeStudioBar';
import type { TemplateId, ThemeColorKey } from '../../domain/themeTokens';
import type { DraftLine, Invoice, PaymentMode, LineKind } from '../../domain/invoice.types';
import type { Room, Guest } from '../../types/hotel';

interface InvoiceWizardProps {
  isOpen: boolean;
  onClose: () => void;
  prefillBooking?: {
    room: Room;
    guest?: Guest;
    nights?: number;
    amount?: number;
    paymentMode?: string;
  } | null;
  onInvoiceIssued?: (invoice: Invoice) => void;
}

export const InvoiceWizard: React.FC<InvoiceWizardProps> = ({
  isOpen,
  onClose,
  prefillBooking,
  onInvoiceIssued,
}) => {
  const [step, setStep] = useState<'details' | 'preview'>('details');

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestGstin, setGuestGstin] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [roomType, setRoomType] = useState('');
  const [nights, setNights] = useState(1);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('advanced-gst');
  const [selectedColor, setSelectedColor] = useState<ThemeColorKey>('sapphire');
  const [showDeity, setShowDeity] = useState(true);
  const [showHsnTable, setShowHsnTable] = useState(true);
  const [showQr, setShowQr] = useState(true);
  const [showStamp, setShowStamp] = useState(true);

  // Preview & Output State
  const [issuedInvoice, setIssuedInvoice] = useState<Invoice | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [deityDataUrl, setDeityDataUrl] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const invoiceContainerRef = useRef<HTMLDivElement>(null);

  // Prefill on open
  useEffect(() => {
    if (!isOpen) {
      setStep('details');
      setIssuedInvoice(null);
      setPdfBlob(null);
      setErrorMsg('');
      return;
    }

    if (prefillBooking) {
      setGuestName(prefillBooking.guest?.name || 'Walk-in Guest');
      setGuestPhone(prefillBooking.guest?.phone || '');
      setRoomNo(prefillBooking.room?.number || '');
      setRoomType(prefillBooking.room?.type || '');
      const n = prefillBooking.nights || 1;
      setNights(n);
      const totalAmt = prefillBooking.amount || (prefillBooking.room?.pricePerNight ? prefillBooking.room.pricePerNight * n : 3500 * n);
      const unitPerNightPaise = rupeesToPaise(totalAmt / n);

      setLines([
        {
          id: `line-${Date.now()}-1`,
          kind: 'room',
          description: `Room ${prefillBooking.room?.number} Accommodation (${prefillBooking.room?.type || 'Standard'})`,
          sac: '996311',
          qty: n,
          unitPrice: unitPerNightPaise,
          discount: 0,
        },
      ]);
      setPaymentMode((prefillBooking.paymentMode as PaymentMode) || 'UPI');
    } else {
      setGuestName('');
      setGuestPhone('');
      setRoomNo('');
      setRoomType('');
      setNights(1);
      setLines([
        {
          id: `line-${Date.now()}-1`,
          kind: 'room',
          description: 'Hotel Room Accommodation',
          sac: '996311',
          qty: 1,
          unitPrice: 350000,
          discount: 0,
        },
      ]);
    }
  }, [isOpen, prefillBooking]);

  if (!isOpen) return null;

  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: `line-${Date.now()}-${prev.length + 1}`,
        kind: 'food',
        description: 'Dining & Room Service',
        sac: '996331',
        qty: 1,
        unitPrice: 45000,
        discount: 0,
      },
    ]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const handleLineChange = (id: string, updates: Partial<DraftLine>) => {
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        return { ...l, ...updates };
      })
    );
  };

  const handleKindSelect = (id: string, kind: LineKind) => {
    const presets: Record<LineKind, { desc: string; sac: string; defaultPrice: number }> = {
      room: { desc: 'Hotel Room Accommodation', sac: '996311', defaultPrice: 350000 },
      'extra-bed': { desc: 'Extra Bed / Rollaway Mattress', sac: '996311', defaultPrice: 80000 },
      food: { desc: 'Dining & Room Service (5% GST)', sac: '996331', defaultPrice: 45000 },
      laundry: { desc: 'Laundry & Dry Cleaning Service', sac: '999799', defaultPrice: 25000 },
      service: { desc: 'Hotel Service / Facility Fee', sac: '999799', defaultPrice: 30000 },
      other: { desc: 'Hospitality Misc Charge', sac: '999799', defaultPrice: 50000 },
    };
    const p = presets[kind];
    handleLineChange(id, {
      kind,
      description: p.desc,
      sac: p.sac,
      unitPrice: p.defaultPrice,
    });
  };

  const totalEstimatePaise = lines.reduce((acc, l) => acc + (l.unitPrice || 0) * (l.qty || 1), 0);

  const handleIssueInvoice = async () => {
    if (!guestName.trim()) {
      setErrorMsg('Please enter guest name.');
      return;
    }

    if (guestGstin.trim()) {
      const gstinVal = validateGstin(guestGstin.trim());
      if (!gstinVal.valid) {
        setErrorMsg(`Invalid GSTIN: ${gstinVal.reason}. Please check the 15-character format.`);
        return;
      }
    }

    setIsGenerating(true);
    setErrorMsg('');

    try {
      const db = getDb();
      const invoiceRepo = new DexieInvoiceRepo(db);
      const settingsRepo = new SettingsRepo(db);

      let rawSupplier = await settingsRepo.getSupplier();
      if (!rawSupplier || !rawSupplier.gstin) {
        rawSupplier = await settingsRepo.saveSupplier({
          legalName: 'Grand Heritage Hotels Pvt Ltd',
          tradeName: 'Grand Heritage Inn',
          address: '42, Palace Road, Civil Lines, Jaipur, Rajasthan 302006',
          gstin: '27AAPFU0939F1ZV',
          phone: '+91 98765 43210',
          upiVpa: 'grandheritage@upi',
          invoicePrefix: 'GHI',
          terms: ['Check-out time: 11:00 AM. Government ID required.'],
        });
      }
      const supplier = rawSupplier;

      let branding = await settingsRepo.getBranding();
      branding = { ...branding, templateId: selectedTemplate };
      const device = await settingsRepo.getDevice();

      const invoice = await issueInvoice(invoiceRepo, {
        supplier,
        branding,
        device,
        createdBy: 'FRONT_DESK',
        buyer: {
          name: guestName.trim(),
          phone: guestPhone.trim() || undefined,
          gstin: guestGstin.trim() || undefined,
        },
        stay: roomNo
          ? {
              roomNo,
              roomType: roomType || undefined,
              nights,
            }
          : undefined,
        lines,
        payments: [
          {
            mode: paymentMode,
            amount: totalEstimatePaise,
            at: new Date().toISOString(),
          },
        ],
      });

      setIssuedInvoice(invoice);

      // Generate offline UPI QR
      if (supplier.upiVpa) {
        const upiUri = buildUPIUri({
          pa: supplier.upiVpa,
          pn: supplier.tradeName || 'Hotel',
          am: paiseToRupees(invoice.totals.grandTotal),
          tn: invoice.number,
        });
        try {
          const qr = await generateQrDataUrl(upiUri, { width: 180 });
          setQrDataUrl(qr);
        } catch (e) {
          console.warn('QR failed:', e);
        }
      }

      // Load logo/deity assets
      if (branding.deityAssetId) {
        const d = await db.assets.get(branding.deityAssetId);
        if (d) setDeityDataUrl(d.dataUrl);
      }
      if (supplier.logoAssetId) {
        const l = await db.assets.get(supplier.logoAssetId);
        if (l) setLogoDataUrl(l.dataUrl);
      }
      if (supplier.signatureAssetId) {
        const s = await db.assets.get(supplier.signatureAssetId);
        if (s) setSignatureDataUrl(s.dataUrl);
      }

      // Background PDF preparation
      try {
        const { blob } = await renderInvoicePdf(invoice);
        setPdfBlob(blob);
      } catch (pdfErr) {
        console.warn('Background @react-pdf render warning, will use DOM canvas exporter:', pdfErr);
      }

      setStep('preview');
      onInvoiceIssued?.(invoice);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to issue invoice.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!issuedInvoice) return;
    try {
      let blob = pdfBlob;
      if (!blob) {
        const res = await renderInvoicePdf(issuedInvoice);
        blob = res.blob;
        setPdfBlob(res.blob);
      }

      if (blob) {
        await shareInvoicePdf({ invoice: issuedInvoice, pdfBlob: blob });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Share error: ' + err.message);
    }
  };

  const handleDownloadPdf = async () => {
    if (!issuedInvoice) return;
    setIsDownloading(true);
    try {
      let blob = pdfBlob;
      if (!blob) {
        const res = await renderInvoicePdf(issuedInvoice);
        blob = res.blob;
        setPdfBlob(res.blob);
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${issuedInvoice.number.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      }
    } catch (e: any) {
      console.error('Download failed:', e);
      setErrorMsg('Download failed: ' + e.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#F8F5EE] border border-[#DDD6C8] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh]">
        
        {/* Wizard Header */}
        <div className="p-4 bg-white border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                {step === 'details' ? 'Generate Official GST Tax Invoice' : `Official Invoice • ${issuedInvoice?.number}`}
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono border border-emerald-200">
                  CBIC 2025/2026
                </span>
              </h3>
              <p className="text-[11px] text-stone-600">
                {step === 'details'
                  ? 'Calculates 2025 CBIC room tax slabs, assigns sequential series, renders vector PDF'
                  : 'Official document locked and ready for WhatsApp dispatch or printing'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 font-sans text-xs">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'details' ? (
            <div className="space-y-5">
              {/* Guest & Room Details */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
                <span className="text-[11px] font-bold text-stone-800 uppercase block tracking-wider">1. Guest & Stay Information (अतिथि जानकारी)</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Guest Full Name*</label>
                    <input
                      type="text"
                      required
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 placeholder:text-stone-400 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Guest Phone (for WhatsApp)</label>
                    <input
                      type="text"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      placeholder="+91 98200 11223"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Company GSTIN (B2B ITC Claim)</label>
                    <input
                      type="text"
                      maxLength={15}
                      value={guestGstin}
                      onChange={(e) => setGuestGstin(e.target.value.toUpperCase())}
                      placeholder="Optional GSTIN"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-emerald-700 font-mono font-medium outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Room Number</label>
                    <input
                      type="text"
                      value={roomNo}
                      onChange={(e) => setRoomNo(e.target.value)}
                      placeholder="e.g. 204"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-indigo-700 font-mono font-medium outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Room Category</label>
                    <input
                      type="text"
                      value={roomType}
                      onChange={(e) => setRoomType(e.target.value)}
                      placeholder="Deluxe Ocean View"
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-stone-600 block mb-1">Nights</label>
                    <input
                      type="number"
                      min={1}
                      value={nights}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setNights(val);
                        if (lines.length > 0 && lines[0].kind === 'room') {
                          handleLineChange(lines[0].id, { qty: val });
                        }
                      }}
                      className="w-full bg-[#FAF8F5] border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono outline-none focus:border-indigo-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items & Tariffs */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">2. Line Items & Tariffs (किराया व सेवाएं)</span>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service / Food
                  </button>
                </div>

                <div className="space-y-2.5">
                  {lines.map((line) => (
                    <div key={line.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3] space-y-2">
                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 sm:col-span-4">
                          <label className="text-[9px] font-medium text-stone-500 block mb-0.5">Category</label>
                          <select
                            value={line.kind}
                            onChange={(e) => handleKindSelect(line.id, e.target.value as LineKind)}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-xs text-stone-900 outline-none focus:border-indigo-500"
                          >
                            <option value="room">Room Tariff (SAC 996311)</option>
                            <option value="extra-bed">Extra Bed / Mattress</option>
                            <option value="food">Restaurant Food (5% GST)</option>
                            <option value="laundry">Laundry Service</option>
                            <option value="other">Other Hospitality Service</option>
                          </select>
                        </div>

                        <div className="col-span-12 sm:col-span-4">
                          <label className="text-[9px] font-medium text-stone-500 block mb-0.5">Description</label>
                          <input
                            type="text"
                            value={line.description}
                            onChange={(e) => handleLineChange(line.id, { description: e.target.value })}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-xs text-stone-900 outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="col-span-4 sm:col-span-1">
                          <label className="text-[9px] font-medium text-stone-500 block mb-0.5">Qty</label>
                          <input
                            type="number"
                            min={1}
                            value={line.qty}
                            onChange={(e) => handleLineChange(line.id, { qty: parseInt(e.target.value) || 1 })}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-xs text-stone-900 font-mono text-center outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="col-span-6 sm:col-span-2">
                          <label className="text-[9px] font-medium text-stone-500 block mb-0.5">Price / Unit (₹)</label>
                          <input
                            type="number"
                            min={0}
                            value={line.unitPrice / 100}
                            onChange={(e) => handleLineChange(line.id, { unitPrice: rupeesToPaise(parseFloat(e.target.value) || 0) })}
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1.5 text-xs text-stone-900 font-mono text-right outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="col-span-2 sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                          <button
                            type="button"
                            disabled={lines.length <= 1}
                            onClick={() => handleRemoveLine(line.id)}
                            className="p-1.5 text-stone-400 hover:text-red-600 disabled:opacity-30 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-[#E5DFD3] text-xs">
                  <span className="text-stone-600 font-medium">Estimated Total (Inclusive of GST):</span>
                  <span className="text-sm font-bold font-mono text-emerald-700">{formatINR(totalEstimatePaise)}</span>
                </div>
              </div>

              {/* BillBook Theme Studio */}
              <div>
                <ThemeStudioBar
                  selectedTemplate={selectedTemplate}
                  onSelectTemplate={setSelectedTemplate}
                  selectedColor={selectedColor}
                  onSelectColor={setSelectedColor}
                  showDeity={showDeity}
                  onToggleDeity={setShowDeity}
                  showHsnTable={showHsnTable}
                  onToggleHsnTable={setShowHsnTable}
                  showQr={showQr}
                  onToggleQr={setShowQr}
                  showStamp={showStamp}
                  onToggleStamp={setShowStamp}
                />
              </div>

              {/* Payment Mode */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs space-y-3">
                <span className="text-[11px] font-bold text-stone-800 uppercase block tracking-wider">4. Payment Mode (भुगतान माध्यम)</span>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['UPI', 'Cash', 'Card'] as PaymentMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMode(mode)}
                      className={`p-2.5 rounded-xl border font-bold text-xs transition-all ${
                        paymentMode === mode
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-500/20 shadow-xs'
                          : 'border-stone-200 bg-[#FAF8F5] text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      {mode === 'UPI' ? '⚡ UPI / QR' : mode === 'Cash' ? '💵 Cash (नकद)' : '💳 Card / EDC'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs text-stone-600 hover:text-stone-900 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleIssueInvoice}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {isGenerating ? 'Generating Official Bill...' : 'Issue Official Bill & View PDF'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Step 2: Live High-Fidelity Bill Preview & 1-Tap Export */
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold text-emerald-950 text-xs">
                      Invoice {issuedInvoice?.number} Successfully Issued!
                    </div>
                    <div className="text-[11px] text-emerald-700">
                      Total: {formatINR(issuedInvoice?.totals.grandTotal || 0)} • Billed to {issuedInvoice?.buyer.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                    Offline Dexie Verified
                  </span>
                </div>
              </div>

              {/* Theme Studio Bar */}
              <ThemeStudioBar
                selectedTemplate={selectedTemplate}
                onSelectTemplate={setSelectedTemplate}
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
                showDeity={showDeity}
                onToggleDeity={setShowDeity}
                showHsnTable={showHsnTable}
                onToggleHsnTable={setShowHsnTable}
                showQr={showQr}
                onToggleQr={setShowQr}
                showStamp={showStamp}
                onToggleStamp={setShowStamp}
              />

              {/* Exact HTML Invoice Document View in Parchment Frame */}
              {issuedInvoice && (
                <div ref={invoiceContainerRef} className="w-full bg-[#ECE6DA] rounded-2xl p-2 sm:p-4 border border-[#DDD6C8] overflow-x-auto max-h-[55vh] overflow-y-auto shadow-inner">
                  <HtmlInvoiceView
                    invoice={issuedInvoice}
                    qrDataUrl={qrDataUrl}
                    deityDataUrl={deityDataUrl}
                    logoDataUrl={logoDataUrl}
                    signatureDataUrl={signatureDataUrl}
                    templateId={selectedTemplate}
                    colorKey={selectedColor}
                    showDeity={showDeity}
                    showHsnTable={showHsnTable}
                    showQr={showQr}
                    showStamp={showStamp}
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="p-4 bg-white rounded-2xl border border-[#E5DFD3] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" /> Send PDF on WhatsApp
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={handleDownloadPdf}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-stone-300 shadow-2xs active:scale-95 transition-all"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-stone-300 shadow-2xs active:scale-95 transition-all"
                  >
                    <Printer className="w-4 h-4 text-emerald-600" /> Print
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
