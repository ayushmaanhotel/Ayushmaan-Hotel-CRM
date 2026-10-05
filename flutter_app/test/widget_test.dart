import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ayushman_hotel_flutter/main.dart';

void main() {
  testWidgets('Ayushman Hotel App smoke test', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    // Build our app and trigger a frame.
    await tester.pumpWidget(const AyushmanHotelApp());
    await tester.pumpAndSettle();

    // Verify that the title or brand is rendered.
    expect(find.text('Front Desk & Operations'), findsOneWidget);
    expect(find.text('Invoices'), findsWidgets);
  });
}
