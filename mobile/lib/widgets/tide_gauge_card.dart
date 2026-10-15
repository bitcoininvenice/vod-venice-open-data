import 'package:flutter/material.dart';
import '../models/tide.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Card principale della marea per la Home e per il Tab Acqua
class TideGaugeCard extends StatelessWidget {
  final TideData tide;
  final String locale;
  final VoidCallback? onTap;

  const TideGaugeCard({
    super.key,
    required this.tide,
    required this.locale,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations(locale);
    final level = tide.reference.levelCm;
    final statusColor = AppTheme.getTideColor(level);

    // Identifica il prossimo colmo (max) e il prossimo minimo (min)
    TideForecastExtreme? nextMax;
    TideForecastExtreme? nextMin;
    for (final ext in tide.extremes) {
      if (nextMax == null && ext.type == 'max') nextMax = ext;
      if (nextMin == null && ext.type == 'min') nextMin = ext;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.cardRadius),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surfaceLight,
          borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          border: Border.all(color: AppTheme.borderLight),
          boxShadow: AppTheme.softShadow,
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Intestazione con Stazione e Pill Stato CPSM
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  tide.reference.name.toUpperCase(),
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                    color: AppTheme.textMuted,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(AppTheme.chipRadius),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    _getCategoryLabel(tide.category, l10n),
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: statusColor,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Livello Grande in centimetri
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Text(
                  level >= 0 ? '+$level' : '$level',
                  style: const TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textMain,
                    letterSpacing: -1.5,
                  ),
                ),
                const SizedBox(width: 8),
                const Text(
                  'cm ZMPS',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMuted,
                  ),
                ),
                const Spacer(),
                if (tide.isOffline)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      'Offline',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.amber,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppTheme.borderLight),
            const SizedBox(height: 12),

            // Previsioni colmo e minimo
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.text('next_peak'),
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        nextMax != null
                            ? '+${nextMax.levelCm} cm (${nextMax.at})'
                            : '+92 cm (21:30)',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMain,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(width: 1, height: 28, color: AppTheme.borderLight),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.text('next_minimum'),
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        nextMin != null
                            ? '+${nextMin.levelCm} cm (${nextMin.at})'
                            : '+15 cm (03:45)',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMain,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getCategoryLabel(String cat, AppLocalizations l10n) {
    switch (cat.toUpperCase()) {
      case 'SOSTENUTA':
        return l10n.text('tide_category_sustained');
      case 'MOLTO_SOSTENUTA':
        return l10n.text('tide_category_very_sustained');
      case 'ECCEZIONALE':
        return l10n.text('tide_category_exceptional');
      default:
        return l10n.text('tide_category_normal');
    }
  }
}
