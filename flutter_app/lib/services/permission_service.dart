import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

class PermissionService {
  static Future<Map<String, bool>> checkAllPermissions() async {
    if (kIsWeb) {
      return {'notification': true, 'storage': true, 'internet': true};
    }

    final notifStatus = await Permission.notification.status;
    final storageStatus = await Permission.storage.status;
    final photosStatus = await Permission.photos.status;

    return {
      'notification': notifStatus.isGranted,
      'storage': storageStatus.isGranted || photosStatus.isGranted,
      'internet': true, // Normal permission on Android, granted automatically
    };
  }

  static Future<bool> requestNotificationPermission() async {
    if (kIsWeb) return true;
    final status = await Permission.notification.request();
    return status.isGranted;
  }

  static Future<bool> requestStoragePermission() async {
    if (kIsWeb) return true;
    final status = await Permission.storage.request();
    if (!status.isGranted) {
      final photosStatus = await Permission.photos.request();
      return photosStatus.isGranted;
    }
    return status.isGranted;
  }

  static Future<bool> requestAllOnboardingPermissions() async {
    if (kIsWeb) return true;
    final notif = await Permission.notification.request();
    final storage = await Permission.storage.request();
    return notif.isGranted || storage.isGranted;
  }
}
