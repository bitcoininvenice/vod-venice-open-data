import '../models/route_trip.dart';

/// Servizio per il calcolo percorsi a Venezia con incrocio quote marea
class RoutingService {
  /// Calcola l'itinerario da A a B tenendo conto del livello di marea
  Future<TripPlan> calculateRoute({
    required String origin,
    required String destination,
    required String mode, // 'boat_walk' | 'walk_only' | 'no_steps'
    required int currentTideCm,
  }) async {
    // Simulazione calcolo percorso da Ferrovia a San Marco
    final bool isSanMarcoDestination =
        destination.toLowerCase().contains('marco') || destination.isEmpty;
    final bool isFlooded = currentTideCm >= 90 && isSanMarcoDestination;

    if (mode == 'walk_only') {
      return TripPlan(
        id: 'route_walk_1',
        title: 'Percorso a piedi via Rialto',
        totalMinutes: 38,
        boatMinutes: 0,
        walkMinutes: 38,
        totalBridges: 8,
        isDrySafe: !isFlooded,
        floodNotice: isFlooded
            ? 'Tratto finale in Piazza San Marco (+64cm) coperto da 10-15cm d acqua. Usa le passerelle.'
            : null,
        steps: [
          TripStep(
            instruction: 'Dalla Stazione svolta a sinistra su Lista di Spagna',
            durationMinutes: 8,
            isBoat: false,
            bridgeCount: 1,
          ),
          TripStep(
            instruction: 'Prosegui su Strada Nova verso Campo Santi Apostoli',
            durationMinutes: 14,
            isBoat: false,
            bridgeCount: 4,
          ),
          TripStep(
            instruction: 'Attraversa il Ponte di Rialto e scendi verso le Mercerie',
            durationMinutes: 10,
            isBoat: false,
            bridgeCount: 2,
          ),
          TripStep(
            instruction: 'Arrivo in Piazza San Marco passando sotto l Orologio',
            durationMinutes: 6,
            isBoat: false,
            bridgeCount: 1,
          ),
        ],
      );
    }

    if (mode == 'no_steps') {
      return TripPlan(
        id: 'route_nosteps_1',
        title: 'Percorso accessibile senza gradini',
        totalMinutes: 26,
        boatMinutes: 22,
        walkMinutes: 4,
        totalBridges: 0,
        isDrySafe: true,
        floodNotice: null,
        steps: [
          TripStep(
            instruction: 'Imbarco a Ferrovia Approdo E (rampa accessibile)',
            durationMinutes: 2,
            isBoat: false,
            departurePier: 'E',
            bridgeCount: 0,
          ),
          TripStep(
            instruction: 'Linea 1 ACTV fino all approdo San Marco Vallaresso',
            durationMinutes: 22,
            isBoat: true,
            lineCode: '1',
            bridgeCount: 0,
          ),
          TripStep(
            instruction: 'Dall approdo Vallaresso a Piazza San Marco su piano continuo',
            durationMinutes: 2,
            isBoat: false,
            bridgeCount: 0,
          ),
        ],
      );
    }

    // Modalità combinata predefinita (Vaporetto + Piedi)
    return TripPlan(
      id: 'route_fast_1',
      title: 'Itinerario rapido Vaporetto Linea 2',
      totalMinutes: 23,
      boatMinutes: 18,
      walkMinutes: 5,
      totalBridges: 0,
      isDrySafe: !isFlooded,
      floodNotice: isFlooded
          ? 'La piazza presenta un velo d acqua. Percorri le passerelle rialzate.'
          : null,
      steps: [
        TripStep(
          instruction: 'Raggiungi Ferrovia Approdo D (corsia veloce)',
          durationMinutes: 2,
          isBoat: false,
          departurePier: 'D',
          bridgeCount: 0,
        ),
        TripStep(
          instruction: 'Sali sulla Linea 2 ACTV diretta a Rialto - San Marco',
          durationMinutes: 18,
          isBoat: true,
          lineCode: '2',
          departurePier: 'D',
          bridgeCount: 0,
        ),
        TripStep(
          instruction: 'Sbarca all approdo San Marco Giardinetti / Vallaresso',
          durationMinutes: 1,
          isBoat: false,
          bridgeCount: 0,
        ),
        TripStep(
          instruction: 'Cammina fino al centro di Piazza San Marco',
          durationMinutes: 2,
          isBoat: false,
          bridgeCount: 0,
        ),
      ],
    );
  }
}
