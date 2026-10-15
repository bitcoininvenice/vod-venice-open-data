import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../providers/app_state_providers.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../widgets/tide_gauge_card.dart';
import '../widgets/passerelle_alert_banner.dart';
import '../widgets/departure_card.dart';
import '../services/actv_service.dart';

/// Schermata Home "Oggi": la killer screen da 3 secondi.
/// Risponde subito a: marea attuale, rischio piedi bagnati e prossimo battello.
class HomeTodayScreen extends ConsumerWidget {
  final Function(int) onNavigateTab;

  const HomeTodayScreen({
    super.key,
    required this.onNavigateTab,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations(locale);
    final tideAsync = ref.watch(tideDataProvider);
    final homeDeparturesAsync = ref.watch(homeDeparturesProvider);
    final favoriteIds = ref.watch(favoriteStopsProvider);

    final now = DateTime.now();
    final dateFormatted = DateFormat('EEEE d MMMM', locale).format(now);

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              dateFormatted[0].toUpperCase() + dateFormatted.substring(1),
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
            ),
            const SizedBox(height: 2),
            Text(
              l10n.text('today_title'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppTheme.textMain),
            ),
          ],
        ),
        actions: [
          // Switch Lingua IT / EN
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: ActionChip(
              label: Text(
                locale.toUpperCase(),
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppTheme.primaryBlue),
              ),
              backgroundColor: AppTheme.backgroundLight,
              side: const BorderSide(color: AppTheme.borderLight),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              onPressed: () {
                ref.read(localeProvider.notifier).toggle();
              },
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(tideDataProvider);
          ref.invalidate(homeDeparturesProvider);
        },
        color: AppTheme.primaryBlue,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. CARD MAREA CPSM
            tideAsync.when(
              data: (tide) => Column(
                children: [
                  TideGaugeCard(
                    tide: tide,
                    locale: locale,
                    onTap: () => onNavigateTab(2), // Tab Acqua
                  ),
                  const SizedBox(height: 12),
                  // 2. BANNER PASSERELLE / STATO PIEDI ASCIUTTI
                  PasserelleAlertBanner(
                    tideLevelCm: tide.reference.levelCm,
                    locale: locale,
                    onOpenPasserelle: () => onNavigateTab(2),
                  ),
                ],
              ),
              loading: () => Container(
                height: 160,
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                alignment: Alignment.center,
                child: const CircularProgressIndicator(color: AppTheme.primaryBlue, strokeWidth: 2),
              ),
              error: (_, __) => const SizedBox.shrink(),
            ),

            const SizedBox(height: 24),

            // 3. SEZIONE FERMATE PREFERITE (Max 2)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.text('my_stops'),
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textMain,
                  ),
                ),
                TextButton(
                  onPressed: () => onNavigateTab(1), // Tab Muoviti
                  child: Text(
                    l10n.text('see_all_departures'),
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (favoriteIds.isEmpty)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppTheme.borderLight),
                ),
                child: Text(
                  l10n.text('no_favorites_hint'),
                  style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                ),
              )
            else
              homeDeparturesAsync.when(
                data: (departuresMap) {
                  return Column(
                    children: favoriteIds.map((stopId) {
                      final stop = ActvService.curatedStops.firstWhere(
                        (s) => s.id == stopId,
                        orElse: () => ActvService.curatedStops.first,
                      );
                      final departures = departuresMap[stopId] ?? [];

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Padding(
                              padding: const EdgeInsets.only(left: 4, bottom: 6),
                              child: Text(
                                stop.name,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w700,
                                  color: AppTheme.textMuted,
                                ),
                              ),
                            ),
                            ...departures.take(2).map((dep) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: DepartureCard(departure: dep, locale: locale),
                              );
                            }),
                          ],
                        ),
                      );
                    }).toList(),
                  );
                },
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: CircularProgressIndicator(color: AppTheme.primaryBlue, strokeWidth: 2),
                  ),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),
          ],
        ),
      ),
    );
  }
}
