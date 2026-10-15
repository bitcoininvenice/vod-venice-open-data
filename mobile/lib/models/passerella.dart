/// Modello per passerelle rialzate e zone allagate a Venezia
class PasserellaRoute {
  final String id;
  final String name;
  final int activationThresholdCm; // Quota di marea per il montaggio (es. 80, 95, 110)
  final String description;
  final bool isMounted;

  PasserellaRoute({
    required this.id,
    required this.name,
    required this.activationThresholdCm,
    required this.description,
    required this.isMounted,
  });
}

class CriticalZone {
  final String name;
  final int groundHeightCm; // Quota del suolo sul medio mare (es. San Marco: 64 cm)
  final String statusDescription;

  CriticalZone({
    required this.name,
    required this.groundHeightCm,
    required this.statusDescription,
  });

  bool isFloodedAt(int tideLevelCm) => tideLevelCm >= groundHeightCm;
}
