import 'package:shared_preferences/shared_preferences.dart';

/// Servizio per la persistenza locale (lingua, preferiti, soglie notifiche, cache marea)
class StorageService {
  static const String _keyLocale = 'vod_locale';
  static const String _keyFavorites = 'vod_favorite_stops';
  static const String _keyTideAlert = 'vod_tide_alert_enabled';
  static const String _keyTideThreshold = 'vod_tide_threshold_cm';
  static const String _keyCachedTide = 'vod_cached_tide_json';

  final SharedPreferences _prefs;

  StorageService(this._prefs);

  static Future<StorageService> init() async {
    final prefs = await SharedPreferences.getInstance();
    return StorageService(prefs);
  }

  // Lingua
  String getLocale() => _prefs.getString(_keyLocale) ?? 'it';
  Future<void> setLocale(String lang) => _prefs.setString(_keyLocale, lang);

  // Fermate preferite (massimo 2 per la home "Oggi")
  List<String> getFavoriteStopIds() {
    return _prefs.getStringList(_keyFavorites) ?? ['ferrovia', 'rialto'];
  }

  Future<void> toggleFavoriteStop(String stopId) async {
    final list = List<String>.from(getFavoriteStopIds());
    if (list.contains(stopId)) {
      list.remove(stopId);
    } else {
      if (list.length >= 2) {
        list.removeAt(0); // Mantiene al massimo 2 preferiti in home
      }
      list.add(stopId);
    }
    await _prefs.setStringList(_keyFavorites, list);
  }

  // Notifiche soglia marea
  bool getTideAlertEnabled() => _prefs.getBool(_keyTideAlert) ?? true;
  Future<void> setTideAlertEnabled(bool enabled) => _prefs.setBool(_keyTideAlert, enabled);

  int getTideThresholdCm() => _prefs.getInt(_keyTideThreshold) ?? 110;
  Future<void> setTideThresholdCm(int threshold) => _prefs.setInt(_keyTideThreshold, threshold);

  // Cache marea offline
  String? getCachedTideJson() => _prefs.getString(_keyCachedTide);
  Future<void> setCachedTideJson(String jsonStr) => _prefs.setString(_keyCachedTide, jsonStr);
}
