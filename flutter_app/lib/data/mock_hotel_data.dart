import '../models/hotel_models.dart';

class MockHotelData {
  static List<Guest> getInitialGuests() {
    return [
      Guest(
        id: 'g-100',
        name: 'Ayush',
        phone: '+91 99999 88888',
        email: 'ayush@grandheritage.com',
        isVIP: true,
        pendingBalance: 0.0,
      ),
      Guest(
        id: 'g-101',
        name: 'Rajesh Sharma',
        phone: '+91 98765 43210',
        email: 'rajesh@example.com',
        isVIP: true,
        pendingBalance: 0.0,
      ),
      Guest(
        id: 'g-102',
        name: 'Vikram Malhotra',
        phone: '+91 98200 11223',
        email: 'vikram.m@techcorp.in',
        isVIP: false,
        pendingBalance: 1400.0,
      ),
      Guest(
        id: 'g-103',
        name: 'Dr. Sunita Patel',
        phone: '+91 97411 22334',
        email: 'sunita.patel@aiims.edu',
        isVIP: true,
        pendingBalance: 0.0,
      ),
      Guest(
        id: 'g-104',
        name: 'Johnathan Miller (UK)',
        phone: '+44 7700 900077',
        email: 'jmiller@london.co.uk',
        isVIP: false,
        isForeigner: true,
        cFormDone: false, // Triggers C-Form warning!
        pendingBalance: 0.0,
      ),
    ];
  }

  static List<Room> getInitialRooms() {
    final guests = getInitialGuests();
    return [
      Room(
        id: 'r-101',
        number: '101',
        floor: 1,
        type: 'Executive Suite',
        pricePerNight: 4200.0,
        status: RoomStatus.occupied,
        currentGuest: guests[1], // Rajesh
        checkInTime: 'Today, 02:00 PM',
        checkOutTime: 'Tomorrow, 11:00 AM',
      ),
      Room(
        id: 'r-102',
        number: '102',
        floor: 1,
        type: 'Deluxe Ocean View',
        pricePerNight: 3500.0,
        status: RoomStatus.cleaning,
      ),
      Room(
        id: 'r-103',
        number: '103',
        floor: 1,
        type: 'Standard King',
        pricePerNight: 2800.0,
        status: RoomStatus.vacant,
      ),
      Room(
        id: 'r-104',
        number: '104',
        floor: 1,
        type: 'Standard King',
        pricePerNight: 2800.0,
        status: RoomStatus.maintenance,
      ),
      Room(
        id: 'r-201',
        number: '201',
        floor: 2,
        type: 'Deluxe Ocean View',
        pricePerNight: 3500.0,
        status: RoomStatus.occupied,
        currentGuest: guests[2], // Vikram
        checkInTime: 'Yesterday, 06:30 PM',
        checkOutTime: 'Today, 12:00 PM',
      ),
      Room(
        id: 'r-202',
        number: '202',
        floor: 2,
        type: 'Executive Suite',
        pricePerNight: 4500.0,
        status: RoomStatus.vacant,
      ),
      Room(
        id: 'r-203',
        number: '203',
        floor: 2,
        type: 'Presidential Suite',
        pricePerNight: 9500.0,
        status: RoomStatus.occupied,
        currentGuest: guests[3], // Dr. Sunita
        checkInTime: '24 Jul, 01:00 PM',
        checkOutTime: '28 Jul, 11:00 AM',
      ),
      Room(
        id: 'r-301',
        number: '301',
        floor: 3,
        type: 'Presidential Royal Suite',
        pricePerNight: 12500.0,
        status: RoomStatus.occupied,
        currentGuest: guests[0], // Ayush
        checkInTime: '23 Jul, 02:00 PM',
        checkOutTime: '26 Jul, 12:00 PM',
      ),
    ];
  }

  static List<Invoice> getInitialInvoices() {
    return [
      // 1. AYUSH'S VIP PRESIDENTIAL SUITE INVOICE
      Invoice(
        id: 'inv-001',
        invoiceNumber: 'GHI/26-27/A0009',
        date: '04-Oct-2026',
        guestName: 'Ayush',
        guestPhone: '+91 99999 88888',
        guestAddress: 'Presidential Penthouse Suite 301, Grand Heritage Inn, Mumbai',
        roomNumber: '301 (Presidential Royal Suite)',
        nights: 2,
        checkIn: '23-Jul-2026',
        checkOut: '25-Jul-2026',
        lines: [
          InvoiceLine(
            id: 'l-1',
            description: 'Presidential Royal Suite 301 Accommodation',
            sac: '996311',
            qty: 2,
            unitPrice: 12500.0,
            taxable: 21186.44,
            cgst: 1906.78,
            sgst: 1906.78,
            igst: 0.0,
            total: 25000.0,
            gstRatePercent: 18,
          ),
          InvoiceLine(
            id: 'l-2',
            description: 'Chef Curated In-Room Royal Degustation Menu',
            sac: '996331',
            qty: 1,
            unitPrice: 3500.0,
            taxable: 3333.33,
            cgst: 83.33,
            sgst: 83.33,
            igst: 0.0,
            total: 3500.0,
            gstRatePercent: 5,
          ),
          InvoiceLine(
            id: 'l-3',
            description: 'VIP Luxury Chauffeur Airport Transfer (Mercedes S-Class)',
            sac: '996412',
            qty: 1,
            unitPrice: 1500.0,
            taxable: 1271.19,
            cgst: 114.41,
            sgst: 114.41,
            igst: 0.0,
            total: 1500.0,
            gstRatePercent: 18,
          ),
        ],
        taxable: 25790.96,
        cgst: 2104.52,
        sgst: 2104.52,
        igst: 0.0,
        roundOff: 0.0,
        grandTotal: 30000.0,
        totalInWords: 'Rupees Thirty Thousand Only',
        status: 'ISSUED',
        paymentMode: 'UPI',
        upiVpa: 'grandheritage@upi',
        balanceDue: 0.0,
      ),

      // 2. Rajesh Sharma
      Invoice(
        id: 'inv-002',
        invoiceNumber: 'GHI/26-27/A0001',
        date: '24-Jul-2026',
        guestName: 'Rajesh Sharma',
        guestPhone: '+91 98765 43210',
        roomNumber: '101',
        nights: 1,
        checkIn: '24-Jul-2026',
        checkOut: '25-Jul-2026',
        lines: [
          InvoiceLine(
            id: 'l-21',
            description: 'Executive Suite 101 Accommodation',
            sac: '996311',
            qty: 1,
            unitPrice: 4200.0,
            taxable: 4000.0,
            cgst: 100.0,
            sgst: 100.0,
            igst: 0.0,
            total: 4200.0,
            gstRatePercent: 5,
          ),
        ],
        taxable: 4000.0,
        cgst: 100.0,
        sgst: 100.0,
        grandTotal: 4200.0,
        totalInWords: 'Rupees Four Thousand Two Hundred Only',
        status: 'ISSUED',
        paymentMode: 'UPI',
      ),

      // 3. Vikram Malhotra
      Invoice(
        id: 'inv-003',
        invoiceNumber: 'GHI/26-27/A0002',
        date: '24-Jul-2026',
        guestName: 'Vikram Malhotra',
        guestPhone: '+91 98200 11223',
        roomNumber: '201',
        nights: 1,
        checkIn: '23-Jul-2026',
        checkOut: '24-Jul-2026',
        lines: [
          InvoiceLine(
            id: 'l-31',
            description: 'Deluxe Ocean View 201 Accommodation',
            sac: '996311',
            qty: 1,
            unitPrice: 3500.0,
            taxable: 3333.33,
            cgst: 83.33,
            sgst: 83.33,
            igst: 0.0,
            total: 3500.0,
            gstRatePercent: 5,
          ),
        ],
        taxable: 3333.33,
        cgst: 83.33,
        sgst: 83.33,
        grandTotal: 3500.0,
        totalInWords: 'Rupees Three Thousand Five Hundred Only',
        status: 'ISSUED',
        paymentMode: 'Card',
      ),

      // 4. Dr. Sunita Patel
      Invoice(
        id: 'inv-004',
        invoiceNumber: 'GHI/26-27/A0003',
        date: '24-Jul-2026',
        guestName: 'Dr. Sunita Patel',
        guestPhone: '+91 97411 22334',
        roomNumber: '203',
        nights: 2,
        checkIn: '24-Jul-2026',
        checkOut: '26-Jul-2026',
        lines: [
          InvoiceLine(
            id: 'l-41',
            description: 'Presidential Suite 203 Accommodation',
            sac: '996311',
            qty: 2,
            unitPrice: 9500.0,
            taxable: 16101.69,
            cgst: 1449.15,
            sgst: 1449.15,
            igst: 0.0,
            total: 19000.0,
            gstRatePercent: 18,
          ),
        ],
        taxable: 16101.69,
        cgst: 1449.15,
        sgst: 1449.15,
        grandTotal: 19000.0,
        totalInWords: 'Rupees Nineteen Thousand Only',
        status: 'ISSUED',
        paymentMode: 'UPI',
      ),
    ];
  }

  static List<Inquiry> getInitialInquiries() {
    return [
      Inquiry(
        id: 'inq-1',
        name: 'Amitabh Sen',
        phone: '+91 98300 55443',
        checkIn: '10-Oct-2026',
        checkOut: '12-Oct-2026',
        quotedRate: 4500.0,
        source: 'WhatsApp',
        status: 'NEW',
        createdAt: 'Today, 11:20 AM',
        notes: 'Needs 2 connecting Executive Suites for family wedding.',
      ),
      Inquiry(
        id: 'inq-2',
        name: 'Kavita Chawla',
        phone: '+91 98111 22334',
        checkIn: '15-Oct-2026',
        checkOut: '17-Oct-2026',
        quotedRate: 3500.0,
        source: 'Phone',
        status: 'FOLLOWED',
        createdAt: 'Yesterday, 04:45 PM',
        notes: 'Corporate conference booking inquiry.',
      ),
    ];
  }

  static DailyBrief getDailyBrief() {
    return DailyBrief(
      date: '04-Oct-2026',
      occupied: 4,
      vacant: 2,
      cleaning: 1,
      maintenance: 1,
      occupancyPct: 50,
      collected: 56700.0,
      upi: 49000.0,
      cash: 4200.0,
      card: 3500.0,
      outstanding: 1400.0,
      cFormDue: 1, // Johnathan Miller
      openInquiries: 2,
      vipInHouse: 3, // Ayush, Rajesh, Dr. Sunita
    );
  }
}
