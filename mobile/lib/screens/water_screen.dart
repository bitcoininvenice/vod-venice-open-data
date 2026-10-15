import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_state_providers.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../widgets/tide_gauge_card.dart';
import '../widgets/mose_status_card.dart';
import '../services/passerelle_service.dart';

/// Schermata "Acqua": monitoraggio scientifico della marea, passerelle montate e MOSE.
class WaterScreen extends ConsumerWidget {
  const WaterScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations(locale);
    final tideAsync = ref.watch(tideDataProvider);
    final passerelleService = ref.watch(passerelleServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.text('water_title')),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(tideDataProvider),
        color: AppTheme.primaryBlue,
        child: tideAsync.when(
          data: (tide) {
            final currentLevel = tide.reference.levelCm;
            final floodedPct = passerelleService.calculateFloodedGroundPercentage(currentLevel);
            final routes = passerelleService.getRoutesForTide(currentLevel);

            return ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 1. CARD PRINCIPALE MAREA
                TideGaugeCard(tide: tide, locale: locale),

                const SizedBox(height: 20),

                // 2. TABELLA PREVISIONI ESTREMI (48 ORE)
                Container(
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
                      Text(
                        l10n.text('tide_forecast_title').toUpperCase(),
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.8,
                          color: AppTheme.textMuted,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...tide.extremes.map((ext) {
                        final isMax = ext.type == 'max';
                        final color = isMax ? AppTheme.getTideColor(ext.levelCm) : AppTheme.textMuted;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                '${isMax ? "Colmo (Max)" : "Minimo (Min)"} ${ext.at}',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                              ),
                              Text(
                                '${ext.levelCm >= 0 ? "+" : ""}${ext.levelCm} cm',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: color,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // 3. SEZIONE PASSERELLE E SUOLO ALLAGATO
                Container(
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
                            l10n.text('passerelle_section_title').toUpperCase(),
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              letterSpacing: 0.8,
                              color: AppTheme.textMuted,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.backgroundLight,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Suolo: ${floodedPct.toStringAsFixed(1)}%',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppTheme.textMain,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Lista tratte passerelle
                      ...routes.map((route) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 10),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: route.isMounted
                                  ? const Color(0xFFFEF3C7)
                                  : AppTheme.backgroundLight,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                color: route.isMounted
                                    ? const Color(0xFFFDE68A)
                                    : AppTheme.borderLight,
                              ),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      route.name,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w700,
                                        color: AppTheme.textMain,
                                      ),
                                    ),
                                    Text(
                                      route.isMounted ? 'Montata' : 'A riposo',
                                      style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w700,
                                        color: route.isMounted
                                            ? AppTheme.tideSustained
                                            : AppTheme.textMuted,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  route.description,
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                ),
                              ],
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // 4. STATO MOSE
                MoseStatusCard(gates: tide.moseGates, locale: locale),
              ],
            );
          },
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppTheme.primaryBlue, strokeWidth: 2),
          ),
          error: (_, __) => const Center(
            child: Text('Errore nel caricamento dei dati di marea.'),
          ),
        ),
      ),
    );
  }
}
