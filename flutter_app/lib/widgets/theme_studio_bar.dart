import 'package:flutter/material.dart';
import '../models/hotel_models.dart';
import '../theme/app_theme.dart';

class ThemeStudioBar extends StatelessWidget {
  final String selectedTemplate;
  final Function(String) onSelectTemplate;
  final String selectedColor;
  final Function(String) onSelectColor;
  final bool showDeity;
  final Function(bool)? onToggleDeity;
  final bool showHsnTable;
  final Function(bool)? onToggleHsnTable;
  final bool showQr;
  final Function(bool)? onToggleQr;
  final bool showStamp;
  final Function(bool)? onToggleStamp;

  const ThemeStudioBar({
    super.key,
    required this.selectedTemplate,
    required this.onSelectTemplate,
    required this.selectedColor,
    required this.onSelectColor,
    this.showDeity = true,
    this.onToggleDeity,
    this.showHsnTable = true,
    this.onToggleHsnTable,
    this.showQr = true,
    this.onToggleQr,
    this.showStamp = true,
    this.onToggleStamp,
  });

  @override
  Widget build(BuildContext context) {
    final isThermal = selectedTemplate == 'thermal-80mm';
    final activePalette = getThemePalette(selectedColor);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Template Layout Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.layers_rounded, size: 16, color: AppTheme.maroon),
                  SizedBox(width: 6),
                  Text(
                    'BILL LAYOUT TEMPLATES',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: AppTheme.ink),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceWarm,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'BillBook Style Studio',
                  style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: AppTheme.maroon),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Template Cards Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: TEMPLATE_DEFINITIONS.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 2.1,
            ),
            itemBuilder: (ctx, idx) {
              final tmpl = TEMPLATE_DEFINITIONS[idx];
              final isSelected = selectedTemplate == tmpl.id;

              return InkWell(
                onTap: () => onSelectTemplate(tmpl.id),
                borderRadius: BorderRadius.circular(10),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? Color(activePalette.primaryLight) : AppTheme.paperBg,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: isSelected ? Color(activePalette.primary) : AppTheme.borderLight,
                      width: isSelected ? 1.5 : 1.0,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: Text(
                              tmpl.name,
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.bold,
                                color: isSelected ? Color(activePalette.primaryDark) : AppTheme.ink,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (isSelected)
                            Icon(Icons.check_circle_rounded, size: 14, color: Color(activePalette.primary)),
                        ],
                      ),
                      Text(
                        tmpl.hindiName,
                        style: TextStyle(fontSize: 9.5, color: isSelected ? Color(activePalette.primary) : AppTheme.textMuted),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        tmpl.badge,
                        style: TextStyle(
                          fontSize: 7.5,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                          color: isSelected ? Color(activePalette.primaryDark) : Colors.grey.shade500,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          // 2. Color Palette Swatches (Disabled in Thermal Mode)
          if (!isThermal) ...[
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.palette_rounded, size: 16, color: AppTheme.gold),
                    SizedBox(width: 6),
                    Text(
                      'THEME COLOR PALETTE',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 0.8, color: AppTheme.ink),
                    ),
                  ],
                ),
                Text(
                  activePalette.name,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(activePalette.primary)),
                ),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: THEME_COLOR_PALETTES.keys.map((cKey) {
                  final pal = THEME_COLOR_PALETTES[cKey]!;
                  final isSel = selectedColor == cKey;

                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      onTap: () => onSelectColor(cKey),
                      borderRadius: BorderRadius.circular(10),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isSel ? Colors.black : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: isSel ? Colors.black : AppTheme.borderLight),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 14,
                              height: 14,
                              decoration: BoxDecoration(
                                color: Color(pal.primary),
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 1.5),
                              ),
                              child: isSel
                                  ? const Icon(Icons.check, size: 9, color: Colors.white)
                                  : null,
                            ),
                            const SizedBox(width: 6),
                            Text(
                              pal.name,
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: isSel ? Colors.white : AppTheme.ink,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ],

          // 3. Statutory & Brand Feature Toggles
          if (!isThermal) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 6,
              children: [
                if (onToggleDeity != null)
                  _buildToggleChip(
                    label: 'Ganesha Arch',
                    isActive: showDeity,
                    icon: Icons.temple_hindu_rounded,
                    activeColor: Colors.amber.shade800,
                    onTap: () => onToggleDeity!(!showDeity),
                  ),
                if (onToggleHsnTable != null)
                  _buildToggleChip(
                    label: 'CBIC 8-Col HSN',
                    isActive: showHsnTable,
                    icon: Icons.table_chart_rounded,
                    activeColor: Colors.teal.shade800,
                    onTap: () => onToggleHsnTable!(!showHsnTable),
                  ),
                if (onToggleQr != null)
                  _buildToggleChip(
                    label: 'UPI QR',
                    isActive: showQr,
                    icon: Icons.qr_code_rounded,
                    activeColor: Colors.blue.shade800,
                    onTap: () => onToggleQr!(!showQr),
                  ),
                if (onToggleStamp != null)
                  _buildToggleChip(
                    label: 'Seal & Sign',
                    isActive: showStamp,
                    icon: Icons.verified_rounded,
                    activeColor: Colors.purple.shade800,
                    onTap: () => onToggleStamp!(!showStamp),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildToggleChip({
    required String label,
    required bool isActive,
    required IconData icon,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
        decoration: BoxDecoration(
          color: isActive ? activeColor.withValues(alpha: 0.12) : AppTheme.paperBg,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isActive ? activeColor : AppTheme.borderLight,
            width: isActive ? 1.2 : 0.8,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 13, color: isActive ? activeColor : AppTheme.textMuted),
            const SizedBox(width: 4),
            Text(
              '$label (${isActive ? 'ON' : 'OFF'})',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: isActive ? activeColor : AppTheme.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
