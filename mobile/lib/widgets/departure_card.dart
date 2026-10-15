import 'package:flutter/material.dart';
import '../models/actv_departure.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Card singola partenza per battelli ACTV e Alilaguna
class DepartureCard extends StatelessWidget {
  final ActvDeparture departure;
  final String locale;

  const DepartureCard({
    super.key,
    required this.departure,
    required this.locale,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations(locale);
    final isUrgent = departure.minutesRemaining <= 3;

    return Container(
      decoration: BoxDecoration(
        color: AppTheme.surfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.borderLight),
        boxShadow: AppTheme.softShadow,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          // Badge Linea con colore ufficiale
          Container(
            constraints: const BoxConstraints(minWidth: 32, minHeight: 28),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: departure.badgeColor,
              borderRadius: BorderRadius.circular(6),
            ),
            alignment: Alignment.center,
            child: Text(
              departure.lineCode,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Destinazione e pontile
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  departure.destination,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textMain,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundLight,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Text(
                        '${l10n.text('pier_label')} ${departure.pier}',
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textMain,
                        ),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      departure.isRealtime
                          ? l10n.text('live_indicator')
                          : l10n.text('scheduled_indicator'),
                      style: TextStyle(
                        fontSize: 11,
                        color: departure.isRealtime ? AppTheme.primaryBlue : AppTheme.textMuted,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Countdown minuti e orario previsto
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                departure.minutesRemaining <= 0
                    ? l10n.text('now_arriving')
                    : '${departure.minutesRemaining} ${l10n.text('min_remaining')}',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: isUrgent ? AppTheme.actvLine2 : AppTheme.textMain,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                departure.scheduledTime,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
