import { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import type { ActiveTab } from './components/layout/Sidebar';
import { RoleSwitcher } from './components/layout/RoleSwitcher';
import { ShareAccessModal } from './components/layout/ShareAccessModal';
import { StaffLoginModal } from './components/admin/StaffLoginModal';
import { AdminStaffScopePanel } from './components/admin/AdminStaffScopePanel';
import { AICommandBar } from './components/ai/AICommandBar';
import { FrontDeskModule } from './components/modules/FrontDeskModule';
import { VisualRoomsBoard } from './components/modules/VisualRoomsBoard';
import { QuickBookingModal } from './components/modules/QuickBookingModal';
import { BookingVoucherModal } from './components/booking/BookingVoucherModal';
import { GuestTimeline } from './components/modules/GuestTimeline';
import { HousekeepingKanban } from './components/modules/HousekeepingKanban';
import { OwnerAnalyticsModule } from './components/modules/OwnerAnalyticsModule';
import { CleanerMobileModule } from './components/modules/CleanerMobileModule';
import { AIAssistantModule } from './components/modules/AIAssistantModule';
import { WhatsAppSimulator } from './components/whatsapp/WhatsAppSimulator';
import { InvoiceWizard } from './components/invoice/InvoiceWizard';
import { InvoiceListModal } from './components/invoice/InvoiceListModal';
import { BrandingSettingsModal } from './components/invoice/BrandingSettingsModal';
import { PnLMobileCockpit } from './components/pnl/PnLMobileCockpit';
import { AddExpenseModal } from './components/pnl/AddExpenseModal';
import { MobileNavBar } from './components/layout/MobileNavBar';
import { migrateLegacyDataIfNeeded } from './db/migrate';
import { PremiumInvoiceModal } from './components/finance/PremiumInvoiceModal';
import { InvoiceComposerModal } from './components/finance/InvoiceComposerModal';
import { FinanceModule } from './components/modules/FinanceModule';
import type { Invoice, InvoiceDraft } from './types/invoice';
import { folioFromInclusive, round2 } from './lib/invoiceEngine';
import { downloadBlob } from './lib/sharePdf';

import { useHotelStore } from './hooks/useHotelStore';
import type { Room, Guest, StaffAccount, Transaction } from './types/hotel';

export function App() {
  const {
    hotelConfig,
    updateHotelConfig,
    staffAccounts,
    saveStaffAccount,
    currentStaff,
    setCurrentStaff,
    activeRole,
    setActiveRole,
    rooms,
    guests,
    transactions,
    tasks,
    updateRoomStatus,
    addBooking,
    updateTaskStage,
    resetDemoData,
    invoiceConfig,
    invoices,
    issueInvoice,
    saveDraft,
    readDraft,
    clearDraft,
    recordPayment,
    cancelInvoice,
    exportBackup
  } = useHotelStore();

  // surface an unfinished bill once, on launch (master prompt §49/50)
  useEffect(() => {
    const d = readDraft();
    if (d) setDraftBanner(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('finance');
  const [isCmdKOpen, setIsCmdKOpen] = useState(false);
  const [isQuickBookingOpen, setIsQuickBookingOpen] = useState(false);
  const [selectedRoomForBooking, setSelectedRoomForBooking] = useState<Room | undefined>(undefined);
  
  // Modals
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isStaffLoginOpen, setIsStaffLoginOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [activeVoucherData, setActiveVoucherData] = useState<any>(null);

  // WhatsApp Modal
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [whatsAppGuest, setWhatsAppGuest] = useState<Guest | null>(null);

  // Luxury GST Invoicing Modals (IndexedDB Dexie Engine)
  const [isInvoiceWizardOpen, setIsInvoiceWizardOpen] = useState(false);
  const [invoiceWizardBooking, setInvoiceWizardBooking] = useState<{
    room: Room;
    guest?: Guest;
    nights?: number;
    amount?: number;
    paymentMode?: string;
  } | null>(null);
  const [isInvoiceListOpen, setIsInvoiceListOpen] = useState(false);
  const [isBrandingSettingsOpen, setIsBrandingSettingsOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);

  // Auto-migrate legacy localStorage transactions to Dexie on boot
  useEffect(() => {
    migrateLegacyDataIfNeeded().catch(err => {
      console.warn('Dexie migration warning:', err);
    });
  }, []);

  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(null);

  // Full billing: composer + crash-recovery draft banner
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerSeed, setComposerSeed] = useState<InvoiceDraft | null>(null);
  const [composerKey, setComposerKey] = useState(0);
  const [draftBanner, setDraftBanner] = useState<InvoiceDraft | null>(null);

  const occupiedCount = rooms.filter(r => r.status === 'occupied').length;
  const occupancyRate = Math.round((occupiedCount / rooms.length) * 100);
  const todayRevenue = transactions.reduce((acc, t) => acc + t.amount, 0);
  const pendingPaymentCount = guests.filter(g => g.pendingBalance > 0).length;

  const handleCompleteBooking = (details: any) => {
    const result = addBooking(details);

    // Phase 1: issue the legal GST tax invoice at check-in (folio = room line)
    const checkIn = new Date();
    const checkOut = new Date(checkIn.getTime() + details.nights * 86400000);
    const guestProfile = guests.find(g => g.phone.includes(details.phone) || details.phone.includes(g.phone.replace(/\D/g, '').slice(-10)));
    const invoice = issueInvoice({
      guestName: details.guestName,
      phone: details.phone,
      email: guestProfile?.email,
      gstin: null,
      stay: {
        roomNumber: details.room.number,
        roomType: details.room.type,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        nights: details.nights,
        tariffPerNight: details.room.pricePerNight
      },
      inclusiveAmount: details.totalAmount,
      paymentMethod: details.paymentMode,
      bookingRef: result.bookingRef,
      transactionId: result.newTx.id
    });

    setActiveVoucherData({
      bookingRef: result.bookingRef,
      room: details.room,
      guestName: details.guestName,
      phone: details.phone,
      nights: details.nights,
      paymentMode: details.paymentMode,
      totalAmount: details.totalAmount,
      invoiceId: invoice.id
    });
    setIsVoucherOpen(true);
  };

  const handleCheckOutRoom = (room: Room) => {
    updateRoomStatus(room.id, 'cleaning');
    setInvoiceWizardBooking({
      room,
      guest: room.currentGuest,
      nights: 1,
      amount: room.pricePerNight,
      paymentMode: 'UPI'
    });
    setIsInvoiceWizardOpen(true);
  };

  /** Open (or lazily issue) the premium tax invoice for a ledger transaction. */
  const handleOpenInvoice = (tx: Transaction) => {
    const existing = invoices.find(i => i.transactionId === tx.id);
    if (existing) {
      setActiveInvoice(existing);
      return;
    }
    const room = rooms.find(r => r.number === tx.roomNumber);
    const guestProfile = guests.find(g => g.name === tx.guestName);
    const invoice = issueInvoice({
      guestName: tx.guestName,
      phone: guestProfile?.phone ?? '+91 00000 00000',
      email: guestProfile?.email,
      gstin: null,
      stay: room ? {
        roomNumber: room.number,
        roomType: room.type,
        checkIn: new Date().toISOString(),
        checkOut: new Date().toISOString(),
        nights: 1,
        tariffPerNight: room.pricePerNight
      } : undefined,
      inclusiveAmount: tx.amount,
      paymentMethod: tx.type,
      transactionId: tx.id
    });
    setActiveInvoice(invoice);
  };

  const openComposer = (seed: InvoiceDraft | null) => {
    setComposerSeed(seed);
    setComposerKey(k => k + 1);
    setComposerOpen(true);
    setDraftBanner(null);
  };

  const handleComposerIssue = (input: {
    guestName: string; guestPhone: string; guestGstin?: string | null;
    stay?: { roomNumber: string; roomType: string; checkIn: string; checkOut: string; nights: number; tariffPerNight: number };
    entries: Parameters<typeof folioFromInclusive>[0];
    received: number;
    paymentMethod: 'UPI' | 'Cash' | 'Card' | 'Mixed';
    mode: 'SIMPLE' | 'GST';
  }): Invoice => {
    const items = folioFromInclusive(input.entries, input.stay?.tariffPerNight, input.mode);
    const incl = round2(input.entries.reduce((a, e) => a + e.qty * e.rateIncl, 0));
    const inv = issueInvoice({
      guestName: input.guestName,
      phone: input.guestPhone,
      gstin: input.guestGstin ?? null,
      stay: input.stay,
      items,
      inclusiveAmount: incl,
      received: input.received,
      paymentMethod: input.paymentMethod,
      mode: input.mode,
      settled: false,
    });
    setComposerOpen(false);
    return inv;
  };

  const handleDuplicateInvoice = (inv: Invoice) => {
    openComposer({
      updatedAt: new Date().toISOString(),
      guestName: inv.guest.name,
      guestPhone: inv.guest.phone,
      guestGstin: inv.guest.gstin ?? null,
      roomNumber: inv.stay?.roomNumber,
      nights: inv.stay?.nights ?? 1,
      tariffPerNight: inv.stay?.tariffPerNight ?? 0,
      items: inv.items.filter(i => i.category !== 'ROOM').map(i => ({
        ...i,
        rate: round2(i.rate * (1 + i.gstRate / 100)),   // taxable → as-quoted inclusive
      })),
      paymentMethod: 'UPI',
      received: 0,
      mode: inv.mode,
    });
  };

  const handleExportBackup = () => {
    downloadBlob(
      new Blob([exportBackup()], { type: 'application/json' }),
      `AyushmaanOS-backup-${new Date().toISOString().slice(0, 10)}.json`
    );
  };

  const handleStaffLoginSuccess = (staff: StaffAccount) => {
    setCurrentStaff(staff);
    if (staff.scopes.includes('SCOPE_HOUSEKEEPING_ONLY') && staff.scopes.length === 1) {
      setActiveRole('housekeeper');
    } else if (staff.scopes.includes('SCOPE_MANAGE_STAFF')) {
      setActiveRole('owner');
    } else {
      setActiveRole('receptionist');
    }
  };

  const handleSelectCmdKAction = (action: string) => {
    if (action === 'new-booking') {
      setIsQuickBookingOpen(true);
    } else if (action === 'whatsapp-trigger') {
      setIsWhatsAppOpen(true);
    } else if (action === 'view-room') {
      setActiveTab('rooms');
    } else if (action === 'view-guest') {
      setActiveTab('guests');
    } else if (action === 'ai-query') {
      setActiveTab('ai-assistant');
    } else if (action === 'new-invoice') {
      setInvoiceWizardBooking(null);
      setIsInvoiceWizardOpen(true);
    } else if (action === 'invoice-registry') {
      setIsInvoiceListOpen(true);
    } else if (action === 'branding-settings') {
      setIsBrandingSettingsOpen(true);
    } else if (action === 'record-expense') {
      setIsAddExpenseModalOpen(true);
    } else if (action === 'view-pnl') {
      setActiveTab('pnl');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5EE] text-[#1C1917] flex flex-col font-sans antialiased">
      <RoleSwitcher 
        activeRole={activeRole}
        setActiveRole={setActiveRole}
        currentStaff={currentStaff}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenStaffLoginModal={() => setIsStaffLoginOpen(true)}
      />

      <div className="flex-1 flex">
        {activeRole !== 'housekeeper' && (
          <div className="hidden md:flex shrink-0">
            <Sidebar 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              openCmdK={() => setIsCmdKOpen(true)}
              occupancyRate={occupancyRate}
              todayRevenue={todayRevenue}
              pendingPaymentCount={pendingPaymentCount}
              activeRole={activeRole}
            />
          </div>
        )}

        <main className="flex-1 p-3 sm:p-4 md:p-8 pb-28 md:pb-8 max-w-7xl mx-auto overflow-x-hidden w-full">
          {activeRole === 'housekeeper' ? (
            <CleanerMobileModule 
              tasks={tasks}
              onTaskStageChange={updateTaskStage}
            />
          ) : (
            <>
              {activeTab === 'front-desk' && (
                <FrontDeskModule 
                  rooms={rooms}
                  guests={guests}
                  onOpenQuickBooking={() => setIsQuickBookingOpen(true)}
                  onOpenCheckIn={(room) => {
                    setSelectedRoomForBooking(room);
                    setIsQuickBookingOpen(true);
                  }}
                  onOpenCheckOut={handleCheckOutRoom}
                  onOpenPayment={(guest) => {
                    setWhatsAppGuest(guest);
                    setIsWhatsAppOpen(true);
                  }}
                  onSelectTab={setActiveTab}
                />
              )}

              {activeTab === 'rooms' && (
                <VisualRoomsBoard 
                  rooms={rooms}
                  onRoomStatusChange={updateRoomStatus}
                  onBookRoom={(room) => {
                    setSelectedRoomForBooking(room);
                    setIsQuickBookingOpen(true);
                  }}
                  onOpenCheckOut={handleCheckOutRoom}
                />
              )}

              {activeTab === 'guests' && (
                <GuestTimeline 
                  guests={guests}
                  onOpenWhatsApp={(g) => {
                    setWhatsAppGuest(g);
                    setIsWhatsAppOpen(true);
                  }}
                />
              )}

              {activeTab === 'finance' && (
                <FinanceModule 
                  transactions={transactions}
                  todayRevenue={todayRevenue}
                  hotelConfig={hotelConfig}
                  onUpdateHotelConfig={updateHotelConfig}
                  onOpenGSTModal={(tx: Transaction) => {
                    handleOpenInvoice(tx);
                  }}
                  invoices={invoices}
                  onNewBill={() => openComposer(null)}
                  onOpenInvoice={(inv: Invoice) => setActiveInvoice(inv)}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onRecordPayment={(inv: Invoice, amount: number, mode: 'UPI' | 'Cash' | 'Card') => recordPayment(inv.id, amount, mode)}
                  onCancelInvoice={(inv: Invoice, reason: string) => cancelInvoice(inv.id, reason)}
                  onExportBackup={handleExportBackup}
                  onOpenInvoiceRegistry={() => setIsInvoiceListOpen(true)}
                  onOpenBrandingSettings={() => setIsBrandingSettingsOpen(true)}
                  onOpenNewInvoice={() => {
                    setInvoiceWizardBooking(null);
                    setIsInvoiceWizardOpen(true);
                  }}
                />
              )}

              {activeTab === 'pnl' && (
                <PnLMobileCockpit 
                  activeRole={activeRole}
                  currentStaffName={currentStaff?.name || 'Front Desk'}
                  onOpenNewInvoice={() => {
                    setInvoiceWizardBooking(null);
                    setIsInvoiceWizardOpen(true);
                  }}
                />
              )}

              {activeTab === 'operations' && (
                <HousekeepingKanban 
                  tasks={tasks}
                  onTaskStageChange={updateTaskStage}
                />
              )}

              {activeTab === 'owner-analytics' && (
                <OwnerAnalyticsModule 
                  rooms={rooms}
                  transactions={transactions}
                  todayRevenue={todayRevenue}
                />
              )}

              {activeTab === 'admin-scopes' && (
                <AdminStaffScopePanel 
                  staffAccounts={staffAccounts}
                  onSaveStaffAccount={saveStaffAccount}
                />
              )}

              {activeTab === 'ai-assistant' && (
                <AIAssistantModule 
                  onTriggerWhatsApp={() => setIsWhatsAppOpen(true)}
                  onOpenQuickBooking={() => setIsQuickBookingOpen(true)}
                />
              )}

              {activeTab === 'settings' && (
                <div className="p-8 bg-white rounded-2xl border border-[#E5DFD3] shadow-sm space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-stone-900">Hotel Settings & Merchant UPI Config</h2>
                      <p className="text-xs text-stone-600 mt-1">Configure Indian Hotel GSTIN, Merchant UPI VPA, Sacred Deity Logo, Invoice Prefix & Staff RBAC permissions.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => setIsBrandingSettingsOpen(true)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Branding, Deity Arch & GST Slabs
                      </button>
                      <button 
                        onClick={() => setIsInvoiceListOpen(true)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        GST Tax Register & Backup
                      </button>
                      <button 
                        onClick={() => {
                          if (confirm("Reset local persistent state to default sample data?")) {
                            resetDemoData();
                          }
                        }}
                        className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Reset Demo Data
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3] space-y-2 text-xs">
                      <div className="font-semibold text-emerald-700">✓ Merchant UPI VPA ID: {hotelConfig.upiVpa}</div>
                      <div className="text-stone-700">Merchant Name: {hotelConfig.merchantName}</div>
                      <div className="text-[11px] text-stone-500">Offline NPCI standard string formatted with checksums.</div>
                    </div>

                    <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#E5DFD3] space-y-2 text-xs">
                      <div className="font-semibold text-indigo-700">✓ Offline Dexie Invoicing Engine</div>
                      <div className="text-stone-700">Immutable sequential numbering, CBIC 2025 GST slabs, and vector PDF compilation.</div>
                      <div className="text-[11px] text-stone-500">Zero cloud API subscriptions required.</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <ShareAccessModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        currentRole={activeRole}
      />

      <StaffLoginModal 
        isOpen={isStaffLoginOpen}
        onClose={() => setIsStaffLoginOpen(false)}
        staffAccounts={staffAccounts}
        onLoginSuccess={handleStaffLoginSuccess}
      />

      <AICommandBar 
        isOpen={isCmdKOpen}
        onClose={() => setIsCmdKOpen(false)}
        rooms={rooms}
        guests={guests}
        onSelectAction={handleSelectCmdKAction}
      />

      <QuickBookingModal 
        isOpen={isQuickBookingOpen}
        onClose={() => setIsQuickBookingOpen(false)}
        selectedRoom={selectedRoomForBooking}
        rooms={rooms}
        hotelConfig={hotelConfig}
        onCompleteBooking={handleCompleteBooking}
      />

      <BookingVoucherModal 
        isOpen={isVoucherOpen}
        onClose={() => setIsVoucherOpen(false)}
        bookingData={activeVoucherData}
        onOpenInvoice={() => {
          const inv = invoices.find(i => i.id === activeVoucherData?.invoiceId);
          if (inv) {
            setIsVoucherOpen(false);
            setActiveInvoice(inv);
          }
        }}
      />

      <WhatsAppSimulator 
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        guest={whatsAppGuest}
      />

      <InvoiceWizard 
        isOpen={isInvoiceWizardOpen}
        onClose={() => {
          setIsInvoiceWizardOpen(false);
          setInvoiceWizardBooking(null);
        }}
        prefillBooking={invoiceWizardBooking}
      />

      {draftBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-md bg-zinc-900 border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-amber-300">Unfinished bill found</div>
            <div className="text-[10px] text-zinc-400 truncate">
              {draftBanner.guestName || 'New customer'} · {draftBanner.items.length} line(s) · {new Date(draftBanner.updatedAt).toLocaleString()}
            </div>
          </div>
          <button onClick={() => openComposer(draftBanner)} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-bold">Continue</button>
          <button onClick={() => { clearDraft(); setDraftBanner(null); }} className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-[10px] font-bold">Discard</button>
        </div>
      )}

      <InvoiceComposerModal
        key={composerKey}
        isOpen={composerOpen}
        onClose={() => setComposerOpen(false)}
        hotelConfig={hotelConfig}
        invoiceConfig={invoiceConfig}
        guests={guests}
        rooms={rooms}
        seed={composerSeed}
        onIssued={(inv) => setActiveInvoice(inv)}
        onIssue={handleComposerIssue}
        saveDraft={saveDraft}
        clearDraft={clearDraft}
      />

      <PremiumInvoiceModal
        isOpen={!!activeInvoice}
        onClose={() => setActiveInvoice(null)}
        invoice={activeInvoice}
        hotelConfig={hotelConfig}
        invoiceConfig={invoiceConfig}
      />

      <InvoiceListModal 
        isOpen={isInvoiceListOpen}
        onClose={() => setIsInvoiceListOpen(false)}
        onOpenNewInvoice={() => {
          setIsInvoiceListOpen(false);
          setInvoiceWizardBooking(null);
          setIsInvoiceWizardOpen(true);
        }}
      />

      <BrandingSettingsModal 
        isOpen={isBrandingSettingsOpen}
        onClose={() => setIsBrandingSettingsOpen(false)}
      />

      <AddExpenseModal 
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
        currentStaffName={currentStaff?.name || 'Front Desk'}
      />

      {activeRole !== 'housekeeper' && (
        <MobileNavBar 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenQuickBooking={() => setIsQuickBookingOpen(true)}
          pendingPaymentCount={pendingPaymentCount}
        />
      )}
    </div>
  );
}

export default App;
