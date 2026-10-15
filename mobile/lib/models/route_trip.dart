/// Modello per il calcolo di percorsi multimodali a Venezia
class TripStep {
  final String instruction;
  final int durationMinutes;
  final bool isBoat;
  final String? lineCode;
  final String? departurePier;
  final int bridgeCount;

  TripStep({
    required this.instruction,
    required this.durationMinutes,
    required this.isBoat,
    this.lineCode,
    this.departurePier,
    this.bridgeCount = 0,
  });
}

class TripPlan {
  final String id;
  final String title;
  final int totalMinutes;
  final int boatMinutes;
  final int walkMinutes;
  final int totalBridges;
  final bool isDrySafe; // Se all'asciutto con la marea attuale
  final String? floodNotice;
  final List<TripStep> steps;

  TripPlan({
    required this.id,
    required this.title,
    required this.totalMinutes,
    required this.boatMinutes,
    required this.walkMinutes,
    required this.totalBridges,
    required this.isDrySafe,
    this.floodNotice,
    required this.steps,
  });
}
