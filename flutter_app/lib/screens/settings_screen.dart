import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';
import '../services/storage_service.dart';
import '../services/cloud_sync_service.dart';
import '../services/permission_service.dart';
import '../widgets/theme_studio_bar.dart';
import 'owner_analytics_screen.dart';
import 'guests_screen.dart';
import 'enquiry_screen.dart';

class SettingsScreen extends StatefulWidget {
  final HotelConfig hotelConfig;
  final Function(HotelConfig) onConfigChanged;
  final StaffAccount currentStaff;
  final Function(StaffAccount) onStaffChanged;
  final List<StaffAccount> staffAccounts;
  final Function(List<StaffAccount>) onStaffAccountsChanged;
  final List<Room> rooms;
  final List<Invoice> invoices;
  final List<Inquiry> inquiries;
  final List<Guest>? guests;
  final Function(Guest)? onGuestAdded;
  final Function(Inquiry)? onAddInquiry;

  const SettingsScreen({
    super.key,
    required this.hotelConfig,
    required this.onConfigChanged,
    required this.currentStaff,
    required this.onStaffChanged,
    required this.staffAccounts,
    required this.onStaffAccountsChanged,
    required this.rooms,
    required this.invoices,
    required this.inquiries,
    this.guests,
    this.onGuestAdded,
    this.onAddInquiry,
  });

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  Map<String, bool> _permissions = {'notification': false, 'storage': false, 'internet': true};
  bool _isSyncing = false;
  String _supabaseUrl = '';
  String _supabaseKey = '';
  bool _cloudSyncActive = false;
  bool _obscureKey = true;

  @override
  void initState() {
    super.initState();
    _loadPermissions();
    _loadCloudConfig();
  }

  Future<void> _loadPermissions() async {
    final res = await PermissionService.checkAllPermissions();
    if (mounted) {
      setState(() => _permissions = res);
    }
  }

  Future<void> _loadCloudConfig() async {
    final config = await StorageService.loadCloudSyncConfig();
    if (mounted) {
      setState(() {
        _supabaseUrl = config['url'] as String? ?? '';
        _supabaseKey = config['key'] as String? ?? '';
        _cloudSyncActive = config['active'] as bool? ?? false;
      });
    }
  }

  Future<void> _requestNotification() async {
    final granted = await PermissionService.requestNotificationPermission();
    if (mounted) {
      setState(() => _permissions['notification'] = granted);
    }
  }

  Future<void> _requestStorage() async {
    final granted = await PermissionService.requestStoragePermission();
    if (mounted) {
      setState(() => _permissions['storage'] = granted);
    }
  }

  Future<void> _triggerCloudSync() async {
    setState(() => _isSyncing = true);
    final success = await CloudSyncService.syncAll(
      rooms: widget.rooms,
      invoices: widget.invoices,
      inquiries: widget.inquiries,
    );
    if (mounted) {
      setState(() => _isSyncing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success
                ? 'Cloud Sync Complete! Data synchronized with Supabase.'
                : 'Offline Cache Active. Changes saved locally and will push when online.',
          ),
          backgroundColor: success ? AppTheme.greenSuccess : AppTheme.maroon,
        ),
      );
    }
  }

  // --- Role / Staff Switcher Dialog ---
  void _showRoleSwitcherDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Switch Active Staff & Role',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const Text(
                'Select a staff account below. Permissions and access levels adapt immediately.',
                style: TextStyle(fontSize: 12, color: AppTheme.textMuted),
              ),
              const SizedBox(height: 16),
              ...widget.staffAccounts.map((account) {
                final isCurrent = account.id == widget.currentStaff.id;
                Color roleColor;
                switch (account.role) {
                  case UserRole.owner:
                    roleColor = AppTheme.maroon;
                    break;
                  case UserRole.manager:
                    roleColor = Colors.teal;
                    break;
                  case UserRole.receptionist:
                    roleColor = Colors.blue.shade700;
                    break;
                  case UserRole.housekeeper:
                    roleColor = Colors.orange.shade800;
                    break;
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(
                    color: isCurrent ? AppTheme.surfaceWarm : Colors.white,
                    border: Border.all(
                      color: isCurrent ? AppTheme.maroon : AppTheme.borderLight,
                      width: isCurrent ? 1.5 : 1,
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: roleColor.withValues(alpha: 0.15),
                      child: Icon(Icons.person_rounded, color: roleColor),
                    ),
                    title: Row(
                      children: [
                        Flexible(
                          child: Text(
                            account.name,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isCurrent) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppTheme.maroon,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Text(
                              'ACTIVE',
                              style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ],
                    ),
                    subtitle: Text(
                      '${account.roleTitle} · PIN: ${account.pin}',
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    trailing: isCurrent
                        ? const Icon(Icons.check_circle_rounded, color: AppTheme.maroon)
                        : TextButton(
                            onPressed: () {
                              Navigator.pop(ctx);
                              _confirmStaffSwitch(account);
                            },
                            child: const Text('Switch', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                  ),
                );
              }),
            ],
          ),
        );
      },
    );
  }

  void _confirmStaffSwitch(StaffAccount target) {
    widget.onStaffChanged(target);
    StorageService.saveCurrentStaff(target);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Switched to ${target.name} (${target.role.name.toUpperCase()})'),
        backgroundColor: AppTheme.maroon,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  // --- Edit Hotel & GST Profile Modal ---
  void _showEditHotelProfileModal() {
    final tradeNameCtrl = TextEditingController(text: widget.hotelConfig.hotelName);
    final legalNameCtrl = TextEditingController(text: widget.hotelConfig.legalName);
    final gstinCtrl = TextEditingController(text: widget.hotelConfig.gstin);
    final addressCtrl = TextEditingController(text: widget.hotelConfig.address);
    final phoneCtrl = TextEditingController(text: widget.hotelConfig.phone);
    final emailCtrl = TextEditingController(text: widget.hotelConfig.email);
    final upiCtrl = TextEditingController(text: widget.hotelConfig.upiVpa);
    final bankNameCtrl = TextEditingController(text: widget.hotelConfig.bankName);
    final bankAccCtrl = TextEditingController(text: widget.hotelConfig.bankAccount);
    final bankIfscCtrl = TextEditingController(text: widget.hotelConfig.bankIfsc);
    final prefixCtrl = TextEditingController(text: widget.hotelConfig.invoicePrefix);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
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
                        const Text(
                          'Edit Hotel Legal & GST Profile',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const Text(
                      'Changes save to local storage and reflect immediately on all newly generated GST invoices.',
                      style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 16),
                    _buildInput('Trade Name (Hotel Name)', tradeNameCtrl, Icons.storefront_rounded),
                    _buildInput('Legal Entity Name', legalNameCtrl, Icons.business_rounded),
                    _buildInput(
                      'GSTIN (15 characters)',
                      gstinCtrl,
                      Icons.receipt_rounded,
                      textCapitalization: TextCapitalization.characters,
                      helperText: 'e.g. 27AABCG1234H1Z5 (Auto-detects State & PAN)',
                    ),
                    _buildInput('Full Postal Address', addressCtrl, Icons.location_on_rounded, maxLines: 2),
                    _buildInput('Official Phone', phoneCtrl, Icons.phone_rounded, keyboardType: TextInputType.phone),
                    _buildInput('Official Email', emailCtrl, Icons.email_rounded, keyboardType: TextInputType.emailAddress),
                    _buildInput('Merchant UPI VPA', upiCtrl, Icons.qr_code_rounded, helperText: 'e.g. grandheritage@upi'),
                    _buildInput('Bank Name', bankNameCtrl, Icons.account_balance_rounded),
                    _buildInput('Bank Account Number', bankAccCtrl, Icons.credit_card_rounded, keyboardType: TextInputType.number),
                    _buildInput('Bank IFSC Code', bankIfscCtrl, Icons.pin_drop_rounded, textCapitalization: TextCapitalization.characters),
                    _buildInput('Invoice Number Prefix', prefixCtrl, Icons.tag_rounded, textCapitalization: TextCapitalization.characters, helperText: 'e.g. GHI or AYU'),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          final gstin = gstinCtrl.text.trim().toUpperCase();
                          String stateCode = widget.hotelConfig.stateCode;
                          String pan = widget.hotelConfig.pan;
                          if (gstin.length >= 2) {
                            stateCode = gstin.substring(0, 2);
                          }
                          if (gstin.length >= 12) {
                            pan = gstin.substring(2, 12);
                          }

                          final updated = widget.hotelConfig.copyWith(
                            hotelName: tradeNameCtrl.text.trim(),
                            legalName: legalNameCtrl.text.trim(),
                            gstin: gstin,
                            address: addressCtrl.text.trim(),
                            phone: phoneCtrl.text.trim(),
                            email: emailCtrl.text.trim(),
                            upiVpa: upiCtrl.text.trim(),
                            bankName: bankNameCtrl.text.trim(),
                            bankAccount: bankAccCtrl.text.trim(),
                            bankIfsc: bankIfscCtrl.text.trim().toUpperCase(),
                            invoicePrefix: prefixCtrl.text.trim().toUpperCase(),
                            stateCode: stateCode,
                            pan: pan,
                          );

                          StorageService.saveHotelConfig(updated);
                          widget.onConfigChanged(updated);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Hotel profile updated successfully!'),
                              backgroundColor: AppTheme.maroon,
                            ),
                          );
                        },
                        child: const Text('Save Hotel Profile', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
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

  // --- Invoice Stationery & Themes Customizer Modal ---
  void _showStationeryCustomizerModal() {
    String currentTemplate = widget.hotelConfig.selectedTemplate;
    String currentColor = widget.hotelConfig.selectedColor;
    bool showDeity = widget.hotelConfig.showDeity;
    bool showHsnTable = widget.hotelConfig.showHsnTable;
    bool showQr = widget.hotelConfig.showQr;
    bool showStamp = widget.hotelConfig.showStamp;
    String priceMode = widget.hotelConfig.priceMode;

    final shlokaCtrl = TextEditingController(text: widget.hotelConfig.shlokaText);

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
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
                            Icon(Icons.palette_rounded, color: AppTheme.maroon, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Invoice Stationery & Theme Studio',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const Text(
                      'Configure default stationery themes, legal layouts, tax matrices, and invocation banners for all invoices.',
                      style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 14),
                    ThemeStudioBar(
                      selectedTemplate: currentTemplate,
                      onSelectTemplate: (t) => setModalState(() => currentTemplate = t),
                      selectedColor: currentColor,
                      onSelectColor: (c) => setModalState(() => currentColor = c),
                      showDeity: showDeity,
                      onToggleDeity: (val) => setModalState(() => showDeity = val),
                      showHsnTable: showHsnTable,
                      onToggleHsnTable: (val) => setModalState(() => showHsnTable = val),
                      showQr: showQr,
                      onToggleQr: (val) => setModalState(() => showQr = val),
                      showStamp: showStamp,
                      onToggleStamp: (val) => setModalState(() => showStamp = val),
                    ),
                    if (showDeity) ...[
                      const SizedBox(height: 14),
                      TextField(
                        controller: shlokaCtrl,
                        decoration: InputDecoration(
                          labelText: 'Sacred Invocation / Shloka Text',
                          prefixIcon: const Icon(Icons.temple_hindu_rounded, color: AppTheme.gold, size: 20),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ],
                    const SizedBox(height: 14),
                    const Text(
                      'Room Tariff Tax Calculation Preference',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: () => setModalState(() => priceMode = 'inclusive'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                              decoration: BoxDecoration(
                                color: priceMode == 'inclusive' ? AppTheme.maroon.withValues(alpha: 0.1) : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: priceMode == 'inclusive' ? AppTheme.maroon : Colors.grey.shade300,
                                  width: priceMode == 'inclusive' ? 1.5 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    'Tax-Inclusive',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: priceMode == 'inclusive' ? AppTheme.maroon : AppTheme.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text('₹3,500 gross tariff', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                ],
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: InkWell(
                            borderRadius: BorderRadius.circular(10),
                            onTap: () => setModalState(() => priceMode = 'exclusive'),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
                              decoration: BoxDecoration(
                                color: priceMode == 'exclusive' ? AppTheme.maroon.withValues(alpha: 0.1) : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: priceMode == 'exclusive' ? AppTheme.maroon : Colors.grey.shade300,
                                  width: priceMode == 'exclusive' ? 1.5 : 1,
                                ),
                              ),
                              child: Column(
                                children: [
                                  Text(
                                    'Tax-Exclusive',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: priceMode == 'exclusive' ? AppTheme.maroon : AppTheme.ink,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  const Text('₹3,500 + 12% GST', style: TextStyle(fontSize: 10, color: AppTheme.textMuted)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.check_circle_outline_rounded, size: 20),
                        label: const Text('Save Default Stationery & Themes', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          final updated = widget.hotelConfig.copyWith(
                            selectedTemplate: currentTemplate,
                            selectedColor: currentColor,
                            showDeity: showDeity,
                            shlokaText: shlokaCtrl.text.trim(),
                            showHsnTable: showHsnTable,
                            showQr: showQr,
                            showStamp: showStamp,
                            priceMode: priceMode,
                          );
                          StorageService.saveHotelConfig(updated);
                          widget.onConfigChanged(updated);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Default Invoice Stationery & Themes updated!'),
                              backgroundColor: AppTheme.maroon,
                            ),
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

  Widget _buildInput(
    String label,
    TextEditingController controller,
    IconData icon, {
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
    TextCapitalization textCapitalization = TextCapitalization.none,
    String? helperText,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        textCapitalization: textCapitalization,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: const TextStyle(fontSize: 12),
          prefixIcon: Icon(icon, size: 20, color: AppTheme.maroon),
          helperText: helperText,
          helperStyle: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
          filled: true,
          fillColor: Colors.grey.shade50,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderLight)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderLight)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.maroon, width: 1.5)),
        ),
      ),
    );
  }

  // --- Add Staff Account Dialog ---
  void _showAddStaffModal() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final pinCtrl = TextEditingController(text: '1234');
    UserRole selectedRole = UserRole.receptionist;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
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
                        const Text('Add Staff Member', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildInput('Full Name', nameCtrl, Icons.person_rounded),
                    _buildInput('Phone Number', phoneCtrl, Icons.phone_rounded, keyboardType: TextInputType.phone),
                    _buildInput('4-Digit Security PIN', pinCtrl, Icons.pin_rounded, keyboardType: TextInputType.number),
                    const SizedBox(height: 8),
                    const Text('Assign Role & Permissions:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<UserRole>(
                      initialValue: selectedRole,
                      decoration: InputDecoration(
                        filled: true,
                        fillColor: Colors.grey.shade50,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      ),
                      items: const [
                        DropdownMenuItem(value: UserRole.owner, child: Text('Hotel Owner / Admin (Full Access)')),
                        DropdownMenuItem(value: UserRole.manager, child: Text('General Manager (Front Desk + Folios)')),
                        DropdownMenuItem(value: UserRole.receptionist, child: Text('Receptionist (Check-in + Billing)')),
                        DropdownMenuItem(value: UserRole.housekeeper, child: Text('Housekeeper (Room Cleaning Only)')),
                      ],
                      onChanged: (val) {
                        if (val != null) setModalState(() => selectedRole = val);
                      },
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          if (nameCtrl.text.trim().isEmpty) return;
                          String roleTitle = 'Receptionist';
                          if (selectedRole == UserRole.owner) roleTitle = 'Hotel Owner';
                          if (selectedRole == UserRole.manager) roleTitle = 'General Manager';
                          if (selectedRole == UserRole.housekeeper) roleTitle = 'Housekeeping Staff';

                          final newStaff = StaffAccount(
                            id: 'STF-${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}',
                            name: nameCtrl.text.trim(),
                            phone: phoneCtrl.text.trim().isEmpty ? '+91 99999 00000' : phoneCtrl.text.trim(),
                            roleTitle: roleTitle,
                            role: selectedRole,
                            pin: pinCtrl.text.trim().isEmpty ? '1234' : pinCtrl.text.trim(),
                          );

                          final updatedList = List<StaffAccount>.from(widget.staffAccounts)..add(newStaff);
                          StorageService.saveStaffAccounts(updatedList);
                          widget.onStaffAccountsChanged(updatedList);
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Staff account added for ${newStaff.name}!'),
                              backgroundColor: AppTheme.maroon,
                            ),
                          );
                        },
                        child: const Text('Add Staff Member', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
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

  // --- Cloud Sync Config Dialog ---
  void _showCloudSyncModal() {
    final urlCtrl = TextEditingController(text: _supabaseUrl);
    final keyCtrl = TextEditingController(text: _supabaseKey);
    bool activeState = _cloudSyncActive;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
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
                        const Text('Supabase Cloud Sync Settings', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                        IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(ctx)),
                      ],
                    ),
                    const Text(
                      'Connects Mobile Apps & Web Cockpit together so room bookings, billing, and invoices sync across devices.',
                      style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                    ),
                    const SizedBox(height: 16),
                    _buildInput(
                      'Supabase Project URL',
                      urlCtrl,
                      Icons.cloud_outlined,
                      helperText: 'https://xyzcompany.supabase.co',
                    ),
                    Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: TextField(
                        controller: keyCtrl,
                        obscureText: _obscureKey,
                        decoration: InputDecoration(
                          labelText: 'Supabase Anon / Service Key',
                          labelStyle: const TextStyle(fontSize: 12),
                          prefixIcon: const Icon(Icons.key_rounded, size: 20, color: AppTheme.maroon),
                          suffixIcon: IconButton(
                            icon: Icon(_obscureKey ? Icons.visibility_off : Icons.visibility, size: 20),
                            onPressed: () => setModalState(() => _obscureKey = !_obscureKey),
                          ),
                          filled: true,
                          fillColor: Colors.grey.shade50,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Enable Real-Time Cloud Sync', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      subtitle: const Text('When enabled, changes synchronize automatically over the network', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      value: activeState,
                      activeThumbColor: AppTheme.maroon,
                      activeTrackColor: AppTheme.maroon.withValues(alpha: 0.3),
                      onChanged: (val) => setModalState(() => activeState = val),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.maroon,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () async {
                          final url = urlCtrl.text.trim();
                          final key = keyCtrl.text.trim();
                          await StorageService.saveCloudSyncConfig(url, key, activeState);
                          if (!mounted) return;
                          setState(() {
                            _supabaseUrl = url;
                            _supabaseKey = key;
                            _cloudSyncActive = activeState;
                          });
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          _triggerCloudSync();
                        },
                        child: const Text('Save & Test Connection', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
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
    Color roleBadgeColor;
    switch (widget.currentStaff.role) {
      case UserRole.owner:
        roleBadgeColor = AppTheme.maroon;
        break;
      case UserRole.manager:
        roleBadgeColor = Colors.teal;
        break;
      case UserRole.receptionist:
        roleBadgeColor = Colors.blue.shade700;
        break;
      case UserRole.housekeeper:
        roleBadgeColor = Colors.orange.shade800;
        break;
    }

    return Scaffold(
      backgroundColor: AppTheme.paperBg,
      appBar: AppBar(
        title: const Text('Settings & Configuration', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // 1. Current Active Staff Card
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: roleBadgeColor.withValues(alpha: 0.15),
                          child: Icon(Icons.admin_panel_settings_rounded, color: roleBadgeColor, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Active Staff User', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                            Text(widget.currentStaff.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                          ],
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: roleBadgeColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        widget.currentStaff.role.name.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _field('Role Title', widget.currentStaff.roleTitle),
                _field('Phone', widget.currentStaff.phone),
                _field('Security PIN', '••••  (${widget.currentStaff.pin})'),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.maroon,
                      side: const BorderSide(color: AppTheme.maroon),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.swap_horiz_rounded, size: 18),
                    label: const Text('Switch Staff / Admin Position', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                    onPressed: _showRoleSwitcherDialog,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 1.5 Executive Operations Hub Card
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
                const Row(
                  children: [
                    Icon(Icons.dashboard_customize_rounded, color: AppTheme.maroon, size: 22),
                    SizedBox(width: 8),
                    Text('Executive Operations Hub', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 4),
                const Text('Quick access to hotel intelligence, guest directories, and lead pipelines.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.maroon,
                          side: const BorderSide(color: AppTheme.borderLight),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                        icon: const Icon(Icons.analytics_rounded, size: 18),
                        label: const Text('RevPAR Radar', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => OwnerAnalyticsScreen(
                                rooms: widget.rooms,
                                invoices: widget.invoices,
                                hotelConfig: widget.hotelConfig,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppTheme.maroon,
                          side: const BorderSide(color: AppTheme.borderLight),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                        icon: const Icon(Icons.people_alt_rounded, size: 18),
                        label: const Text('Guests 360°', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => GuestsScreen(
                                guests: widget.guests ?? [],
                                onGuestAdded: (g) {
                                  if (widget.onGuestAdded != null) widget.onGuestAdded!(g);
                                },
                                onGuestUpdated: (_) {},
                                hotelConfig: widget.hotelConfig,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.maroon,
                      side: const BorderSide(color: AppTheme.borderLight),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.mark_chat_unread_rounded, size: 18),
                    label: const Text('Enquiries & Lead Pipeline', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => EnquiryScreen(
                            inquiries: widget.inquiries,
                            onAddInquiry: (inq) {
                              if (widget.onAddInquiry != null) widget.onAddInquiry!(inq);
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2. Hotel Legal & GST Identity Card (Editable)
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.storefront_rounded, color: AppTheme.maroon, size: 22),
                        SizedBox(width: 8),
                        Text('Hotel Legal & GST Identity', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.edit_rounded, color: AppTheme.maroon, size: 20),
                      onPressed: _showEditHotelProfileModal,
                      tooltip: 'Edit Hotel Details',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _field('Trade Name', widget.hotelConfig.hotelName),
                _field('Legal Entity', widget.hotelConfig.legalName),
                _field('GSTIN', '${widget.hotelConfig.gstin} (${widget.hotelConfig.stateName})'),
                _field('PAN', widget.hotelConfig.pan),
                _field('Address', widget.hotelConfig.address),
                _field('Official Phone', widget.hotelConfig.phone),
                _field('Official Email', widget.hotelConfig.email),
                _field('Merchant UPI VPA', widget.hotelConfig.upiVpa),
                _field('Bank Details', '${widget.hotelConfig.bankName} · ${widget.hotelConfig.bankAccount} (IFSC: ${widget.hotelConfig.bankIfsc})'),
                _field('Invoice Prefix', widget.hotelConfig.invoicePrefix),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.surfaceWarm,
                      foregroundColor: AppTheme.maroon,
                      elevation: 0,
                      side: const BorderSide(color: AppTheme.borderLight),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.edit_note_rounded, size: 18),
                    label: const Text('Edit Hotel & Invoice Profile', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                    onPressed: _showEditHotelProfileModal,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2.5 Invoice Stationery & Theme Studio Card
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.palette_rounded, color: AppTheme.gold, size: 22),
                        SizedBox(width: 8),
                        Text('Invoice Stationery & Themes', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.tune_rounded, color: AppTheme.maroon, size: 20),
                      onPressed: _showStationeryCustomizerModal,
                      tooltip: 'Customize Themes',
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                _field(
                  'Default Template',
                  TEMPLATE_DEFINITIONS.firstWhere(
                    (t) => t.id == widget.hotelConfig.selectedTemplate,
                    orElse: () => TEMPLATE_DEFINITIONS.first,
                  ).name,
                ),
                _field(
                  'Color Palette',
                  '${getThemePalette(widget.hotelConfig.selectedColor).name} (${getThemePalette(widget.hotelConfig.selectedColor).hindiName})',
                ),
                _field(
                  'Ganesha Invocation',
                  widget.hotelConfig.showDeity ? widget.hotelConfig.shlokaText : 'Hidden',
                ),
                _field(
                  'CBIC 8-Col HSN Matrix',
                  widget.hotelConfig.showHsnTable ? 'Enabled (Statutory Rule 46)' : 'Summary Only',
                ),
                _field(
                  'Dynamic UPI QR',
                  widget.hotelConfig.showQr ? 'Active (${widget.hotelConfig.upiVpa})' : 'Disabled',
                ),
                _field(
                  'Authorized Stamp/Seal',
                  widget.hotelConfig.showStamp ? 'Enabled' : 'Disabled',
                ),
                _field(
                  'Pricing Logic',
                  widget.hotelConfig.priceMode == 'inclusive'
                      ? 'Tax-Inclusive (Hospitality Standard)'
                      : 'Tax-Exclusive (Plus GST)',
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.surfaceWarm,
                      foregroundColor: AppTheme.maroon,
                      elevation: 0,
                      side: const BorderSide(color: AppTheme.borderLight),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.style_rounded, size: 18),
                    label: const Text('Customize Invoice Themes & Layout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                    onPressed: _showStationeryCustomizerModal,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 2.5 Digital Print Assets (Counter Standee QR, Stamp, Signature)
          _buildDigitalAssetsCard(),

          const SizedBox(height: 16),

          // 3. Team & Staff Accounts Management Card
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.badge_rounded, color: AppTheme.gold, size: 22),
                        SizedBox(width: 8),
                        Text('Staff Accounts & Access', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.add_rounded, size: 18),
                      label: const Text('Add Staff', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      onPressed: _showAddStaffModal,
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Manage personnel accounts and assign roles for role-based permissions.',
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 12),
                ...widget.staffAccounts.map((staff) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppTheme.surfaceWarm.withValues(alpha: 0.5),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.borderLight),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(staff.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                              Text('${staff.roleTitle} · PIN: ${staff.pin}', style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade200,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            staff.role.name.toUpperCase(),
                            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.ink),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 4. Supabase Cloud Sync Card
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.cloud_sync_rounded, color: Colors.blue, size: 22),
                        SizedBox(width: 8),
                        Text('Supabase Real-Time Sync', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.settings_outlined, size: 20),
                      onPressed: _showCloudSyncModal,
                      tooltip: 'Configure Supabase',
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Connects this mobile device directly to your Supabase backend so Web Cockpit and Mobile Apps stay updated in real time.',
                  style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      width: 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: _cloudSyncActive ? AppTheme.greenSuccess : Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _cloudSyncActive ? 'Cloud Sync Enabled' : 'Local Offline Mode (Default)',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  'Last Synced: ${CloudSyncService.lastSyncTime}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.maroon,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: _isSyncing
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.sync_rounded, size: 18),
                    label: Text(_isSyncing ? 'Syncing...' : 'Sync Now with Cloud', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                    onPressed: _isSyncing ? null : _triggerCloudSync,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 5. Native Permissions Card
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
                const Row(
                  children: [
                    Icon(Icons.security_rounded, color: AppTheme.gold, size: 22),
                    SizedBox(width: 8),
                    Text('Android Native Permissions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                _permTile(
                  'Push Notifications',
                  'Used for check-in alarms and guest arrival alerts.',
                  _permissions['notification'] ?? false,
                  _requestNotification,
                ),
                const Divider(height: 16),
                _permTile(
                  'Storage & PDF Export',
                  'Allows writing and sharing PDF invoices to external storage.',
                  _permissions['storage'] ?? false,
                  _requestStorage,
                ),
                const Divider(height: 16),
                _permTile(
                  'Internet & Syncing',
                  'Active network access for live GST and UPI synchronization.',
                  true,
                  null,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // 6. Technical Specs Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.surfaceWarm,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.borderLight),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Ayushmaan OS Flutter Edition', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.maroon)),
                SizedBox(height: 4),
                Text('Version: 2.4.0 (Flutter 3.44.6 / Dart 3.12.2)', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                Text('Engine: Native Vector PDF + ESC/POS 80mm Thermal Receipt · 100% Offline CBIC GST 2026', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                Text('Sync Engine: Supabase REST + Offline-First SharedPreferences Cache', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                Text('Platform: Pure Native Flutter Android APK (Zero WebView Latency)', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _field(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(fontSize: 11.5, color: AppTheme.textMuted)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.ink)),
          ),
        ],
      ),
    );
  }

  Widget _permTile(String title, String desc, bool isGranted, VoidCallback? onRequest) {
    return Row(
      children: [
        Icon(
          isGranted ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
          color: isGranted ? AppTheme.greenSuccess : AppTheme.textMuted,
          size: 20,
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.ink)),
              Text(desc, style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
            ],
          ),
        ),
        if (!isGranted && onRequest != null)
          TextButton(
            onPressed: onRequest,
            child: const Text('Enable', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
          ),
      ],
    );
  }

  Future<void> _pickAssetImage({
    required String assetType,
    required ImageSource source,
  }) async {
    try {
      final picker = ImagePicker();
      final XFile? pickedFile = await picker.pickImage(
        source: source,
        maxWidth: 600,
        maxHeight: 600,
        imageQuality: 82,
      );
      if (pickedFile == null) return;

      final bytes = await pickedFile.readAsBytes();
      final base64Str = base64Encode(bytes);

      HotelConfig updated;
      String successMsg;
      if (assetType == 'qr') {
        updated = widget.hotelConfig.copyWith(customQrBase64: base64Str);
        successMsg = 'Counter Standee QR image updated successfully!';
      } else if (assetType == 'stamp') {
        updated = widget.hotelConfig.copyWith(stampBase64: base64Str);
        successMsg = 'Official hotel stamp updated successfully!';
      } else {
        updated = widget.hotelConfig.copyWith(signatureBase64: base64Str);
        successMsg = 'Authorized signature updated successfully!';
      }

      await StorageService.saveHotelConfig(updated);
      widget.onConfigChanged(updated);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(successMsg),
            backgroundColor: AppTheme.greenSuccess,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to pick image: $e'),
            backgroundColor: AppTheme.alertRed,
          ),
        );
      }
    }
  }

  Future<void> _removeAssetImage(String assetType) async {
    HotelConfig updated;
    String msg;
    if (assetType == 'qr') {
      updated = widget.hotelConfig.copyWith(clearCustomQr: true);
      msg = 'Counter Standee QR removed. Dynamic vector UPI QR restored.';
    } else if (assetType == 'stamp') {
      updated = widget.hotelConfig.copyWith(clearStamp: true);
      msg = 'Custom stamp removed.';
    } else {
      updated = widget.hotelConfig.copyWith(clearSignature: true);
      msg = 'Custom signature removed.';
    }

    await StorageService.saveHotelConfig(updated);
    widget.onConfigChanged(updated);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(msg),
          backgroundColor: AppTheme.maroon,
        ),
      );
    }
  }

  Widget _buildImageThumbnail(String base64Str) {
    try {
      final clean = base64Str.contains(',') ? base64Str.split(',').last : base64Str;
      final bytes = base64Decode(clean);
      return ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: Image.memory(
          bytes,
          width: 58,
          height: 58,
          fit: BoxFit.cover,
        ),
      );
    } catch (_) {
      return const Icon(Icons.broken_image_rounded, size: 36, color: AppTheme.alertRed);
    }
  }

  void _showFullImagePreview(String title, String base64Str) {
    try {
      final clean = base64Str.contains(',') ? base64Str.split(',').last : base64Str;
      final bytes = base64Decode(clean);
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.memory(bytes, fit: BoxFit.contain),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (_) {}
  }

  Widget _buildAssetTile({
    required String title,
    required String hindiTitle,
    required String description,
    required String badgeText,
    required Color badgeColor,
    required Widget previewWidget,
    required bool hasCustomImage,
    required VoidCallback onPickCamera,
    required VoidCallback onPickGallery,
    required VoidCallback onRemove,
    String? base64ForPreview,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            GestureDetector(
              onTap: base64ForPreview != null ? () => _showFullImagePreview(title, base64ForPreview) : null,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  border: Border.all(color: AppTheme.borderLight),
                  borderRadius: BorderRadius.circular(10),
                  color: Colors.white,
                ),
                child: previewWidget,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          '$title ($hindiTitle)',
                          style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppTheme.ink),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: badgeColor.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          badgeText,
                          style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.bold, color: badgeColor),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 3),
                  Text(description, style: const TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: const Size(0, 30),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.camera_alt_rounded, size: 14, color: AppTheme.maroon),
                        label: const Text('Camera', style: TextStyle(fontSize: 11, color: AppTheme.maroon)),
                        onPressed: onPickCamera,
                      ),
                      const SizedBox(width: 6),
                      OutlinedButton.icon(
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          minimumSize: const Size(0, 30),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        icon: const Icon(Icons.photo_library_rounded, size: 14, color: AppTheme.ink),
                        label: const Text('Gallery', style: TextStyle(fontSize: 11, color: AppTheme.ink)),
                        onPressed: onPickGallery,
                      ),
                      if (hasCustomImage) ...[
                        const SizedBox(width: 6),
                        TextButton.icon(
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                            minimumSize: const Size(0, 30),
                          ),
                          icon: const Icon(Icons.delete_outline_rounded, size: 14, color: AppTheme.alertRed),
                          label: const Text('Clear', style: TextStyle(fontSize: 11, color: AppTheme.alertRed)),
                          onPressed: onRemove,
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDigitalAssetsCard() {
    final cfg = widget.hotelConfig;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
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
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.maroon.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.qr_code_scanner_rounded, color: AppTheme.maroon, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Print Assets & Standee QR', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.ink)),
                      Text('Standee QR · Rubber Stamp · Manager Signature', style: TextStyle(fontSize: 10.5, color: AppTheme.textMuted)),
                    ],
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Asset 1: Counter Standee QR
          _buildAssetTile(
            title: 'Counter Standee QR',
            hindiTitle: 'काउंटर स्टैंडी क्यूआर',
            description: 'Photo of PhonePe, Google Pay, or Paytm standee printed on invoices.',
            badgeText: cfg.customQrBase64 != null ? 'Standee Image Active' : 'Dynamic Vector QR',
            badgeColor: cfg.customQrBase64 != null ? AppTheme.greenSuccess : Colors.blue.shade700,
            previewWidget: cfg.customQrBase64 != null
                ? _buildImageThumbnail(cfg.customQrBase64!)
                : QrImageView(
                    data: 'upi://pay?pa=${cfg.upiVpa}&pn=${Uri.encodeComponent(cfg.merchantName)}',
                    version: QrVersions.auto,
                    size: 58,
                  ),
            hasCustomImage: cfg.customQrBase64 != null,
            onPickCamera: () => _pickAssetImage(assetType: 'qr', source: ImageSource.camera),
            onPickGallery: () => _pickAssetImage(assetType: 'qr', source: ImageSource.gallery),
            onRemove: () => _removeAssetImage('qr'),
            base64ForPreview: cfg.customQrBase64,
          ),

          const Divider(height: 24),

          // Asset 2: Official Rubber Stamp
          _buildAssetTile(
            title: 'Official Stamp & Seal',
            hindiTitle: 'होटल की रबर मुहर',
            description: 'Circular or rectangular hotel seal on white paper to imprint on invoices.',
            badgeText: cfg.stampBase64 != null ? 'Custom Stamp Attached' : 'Default Text Seal',
            badgeColor: cfg.stampBase64 != null ? AppTheme.greenSuccess : AppTheme.textMuted,
            previewWidget: cfg.stampBase64 != null
                ? _buildImageThumbnail(cfg.stampBase64!)
                : Container(
                    width: 58,
                    height: 58,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.maroon.withValues(alpha: 0.5), width: 1.5),
                      borderRadius: BorderRadius.circular(8),
                      color: AppTheme.surfaceWarm,
                    ),
                    child: const Center(
                      child: Text('OFFICIAL\nSTAMP', textAlign: TextAlign.center, style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: AppTheme.maroon)),
                    ),
                  ),
            hasCustomImage: cfg.stampBase64 != null,
            onPickCamera: () => _pickAssetImage(assetType: 'stamp', source: ImageSource.camera),
            onPickGallery: () => _pickAssetImage(assetType: 'stamp', source: ImageSource.gallery),
            onRemove: () => _removeAssetImage('stamp'),
            base64ForPreview: cfg.stampBase64,
          ),

          const Divider(height: 24),

          // Asset 3: Authorized Signature
          _buildAssetTile(
            title: 'Authorized Signature',
            hindiTitle: 'अधिकृत हस्ताक्षर',
            description: 'Signature of manager/proprietor to print above "Authorized Signatory".',
            badgeText: cfg.signatureBase64 != null ? 'Signature Attached' : 'Default Text Line',
            badgeColor: cfg.signatureBase64 != null ? AppTheme.greenSuccess : AppTheme.textMuted,
            previewWidget: cfg.signatureBase64 != null
                ? _buildImageThumbnail(cfg.signatureBase64!)
                : Container(
                    width: 58,
                    height: 38,
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.borderLight),
                      borderRadius: BorderRadius.circular(6),
                      color: Colors.grey.shade50,
                    ),
                    child: const Center(
                      child: Text('— Sign —', style: TextStyle(fontSize: 10, fontStyle: FontStyle.italic, color: AppTheme.textMuted)),
                    ),
                  ),
            hasCustomImage: cfg.signatureBase64 != null,
            onPickCamera: () => _pickAssetImage(assetType: 'signature', source: ImageSource.camera),
            onPickGallery: () => _pickAssetImage(assetType: 'signature', source: ImageSource.gallery),
            onRemove: () => _removeAssetImage('signature'),
            base64ForPreview: cfg.signatureBase64,
          ),
        ],
      ),
    );
  }
}
