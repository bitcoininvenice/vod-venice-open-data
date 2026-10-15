import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'services/storage_service.dart';
import 'providers/app_state_providers.dart';
import 'theme/app_theme.dart';
import 'screens/shell_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final storageService = await StorageService.init();

  runApp(
    ProviderScope(
      overrides: [
        storageServiceProvider.overrideWithValue(storageService),
      ],
      child: const VodApp(),
    ),
  );
}

class VodApp extends ConsumerWidget {
  const VodApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'Venice Open Data',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const ShellScreen(),
    );
  }
}
