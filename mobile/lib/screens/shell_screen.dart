import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_state_providers.dart';
import '../l10n/app_localizations.dart';
import 'home_today_screen.dart';
import 'navigate_screen.dart';
import 'water_screen.dart';
import 'settings_screen.dart';

/// Shell dell'applicazione con Bottom Navigation Bar a 4 voci
class ShellScreen extends ConsumerStatefulWidget {
  const ShellScreen({super.key});

  @override
  ConsumerState<ShellScreen> createState() => _ShellScreenState();
}

class _ShellScreenState extends ConsumerState<ShellScreen> {
  int _currentIndex = 0;

  void _onTabTapped(int index) {
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations(locale);

    final List<Widget> screens = [
      HomeTodayScreen(onNavigateTab: _onTabTapped),
      const NavigateScreen(),
      const WaterScreen(),
      const SettingsScreen(),
    ];

    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: screens,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: _onTabTapped,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.today_outlined),
            activeIcon: const Icon(Icons.today),
            label: l10n.text('tab_today'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.navigation_outlined),
            activeIcon: const Icon(Icons.navigation),
            label: l10n.text('tab_move'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.water_drop_outlined),
            activeIcon: const Icon(Icons.water_drop),
            label: l10n.text('tab_water'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.more_horiz_outlined),
            activeIcon: const Icon(Icons.more_horiz),
            label: l10n.text('tab_more'),
          ),
        ],
      ),
    );
  }
}
