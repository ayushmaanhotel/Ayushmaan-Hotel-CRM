import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';

class OwnerAnalyticsScreen extends StatelessWidget {
  final List<Room> rooms;
  final List<Invoice> invoices;
  final HotelConfig hotelConfig;

  const OwnerAnalyticsScreen({
    super.key,
    required this.rooms,
    required this.invoices,
    required this.hotelConfig,
  });

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    final totalRooms = rooms.length;
    final occupiedRooms = rooms.where((r) => r.status == RoomStatus.occupied).length;
    final occupancyRate = totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).round() : 0;

    final issuedInvoices = invoices.where((i) => i.status == 'ISSUED').toList();
    final todayRevenue = issuedInvoices.fold<double>(0.0, (sum, i) => sum + i.grandTotal);

    final adr = occupiedRooms > 0 ? (todayRevenue / occupiedRooms).roundToDouble() : 0.0;
    final revPar = totalRooms > 0 ? (todayRevenue / totalRooms).roundToDouble() : 0.0;

    // Full potential revenue if 100% full
    final potentialFullRevenue = rooms.fold<double>(0.0, (sum, r) => sum + r.pricePerNight);
    final revenueLeakGap = potentialFullRevenue > todayRevenue ? (potentialFullRevenue - todayRevenue) : 0.0;

    // Estimated 20% OTA commission leak (e.g. MakeMyTrip, Goibibo)
    final otaEstimatedLeak = todayRevenue * 0.20;

    // Group rooms by category/type
    final Map<String, List<Room>> categoryMap = {};
    for (final room in rooms) {
      categoryMap.putIfAbsent(room.type, () => []).add(room);
    }

    final categoryStats = categoryMap.entries.map((entry) {
      final type = entry.key;
      final roomList = entry.value;
      final total = roomList.length;
      final occ = roomList.where((r) => r.status == RoomStatus.occupied).length;
      final fillPct = total > 0 ? ((occ / total) * 100).round() : 0;
      final avgPrice = roomList.isNotEmpty ? roomList.first.pricePerNight : 0.0;
      return {
        'type': type,
        'total': total,
        'occupied': occ,
        'vacant': total - occ,
        'fillRate': fillPct,
        'price': avgPrice,
      };
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Owner Intelligence & Fill-Rate', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('RevPAR, ADR & Direct Booking Leverage', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Executive Intelligence Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 8, offset: const Offset(0, 3)),
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
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: AppTheme.goldPale, borderRadius: BorderRadius.circular(10)),
                          child: const Icon(Icons.stars_rounded, color: AppTheme.gold, size: 22),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Executive RevPAR Radar', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                            Text(hotelConfig.hotelName, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: AppTheme.maroonLight, borderRadius: BorderRadius.circular(12)),
                      child: Text('$occupancyRate% OCCUPIED', style: const TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Today\'s RevPAR', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(currency.format(revPar), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.greenSuccess)),
                          ),
                          const Text('Rev / total room', style: TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 40, color: AppTheme.borderLight),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Average Daily Rate (ADR)', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(currency.format(adr), style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.maroon)),
                          ),
                          const Text('Rev / occupied room', style: TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                    Container(width: 1, height: 40, color: AppTheme.borderLight),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Occupied Rms', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          const SizedBox(height: 2),
                          FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text('$occupiedRooms of $totalRooms', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppTheme.ink)),
                          ),
                          Text('${totalRooms - occupiedRooms} vacant', style: const TextStyle(fontSize: 9.5, color: AppTheme.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2. MakeMyTrip & OTA Commission Leak Warning Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.orange.shade300),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.warning_amber_rounded, color: Colors.orange.shade800, size: 22),
                        const SizedBox(width: 8),
                        const Text('MakeMyTrip / OTA 20% Commission Leak', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                      ],
                    ),
                    Text(currency.format(otaEstimatedLeak), style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.orange.shade900)),
                  ],
                ),
                const SizedBox(height: 6),
                const Text(
                  'Third-party OTA aggregators take 18%–22% commission on each room booking. Direct UPI bookings retain 100% revenue in your bank account.',
                  style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.maroon,
                      side: const BorderSide(color: AppTheme.maroon),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.share_rounded, size: 16),
                    label: const Text('Copy Direct Booking Discount Link for Guests', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      final text = '''
Namaste! Book direct with *${hotelConfig.hotelName}* and save 10% on your stay.
Skip OTA commissions and get free early check-in & breakfast.
Direct UPI / Booking Desk: ${hotelConfig.phone} · VPA: ${hotelConfig.upiVpa}
'''.trim();
                      Clipboard.setData(ClipboardData(text: text));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Direct booking link copied to clipboard!'), backgroundColor: AppTheme.maroon),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 3. Category Fill Rates
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Category Fill-Rates & Inventory Health', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                const SizedBox(height: 4),
                const Text('Monitors underperforming inventory to adjust walk-in pricing.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                const SizedBox(height: 14),
                ...categoryStats.map((stat) {
                  final fillRate = stat['fillRate'] as int;
                  final isUnder = fillRate < 60;
                  final fillDecimal = fillRate / 100.0;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                Text(stat['type'] as String, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                                const SizedBox(width: 8),
                                if (isUnder)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                    decoration: BoxDecoration(color: AppTheme.alertRed.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                                    child: const Text('UNDER 60%', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.alertRed)),
                                  ),
                              ],
                            ),
                            Text(
                              '${stat['occupied']}/${stat['total']} Filled ($fillRate%) · ${currency.format(stat['price'])}/nt',
                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold, color: AppTheme.ink),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        LinearProgressIndicator(
                          value: fillDecimal,
                          backgroundColor: Colors.grey.shade100,
                          valueColor: AlwaysStoppedAnimation<Color>(isUnder ? Colors.orange.shade700 : AppTheme.greenSuccess),
                          borderRadius: BorderRadius.circular(4),
                          minHeight: 6,
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 4. Revenue Gap Analysis Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Potential 100% Full-House Revenue', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                const SizedBox(height: 4),
                Text('Total inventory potential: ${currency.format(potentialFullRevenue)}', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppTheme.surfaceWarm, borderRadius: BorderRadius.circular(10)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Realized Today', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                            Text(currency.format(todayRevenue), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.greenSuccess)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppTheme.surfaceWarm, borderRadius: BorderRadius.circular(10)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Unrealized Capacity', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                            Text(currency.format(revenueLeakGap), style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.alertRed)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
