import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/tide.dart';
import '../models/actv_departure.dart';
import '../services/storage_service.dart';
import '../services/tide_service.dart';
import '../services/actv_service.dart';
import '../services/routing_service.dart';
import '../services/passerelle_service.dart';

// Provider di basso livello per lo Storage
final storageServiceProvider = Provider<StorageService>((ref) {
  throw UnimplementedError('StorageService deve essere inizializzato nel main');
});

// Gestione Lingua IT / EN
class LocaleNotifier extends StateNotifier<String> {
  final StorageService _storage;
  LocaleNotifier(this._storage) : super(_storage.getLocale());

  Future<void> setLocale(String lang) async {
    state = lang;
    await _storage.setLocale(lang);
  }

  void toggle() {
    final next = state == 'it' ? 'en' : 'it';
    setLocale(next);
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, String>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return LocaleNotifier(storage);
});

// Servizi singleton
final tideServiceProvider = Provider<TideService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return TideService(storage);
});

final actvServiceProvider = Provider<ActvService>((ref) {
  return ActvService();
});

final routingServiceProvider = Provider<RoutingService>((ref) {
  return RoutingService();
});

final passerelleServiceProvider = Provider<PasserelleService>((ref) {
  return PasserelleService();
});

// Dati Marea con caching e ricarica
final tideDataProvider = FutureProvider<TideData>((ref) async {
  final service = ref.watch(tideServiceProvider);
  return service.fetchTide();
});

// Gestione fermate preferite (massimo 2)
class FavoritesNotifier extends StateNotifier<List<String>> {
  final StorageService _storage;
  FavoritesNotifier(this._storage) : super(_storage.getFavoriteStopIds());

  Future<void> toggle(String stopId) async {
    await _storage.toggleFavoriteStop(stopId);
    state = _storage.getFavoriteStopIds();
  }
}

final favoriteStopsProvider = StateNotifierProvider<FavoritesNotifier, List<String>>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return FavoritesNotifier(storage);
});

// Partenze per le fermate preferite in Home "Oggi"
final homeDeparturesProvider = FutureProvider<Map<String, List<ActvDeparture>>>((ref) async {
  final favoriteIds = ref.watch(favoriteStopsProvider);
  final actvService = ref.watch(actvServiceProvider);

  final Map<String, List<ActvDeparture>> result = {};
  for (final id in favoriteIds) {
    result[id] = await actvService.getDeparturesForStop(id);
  }
  return result;
});
