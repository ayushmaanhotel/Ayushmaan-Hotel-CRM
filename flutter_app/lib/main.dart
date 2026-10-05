import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'theme/app_theme.dart';
import 'models/hotel_models.dart';
import 'services/storage_service.dart';
import 'screens/front_desk_screen.dart';
import 'screens/invoices_screen.dart';
import 'screens/enquiry_screen.dart';
import 'screens/settings_screen.dart';
import 'screens/pnl_cockpit_screen.dart';
import 'screens/cleaner_mobile_screen.dart';
import 'screens/guests_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: AppTheme.paperBg,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(const AyushmanHotelApp());
}

class AyushmanHotelApp extends StatelessWidget {
  const AyushmanHotelApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Ayushmaan Hotel CRM & Invoice',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;
  bool _isLoading = true;

  late HotelConfig _hotelConfig;
  late StaffAccount _currentStaff;
  late List<StaffAccount> _staffAccounts;
  late List<Room> _rooms;
  late List<Invoice> _invoices;
  late List<Inquiry> _inquiries;
  late List<Expense> _expenses;
  late List<Guest> _guests;

  @override
  void initState() {
    super.initState();
    _loadAllInitialData();
  }

  Future<void> _loadAllInitialData() async {
    final cfg = await StorageService.loadHotelConfig();
    final staffList = await StorageService.loadStaffAccounts();
    final curStaff = await StorageService.loadCurrentStaff();
    final rms = await StorageService.loadRooms();
    final invs = await StorageService.loadInvoices();
    final inqs = await StorageService.loadInquiries();
    final exps = await StorageService.loadExpenses();
    final gsts = await StorageService.loadGuests();

    if (mounted) {
      setState(() {
        _hotelConfig = cfg;
        _staffAccounts = staffList;
        _currentStaff = curStaff;
        _rooms = rms;
        _invoices = invs;
        _inquiries = inqs;
        _expenses = exps;
        _guests = gsts;
        _isLoading = false;
      });
    }
  }

  void _updateRoom(Room updated) {
    setState(() {
      final index = _rooms.indexWhere((r) => r.id == updated.id);
      if (index != -1) {
        _rooms[index] = updated;
      }
    });
    StorageService.saveRooms(_rooms);
  }

  void _addInvoice(Invoice invoice) {
    setState(() {
      _invoices.insert(0, invoice);
    });
    StorageService.saveInvoices(_invoices);
  }

  void _addInquiry(Inquiry inq) {
    setState(() {
      _inquiries.insert(0, inq);
    });
    StorageService.saveInquiries(_inquiries);
  }

  void _addExpense(Expense expense) {
    setState(() {
      _expenses.insert(0, expense);
    });
    StorageService.saveExpenses(_expenses);
  }

  void _voidExpense(Expense expense) {
    setState(() {
      final index = _expenses.indexWhere((e) => e.id == expense.id);
      if (index != -1) {
        _expenses[index] = expense;
      }
    });
    StorageService.saveExpenses(_expenses);
  }

  void _addGuest(Guest guest) {
    setState(() {
      _guests.insert(0, guest);
    });
    StorageService.saveGuests(_guests);
  }

  void _updateGuest(Guest guest) {
    setState(() {
      final index = _guests.indexWhere((g) => g.id == guest.id);
      if (index != -1) {
        _guests[index] = guest;
      }
    });
    StorageService.saveGuests(_guests);
  }

  void _updateStaff(StaffAccount staff) {
    setState(() {
      _currentStaff = staff;
      _currentIndex = 0; // Reset index to first screen of new persona
    });
    StorageService.saveCurrentStaff(staff);
  }

  void _updateStaffAccounts(List<StaffAccount> list) {
    setState(() {
      _staffAccounts = list;
    });
    StorageService.saveStaffAccounts(list);
  }

  void _updateHotelConfig(HotelConfig config) {
    setState(() {
      _hotelConfig = config;
    });
    StorageService.saveHotelConfig(config);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppTheme.paperBg,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(
                  color: AppTheme.maroon,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.maroon.withValues(alpha: 0.25),
                      blurRadius: 16,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: const Icon(Icons.hotel_rounded, color: AppTheme.gold, size: 36),
              ),
              const SizedBox(height: 20),
              const Text(
                'AYUSHMAAN HOTEL CRM',
                style: TextStyle(
                  fontFamily: 'serif',
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  letterSpacing: 2.0,
                  color: AppTheme.maroon,
                ),
              ),
              const SizedBox(height: 6),
              const Text(
                'Loading Offline Database & Staff Session...',
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 24),
              const SizedBox(
                width: 28,
                height: 28,
                child: CircularProgressIndicator(
                  color: AppTheme.maroon,
                  strokeWidth: 2.5,
                ),
              ),
            ],
          ),
        ),
      );
    }

    final isHousekeeper = _currentStaff.role == UserRole.housekeeper;
    final isReceptionist = _currentStaff.role == UserRole.receptionist;

    // Define navigation items dynamically based on active role
    final List<Widget> screens;
    final List<BottomNavigationBarItem> navItems;

    if (isHousekeeper) {
      // 1. Housekeeper Persona: Dedicated 1-Tap Mobile Cleaner View
      screens = [
        CleanerMobileScreen(
          rooms: _rooms,
          onRoomUpdated: _updateRoom,
          currentStaff: _currentStaff,
          hotelConfig: _hotelConfig,
        ),
        SettingsScreen(
          hotelConfig: _hotelConfig,
          onConfigChanged: _updateHotelConfig,
          currentStaff: _currentStaff,
          onStaffChanged: _updateStaff,
          staffAccounts: _staffAccounts,
          onStaffAccountsChanged: _updateStaffAccounts,
          rooms: _rooms,
          invoices: _invoices,
          inquiries: _inquiries,
          guests: _guests,
          onGuestAdded: _addGuest,
          onAddInquiry: _addInquiry,
        ),
      ];
      navItems = const [
        BottomNavigationBarItem(
          icon: Icon(Icons.cleaning_services_rounded),
          label: 'Rooms & Cleaning',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.tune_rounded),
          label: 'Settings',
        ),
      ];
    } else if (isReceptionist) {
      // 2. Receptionist Persona: Front Desk, Invoices, Guests 360, Enquiries, Settings
      screens = [
        FrontDeskScreen(
          rooms: _rooms,
          onRoomUpdated: _updateRoom,
          onInvoiceCreated: _addInvoice,
          currentStaff: _currentStaff,
          onStaffChanged: _updateStaff,
          hotelConfig: _hotelConfig,
          invoices: _invoices,
        ),
        InvoicesScreen(
          invoices: _invoices,
          onInvoiceCreated: _addInvoice,
          hotelConfig: _hotelConfig,
        ),
        GuestsScreen(
          guests: _guests,
          onGuestAdded: _addGuest,
          onGuestUpdated: _updateGuest,
          hotelConfig: _hotelConfig,
        ),
        EnquiryScreen(
          inquiries: _inquiries,
          onAddInquiry: _addInquiry,
        ),
        SettingsScreen(
          hotelConfig: _hotelConfig,
          onConfigChanged: _updateHotelConfig,
          currentStaff: _currentStaff,
          onStaffChanged: _updateStaff,
          staffAccounts: _staffAccounts,
          onStaffAccountsChanged: _updateStaffAccounts,
          rooms: _rooms,
          invoices: _invoices,
          inquiries: _inquiries,
          guests: _guests,
          onGuestAdded: _addGuest,
          onAddInquiry: _addInquiry,
        ),
      ];
      navItems = const [
        BottomNavigationBarItem(
          icon: Icon(Icons.hotel_rounded),
          label: 'Front Desk',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.receipt_long_rounded),
          label: 'Invoices',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.people_alt_rounded),
          label: 'Guests 360°',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chat_bubble_outline_rounded),
          label: 'Enquiries',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.tune_rounded),
          label: 'Settings',
        ),
      ];
    } else {
      // 3. Owner / General Manager Persona: Full Executive Cockpit
      screens = [
        FrontDeskScreen(
          rooms: _rooms,
          onRoomUpdated: _updateRoom,
          onInvoiceCreated: _addInvoice,
          currentStaff: _currentStaff,
          onStaffChanged: _updateStaff,
          hotelConfig: _hotelConfig,
          invoices: _invoices,
        ),
        InvoicesScreen(
          invoices: _invoices,
          onInvoiceCreated: _addInvoice,
          hotelConfig: _hotelConfig,
        ),
        PnLCockpitScreen(
          invoices: _invoices,
          expenses: _expenses,
          onExpenseAdded: _addExpense,
          onExpenseVoided: _voidExpense,
          rooms: _rooms,
          hotelConfig: _hotelConfig,
        ),
        GuestsScreen(
          guests: _guests,
          onGuestAdded: _addGuest,
          onGuestUpdated: _updateGuest,
          hotelConfig: _hotelConfig,
        ),
        SettingsScreen(
          hotelConfig: _hotelConfig,
          onConfigChanged: _updateHotelConfig,
          currentStaff: _currentStaff,
          onStaffChanged: _updateStaff,
          staffAccounts: _staffAccounts,
          onStaffAccountsChanged: _updateStaffAccounts,
          rooms: _rooms,
          invoices: _invoices,
          inquiries: _inquiries,
          guests: _guests,
          onGuestAdded: _addGuest,
          onAddInquiry: _addInquiry,
        ),
      ];
      navItems = const [
        BottomNavigationBarItem(
          icon: Icon(Icons.hotel_rounded),
          label: 'Front Desk',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.receipt_long_rounded),
          label: 'Invoices',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.trending_up_rounded),
          label: 'P&L Cockpit',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.people_alt_rounded),
          label: 'Guests 360°',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.tune_rounded),
          label: 'Settings',
        ),
      ];
    }

    final safeIndex = _currentIndex >= screens.length ? 0 : _currentIndex;

    return Scaffold(
      body: IndexedStack(
        index: safeIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: safeIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: navItems,
        type: BottomNavigationBarType.fixed,
        selectedItemColor: AppTheme.maroon,
        unselectedItemColor: AppTheme.textMuted,
        selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
        unselectedLabelStyle: const TextStyle(fontSize: 10.5),
      ),
    );
  }
}
