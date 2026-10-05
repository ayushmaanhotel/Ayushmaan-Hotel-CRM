import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';

class CleanerMobileScreen extends StatefulWidget {
  final List<Room> rooms;
  final Function(Room) onRoomUpdated;
  final StaffAccount currentStaff;
  final HotelConfig hotelConfig;

  const CleanerMobileScreen({
    super.key,
    required this.rooms,
    required this.onRoomUpdated,
    required this.currentStaff,
    required this.hotelConfig,
  });

  @override
  State<CleanerMobileScreen> createState() => _CleanerMobileScreenState();
}

class _CleanerMobileScreenState extends State<CleanerMobileScreen> {
  final List<String> _completedTodayRoomNumbers = [];

  @override
  Widget build(BuildContext context) {
    final dirtyRooms = widget.rooms.where((r) => r.status == RoomStatus.cleaning).toList();
    final vacantRooms = widget.rooms.where((r) => r.status == RoomStatus.vacant).toList();
    final occupiedRooms = widget.rooms.where((r) => r.status == RoomStatus.occupied).toList();
    final maintenanceRooms = widget.rooms.where((r) => r.status == RoomStatus.maintenance).toList();

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppTheme.greenSuccess.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.cleaning_services_rounded, color: AppTheme.greenSuccess, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Housekeeping Mobile Sync', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                  Text('${widget.currentStaff.name} · ${widget.hotelConfig.hotelName}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppTheme.greenSuccess.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.greenSuccess.withValues(alpha: 0.3)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.wifi_rounded, color: AppTheme.greenSuccess, size: 14),
                SizedBox(width: 4),
                Text('LIVE SYNC', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.greenSuccess)),
              ],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Staff Greeting & Daily Turnover Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 6, offset: const Offset(0, 3)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Namaste, ${widget.currentStaff.name.split(' ').first} Ji! 🙏',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.ink),
                    ),
                    Text(
                      DateFormat('dd MMM yyyy').format(DateTime.now()),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    _buildStatCard('Needs Cleaning', '${dirtyRooms.length}', Icons.brush_rounded, AppTheme.alertRed),
                    const SizedBox(width: 8),
                    _buildStatCard('Clean & Ready', '${vacantRooms.length}', Icons.check_circle_rounded, AppTheme.greenSuccess),
                    const SizedBox(width: 8),
                    _buildStatCard('Occupied Stays', '${occupiedRooms.length}', Icons.hotel_rounded, AppTheme.maroon),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 18),

          // 2. Section: Rooms Needing Cleaning Action
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(color: AppTheme.alertRed, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                'Rooms Needing Turnover (${dirtyRooms.length})',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink),
              ),
            ],
          ),
          const SizedBox(height: 10),

          if (dirtyRooms.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: const Column(
                children: [
                  Icon(Icons.done_all_rounded, color: AppTheme.greenSuccess, size: 36),
                  SizedBox(height: 8),
                  Text('All Checked-out Rooms are Clean & Ready!', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.ink)),
                  SizedBox(height: 4),
                  Text('Great job! No rooms are pending housekeeping turnover.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                ],
              ),
            )
          else
            ...dirtyRooms.map((room) {
              final isAyushRoom = room.number == '301';
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: isAyushRoom ? AppTheme.gold : AppTheme.alertRed.withValues(alpha: 0.3),
                    width: isAyushRoom ? 1.5 : 1.0,
                  ),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 6, offset: const Offset(0, 3)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Room ${room.number}',
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.ink, fontFamily: 'serif'),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppTheme.alertRed.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text('DIRTY / CHECKOUT', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppTheme.alertRed)),
                            ),
                          ],
                        ),
                        if (isAyushRoom)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.goldPale,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text('👑 VIP SUITE', style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${room.type} · Floor ${room.floor}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 12),
                    const Divider(height: 1),
                    const SizedBox(height: 12),
                    // Large Touch Target Button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.greenSuccess,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          elevation: 1,
                        ),
                        icon: const Icon(Icons.check_circle_outline_rounded, size: 22),
                        label: Text(
                          'Mark Room ${room.number} Clean & Ready!',
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        onPressed: () {
                          setState(() {
                            room.status = RoomStatus.vacant;
                            if (!_completedTodayRoomNumbers.contains(room.number)) {
                              _completedTodayRoomNumbers.insert(0, room.number);
                            }
                          });
                          widget.onRoomUpdated(room);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Room ${room.number} is clean and available on Front Desk!'),
                              backgroundColor: AppTheme.greenSuccess,
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              );
            }),

          const SizedBox(height: 20),

          // 3. Section: Completed Clean Today
          Row(
            children: [
              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(color: AppTheme.greenSuccess, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                'Completed Clean Today (${_completedTodayRoomNumbers.length + vacantRooms.length})',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink),
              ),
            ],
          ),
          const SizedBox(height: 10),

          ...vacantRooms.map((room) {
            return Container(
              margin: const EdgeInsets.only(bottom: 8),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderLight),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check_circle_rounded, color: AppTheme.greenSuccess, size: 20),
                      const SizedBox(width: 10),
                      Text('Room ${room.number}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                      const SizedBox(width: 6),
                      Text('(${room.type})', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppTheme.greenSuccess.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('READY', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.greenSuccess)),
                  ),
                ],
              ),
            );
          }),

          if (maintenanceRooms.isNotEmpty) ...[
            const SizedBox(height: 16),
            const Text('Maintenance Needed', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textMuted)),
            const SizedBox(height: 8),
            ...maintenanceRooms.map((room) {
              return Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.alertRed.withValues(alpha: 0.3)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.handyman_rounded, color: AppTheme.alertRed, size: 20),
                    const SizedBox(width: 10),
                    Text('Room ${room.number}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const Spacer(),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.greenSuccess, foregroundColor: Colors.white),
                      onPressed: () {
                        setState(() => room.status = RoomStatus.vacant);
                        widget.onRoomUpdated(room);
                      },
                      child: const Text('Fixed & Ready', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              );
            }),
          ],

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String val, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 4),
            Text(val, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            Text(title, style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
          ],
        ),
      ),
    );
  }
}
