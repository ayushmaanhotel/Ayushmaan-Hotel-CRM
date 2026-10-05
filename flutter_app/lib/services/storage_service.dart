import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/hotel_models.dart';
import '../data/mock_hotel_data.dart';

/// Central offline persistence service for Ayushmaan Hotel CRM & Invoicing
class StorageService {
  static const String _keyHotelConfig = 'ayushmaan_hotel_config';
  static const String _keyStaffAccounts = 'ayushmaan_staff_accounts';
  static const String _keyCurrentStaff = 'ayushmaan_current_staff';
  static const String _keyInvoices = 'ayushmaan_invoices';
  static const String _keyRooms = 'ayushmaan_rooms';
  static const String _keyInquiries = 'ayushmaan_inquiries';
  static const String _keySupabaseUrl = 'ayushmaan_supabase_url';
  static const String _keySupabaseKey = 'ayushmaan_supabase_key';
  static const String _keyCloudSyncActive = 'ayushmaan_cloud_sync_active';
  static const String _keyExpenses = 'ayushmaan_expenses';
  static const String _keyGuests = 'ayushmaan_guests';
  static const String _keyHousekeepingTasks = 'ayushmaan_housekeeping_tasks';

  static SharedPreferences? _prefs;

  static Future<SharedPreferences> _getPrefs() async {
    _prefs ??= await SharedPreferences.getInstance();
    return _prefs!;
  }

  // --- Hotel Config ---
  static Future<HotelConfig> loadHotelConfig() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyHotelConfig);
    if (jsonStr != null) {
      try {
        return HotelConfig.fromJson(jsonDecode(jsonStr));
      } catch (_) {}
    }
    return HotelConfig();
  }

  static Future<void> saveHotelConfig(HotelConfig config) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyHotelConfig, jsonEncode(config.toJson()));
  }

  // --- Staff Accounts & Current Staff ---
  static List<StaffAccount> defaultStaffAccounts() => [
    StaffAccount(
      id: 'STF-101',
      name: 'Aman Varma (Admin / Owner)',
      phone: '+91 98765 43210',
      roleTitle: 'Hotel Owner & General Manager',
      role: UserRole.owner,
      pin: '9999',
    ),
    StaffAccount(
      id: 'STF-102',
      name: 'Priya Nair (Front Desk)',
      phone: '+91 98200 11223',
      roleTitle: 'Senior Receptionist',
      role: UserRole.receptionist,
      pin: '2222',
    ),
    StaffAccount(
      id: 'STF-103',
      name: 'Suresh Kumar (Housekeeping)',
      phone: '+91 97411 22334',
      roleTitle: 'Housekeeper Staff',
      role: UserRole.housekeeper,
      pin: '1111',
    ),
  ];

  static Future<List<StaffAccount>> loadStaffAccounts() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyStaffAccounts);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => StaffAccount.fromJson(e)).toList();
      } catch (_) {}
    }
    final defaults = defaultStaffAccounts();
    await saveStaffAccounts(defaults);
    return defaults;
  }

  static Future<void> saveStaffAccounts(List<StaffAccount> accounts) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyStaffAccounts, jsonEncode(accounts.map((a) => a.toJson()).toList()));
  }

  static Future<StaffAccount> loadCurrentStaff() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyCurrentStaff);
    if (jsonStr != null) {
      try {
        return StaffAccount.fromJson(jsonDecode(jsonStr));
      } catch (_) {}
    }
    return defaultStaffAccounts().first;
  }

  static Future<void> saveCurrentStaff(StaffAccount staff) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyCurrentStaff, jsonEncode(staff.toJson()));
  }

  // --- Invoices ---
  static Future<List<Invoice>> loadInvoices() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyInvoices);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => Invoice.fromJson(e)).toList();
      } catch (_) {}
    }
    final initial = MockHotelData.getInitialInvoices();
    await saveInvoices(initial);
    return initial;
  }

  static Future<void> saveInvoices(List<Invoice> invoices) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyInvoices, jsonEncode(invoices.map((i) => i.toJson()).toList()));
  }

  // --- Rooms ---
  static Future<List<Room>> loadRooms() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyRooms);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => Room.fromJson(e)).toList();
      } catch (_) {}
    }
    final initial = MockHotelData.getInitialRooms();
    await saveRooms(initial);
    return initial;
  }

  static Future<void> saveRooms(List<Room> rooms) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyRooms, jsonEncode(rooms.map((r) => r.toJson()).toList()));
  }

  // --- Inquiries ---
  static Future<List<Inquiry>> loadInquiries() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyInquiries);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => Inquiry.fromJson(e)).toList();
      } catch (_) {}
    }
    final initial = MockHotelData.getInitialInquiries();
    await saveInquiries(initial);
    return initial;
  }

  static Future<void> saveInquiries(List<Inquiry> inquiries) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyInquiries, jsonEncode(inquiries.map((inq) => inq.toJson()).toList()));
  }

  // --- Cloud Sync Settings ---
  static Future<Map<String, dynamic>> loadCloudSyncConfig() async {
    final prefs = await _getPrefs();
    return {
      'url': prefs.getString(_keySupabaseUrl) ?? '',
      'key': prefs.getString(_keySupabaseKey) ?? '',
      'active': prefs.getBool(_keyCloudSyncActive) ?? false,
    };
  }

  static Future<void> saveCloudSyncConfig(String url, String key, bool active) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keySupabaseUrl, url);
    await prefs.setString(_keySupabaseKey, key);
    await prefs.setBool(_keyCloudSyncActive, active);
  }

  // --- Operating Expenses & PnL ---
  static List<Expense> defaultExpenses() => [
    Expense(
      id: 'EXP-101',
      voucherNumber: 'EXP/26-27/0001',
      date: '05-Oct-2026',
      category: ExpenseCategory.kitchenGroceries,
      amount: 3200.0,
      paymentMode: 'Cash',
      paidTo: 'Bandra Fresh Vegetable Market',
      description: 'Daily breakfast provisions (Milk, bread, butter, eggs, vegetables)',
      recordedBy: 'Aman Varma',
    ),
    Expense(
      id: 'EXP-102',
      voucherNumber: 'EXP/26-27/0002',
      date: '05-Oct-2026',
      category: ExpenseCategory.laundryLinen,
      amount: 1850.0,
      paymentMode: 'UPI',
      paidTo: 'Apex Steam Laundry Services',
      description: 'Dry cleaning 35 bedsheets, 20 pillow covers & 30 bath towels',
      recordedBy: 'Priya Nair',
    ),
    Expense(
      id: 'EXP-103',
      voucherNumber: 'EXP/26-27/0003',
      date: '04-Oct-2026',
      category: ExpenseCategory.utilitiesBills,
      amount: 4500.0,
      paymentMode: 'UPI',
      paidTo: 'HP Fuel Station Bandra',
      description: '50 Litres generator backup diesel',
      recordedBy: 'Aman Varma',
    ),
    Expense(
      id: 'EXP-104',
      voucherNumber: 'EXP/26-27/0004',
      date: '04-Oct-2026',
      category: ExpenseCategory.staffWages,
      amount: 2000.0,
      paymentMode: 'Cash',
      paidTo: 'Suresh Kumar',
      description: 'Festival advance on monthly salary',
      recordedBy: 'Aman Varma',
    ),
    Expense(
      id: 'EXP-105',
      voucherNumber: 'EXP/26-27/0005',
      date: '03-Oct-2026',
      category: ExpenseCategory.maintenanceRepairs,
      amount: 850.0,
      paymentMode: 'Cash',
      paidTo: 'CoolCare AC Solutions',
      description: 'Room 204 AC blower servicing & filter replacement',
      recordedBy: 'Priya Nair',
    ),
    Expense(
      id: 'EXP-106',
      voucherNumber: 'EXP/26-27/0006',
      date: '03-Oct-2026',
      category: ExpenseCategory.otaCommissions,
      amount: 2100.0,
      paymentMode: 'Bank Transfer',
      paidTo: 'MakeMyTrip India Pvt Ltd',
      description: '20% commission leak deduction on booking MMT-84920',
      recordedBy: 'Aman Varma',
    ),
  ];

  static Future<List<Expense>> loadExpenses() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyExpenses);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => Expense.fromJson(e)).toList();
      } catch (_) {}
    }
    final initial = defaultExpenses();
    await saveExpenses(initial);
    return initial;
  }

  static Future<void> saveExpenses(List<Expense> expenses) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyExpenses, jsonEncode(expenses.map((e) => e.toJson()).toList()));
  }

  // --- Guests 360 Directory ---
  static List<Guest> defaultGuests() => [
    Guest(
      id: 'GST-001',
      name: 'Rajesh Sharma',
      phone: '+91 98765 43210',
      email: 'stay@rajesh.com',
      isVIP: true,
      visits: 5,
      totalSpent: 45000.0,
      lastStay: '04-Oct-2026 (Room 101)',
      notes: 'High floor preference, Jain meal preparation, extra water bottles.',
    ),
    Guest(
      id: 'GST-002',
      name: 'Priya Nair',
      phone: '+91 98200 11223',
      email: 'priya@nair.org',
      isVIP: false,
      visits: 2,
      totalSpent: 14000.0,
      lastStay: '02-Oct-2026 (Room 201)',
      notes: 'Late check-out requested at 1:00 PM.',
    ),
    Guest(
      id: 'GST-003',
      name: 'Jonathan Miller',
      phone: '+44 7700 900123',
      email: 'jonathan@london.co.uk',
      isVIP: true,
      isForeigner: true,
      cFormDone: true,
      visits: 1,
      totalSpent: 18000.0,
      lastStay: '05-Oct-2026 (Room 301)',
      notes: 'UK Tourist, passport verified, Form C filed on FRRO portal.',
    ),
    Guest(
      id: 'GST-004',
      name: 'Vikram Malhotra',
      phone: '+91 99887 76655',
      email: 'vikram@malhotra.in',
      isVIP: false,
      visits: 3,
      totalSpent: 26500.0,
      lastStay: '28-Sep-2026 (Room 202)',
      notes: 'Corporate billing required under GSTIN: 27AABCM8899K1Z4.',
    ),
  ];

  static Future<List<Guest>> loadGuests() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyGuests);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => Guest.fromJson(e)).toList();
      } catch (_) {}
    }
    final initial = defaultGuests();
    await saveGuests(initial);
    return initial;
  }

  static Future<void> saveGuests(List<Guest> guests) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyGuests, jsonEncode(guests.map((g) => g.toJson()).toList()));
  }

  // --- Housekeeping Tasks ---
  static List<HousekeepingTask> defaultHousekeepingTasks() => [
    HousekeepingTask(
      id: 'TSK-101',
      roomNumber: '101',
      housekeeperName: 'Suresh Kumar',
      stage: 'dirty',
      priority: 'Normal',
      updatedAt: '11:15 AM (Checkout)',
    ),
    HousekeepingTask(
      id: 'TSK-204',
      roomNumber: '204',
      housekeeperName: 'Suresh Kumar',
      stage: 'cleaning',
      priority: 'High',
      updatedAt: '11:45 AM (In Progress)',
    ),
    HousekeepingTask(
      id: 'TSK-301',
      roomNumber: '301',
      housekeeperName: 'Suresh Kumar',
      stage: 'ready',
      priority: 'VIP Urgent',
      updatedAt: '10:30 AM (Clean & Sanitised)',
    ),
    HousekeepingTask(
      id: 'TSK-102',
      roomNumber: '102',
      housekeeperName: 'Suresh Kumar',
      stage: 'ready',
      priority: 'Normal',
      updatedAt: '09:00 AM (Clean & Ready)',
    ),
  ];

  static Future<List<HousekeepingTask>> loadHousekeepingTasks() async {
    final prefs = await _getPrefs();
    final jsonStr = prefs.getString(_keyHousekeepingTasks);
    if (jsonStr != null) {
      try {
        final List<dynamic> list = jsonDecode(jsonStr);
        return list.map((e) => HousekeepingTask.fromJson(e)).toList();
      } catch (_) {}
    }
    final initial = defaultHousekeepingTasks();
    await saveHousekeepingTasks(initial);
    return initial;
  }

  static Future<void> saveHousekeepingTasks(List<HousekeepingTask> tasks) async {
    final prefs = await _getPrefs();
    await prefs.setString(_keyHousekeepingTasks, jsonEncode(tasks.map((t) => t.toJson()).toList()));
  }
}
