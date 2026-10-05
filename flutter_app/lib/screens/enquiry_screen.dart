import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';

class EnquiryScreen extends StatefulWidget {
  final List<Inquiry> inquiries;
  final Function(Inquiry) onAddInquiry;

  const EnquiryScreen({
    super.key,
    required this.inquiries,
    required this.onAddInquiry,
  });

  @override
  State<EnquiryScreen> createState() => _EnquiryScreenState();
}

class _EnquiryScreenState extends State<EnquiryScreen> {
  void _copyFollowUp(Inquiry inq) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);
    final text = '''
Namaste ${inq.name} Ji! 🙏
Thank you for enquiring at *Grand Heritage Inn Hotel* (${inq.source}).

📅 Stay: ${inq.checkIn} → ${inq.checkOut}
💰 Quoted: ${currency.format(inq.quotedRate)} per night

Rooms are filling fast for these dates — shall we block one for you?
Reply YES and we will hold it for 2 hours.
'''.trim();
    Clipboard.setData(ClipboardData(text: text));
    setState(() {
      inq.status = 'FOLLOWED';
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Follow-up copied! Marked as FOLLOWED. Ready for WhatsApp.'),
        backgroundColor: AppTheme.maroon,
      ),
    );
  }

  void _showAddDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final rateCtrl = TextEditingController(text: '3500');

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Log New Enquiry', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(labelText: 'Guest / Lead Name', hintText: 'e.g. Rahul Verma'),
                ),
                TextField(
                  controller: phoneCtrl,
                  decoration: const InputDecoration(labelText: 'Phone Number', hintText: '+91 98765 00000'),
                  keyboardType: TextInputType.phone,
                ),
                TextField(
                  controller: rateCtrl,
                  decoration: const InputDecoration(labelText: 'Quoted Rate / Night (₹)'),
                  keyboardType: TextInputType.number,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (nameCtrl.text.isNotEmpty && phoneCtrl.text.isNotEmpty) {
                  final newInq = Inquiry(
                    id: 'inq-${DateTime.now().millisecondsSinceEpoch}',
                    name: nameCtrl.text.trim(),
                    phone: phoneCtrl.text.trim(),
                    checkIn: 'Tomorrow',
                    checkOut: 'Day after',
                    quotedRate: double.tryParse(rateCtrl.text) ?? 3500.0,
                    source: 'WhatsApp',
                    status: 'NEW',
                    createdAt: 'Just now',
                  );
                  widget.onAddInquiry(newInq);
                  Navigator.pop(context);
                }
              },
              child: const Text('Save Lead'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currency = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enquiry Pad (लीड रजिस्टर)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Enquiries stop dying in notebooks', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded, color: AppTheme.maroon),
            tooltip: 'Log Enquiry',
            onPressed: _showAddDialog,
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        itemCount: widget.inquiries.length,
        itemBuilder: (context, index) {
          final inq = widget.inquiries[index];
          final isNew = inq.status == 'NEW';

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isNew ? AppTheme.gold : AppTheme.borderLight,
                width: isNew ? 1.5 : 1.0,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      inq.name,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isNew ? AppTheme.goldPale : AppTheme.surfaceWarm,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        inq.status,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isNew ? AppTheme.gold : AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${inq.phone} · Source: ${inq.source}',
                  style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                ),
                Text(
                  'Stay: ${inq.checkIn} -> ${inq.checkOut} · Quoted: ${currency.format(inq.quotedRate)}/N',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.ink),
                ),
                if (inq.notes != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    inq.notes!,
                    style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppTheme.textMuted),
                  ),
                ],
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.send_rounded, size: 14),
                        label: const Text('1-Tap WhatsApp Follow-up'),
                        onPressed: () => _copyFollowUp(inq),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.maroon,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('New Lead'),
        onPressed: _showAddDialog,
      ),
    );
  }
}
