import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';
import 'invoice_composer_screen.dart';
import 'owner_analytics_screen.dart';

class FrontDeskScreen extends StatefulWidget {
  final List<Room> rooms;
  final Function(Room) onRoomUpdated;
  final Function(Invoice)? onInvoiceCreated;
  final StaffAccount currentStaff;
  final Function(StaffAccount) onStaffChanged;
  final HotelConfig hotelConfig;
  final List<Invoice>? invoices;

  const FrontDeskScreen({
    super.key,
    required this.rooms,
    required this.onRoomUpdated,
    this.onInvoiceCreated,
    required this.currentStaff,
    required this.onStaffChanged,
    required this.hotelConfig,
    this.invoices,
  });

  @override
  State<FrontDeskScreen> createState() => _FrontDeskScreenState();
}

class _FrontDeskScreenState extends State<FrontDeskScreen> {
  RoomStatus? _filterStatus;
  late DailyBrief _brief;

  @override
  void initState() {
    super.initState();
    _recomputeBrief();
  }

  void _recomputeBrief() {
    int occ = widget.rooms.where((r) => r.status == RoomStatus.occupied).length;
    int vac = widget.rooms.where((r) => r.status == RoomStatus.vacant).length;
    int cln = widget.rooms.where((r) => r.status == RoomStatus.cleaning).length;
    int mnt = widget.rooms.where((r) => r.status == RoomStatus.maintenance).length;
    int total = occ + vac + cln + mnt;
    int pct = total > 0 ? ((occ / total) * 100).round() : 0;

    _brief = DailyBrief(
      date: DateFormat('dd MMM yyyy').format(DateTime.now()),
      occupied: occ,
      vacant: vac,
      cleaning: cln,
      maintenance: mnt,
      occupancyPct: pct,
      collected: occ * 3500.0,
      upi: occ * 2500.0,
      cash: occ * 1000.0,
      card: 0.0,
      outstanding: 0.0,
      cFormDue: 0,
      openInquiries: 2,
      vipInHouse: widget.rooms.where((r) => r.currentGuest?.isVIP == true).length,
    );
  }

  void _shareDayBrief() {
    final text = _brief.toWhatsAppBrief(widget.hotelConfig.hotelName);
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Day Brief copied to clipboard! Ready to paste in WhatsApp.'),
        backgroundColor: AppTheme.maroon,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    _recomputeBrief();
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    // If logged in as housekeeper, only show cleaning & dirty rooms by default unless filtered
    final isHousekeeper = widget.currentStaff.role == UserRole.housekeeper;
    final filteredRooms = _filterStatus == null
        ? (isHousekeeper ? widget.rooms.where((r) => r.status == RoomStatus.cleaning || r.status == RoomStatus.maintenance).toList() : widget.rooms)
        : widget.rooms.where((r) => r.status == _filterStatus).toList();

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.maroonLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.hotel_rounded, color: AppTheme.maroon, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    isHousekeeper ? 'Housekeeping Mobile' : 'Front Desk & Operations',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    widget.hotelConfig.hotelName,
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          if (widget.currentStaff.role == UserRole.owner || widget.currentStaff.role == UserRole.manager)
            IconButton(
              icon: const Icon(Icons.analytics_rounded, color: AppTheme.maroon),
              tooltip: 'RevPAR & Fill-Rate Radar',
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => OwnerAnalyticsScreen(
                      rooms: widget.rooms,
                      invoices: widget.invoices ?? [],
                      hotelConfig: widget.hotelConfig,
                    ),
                  ),
                );
              },
            ),
          IconButton(
            icon: const Icon(Icons.share_rounded, color: AppTheme.maroon),
            tooltip: 'Copy Morning Brief',
            onPressed: _shareDayBrief,
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Staff Active Role Pill (Tap to switch roles / Admin position)
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.goldSoft),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
              ],
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 14,
                  backgroundColor: widget.currentStaff.role == UserRole.owner ? AppTheme.goldPale : AppTheme.maroonLight,
                  child: Icon(
                    widget.currentStaff.role == UserRole.owner
                        ? Icons.shield_rounded
                        : (widget.currentStaff.role == UserRole.receptionist ? Icons.person_rounded : Icons.cleaning_services_rounded),
                    size: 16,
                    color: widget.currentStaff.role == UserRole.owner ? AppTheme.gold : AppTheme.maroon,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              widget.currentStaff.name,
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.ink),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceWarm,
                              borderRadius: BorderRadius.circular(4),
                              border: Border.all(color: AppTheme.borderLight),
                            ),
                            child: Text(
                              widget.currentStaff.role.name.toUpperCase(),
                              style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                            ),
                          ),
                        ],
                      ),
                      Text(widget.currentStaff.roleTitle, style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: _showRoleSwitchDialog,
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('Switch Role', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                ),
              ],
            ),
          ),

          // 2. Day Brief Bar (With FittedBox to prevent any flex overflow)
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: AppTheme.surfaceWarm,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.greenSuccess,
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 6),
                        const Text(
                          'DAY BRIEF BAR',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.1,
                            color: AppTheme.maroon,
                          ),
                        ),
                      ],
                    ),
                    Text(
                      _brief.date,
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    _buildStatPill('Occupancy', '${_brief.occupancyPct}%', '${_brief.occupied}/${widget.rooms.length} Rms'),
                    const SizedBox(width: 8),
                    _buildStatPill('Collected', currency.format(_brief.collected), 'UPI + Cash'),
                    const SizedBox(width: 8),
                    _buildStatPill('Clean / Ready', '${_brief.vacant} Vacant', '${_brief.cleaning} Cleaning'),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // 3. Filter Chips (Horizontal Scroll to NEVER overflow on small devices)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _buildFilterChip('All (${widget.rooms.length})', null),
                const SizedBox(width: 6),
                _buildFilterChip('Occupied (${widget.rooms.where((r) => r.status == RoomStatus.occupied).length})', RoomStatus.occupied),
                const SizedBox(width: 6),
                _buildFilterChip('Vacant (${widget.rooms.where((r) => r.status == RoomStatus.vacant).length})', RoomStatus.vacant),
                const SizedBox(width: 6),
                _buildFilterChip('Cleaning (${widget.rooms.where((r) => r.status == RoomStatus.cleaning).length})', RoomStatus.cleaning),
                const SizedBox(width: 6),
                _buildFilterChip('Maintenance (${widget.rooms.where((r) => r.status == RoomStatus.maintenance).length})', RoomStatus.maintenance),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // 4. Rooms Grid (childAspectRatio 0.95 gives proper height, zero overflow)
          if (filteredRooms.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40),
              alignment: Alignment.center,
              child: const Text('No rooms match this filter', style: TextStyle(color: AppTheme.textMuted)),
            )
          else
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredRooms.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 0.95, // Increased height to prevent tight overflows
              ),
              itemBuilder: (context, index) {
                final room = filteredRooms[index];
                return _buildRoomCard(room, currency);
              },
            ),
        ],
      ),
    );
  }

  Widget _buildStatPill(String title, String val, String sub, {bool isAlert = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isAlert ? AppTheme.alertRed.withValues(alpha: 0.5) : AppTheme.borderLight),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            const SizedBox(height: 2),
            FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                val,
                style: TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: isAlert ? AppTheme.alertRed : AppTheme.ink,
                ),
              ),
            ),
            Text(sub, style: const TextStyle(fontSize: 8.5, color: AppTheme.textMuted), overflow: TextOverflow.ellipsis),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, RoomStatus? status) {
    final isSelected = _filterStatus == status;
    return GestureDetector(
      onTap: () => setState(() => _filterStatus = status),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.maroon : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? AppTheme.maroon : AppTheme.borderLight),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }

  Widget _buildRoomCard(Room room, NumberFormat currency) {
    Color statusColor;
    String statusText;
    switch (room.status) {
      case RoomStatus.occupied:
        statusColor = AppTheme.maroon;
        statusText = 'Occupied';
        break;
      case RoomStatus.vacant:
        statusColor = AppTheme.greenSuccess;
        statusText = 'Vacant';
        break;
      case RoomStatus.cleaning:
        statusColor = AppTheme.gold;
        statusText = 'Cleaning';
        break;
      case RoomStatus.maintenance:
        statusColor = AppTheme.textMuted;
        statusText = 'Maint.';
        break;
    }

    final isAyushRoom = room.number == '301';

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => _showRoomActionSheet(room, currency),
        child: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isAyushRoom ? AppTheme.gold : AppTheme.borderLight,
              width: isAyushRoom ? 1.5 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Row 1: Room Number + Compact Status Chip (Zero overflow guaranteed)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Flexible(
                    child: Text(
                      'Room ${room.number}',
                      style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.bold, color: AppTheme.ink),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(fontSize: 8.5, fontWeight: FontWeight.bold, color: statusColor),
                    ),
                  ),
                ],
              ),
              Text(
                room.type,
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (room.currentGuest != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  decoration: BoxDecoration(
                    color: isAyushRoom ? AppTheme.goldPale : AppTheme.surfaceWarm,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        room.currentGuest!.isVIP ? Icons.star_rounded : Icons.person_rounded,
                        size: 13,
                        color: room.currentGuest!.isVIP ? AppTheme.gold : AppTheme.textMuted,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          room.currentGuest!.name,
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: room.currentGuest!.isVIP ? AppTheme.maroon : AppTheme.ink,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              ] else ...[
                Text(
                  '${currency.format(room.pricePerNight)} / night',
                  style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, color: AppTheme.ink),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showRoleSwitchDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Switch Staff / Admin Position', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 6),
              const Text('Select an account to switch operational view & permissions:', style: TextStyle(fontSize: 12, color: AppTheme.textMuted)),
              const SizedBox(height: 14),
              _buildStaffOption(
                name: 'Aman Varma',
                title: 'Hotel Owner & General Manager',
                role: UserRole.owner,
                icon: Icons.shield_rounded,
                color: AppTheme.gold,
              ),
              _buildStaffOption(
                name: 'Priya Nair',
                title: 'Senior Receptionist',
                role: UserRole.receptionist,
                icon: Icons.person_rounded,
                color: AppTheme.maroon,
              ),
              _buildStaffOption(
                name: 'Suresh Kumar',
                title: 'Housekeeper Staff',
                role: UserRole.housekeeper,
                icon: Icons.cleaning_services_rounded,
                color: AppTheme.greenSuccess,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStaffOption({
    required String name,
    required String title,
    required UserRole role,
    required IconData icon,
    required Color color,
  }) {
    final isCurrent = widget.currentStaff.role == role;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: isCurrent ? color.withValues(alpha: 0.08) : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isCurrent ? color : AppTheme.borderLight),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.15),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
        subtitle: Text(title, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
        trailing: isCurrent ? Icon(Icons.check_circle_rounded, color: color) : null,
        onTap: () {
          Navigator.pop(context);
          final updated = StaffAccount(
            id: 'STF-${role.name}',
            name: name,
            phone: '+91 98765 00000',
            roleTitle: title,
            role: role,
            pin: role == UserRole.owner ? '9999' : '1111',
          );
          widget.onStaffChanged(updated);
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Switched to ${updated.roleTitle} ($name)'),
              backgroundColor: AppTheme.maroon,
            ),
          );
        },
      ),
    );
  }

  void _showRoomActionSheet(Room room, NumberFormat currency) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Room ${room.number} · ${room.type}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                      Text('${currency.format(room.pricePerNight)} / night', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                    ],
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 16),

              if (room.status == RoomStatus.vacant) ...[
                const Text('Quick Walk-in Check-in', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.maroon,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.login_rounded),
                    label: const Text('Fast Check-in Guest', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showQuickCheckInDialog(room);
                    },
                  ),
                ),
              ] else if (room.status == RoomStatus.occupied) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceWarm,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderLight),
                  ),
                  child: Row(
                    children: [
                      const CircleAvatar(
                        backgroundColor: AppTheme.maroonLight,
                        child: Icon(Icons.person, color: AppTheme.maroon),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(room.currentGuest?.name ?? 'Guest', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                            Text('Phone: ${room.currentGuest?.phone ?? 'N/A'}', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.receipt_long, size: 18),
                        label: const Text('Generate Bill', style: TextStyle(fontWeight: FontWeight.bold)),
                        onPressed: () {
                          Navigator.pop(ctx);
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => InvoiceComposerScreen(
                                preselectedRoom: room,
                                hotelConfig: widget.hotelConfig,
                                onInvoiceCreated: (newInv) {
                                  if (widget.onInvoiceCreated != null) {
                                    widget.onInvoiceCreated!(newInv);
                                  }
                                },
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.alertRed,
                          side: const BorderSide(color: AppTheme.alertRed),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.logout, size: 18),
                        label: const Text('Check Out', style: TextStyle(fontWeight: FontWeight.bold)),
                        onPressed: () {
                          Navigator.pop(ctx);
                          setState(() {
                            room.status = RoomStatus.cleaning;
                            room.currentGuest = null;
                            widget.onRoomUpdated(room);
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Room ${room.number} checked out · Marked for Cleaning'),
                              backgroundColor: AppTheme.gold,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ] else if (room.status == RoomStatus.cleaning) ...[
                const Text('Room Turnover in Progress', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.greenSuccess,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('Mark Room Clean & Ready', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() {
                        room.status = RoomStatus.vacant;
                        widget.onRoomUpdated(room);
                      });
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Room ${room.number} is now Vacant and Ready for Guests!'),
                          backgroundColor: AppTheme.greenSuccess,
                        ),
                      );
                    },
                  ),
                ),
              ] else if (room.status == RoomStatus.maintenance) ...[
                const Text('Room under maintenance', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.maroon,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.build_circle_outlined),
                    label: const Text('Complete Maintenance', style: TextStyle(fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.pop(ctx);
                      setState(() {
                        room.status = RoomStatus.vacant;
                        widget.onRoomUpdated(room);
                      });
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showQuickCheckInDialog(Room room) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    bool isVIP = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Fast Check-in · Room ${room.number}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(
                  labelText: 'Guest Full Name *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Mobile Phone *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.phone),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Checkbox(
                    value: isVIP,
                    activeColor: AppTheme.maroon,
                    onChanged: (val) => setModalState(() => isVIP = val ?? false),
                  ),
                  const Text('VIP Guest Priority Tag', style: TextStyle(fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.maroon,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () {
                    final name = nameCtrl.text.trim();
                    final phone = phoneCtrl.text.trim();
                    if (name.isEmpty || phone.isEmpty) return;

                    Navigator.pop(ctx);
                    setState(() {
                      room.status = RoomStatus.occupied;
                      room.currentGuest = Guest(
                        id: 'guest-${DateTime.now().millisecondsSinceEpoch}',
                        name: name,
                        phone: phone,
                        email: '$phone@guest.com',
                        isVIP: isVIP,
                      );
                      widget.onRoomUpdated(room);
                    });

                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Checked in $name to Room ${room.number}!'),
                        backgroundColor: AppTheme.greenSuccess,
                      ),
                    );
                  },
                  child: const Text('Confirm Check-in', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
