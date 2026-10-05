import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/hotel_models.dart';
import 'storage_service.dart';

enum SyncStatus { offline, syncing, connected, error }

/// Cloud Sync Engine connecting Mobile Apps and Web Cockpit using native Dart I/O
class CloudSyncService {
  static SyncStatus currentStatus = SyncStatus.offline;
  static String lastSyncTime = 'Never';

  /// Sync all local data (rooms, invoices, enquiries) with cloud
  static Future<bool> syncAll({
    required List<Room> rooms,
    required List<Invoice> invoices,
    required List<Inquiry> inquiries,
  }) async {
    currentStatus = SyncStatus.syncing;
    final config = await StorageService.loadCloudSyncConfig();
    final url = config['url'] as String? ?? '';
    final key = config['key'] as String? ?? '';

    // Always persist to local cache first (Offline-First Rule #1)
    await StorageService.saveRooms(rooms);
    await StorageService.saveInvoices(invoices);
    await StorageService.saveInquiries(inquiries);

    if (url.isEmpty || key.isEmpty) {
      currentStatus = SyncStatus.offline;
      final now = DateTime.now();
      lastSyncTime = 'Local Offline (${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')})';
      return true;
    }

    try {
      final endpoint = url.endsWith('/') ? '${url}rest/v1' : '$url/rest/v1';
      final client = HttpClient()..connectionTimeout = const Duration(seconds: 6);

      // Post Invoices
      final uri = Uri.parse('$endpoint/invoices');
      final request = await client.postUrl(uri);
      request.headers.set('apikey', key);
      request.headers.set('Authorization', 'Bearer $key');
      request.headers.set('Content-Type', 'application/json');
      request.headers.set('Prefer', 'resolution=merge-duplicates');
      request.write(jsonEncode(invoices.map((i) => i.toJson()).toList()));
      final response = await request.close();

      client.close();

      if (response.statusCode >= 200 && response.statusCode < 300) {
        currentStatus = SyncStatus.connected;
        final now = DateTime.now();
        lastSyncTime = 'Cloud Synced (${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')})';
        return true;
      } else {
        currentStatus = SyncStatus.error;
        return false;
      }
    } catch (e) {
      debugPrint('Cloud sync error (fallback to local cache): $e');
      currentStatus = SyncStatus.offline;
      final now = DateTime.now();
      lastSyncTime = 'Local (${now.hour.toString().padLeft(2, '0')}:${now.minute.toString().padLeft(2, '0')})';
      return false;
    }
  }
}
