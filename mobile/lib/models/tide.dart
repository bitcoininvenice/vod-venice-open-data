/// Modello dati per il monitoraggio della marea e del MOSE
class TideStation {
  final String id;
  final String name;
  final double lat;
  final double lon;
  final int levelCm;
  final String observedAt;

  TideStation({
    required this.id,
    required this.name,
    required this.lat,
    required this.lon,
    required this.levelCm,
    required this.observedAt,
  });

  factory TideStation.fromJson(Map<String, dynamic> json) {
    return TideStation(
      id: json['id'] as String? ?? 'salute',
      name: json['name'] as String? ?? 'Punta della Salute',
      lat: (json['lat'] as num?)?.toDouble() ?? 45.4309,
      lon: (json['lon'] as num?)?.toDouble() ?? 12.3364,
      levelCm: (json['levelCm'] as num?)?.toInt() ?? 0,
      observedAt: json['observedAt'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'lat': lat,
    'lon': lon,
    'levelCm': levelCm,
    'observedAt': observedAt,
  };
}

class TideForecastExtreme {
  final String at;
  final String type; // 'max' o 'min'
  final int levelCm;

  TideForecastExtreme({
    required this.at,
    required this.type,
    required this.levelCm,
  });

  factory TideForecastExtreme.fromJson(Map<String, dynamic> json) {
    return TideForecastExtreme(
      at: json['at'] as String? ?? '',
      type: json['type'] as String? ?? 'max',
      levelCm: (json['levelCm'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'at': at,
    'type': type,
    'levelCm': levelCm,
  };
}

class MoseGateItem {
  final String id;
  final String name;
  final String status; // 'A_RIPOSO' | 'ATTIVO'
  final int barriersUp;

  MoseGateItem({
    required this.id,
    required this.name,
    required this.status,
    required this.barriersUp,
  });

  factory MoseGateItem.fromJson(Map<String, dynamic> json) {
    return MoseGateItem(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      status: json['status'] as String? ?? 'A_RIPOSO',
      barriersUp: (json['barriersUp'] as num?)?.toInt() ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'status': status,
    'barriersUp': barriersUp,
  };
}

class TideData {
  final TideStation reference;
  final String category; // 'NORMALE' | 'SOSTENUTA' | 'MOLTO_SOSTENUTA' | 'ECCEZIONALE'
  final String trend; // 'IN_AUMENTO' | 'IN_CALO' | 'STAZIONARIO'
  final List<TideForecastExtreme> extremes;
  final List<MoseGateItem> moseGates;
  final bool isOffline;

  TideData({
    required this.reference,
    required this.category,
    required this.trend,
    required this.extremes,
    required this.moseGates,
    this.isOffline = false,
  });

  factory TideData.fallback() {
    return TideData(
      reference: TideStation(
        id: 'salute',
        name: 'Punta della Salute',
        lat: 45.4309,
        lon: 12.3364,
        levelCm: 78,
        observedAt: 'Dato stimato recente',
      ),
      category: 'NORMALE',
      trend: 'IN_CALO',
      extremes: [
        TideForecastExtreme(at: '21:30', type: 'max', levelCm: 92),
        TideForecastExtreme(at: '03:45', type: 'min', levelCm: 15),
        TideForecastExtreme(at: '10:15', type: 'max', levelCm: 102),
      ],
      moseGates: [
        MoseGateItem(id: 'treporti', name: 'Lido Treporti', status: 'A_RIPOSO', barriersUp: 0),
        MoseGateItem(id: 'san_nicolo', name: 'Lido San Nicolo', status: 'A_RIPOSO', barriersUp: 0),
        MoseGateItem(id: 'malamocco', name: 'Malamocco', status: 'A_RIPOSO', barriersUp: 0),
        MoseGateItem(id: 'chioggia', name: 'Chioggia', status: 'A_RIPOSO', barriersUp: 0),
      ],
      isOffline: true,
    );
  }
}
