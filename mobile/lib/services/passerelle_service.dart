import '../models/passerella.dart';

/// Servizio per la consultazione delle passerelle comunali e zone critiche
class PasserelleService {
  static final List<CriticalZone> criticalZones = [
    CriticalZone(
      name: 'Piazza San Marco (Basilica)',
      groundHeightCm: 64,
      statusDescription: 'Punto piu basso di Venezia: allagamento precoce',
    ),
    CriticalZone(
      name: 'Rialto (Rive e Mercato)',
      groundHeightCm: 85,
      statusDescription: 'Allagamento delle banchine prospicienti il Canal Grande',
    ),
    CriticalZone(
      name: 'Campo San Polo / Erbaria',
      groundHeightCm: 92,
      statusDescription: 'Infiltrazione da tombini a marea sostenuta',
    ),
    CriticalZone(
      name: 'Ferrovia (Fondamenta S. Lucia)',
      groundHeightCm: 105,
      statusDescription: 'Suolo allagato solo con marea molto sostenuta',
    ),
  ];

  static final List<PasserellaRoute> standardRoutes = [
    PasserellaRoute(
      id: 't1_san_marco',
      name: 'Tratta 1: Piazza San Marco',
      activationThresholdCm: 80,
      description: 'Dalla Piazzetta dei Leoncini attraverso la Basilica fino all Approdo Vallaresso.',
      isMounted: false,
    ),
    PasserellaRoute(
      id: 't2_rialto',
      name: 'Tratta 2: Rialto e Ruga dei Oresi',
      activationThresholdCm: 95,
      description: 'Collegamento rialzato tra il ponte di Rialto e Campo San Bartolomeo.',
      isMounted: false,
    ),
    PasserellaRoute(
      id: 't3_ferrovia',
      name: 'Tratta 3: Ferrovia - Lista di Spagna',
      activationThresholdCm: 100,
      description: 'Passerella lungo il fronte della Stazione Santa Lucia.',
      isMounted: false,
    ),
    PasserellaRoute(
      id: 't4_zaccaria',
      name: 'Tratta 4: Riva degli Schiavoni - San Zaccaria',
      activationThresholdCm: 110,
      description: 'Percorso sicuro lungo la riva per raggiungere i pontili ACTV.',
      isMounted: false,
    ),
  ];

  /// Restituisce lo stato delle passerelle aggiornato in base alla marea attuale
  List<PasserellaRoute> getRoutesForTide(int tideLevelCm) {
    return standardRoutes.map((route) {
      final bool active = tideLevelCm >= route.activationThresholdCm;
      return PasserellaRoute(
        id: route.id,
        name: route.name,
        activationThresholdCm: route.activationThresholdCm,
        description: route.description,
        isMounted: active,
      );
    }).toList();
  }

  /// Calcola la percentuale approssimativa di suolo allagato a Venezia per quota
  double calculateFloodedGroundPercentage(int tideLevelCm) {
    if (tideLevelCm < 80) return 0.2; // Solo parte del nartece di San Marco
    if (tideLevelCm < 90) return 1.5;
    if (tideLevelCm < 100) return 4.0;
    if (tideLevelCm < 110) return 12.0;
    if (tideLevelCm < 120) return 28.0;
    if (tideLevelCm < 130) return 46.0;
    if (tideLevelCm < 140) return 59.0;
    return 70.0;
  }
}
