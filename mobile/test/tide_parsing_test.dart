import 'package:flutter_test/flutter_test.dart';
import '../lib/models/tide.dart';
import '../lib/services/passerelle_service.dart';

void main() {
  group('Tide Model & Parsing Tests', () {
    test('Dovrebbe fare il parsing corretto di TideStation da JSON', () {
      final json = {
        'id': 'salute',
        'name': 'Punta della Salute',
        'lat': 45.4309,
        'lon': 12.3364,
        'levelCm': 95,
        'observedAt': '2026-10-15 09:30:00',
      };

      final station = TideStation.fromJson(json);

      expect(station.id, 'salute');
      expect(station.name, 'Punta della Salute');
      expect(station.levelCm, 95);
      expect(station.lat, 45.4309);
    });

    test('Dovrebbe fare il parsing corretto di TideForecastExtreme', () {
      final json = {
        'at': '2026-10-15 21:30:00',
        'type': 'max',
        'levelCm': 105,
      };

      final extreme = TideForecastExtreme.fromJson(json);

      expect(extreme.at, '2026-10-15 21:30:00');
      expect(extreme.type, 'max');
      expect(extreme.levelCm, 105);
    });

    test('Verifica quote e attivazione passerelle secondo piano comunale', () {
      final passerelleService = PasserelleService();

      // Marea normale (+75 cm): nessuna passerella montata
      final routesLow = passerelleService.getRoutesForTide(75);
      expect(routesLow.any((r) => r.isMounted), false);

      // Marea sostenuta (+85 cm): San Marco (soglia 80) deve essere montata
      final routesMedium = passerelleService.getRoutesForTide(85);
      final sanMarco = routesMedium.firstWhere((r) => r.id == 't1_san_marco');
      expect(sanMarco.isMounted, true);

      // Marea molto sostenuta (+115 cm): tutte le tratte montate
      final routesHigh = passerelleService.getRoutesForTide(115);
      expect(routesHigh.every((r) => r.isMounted), true);
    });

    test('Calcolo percentuale suolo allagato a Venezia', () {
      final passerelleService = PasserelleService();

      expect(passerelleService.calculateFloodedGroundPercentage(70), lessThan(1.0));
      expect(passerelleService.calculateFloodedGroundPercentage(110), 12.0);
      expect(passerelleService.calculateFloodedGroundPercentage(140), greaterThan(50.0));
    });
  });
}
