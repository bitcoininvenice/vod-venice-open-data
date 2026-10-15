import 'package:flutter_test/flutter_test.dart';
import '../lib/l10n/app_localizations.dart';
import '../lib/models/actv_departure.dart';
import '../theme/app_theme.dart';

void main() {
  group('Time Formatting & Localization Tests', () {
    test('Verifica dizionario di localizzazione IT ed EN', () {
      final l10nIt = AppLocalizations('it');
      final l10nEn = AppLocalizations('en');

      expect(l10nIt.text('tab_today'), 'Oggi');
      expect(l10nEn.text('tab_today'), 'Today');

      expect(l10nIt.text('route_safe_tide'), contains('asciutto'));
      expect(l10nEn.text('route_safe_tide'), contains('Dry'));
    });

    test('Calcolo etichette partenze battelli', () {
      final l10n = AppLocalizations('it');

      final depNow = ActvDeparture(
        lineCode: '2',
        destination: 'Rialto',
        pier: 'D',
        minutesRemaining: 0,
        scheduledTime: '09:40',
        badgeColor: AppTheme.actvLine2,
      );

      final depLater = ActvDeparture(
        lineCode: '1',
        destination: 'Lido',
        pier: 'E',
        minutesRemaining: 8,
        scheduledTime: '09:48',
        badgeColor: AppTheme.actvLine1,
      );

      final labelNow = depNow.minutesRemaining <= 0
          ? l10n.text('now_arriving')
          : '${depNow.minutesRemaining} ${l10n.text('min_remaining')}';

      final labelLater = depLater.minutesRemaining <= 0
          ? l10n.text('now_arriving')
          : '${depLater.minutesRemaining} ${l10n.text('min_remaining')}';

      expect(labelNow, 'In arrivo');
      expect(labelLater, '8 min');
    });
  });
}
