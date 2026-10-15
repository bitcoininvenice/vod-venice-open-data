import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/tide.dart';
import 'storage_service.dart';

/// Servizio per il recupero dei dati di marea CPSM e stato MOSE
class TideService {
  static const String vodTideApiUrl = 'https://venice-open-data.vercel.app/api/tide';
  final StorageService storageService;

  TideService(this.storageService);

  Future<TideData> fetchTide() async {
    try {
      final response = await http
          .get(Uri.parse(vodTideApiUrl))
          .timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body) as Map<String, dynamic>;
        await storageService.setCachedTideJson(response.body);

        final data = decoded['data'] as Map<String, dynamic>? ?? {};
        final refJson = data['reference'] as Map<String, dynamic>? ?? {};
        final reference = TideStation.fromJson(refJson);
        final category = data['category'] as String? ?? _deriveCategory(reference.levelCm);
        final trend = data['trend'] as String? ?? 'STAZIONARIO';

        final forecastJson = data['forecast'] as Map<String, dynamic>?;
        final List<TideForecastExtreme> extremes = [];
        if (forecastJson != null && forecastJson['extremes'] is List) {
          for (final item in forecastJson['extremes']) {
            extremes.add(TideForecastExtreme.fromJson(item as Map<String, dynamic>));
          }
        }

        final moseJson = data['moseGates'] as List<dynamic>? ?? [];
        final List<MoseGateItem> moseGates = moseJson
            .map((e) => MoseGateItem.fromJson(e as Map<String, dynamic>))
            .toList();

        return TideData(
          reference: reference,
          category: category,
          trend: trend,
          extremes: extremes.isNotEmpty ? extremes : _defaultExtremes(),
          moseGates: moseGates.isNotEmpty ? moseGates : _defaultMoseGates(),
          isOffline: false,
        );
      }
    } catch (_) {
      // Fallback controllato in assenza di rete o timeout
    }

    // Prova a recuperare la cache offline
    final cached = storageService.getCachedTideJson();
    if (cached != null) {
      try {
        final decoded = jsonDecode(cached) as Map<String, dynamic>;
        final data = decoded['data'] as Map<String, dynamic>? ?? {};
        final refJson = data['reference'] as Map<String, dynamic>? ?? {};
        return TideData(
          reference: TideStation.fromJson(refJson),
          category: data['category'] as String? ?? 'NORMALE',
          trend: data['trend'] as String? ?? 'IN_CALO',
          extremes: _defaultExtremes(),
          moseGates: _defaultMoseGates(),
          isOffline: true,
        );
      } catch (_) {}
    }

    // Fallback statico resiliente
    return TideData.fallback();
  }

  static String _deriveCategory(int cm) {
    if (cm < 80) return 'NORMALE';
    if (cm < 110) return 'SOSTENUTA';
    if (cm < 140) return 'MOLTO_SOSTENUTA';
    return 'ECCEZIONALE';
  }

  static List<TideForecastExtreme> _defaultExtremes() {
    return [
      TideForecastExtreme(at: '21:30', type: 'max', levelCm: 92),
      TideForecastExtreme(at: '03:45', type: 'min', levelCm: 15),
      TideForecastExtreme(at: '10:15', type: 'max', levelCm: 102),
    ];
  }

  static List<MoseGateItem> _defaultMoseGates() {
    return [
      MoseGateItem(id: 'treporti', name: 'Lido Treporti', status: 'A_RIPOSO', barriersUp: 0),
      MoseGateItem(id: 'san_nicolo', name: 'Lido San Nicolo', status: 'A_RIPOSO', barriersUp: 0),
      MoseGateItem(id: 'malamocco', name: 'Malamocco', status: 'A_RIPOSO', barriersUp: 0),
      MoseGateItem(id: 'chioggia', name: 'Chioggia', status: 'A_RIPOSO', barriersUp: 0),
    ];
  }
}
