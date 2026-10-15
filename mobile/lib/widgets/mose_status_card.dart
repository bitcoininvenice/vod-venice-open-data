import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../models/tide.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Card informativa sullo stato operativo delle barriere del MOSE
class MoseStatusCard extends StatelessWidget {
  final List<MoseGateItem> gates;
  final String locale;

  const MoseStatusCard({
    super.key,
    required this.gates,
    required this.locale,
  });

  Future<void> _openVodSimulator() async {
    final uri = Uri.parse('https://venice-open-data.vercel.app');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations(locale);
    final bool anyActive = gates.any((g) => g.status == 'ATTIVO' || g.barriersUp > 0);

    return Container(
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.text('mose_section_title').toUpperCase(),
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
                  color: anyActive
                      ? AppTheme.tideSustained.withOpacity(0.12)
                      : AppTheme.tideNormal.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(AppTheme.chipRadius),
                ),
                child: Text(
                  anyActive
                      ? l10n.text('mose_status_active')
                      : l10n.text('mose_status_rest'),
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: anyActive ? AppTheme.tideSustained : AppTheme.tideNormal,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Griglia delle 4 bocche di porto
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: gates.map((gate) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: AppTheme.backgroundLight,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  '${gate.name}: ${gate.status == "ATTIVO" ? "Attivo" : "Riposo"}',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppTheme.textMain,
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          // Spiegazione breve divulgativa
          Text(
            l10n.text('mose_explanation'),
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.textMuted,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),

          // Link al simulatore VOD Web
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: _openVodSimulator,
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: AppTheme.primaryBlue),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.buttonRadius),
                ),
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: Text(
                l10n.text('open_vod_simulator'),
                style: const TextStyle(
                  color: AppTheme.primaryBlue,
                  fontWeight: FontWeight.w700,
                  fontSize: 12,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
