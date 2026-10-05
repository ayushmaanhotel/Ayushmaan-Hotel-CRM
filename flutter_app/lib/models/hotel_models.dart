// ignore_for_file: constant_identifier_names
import 'package:intl/intl.dart';

enum RoomStatus { occupied, vacant, cleaning, maintenance }

enum UserRole { owner, manager, receptionist, housekeeper }

class StaffAccount {
  final String id;
  final String name;
  final String phone;
  final String roleTitle;
  final UserRole role;
  final String pin;
  final bool active;

  StaffAccount({
    required this.id,
    required this.name,
    required this.phone,
    required this.roleTitle,
    required this.role,
    required this.pin,
    this.active = true,
  });

  StaffAccount copyWith({
    String? id,
    String? name,
    String? phone,
    String? roleTitle,
    UserRole? role,
    String? pin,
    bool? active,
  }) => StaffAccount(
    id: id ?? this.id,
    name: name ?? this.name,
    phone: phone ?? this.phone,
    roleTitle: roleTitle ?? this.roleTitle,
    role: role ?? this.role,
    pin: pin ?? this.pin,
    active: active ?? this.active,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'phone': phone,
    'roleTitle': roleTitle,
    'role': role.name,
    'pin': pin,
    'active': active,
  };

  factory StaffAccount.fromJson(Map<String, dynamic> json) => StaffAccount(
    id: json['id'] as String,
    name: json['name'] as String,
    phone: json['phone'] as String,
    roleTitle: json['roleTitle'] as String,
    role: UserRole.values.firstWhere(
      (r) => r.name == json['role'],
      orElse: () => UserRole.receptionist,
    ),
    pin: json['pin'] as String,
    active: json['active'] as bool? ?? true,
  );
}

class ThemePalette {
  final String key;
  final String name;
  final String hindiName;
  final int primary;
  final int primaryLight;
  final int primaryDark;
  final int accent;
  final int border;
  final int tableHeaderBg;
  final int text;
  final int cardBg;

  const ThemePalette({
    required this.key,
    required this.name,
    required this.hindiName,
    required this.primary,
    required this.primaryLight,
    required this.primaryDark,
    required this.accent,
    required this.border,
    required this.tableHeaderBg,
    required this.text,
    required this.cardBg,
  });
}

const Map<String, ThemePalette> THEME_COLOR_PALETTES = {
  'sapphire': ThemePalette(
    key: 'sapphire',
    name: 'Classic Sapphire',
    hindiName: 'शाही नीला',
    primary: 0xFF1E40AF,
    primaryLight: 0xFFEFF6FF,
    primaryDark: 0xFF1E3A8A,
    accent: 0xFF2563EB,
    border: 0xFFBFDBFE,
    tableHeaderBg: 0xFFF0F7FF,
    text: 0xFF0F172A,
    cardBg: 0xFFF8FAFC,
  ),
  'ruby': ThemePalette(
    key: 'ruby',
    name: 'Regal Ruby',
    hindiName: 'शाही लाल / महरून',
    primary: 0xFF991B1B,
    primaryLight: 0xFFFEF2F2,
    primaryDark: 0xFF7F1D1D,
    accent: 0xFFDC2626,
    border: 0xFFFECACA,
    tableHeaderBg: 0xFFFFF1F2,
    text: 0xFF1C1917,
    cardBg: 0xFFFAFAF9,
  ),
  'emerald': ThemePalette(
    key: 'emerald',
    name: 'Emerald Forest',
    hindiName: 'पन्ना हरा',
    primary: 0xFF065F46,
    primaryLight: 0xFFECFDF5,
    primaryDark: 0xFF064E3B,
    accent: 0xFF059669,
    border: 0xFFA7F3D0,
    tableHeaderBg: 0xFFF0FDF4,
    text: 0xFF064E3B,
    cardBg: 0xFFF9FAFB,
  ),
  'terracotta': ThemePalette(
    key: 'terracotta',
    name: 'Royal Terracotta',
    hindiName: 'गेरुआ / अम्बर',
    primary: 0xFF7C2D12,
    primaryLight: 0xFFFFFBEB,
    primaryDark: 0xFF451A03,
    accent: 0xFFD97706,
    border: 0xFFFDE68A,
    tableHeaderBg: 0xFFFEF3C7,
    text: 0xFF1C1917,
    cardBg: 0xFFFFFDF9,
  ),
  'slate': ThemePalette(
    key: 'slate',
    name: 'Executive Slate',
    hindiName: 'कॉर्पोरेट स्लेट',
    primary: 0xFF0F172A,
    primaryLight: 0xFFF1F5F9,
    primaryDark: 0xFF020617,
    accent: 0xFF334155,
    border: 0xFFCBD5E1,
    tableHeaderBg: 0xFFF8FAFC,
    text: 0xFF020617,
    cardBg: 0xFFFFFFFF,
  ),
  'violet': ThemePalette(
    key: 'violet',
    name: 'Imperial Violet',
    hindiName: 'शाही बैंगनी',
    primary: 0xFF4C1D95,
    primaryLight: 0xFFF5F3FF,
    primaryDark: 0xFF2E1065,
    accent: 0xFF7C3AED,
    border: 0xFFDDD6FE,
    tableHeaderBg: 0xFFFAF5FF,
    text: 0xFF1E1B4B,
    cardBg: 0xFFFAFAFA,
  ),
};

ThemePalette getThemePalette(String? key) {
  if (key != null && THEME_COLOR_PALETTES.containsKey(key)) {
    return THEME_COLOR_PALETTES[key]!;
  }
  return THEME_COLOR_PALETTES['ruby']!;
}

class TemplateDefinition {
  final String id;
  final String name;
  final String hindiName;
  final String description;
  final String badge;
  final bool isThermal;

  const TemplateDefinition({
    required this.id,
    required this.name,
    required this.hindiName,
    required this.description,
    required this.badge,
    required this.isThermal,
  });
}

const List<TemplateDefinition> TEMPLATE_DEFINITIONS = [
  TemplateDefinition(
    id: 'royal-heritage',
    name: 'Royal Heritage',
    hindiName: 'शाही भारतीय अतिथि',
    description: 'Lord Ganesha arch, Sanskrit shloka, ivory stationery & luxury stay ledger',
    badge: 'LUXURY HOSPITALITY',
    isThermal: false,
  ),
  TemplateDefinition(
    id: 'advanced-gst',
    name: 'Advanced GST',
    hindiName: 'टैली / सीबीआइसी मानक',
    description: 'Double-line statutory B2B accounting grid with CBIC 8-column HSN tax matrix',
    badge: 'TALLY / B2B STANDARD',
    isThermal: false,
  ),
  TemplateDefinition(
    id: 'stylish-modern',
    name: 'Stylish Modern',
    hindiName: 'स्टाइलिश आधुनिक',
    description: 'Full-bleed color banner header, crisp itemized list & scan-to-pay badge',
    badge: 'BOUTIQUE STAYS',
    isThermal: false,
  ),
  TemplateDefinition(
    id: 'thermal-80mm',
    name: 'Thermal 80mm',
    hindiName: 'पीओएस थर्मल रसीद',
    description: '3-inch monospace slip with dashed borders & high-contrast offline UPI QR',
    badge: 'POS CASHIER RECEIPT',
    isThermal: true,
  ),
];

class HsnTaxSummaryRow {
  final String sac;
  final double taxable;
  final double cgstRate;
  final double cgst;
  final double sgstRate;
  final double sgst;
  final double igstRate;
  final double igst;
  final double totalTax;

  const HsnTaxSummaryRow({
    required this.sac,
    required this.taxable,
    required this.cgstRate,
    required this.cgst,
    required this.sgstRate,
    required this.sgst,
    required this.igstRate,
    required this.igst,
    required this.totalTax,
  });
}

class TaxSummaryReport {
  final List<HsnTaxSummaryRow> rows;
  final double totalTaxable;
  final double totalCgst;
  final double totalSgst;
  final double totalIgst;
  final double totalTax;

  const TaxSummaryReport({
    required this.rows,
    required this.totalTaxable,
    required this.totalCgst,
    required this.totalSgst,
    required this.totalIgst,
    required this.totalTax,
  });
}

TaxSummaryReport computeHsnTaxSummary(List<InvoiceLine> lines) {
  final Map<String, HsnTaxSummaryRow> map = {};
  double totalTaxable = 0.0;
  double totalCgst = 0.0;
  double totalSgst = 0.0;
  double totalIgst = 0.0;
  double totalTax = 0.0;

  for (final line in lines) {
    final sac = line.sac.isNotEmpty ? line.sac : '996311';
    final key = '$sac-${line.taxRate.round()}';

    final taxable = line.taxable;
    final cgst = line.cgst;
    final sgst = line.sgst;
    final igst = line.igst;
    final lineTax = cgst + sgst + igst;

    totalTaxable += taxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;
    totalTax += lineTax;

    if (!map.containsKey(key)) {
      final halfRate = line.taxRate / 2.0;
      map[key] = HsnTaxSummaryRow(
        sac: sac,
        taxable: taxable,
        cgstRate: cgst > 0 ? halfRate : 0.0,
        cgst: cgst,
        sgstRate: sgst > 0 ? halfRate : 0.0,
        sgst: sgst,
        igstRate: igst > 0 ? line.taxRate : 0.0,
        igst: igst,
        totalTax: lineTax,
      );
    } else {
      final existing = map[key]!;
      map[key] = HsnTaxSummaryRow(
        sac: sac,
        taxable: existing.taxable + taxable,
        cgstRate: existing.cgstRate,
        cgst: existing.cgst + cgst,
        sgstRate: existing.sgstRate,
        sgst: existing.sgst + sgst,
        igstRate: existing.igstRate,
        igst: existing.igst + igst,
        totalTax: existing.totalTax + lineTax,
      );
    }
  }

  return TaxSummaryReport(
    rows: map.values.toList(),
    totalTaxable: totalTaxable,
    totalCgst: totalCgst,
    totalSgst: totalSgst,
    totalIgst: totalIgst,
    totalTax: totalTax,
  );
}

class HotelConfig {
  final String hotelName;
  final String legalName;
  final String gstin;
  final String address;
  final String phone;
  final String email;
  final String upiVpa;
  final String merchantName;
  final String stateName;
  final String stateCode;
  final String pan;
  final String bankName;
  final String bankAccount;
  final String bankIfsc;
  final String invoicePrefix;
  final String selectedTemplate;
  final String selectedColor;
  final bool showDeity;
  final String shlokaText;
  final bool showHsnTable;
  final bool showQr;
  final bool showStamp;
  final String priceMode;
  final String? customQrBase64;
  final String? stampBase64;
  final String? signatureBase64;

  HotelConfig({
    this.hotelName = 'Grand Heritage Inn Hotel',
    this.legalName = 'Grand Heritage Inn Hospitality Pvt Ltd',
    this.gstin = '27AABCG1234H1Z5',
    this.address = 'Beach Road, Bandra West, Mumbai 400050',
    this.phone = '+91 98765 43210',
    this.email = 'stay@grandheritage.in',
    this.upiVpa = 'grandheritage@upi',
    this.merchantName = 'Grand Heritage Inn Hospitality Pvt Ltd',
    this.stateName = 'Maharashtra',
    this.stateCode = '27',
    this.pan = 'AABCG1234H',
    this.bankName = 'HDFC Bank',
    this.bankAccount = '50200011223344',
    this.bankIfsc = 'HDFC0000123',
    this.invoicePrefix = 'GHI',
    this.selectedTemplate = 'royal-heritage',
    this.selectedColor = 'ruby',
    this.showDeity = true,
    this.shlokaText = '॥ श्री गणेशाय नमः ॥',
    this.showHsnTable = true,
    this.showQr = true,
    this.showStamp = true,
    this.priceMode = 'inclusive',
    this.customQrBase64,
    this.stampBase64,
    this.signatureBase64,
  });

  HotelConfig copyWith({
    String? hotelName,
    String? legalName,
    String? gstin,
    String? address,
    String? phone,
    String? email,
    String? upiVpa,
    String? merchantName,
    String? stateName,
    String? stateCode,
    String? pan,
    String? bankName,
    String? bankAccount,
    String? bankIfsc,
    String? invoicePrefix,
    String? selectedTemplate,
    String? selectedColor,
    bool? showDeity,
    String? shlokaText,
    bool? showHsnTable,
    bool? showQr,
    bool? showStamp,
    String? priceMode,
    String? customQrBase64,
    bool clearCustomQr = false,
    String? stampBase64,
    bool clearStamp = false,
    String? signatureBase64,
    bool clearSignature = false,
  }) => HotelConfig(
    hotelName: hotelName ?? this.hotelName,
    legalName: legalName ?? this.legalName,
    gstin: gstin ?? this.gstin,
    address: address ?? this.address,
    phone: phone ?? this.phone,
    email: email ?? this.email,
    upiVpa: upiVpa ?? this.upiVpa,
    merchantName: merchantName ?? this.merchantName,
    stateName: stateName ?? this.stateName,
    stateCode: stateCode ?? this.stateCode,
    pan: pan ?? this.pan,
    bankName: bankName ?? this.bankName,
    bankAccount: bankAccount ?? this.bankAccount,
    bankIfsc: bankIfsc ?? this.bankIfsc,
    invoicePrefix: invoicePrefix ?? this.invoicePrefix,
    selectedTemplate: selectedTemplate ?? this.selectedTemplate,
    selectedColor: selectedColor ?? this.selectedColor,
    showDeity: showDeity ?? this.showDeity,
    shlokaText: shlokaText ?? this.shlokaText,
    showHsnTable: showHsnTable ?? this.showHsnTable,
    showQr: showQr ?? this.showQr,
    showStamp: showStamp ?? this.showStamp,
    priceMode: priceMode ?? this.priceMode,
    customQrBase64: clearCustomQr ? null : (customQrBase64 ?? this.customQrBase64),
    stampBase64: clearStamp ? null : (stampBase64 ?? this.stampBase64),
    signatureBase64: clearSignature ? null : (signatureBase64 ?? this.signatureBase64),
  );

  Map<String, dynamic> toJson() => {
    'hotelName': hotelName,
    'legalName': legalName,
    'gstin': gstin,
    'address': address,
    'phone': phone,
    'email': email,
    'upiVpa': upiVpa,
    'merchantName': merchantName,
    'stateName': stateName,
    'stateCode': stateCode,
    'pan': pan,
    'bankName': bankName,
    'bankAccount': bankAccount,
    'bankIfsc': bankIfsc,
    'invoicePrefix': invoicePrefix,
    'selectedTemplate': selectedTemplate,
    'selectedColor': selectedColor,
    'showDeity': showDeity,
    'shlokaText': shlokaText,
    'showHsnTable': showHsnTable,
    'showQr': showQr,
    'showStamp': showStamp,
    'priceMode': priceMode,
    'customQrBase64': customQrBase64,
    'stampBase64': stampBase64,
    'signatureBase64': signatureBase64,
  };

  factory HotelConfig.fromJson(Map<String, dynamic> json) => HotelConfig(
    hotelName: json['hotelName'] as String? ?? 'Grand Heritage Inn Hotel',
    legalName: json['legalName'] as String? ?? 'Grand Heritage Inn Hospitality Pvt Ltd',
    gstin: json['gstin'] as String? ?? '27AABCG1234H1Z5',
    address: json['address'] as String? ?? 'Beach Road, Bandra West, Mumbai 400050',
    phone: json['phone'] as String? ?? '+91 98765 43210',
    email: json['email'] as String? ?? 'stay@grandheritage.in',
    upiVpa: json['upiVpa'] as String? ?? 'grandheritage@upi',
    merchantName: json['merchantName'] as String? ?? 'Grand Heritage Inn Hospitality Pvt Ltd',
    stateName: json['stateName'] as String? ?? 'Maharashtra',
    stateCode: json['stateCode'] as String? ?? '27',
    pan: json['pan'] as String? ?? 'AABCG1234H',
    bankName: json['bankName'] as String? ?? 'HDFC Bank',
    bankAccount: json['bankAccount'] as String? ?? '50200011223344',
    bankIfsc: json['bankIfsc'] as String? ?? 'HDFC0000123',
    invoicePrefix: json['invoicePrefix'] as String? ?? 'GHI',
    selectedTemplate: json['selectedTemplate'] as String? ?? 'royal-heritage',
    selectedColor: json['selectedColor'] as String? ?? 'ruby',
    showDeity: json['showDeity'] as bool? ?? true,
    shlokaText: json['shlokaText'] as String? ?? '॥ श्री गणेशाय नमः ॥',
    showHsnTable: json['showHsnTable'] as bool? ?? true,
    showQr: json['showQr'] as bool? ?? true,
    showStamp: json['showStamp'] as bool? ?? true,
    priceMode: json['priceMode'] as String? ?? 'inclusive',
    customQrBase64: json['customQrBase64'] as String?,
    stampBase64: json['stampBase64'] as String?,
    signatureBase64: json['signatureBase64'] as String?,
  );
}

class Guest {
  final String id;
  final String name;
  final String phone;
  final String email;
  final bool isVIP;
  final bool isForeigner;
  final bool cFormDone;
  final double pendingBalance;
  final int visits;
  final double totalSpent;
  final String lastStay;
  final String notes;

  Guest({
    required this.id,
    required this.name,
    required this.phone,
    required this.email,
    this.isVIP = false,
    this.isForeigner = false,
    this.cFormDone = false,
    this.pendingBalance = 0.0,
    this.visits = 1,
    this.totalSpent = 0.0,
    this.lastStay = '',
    this.notes = '',
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'phone': phone,
    'email': email,
    'isVIP': isVIP,
    'isForeigner': isForeigner,
    'cFormDone': cFormDone,
    'pendingBalance': pendingBalance,
    'visits': visits,
    'totalSpent': totalSpent,
    'lastStay': lastStay,
    'notes': notes,
  };

  factory Guest.fromJson(Map<String, dynamic> json) => Guest(
    id: json['id'] as String,
    name: json['name'] as String,
    phone: json['phone'] as String,
    email: json['email'] as String? ?? '',
    isVIP: json['isVIP'] as bool? ?? false,
    isForeigner: json['isForeigner'] as bool? ?? false,
    cFormDone: json['cFormDone'] as bool? ?? false,
    pendingBalance: (json['pendingBalance'] as num?)?.toDouble() ?? 0.0,
    visits: (json['visits'] as num?)?.toInt() ?? 1,
    totalSpent: (json['totalSpent'] as num?)?.toDouble() ?? 0.0,
    lastStay: json['lastStay'] as String? ?? '',
    notes: json['notes'] as String? ?? '',
  );
}

class Room {
  final String id;
  final String number;
  final int floor;
  final String type;
  final double pricePerNight;
  RoomStatus status;
  Guest? currentGuest;
  String? checkInTime;
  String? checkOutTime;

  Room({
    required this.id,
    required this.number,
    required this.floor,
    required this.type,
    required this.pricePerNight,
    required this.status,
    this.currentGuest,
    this.checkInTime,
    this.checkOutTime,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'number': number,
    'floor': floor,
    'type': type,
    'pricePerNight': pricePerNight,
    'status': status.name,
    'currentGuest': currentGuest?.toJson(),
    'checkInTime': checkInTime,
    'checkOutTime': checkOutTime,
  };

  factory Room.fromJson(Map<String, dynamic> json) => Room(
    id: json['id'] as String,
    number: json['number'] as String,
    floor: json['floor'] as int? ?? 1,
    type: json['type'] as String? ?? 'Standard Room',
    pricePerNight: (json['pricePerNight'] as num?)?.toDouble() ?? 3000.0,
    status: RoomStatus.values.firstWhere(
      (s) => s.name == json['status'],
      orElse: () => RoomStatus.vacant,
    ),
    currentGuest: json['currentGuest'] != null ? Guest.fromJson(json['currentGuest']) : null,
    checkInTime: json['checkInTime'] as String?,
    checkOutTime: json['checkOutTime'] as String?,
  );
}

class InvoiceLine {
  final String id;
  final String description;
  final String sac;
  final int qty;
  final double unitPrice;
  final double taxable;
  final double cgst;
  final double sgst;
  final double igst;
  final double total;
  final int gstRatePercent;

  InvoiceLine({
    required this.id,
    required this.description,
    required this.sac,
    required this.qty,
    required this.unitPrice,
    required this.taxable,
    required this.cgst,
    required this.sgst,
    required this.igst,
    required this.total,
    required this.gstRatePercent,
  });

  int get quantity => qty;
  double get rate => unitPrice;
  double get taxRate => gstRatePercent.toDouble();

  Map<String, dynamic> toJson() => {
    'id': id,
    'description': description,
    'sac': sac,
    'qty': qty,
    'unitPrice': unitPrice,
    'taxable': taxable,
    'cgst': cgst,
    'sgst': sgst,
    'igst': igst,
    'total': total,
    'gstRatePercent': gstRatePercent,
  };

  factory InvoiceLine.fromJson(Map<String, dynamic> json) => InvoiceLine(
    id: json['id'] as String,
    description: json['description'] as String,
    sac: json['sac'] as String,
    qty: (json['qty'] as num?)?.toInt() ?? 1,
    unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
    taxable: (json['taxable'] as num?)?.toDouble() ?? 0.0,
    cgst: (json['cgst'] as num?)?.toDouble() ?? 0.0,
    sgst: (json['sgst'] as num?)?.toDouble() ?? 0.0,
    igst: (json['igst'] as num?)?.toDouble() ?? 0.0,
    total: (json['total'] as num?)?.toDouble() ?? 0.0,
    gstRatePercent: (json['gstRatePercent'] as num?)?.toInt() ?? 5,
  );
}

class Invoice {
  final String id;
  final String invoiceNumber;
  final String date;
  final String guestName;
  final String guestPhone;
  final String? guestGstin;
  final String guestAddress;
  final String roomNumber;
  final int nights;
  final String checkIn;
  final String checkOut;
  final List<InvoiceLine> lines;
  final double taxable;
  final double cgst;
  final double sgst;
  final double igst;
  final double roundOff;
  final double grandTotal;
  final String totalInWords;
  final String status; // 'ISSUED' | 'CANCELLED'
  final String paymentMode; // 'UPI' | 'Cash' | 'Card'
  final String upiVpa;
  final double balanceDue;
  final bool isInterState;

  Invoice({
    required this.id,
    required this.invoiceNumber,
    required this.date,
    required this.guestName,
    required this.guestPhone,
    this.guestGstin,
    this.guestAddress = 'Mumbai, Maharashtra',
    required this.roomNumber,
    required this.nights,
    required this.checkIn,
    required this.checkOut,
    required this.lines,
    required this.taxable,
    required this.cgst,
    required this.sgst,
    this.igst = 0.0,
    this.roundOff = 0.0,
    required this.grandTotal,
    required this.totalInWords,
    this.status = 'ISSUED',
    this.paymentMode = 'UPI',
    this.upiVpa = 'grandheritage@upi',
    this.balanceDue = 0.0,
    this.isInterState = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'invoiceNumber': invoiceNumber,
    'date': date,
    'guestName': guestName,
    'guestPhone': guestPhone,
    'guestGstin': guestGstin,
    'guestAddress': guestAddress,
    'roomNumber': roomNumber,
    'nights': nights,
    'checkIn': checkIn,
    'checkOut': checkOut,
    'lines': lines.map((l) => l.toJson()).toList(),
    'taxable': taxable,
    'cgst': cgst,
    'sgst': sgst,
    'igst': igst,
    'roundOff': roundOff,
    'grandTotal': grandTotal,
    'totalInWords': totalInWords,
    'status': status,
    'paymentMode': paymentMode,
    'upiVpa': upiVpa,
    'balanceDue': balanceDue,
    'isInterState': isInterState,
  };

  factory Invoice.fromJson(Map<String, dynamic> json) => Invoice(
    id: json['id'] as String,
    invoiceNumber: json['invoiceNumber'] as String,
    date: json['date'] as String,
    guestName: json['guestName'] as String,
    guestPhone: json['guestPhone'] as String,
    guestGstin: json['guestGstin'] as String?,
    guestAddress: json['guestAddress'] as String? ?? 'Mumbai, Maharashtra',
    roomNumber: json['roomNumber'] as String? ?? '101',
    nights: (json['nights'] as num?)?.toInt() ?? 1,
    checkIn: json['checkIn'] as String? ?? '',
    checkOut: json['checkOut'] as String? ?? '',
    lines: (json['lines'] as List<dynamic>?)
            ?.map((e) => InvoiceLine.fromJson(e as Map<String, dynamic>))
            .toList() ??
        [],
    taxable: (json['taxable'] as num?)?.toDouble() ?? 0.0,
    cgst: (json['cgst'] as num?)?.toDouble() ?? 0.0,
    sgst: (json['sgst'] as num?)?.toDouble() ?? 0.0,
    igst: (json['igst'] as num?)?.toDouble() ?? 0.0,
    roundOff: (json['roundOff'] as num?)?.toDouble() ?? 0.0,
    grandTotal: (json['grandTotal'] as num?)?.toDouble() ?? 0.0,
    totalInWords: json['totalInWords'] as String? ?? '',
    status: json['status'] as String? ?? 'ISSUED',
    paymentMode: json['paymentMode'] as String? ?? 'UPI',
    upiVpa: json['upiVpa'] as String? ?? 'grandheritage@upi',
    balanceDue: (json['balanceDue'] as num?)?.toDouble() ?? 0.0,
    isInterState: json['isInterState'] as bool? ?? false,
  );
}

class Inquiry {
  final String id;
  final String name;
  final String phone;
  final String checkIn;
  final String checkOut;
  final double quotedRate;
  final String source; // 'Walk-in' | 'Phone' | 'WhatsApp' | 'OTA'
  String status; // 'NEW' | 'FOLLOWED' | 'WON' | 'LOST'
  final String createdAt;
  final String? notes;

  Inquiry({
    required this.id,
    required this.name,
    required this.phone,
    required this.checkIn,
    required this.checkOut,
    required this.quotedRate,
    required this.source,
    required this.status,
    required this.createdAt,
    this.notes,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'phone': phone,
    'checkIn': checkIn,
    'checkOut': checkOut,
    'quotedRate': quotedRate,
    'source': source,
    'status': status,
    'createdAt': createdAt,
    'notes': notes,
  };

  factory Inquiry.fromJson(Map<String, dynamic> json) => Inquiry(
    id: json['id'] as String,
    name: json['name'] as String,
    phone: json['phone'] as String,
    checkIn: json['checkIn'] as String,
    checkOut: json['checkOut'] as String,
    quotedRate: (json['quotedRate'] as num?)?.toDouble() ?? 0.0,
    source: json['source'] as String? ?? 'Walk-in',
    status: json['status'] as String? ?? 'NEW',
    createdAt: json['createdAt'] as String,
    notes: json['notes'] as String?,
  );
}

class DailyBrief {
  final String date;
  final int occupied;
  final int vacant;
  final int cleaning;
  final int maintenance;
  final int occupancyPct;
  final double collected;
  final double upi;
  final double cash;
  final double card;
  final double outstanding;
  final int cFormDue;
  final int openInquiries;
  final int vipInHouse;

  DailyBrief({
    required this.date,
    required this.occupied,
    required this.vacant,
    required this.cleaning,
    required this.maintenance,
    required this.occupancyPct,
    required this.collected,
    required this.upi,
    required this.cash,
    required this.card,
    required this.outstanding,
    required this.cFormDue,
    required this.openInquiries,
    required this.vipInHouse,
  });

  String toWhatsAppBrief(String hotelName) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    return '''
🏨 *$hotelName — Day Brief ($date)*

🛏 Occupancy: $occupied/${occupied + vacant + cleaning + maintenance} rooms ($occupancyPct%)
🧹 Cleaning: $cleaning · 🔧 Maintenance: $maintenance · ✅ Vacant: $vacant

💰 Collected today: ${currency.format(collected)}
   UPI: ${currency.format(upi)} · Cash: ${currency.format(cash)} · Card: ${currency.format(card)}
${outstanding > 0 ? "⚠️ Balance still due: ${currency.format(outstanding)}" : "✅ No pending balances"}
${cFormDue > 0 ? "🚨 C-Form pending for $cFormDue foreign guest(s) — submit within 24h" : ""}
${openInquiries > 0 ? "📞 $openInquiries open enquiry(ies) — follow up today" : ""}
${vipInHouse > 0 ? "👑 $vipInHouse VIP guest(s) in house" : ""}
'''.trim();
  }
}

enum ExpenseCategory {
  kitchenGroceries,
  laundryLinen,
  utilitiesBills,
  staffWages,
  maintenanceRepairs,
  otaCommissions,
  miscellaneous,
}

extension ExpenseCategoryExt on ExpenseCategory {
  String get key {
    switch (this) {
      case ExpenseCategory.kitchenGroceries:
        return 'kitchen_groceries';
      case ExpenseCategory.laundryLinen:
        return 'laundry_linen';
      case ExpenseCategory.utilitiesBills:
        return 'utilities_bills';
      case ExpenseCategory.staffWages:
        return 'staff_wages';
      case ExpenseCategory.maintenanceRepairs:
        return 'maintenance_repairs';
      case ExpenseCategory.otaCommissions:
        return 'ota_commissions';
      case ExpenseCategory.miscellaneous:
        return 'miscellaneous';
    }
  }

  String get labelEn {
    switch (this) {
      case ExpenseCategory.kitchenGroceries:
        return 'Kitchen & Provisions';
      case ExpenseCategory.laundryLinen:
        return 'Laundry & Linen';
      case ExpenseCategory.utilitiesBills:
        return 'Electricity & Utilities';
      case ExpenseCategory.staffWages:
        return 'Staff Salary & Advance';
      case ExpenseCategory.maintenanceRepairs:
        return 'Repairs & Maintenance';
      case ExpenseCategory.otaCommissions:
        return 'OTA Commission Leak';
      case ExpenseCategory.miscellaneous:
        return 'General & Misc';
    }
  }

  String get labelHi {
    switch (this) {
      case ExpenseCategory.kitchenGroceries:
        return 'रसोई और राशन';
      case ExpenseCategory.laundryLinen:
        return 'धुलाई और चादरें';
      case ExpenseCategory.utilitiesBills:
        return 'बिजली व जनरेटर';
      case ExpenseCategory.staffWages:
        return 'स्टाफ वेतन व अग्रिम';
      case ExpenseCategory.maintenanceRepairs:
        return 'मरम्मत व रखरखाव';
      case ExpenseCategory.otaCommissions:
        return 'MMT / OTA कमीशन';
      case ExpenseCategory.miscellaneous:
        return 'अन्य विविध खर्च';
    }
  }

  int get colorValue {
    switch (this) {
      case ExpenseCategory.kitchenGroceries:
        return 0xFFF59E0B;
      case ExpenseCategory.laundryLinen:
        return 0xFF3B82F6;
      case ExpenseCategory.utilitiesBills:
        return 0xFFEF4444;
      case ExpenseCategory.staffWages:
        return 0xFF8B5CF6;
      case ExpenseCategory.maintenanceRepairs:
        return 0xFFEC4899;
      case ExpenseCategory.otaCommissions:
        return 0xFFF97316;
      case ExpenseCategory.miscellaneous:
        return 0xFF6B7280;
    }
  }

  static ExpenseCategory fromKey(String key) {
    switch (key) {
      case 'kitchen_groceries':
        return ExpenseCategory.kitchenGroceries;
      case 'laundry_linen':
        return ExpenseCategory.laundryLinen;
      case 'utilities_bills':
        return ExpenseCategory.utilitiesBills;
      case 'staff_wages':
        return ExpenseCategory.staffWages;
      case 'maintenance_repairs':
        return ExpenseCategory.maintenanceRepairs;
      case 'ota_commissions':
        return ExpenseCategory.otaCommissions;
      default:
        return ExpenseCategory.miscellaneous;
    }
  }
}

class Expense {
  final String id;
  final String voucherNumber;
  final String date;
  final ExpenseCategory category;
  final double amount;
  final String paymentMode;
  final String paidTo;
  final String description;
  final String recordedBy;
  final String status;
  final String? voidReason;

  Expense({
    required this.id,
    required this.voucherNumber,
    required this.date,
    required this.category,
    required this.amount,
    this.paymentMode = 'Cash',
    required this.paidTo,
    required this.description,
    this.recordedBy = 'Admin',
    this.status = 'active',
    this.voidReason,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'voucherNumber': voucherNumber,
    'date': date,
    'category': category.key,
    'amount': amount,
    'paymentMode': paymentMode,
    'paidTo': paidTo,
    'description': description,
    'recordedBy': recordedBy,
    'status': status,
    'voidReason': voidReason,
  };

  factory Expense.fromJson(Map<String, dynamic> json) => Expense(
    id: json['id'] as String,
    voucherNumber: json['voucherNumber'] as String? ?? 'EXP-001',
    date: json['date'] as String? ?? '',
    category: ExpenseCategoryExt.fromKey(json['category'] as String? ?? 'miscellaneous'),
    amount: (json['amount'] as num?)?.toDouble() ?? 0.0,
    paymentMode: json['paymentMode'] as String? ?? 'Cash',
    paidTo: json['paidTo'] as String? ?? '',
    description: json['description'] as String? ?? '',
    recordedBy: json['recordedBy'] as String? ?? 'Admin',
    status: json['status'] as String? ?? 'active',
    voidReason: json['voidReason'] as String?,
  );

  Expense copyWith({
    String? id,
    String? voucherNumber,
    String? date,
    ExpenseCategory? category,
    double? amount,
    String? paymentMode,
    String? paidTo,
    String? description,
    String? recordedBy,
    String? status,
    String? voidReason,
  }) => Expense(
    id: id ?? this.id,
    voucherNumber: voucherNumber ?? this.voucherNumber,
    date: date ?? this.date,
    category: category ?? this.category,
    amount: amount ?? this.amount,
    paymentMode: paymentMode ?? this.paymentMode,
    paidTo: paidTo ?? this.paidTo,
    description: description ?? this.description,
    recordedBy: recordedBy ?? this.recordedBy,
    status: status ?? this.status,
    voidReason: voidReason ?? this.voidReason,
  );
}

class HousekeepingTask {
  final String id;
  final String roomNumber;
  final String housekeeperName;
  final String stage; // 'dirty' | 'cleaning' | 'inspection' | 'ready'
  final String priority; // 'Normal' | 'High' | 'VIP Urgent'
  final String updatedAt;

  HousekeepingTask({
    required this.id,
    required this.roomNumber,
    required this.housekeeperName,
    this.stage = 'dirty',
    this.priority = 'Normal',
    required this.updatedAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'roomNumber': roomNumber,
    'housekeeperName': housekeeperName,
    'stage': stage,
    'priority': priority,
    'updatedAt': updatedAt,
  };

  factory HousekeepingTask.fromJson(Map<String, dynamic> json) => HousekeepingTask(
    id: json['id'] as String,
    roomNumber: json['roomNumber'] as String,
    housekeeperName: json['housekeeperName'] as String? ?? 'Suresh Kumar',
    stage: json['stage'] as String? ?? 'dirty',
    priority: json['priority'] as String? ?? 'Normal',
    updatedAt: json['updatedAt'] as String? ?? 'Just now',
  );

  HousekeepingTask copyWith({
    String? id,
    String? roomNumber,
    String? housekeeperName,
    String? stage,
    String? priority,
    String? updatedAt,
  }) => HousekeepingTask(
    id: id ?? this.id,
    roomNumber: roomNumber ?? this.roomNumber,
    housekeeperName: housekeeperName ?? this.housekeeperName,
    stage: stage ?? this.stage,
    priority: priority ?? this.priority,
    updatedAt: updatedAt ?? this.updatedAt,
  );
}
