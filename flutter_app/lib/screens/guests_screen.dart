import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';

class GuestsScreen extends StatefulWidget {
  final List<Guest> guests;
  final Function(Guest) onGuestAdded;
  final Function(Guest) onGuestUpdated;
  final HotelConfig hotelConfig;

  const GuestsScreen({
    super.key,
    required this.guests,
    required this.onGuestAdded,
    required this.onGuestUpdated,
    required this.hotelConfig,
  });

  @override
  State<GuestsScreen> createState() => _GuestsScreenState();
}

class _GuestsScreenState extends State<GuestsScreen> {
  String _searchQuery = '';
  String _activeFilter = 'All'; // 'All' | 'VIP' | 'Foreigner'

  final _currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

  List<Guest> get _filteredGuests {
    return widget.guests.where((g) {
      if (_activeFilter == 'VIP' && !g.isVIP) return false;
      if (_activeFilter == 'Foreigner' && !g.isForeigner) return false;
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final match = g.name.toLowerCase().contains(q) || g.phone.contains(q) || g.email.toLowerCase().contains(q);
        if (!match) return false;
      }
      return true;
    }).toList();
  }

  void _openWhatsAppForGuest(Guest guest) {
    final cleanPhone = guest.phone.replaceAll(RegExp(r'[^\d]'), '');
    final text = Uri.encodeComponent(
      'Namaste ${guest.name} Ji! 🙏 Greetings from ${widget.hotelConfig.hotelName}. We hope you had a comfortable stay with us. Please let us know if you need any assistance or would like to book your next visit.',
    );
    final url = 'https://wa.me/$cleanPhone?text=$text';
    Clipboard.setData(ClipboardData(text: 'https://wa.me/$cleanPhone?text=$text'));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('WhatsApp chat link copied for ${guest.name} ($url)'),
        backgroundColor: AppTheme.maroon,
      ),
    );
  }

  void _showAddGuestDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    bool isVIP = false;
    bool isForeigner = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 16,
                right: 16,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.person_add_rounded, color: AppTheme.maroon, size: 22),
                            SizedBox(width: 8),
                            Text('Add Guest Profile', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                          ],
                        ),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                    const Text('Save guest identity, preferences, and FRRO foreign compliance notes.', style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted)),
                    const SizedBox(height: 14),

                    TextField(
                      controller: nameCtrl,
                      decoration: const InputDecoration(labelText: 'Guest Full Name *', prefixIcon: Icon(Icons.person_rounded, color: AppTheme.maroon)),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(labelText: 'Phone Number *', prefixIcon: Icon(Icons.phone_rounded, color: AppTheme.maroon)),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: emailCtrl,
                      keyboardType: TextInputType.emailAddress,
                      decoration: const InputDecoration(labelText: 'Email Address', prefixIcon: Icon(Icons.email_rounded, color: AppTheme.maroon)),
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: notesCtrl,
                      maxLines: 2,
                      decoration: const InputDecoration(labelText: 'Stay Preferences & Notes', prefixIcon: Icon(Icons.note_alt_rounded, color: AppTheme.maroon)),
                    ),
                    const SizedBox(height: 12),

                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('VIP Guest Priority', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Highlights guest with gold badge on Front Desk', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      value: isVIP,
                      activeThumbColor: AppTheme.gold,
                      onChanged: (val) => setModalState(() => isVIP = val),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Foreign Citizen (Form C / FRRO)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: const Text('Requires passport verification & Form C registration', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      value: isForeigner,
                      activeThumbColor: AppTheme.maroon,
                      onChanged: (val) => setModalState(() => isForeigner = val),
                    ),

                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.check_circle_rounded, size: 20),
                        label: const Text('Save Guest Profile', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          final name = nameCtrl.text.trim();
                          final phone = phoneCtrl.text.trim();
                          if (name.isEmpty || phone.isEmpty) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Please fill in guest name and phone number!'), backgroundColor: AppTheme.alertRed),
                            );
                            return;
                          }

                          final newGuest = Guest(
                            id: 'GST-${DateTime.now().millisecondsSinceEpoch}',
                            name: name,
                            phone: phone,
                            email: emailCtrl.text.trim(),
                            isVIP: isVIP,
                            isForeigner: isForeigner,
                            cFormDone: isForeigner,
                            visits: 1,
                            totalSpent: 0.0,
                            lastStay: 'Walk-in Registered',
                            notes: notesCtrl.text.trim(),
                          );

                          widget.onGuestAdded(newGuest);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Guest profile saved for $name!'), backgroundColor: AppTheme.maroon),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Guests 360° Directory', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Guest History, LTV, VIP & C-Form Tracking', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.maroon,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_rounded),
        label: const Text('Add Guest', style: TextStyle(fontWeight: FontWeight.bold)),
        onPressed: _showAddGuestDialog,
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Search Box
          TextField(
            decoration: InputDecoration(
              hintText: 'Search guest by name, phone or email...',
              prefixIcon: const Icon(Icons.search_rounded, size: 20),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppTheme.borderLight)),
            ),
            onChanged: (val) => setState(() => _searchQuery = val.trim()),
          ),
          const SizedBox(height: 10),

          // 2. Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                ChoiceChip(
                  label: Text('All (${widget.guests.length})', style: const TextStyle(fontSize: 11)),
                  selected: _activeFilter == 'All',
                  onSelected: (_) => setState(() => _activeFilter = 'All'),
                ),
                const SizedBox(width: 6),
                ChoiceChip(
                  label: Text('VIP Guests (${widget.guests.where((g) => g.isVIP).length})', style: const TextStyle(fontSize: 11)),
                  selected: _activeFilter == 'VIP',
                  selectedColor: AppTheme.goldPale,
                  onSelected: (_) => setState(() => _activeFilter = 'VIP'),
                ),
                const SizedBox(width: 6),
                ChoiceChip(
                  label: Text('Foreign Guests (${widget.guests.where((g) => g.isForeigner).length})', style: const TextStyle(fontSize: 11)),
                  selected: _activeFilter == 'Foreigner',
                  selectedColor: Colors.blue.shade50,
                  onSelected: (_) => setState(() => _activeFilter = 'Foreigner'),
                ),
              ],
            ),
          ),

          const SizedBox(height: 14),

          // 3. Guest List
          if (_filteredGuests.isEmpty)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 40),
              alignment: Alignment.center,
              child: const Text('No guest records match your search', style: TextStyle(color: AppTheme.textMuted)),
            )
          else
            ..._filteredGuests.map((guest) {
              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: guest.isVIP ? AppTheme.gold : AppTheme.borderLight,
                    width: guest.isVIP ? 1.5 : 1.0,
                  ),
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
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 18,
                              backgroundColor: guest.isVIP ? AppTheme.goldPale : AppTheme.maroonLight,
                              child: Text(
                                guest.name.isNotEmpty ? guest.name[0] : 'G',
                                style: TextStyle(fontWeight: FontWeight.bold, color: guest.isVIP ? AppTheme.gold : AppTheme.maroon),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(guest.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                                    if (guest.isVIP) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                        decoration: BoxDecoration(color: AppTheme.goldPale, borderRadius: BorderRadius.circular(6)),
                                        child: const Text('VIP', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                                      ),
                                    ],
                                  ],
                                ),
                                Text(guest.phone, style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted)),
                              ],
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(_currency.format(guest.totalSpent), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: AppTheme.greenSuccess)),
                            Text('${guest.visits} Stays', style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                          ],
                        ),
                      ],
                    ),
                    if (guest.notes.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(color: AppTheme.surfaceWarm, borderRadius: BorderRadius.circular(8)),
                        child: Row(
                          children: [
                            const Icon(Icons.notes_rounded, size: 14, color: AppTheme.textMuted),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(guest.notes, style: const TextStyle(fontSize: 11, color: AppTheme.ink), maxLines: 2, overflow: TextOverflow.ellipsis),
                            ),
                          ],
                        ),
                      ),
                    ],
                    if (guest.isForeigner) ...[
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(guest.cFormDone ? Icons.check_circle_rounded : Icons.warning_rounded, size: 14, color: guest.cFormDone ? AppTheme.greenSuccess : AppTheme.alertRed),
                          const SizedBox(width: 4),
                          Text(
                            guest.cFormDone ? 'C-Form Filed & FRRO Verified' : 'C-Form Pending (24h Compliance Warning)',
                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.bold, color: guest.cFormDone ? AppTheme.greenSuccess : AppTheme.alertRed),
                          ),
                        ],
                      ),
                    ],
                    const SizedBox(height: 10),
                    const Divider(height: 1),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Last Stay: ${guest.lastStay.isNotEmpty ? guest.lastStay : "Direct Walk-in"}', style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                        TextButton.icon(
                          style: TextButton.styleFrom(
                            foregroundColor: AppTheme.maroon,
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                          ),
                          icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                          label: const Text('WhatsApp', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                          onPressed: () => _openWhatsAppForGuest(guest),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          const SizedBox(height: 80),
        ],
      ),
    );
  }
}
