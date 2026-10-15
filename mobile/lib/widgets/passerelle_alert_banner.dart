import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Banner contestuale di allerta marea e passerelle per la schermata Oggi
class PasserelleAlertBanner extends StatelessWidget {
  final int tideLevelCm;
  final String locale;
  final VoidCallback? onOpenPasserelle;

  const PasserelleAlertBanner({
    super.key,
    required this.tideLevelCm,
    required this.locale,
    this.onOpenPasserelle,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations(locale);
    final bool isDry = tideLevelCm < 80;

    final bgColor = isDry ? const Color(0xFFF0FDF4) : const Color(0xFFFEF3C7);
    final borderColor = isDry ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A);
    final textColor = isDry ? const Color(0xFF166534) : const Color(0xFF92400E);
    final dotColor = isDry ? AppTheme.tideNormal : AppTheme.tideSustained;

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              isDry
                  ? l10n.text('feet_dry_all')
                  : l10n.text('feet_wet_warning'),
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: textColor,
              ),
            ),
          ),
          if (!isDry) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onOpenPasserelle,
              child: Text(
                l10n.text('open_passerelle_map'),
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.primaryBlue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
