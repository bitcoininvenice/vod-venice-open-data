import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_state_providers.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';

/// Schermata "Altro": preferenze lingua, soglie notifiche, fonti dati e disclaimer
class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _tideAlertEnabled = true;
  int _thresholdCm = 110;

  @override
  void initState() {
    super.initState();
    final storage = ref.read(storageServiceProvider);
    _tideAlertEnabled = storage.getTideAlertEnabled();
    _thresholdCm = storage.getTideThresholdCm();
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations(locale);
    final storage = ref.watch(storageServiceProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.text('more_title')),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ================= PREFERENZE =================
          Text(
            l10n.text('settings_section').toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 8),

          Container(
            decoration: BoxDecoration(
              color: AppTheme.surfaceLight,
              borderRadius: BorderRadius.circular(AppTheme.cardRadius),
              border: Border.all(color: AppTheme.borderLight),
              boxShadow: AppTheme.softShadow,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Column(
              children: [
                // Switch Lingua
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(
                    l10n.text('language_label'),
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textMain),
                  ),
                  trailing: SegmentedButton<String>(
                    segments: const [
                      ButtonSegment(value: 'it', label: Text('IT')),
                      ButtonSegment(value: 'en', label: Text('EN')),
                    ],
                    selected: {locale},
                    showSelectedIcon: false,
                    onSelectionChanged: (set) {
                      ref.read(localeProvider.notifier).setLocale(set.first);
                    },
                  ),
                ),
                const Divider(height: 1, color: AppTheme.borderLight),

                // Switch Notifiche Marea
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  activeColor: AppTheme.primaryBlue,
                  title: Text(
                    l10n.text('tide_alert_toggle'),
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: AppTheme.textMain),
                  ),
                  value: _tideAlertEnabled,
                  onChanged: (val) {
                    setState(() => _tideAlertEnabled = val);
                    storage.setTideAlertEnabled(val);
                  },
                ),

                if (_tideAlertEnabled) ...[
                  const Divider(height: 1, color: AppTheme.borderLight),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          l10n.text('tide_alert_threshold'),
                          style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                        ),
                        DropdownButton<int>(
                          value: _thresholdCm,
                          underline: const SizedBox.shrink(),
                          items: const [
                            DropdownMenuItem(value: 100, child: Text('+100 cm')),
                            DropdownMenuItem(value: 110, child: Text('+110 cm')),
                            DropdownMenuItem(value: 120, child: Text('+120 cm')),
                          ],
                          onChanged: (val) {
                            if (val != null) {
                              setState(() => _thresholdCm = val);
                              storage.setTideThresholdCm(val);
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ================= FONTI E OPEN DATA =================
          Text(
            l10n.text('sources_section').toUpperCase(),
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppTheme.textMuted,
            ),
          ),
          const SizedBox(height: 8),

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
                _buildSourceItem(l10n.text('source_cpsm'), 'Licenza IODL 2.0 / Open Data'),
                const SizedBox(height: 10),
                _buildSourceItem(l10n.text('source_actv'), 'Formato standard GTFS'),
                const SizedBox(height: 10),
                _buildSourceItem(l10n.text('source_passerelle'), 'Piano Comunale Passerelle'),
                const SizedBox(height: 12),
                const Divider(height: 1, color: AppTheme.borderLight),
                const SizedBox(height: 12),
                Text(
                  l10n.text('open_source_notice'),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryBlue,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ================= DISCLAIMER DI SICUREZZA =================
          Container(
            decoration: BoxDecoration(
              color: AppTheme.backgroundLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppTheme.borderLight),
            ),
            padding: const EdgeInsets.all(14),
            child: Text(
              l10n.text('safety_disclaimer'),
              style: const TextStyle(
                fontSize: 11,
                color: AppTheme.textMuted,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSourceItem(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textMain),
        ),
        const SizedBox(height: 1),
        Text(
          subtitle,
          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
        ),
      ],
    );
  }
}
