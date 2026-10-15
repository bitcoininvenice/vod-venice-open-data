import 'package:flutter/material.dart';

/// Modello per partenze vaporetti e fermate ACTV / Alilaguna
class ActvDeparture {
  final String lineCode;
  final String destination;
  final String pier; // Lettera pontile: A, B, C, D, E
  final int minutesRemaining;
  final String scheduledTime;
  final bool isRealtime;
  final Color badgeColor;

  ActvDeparture({
    required this.lineCode,
    required this.destination,
    required this.pier,
    required this.minutesRemaining,
    required this.scheduledTime,
    this.isRealtime = true,
    required this.badgeColor,
  });

  factory ActvDeparture.fromJson(Map<String, dynamic> json) {
    return ActvDeparture(
      lineCode: json['lineCode'] as String? ?? '1',
      destination: json['destination'] as String? ?? '',
      pier: json['pier'] as String? ?? 'A',
      minutesRemaining: (json['minutesRemaining'] as num?)?.toInt() ?? 0,
      scheduledTime: json['scheduledTime'] as String? ?? '',
      isRealtime: json['isRealtime'] as bool? ?? false,
      badgeColor: Color((json['colorHex'] as num?)?.toInt() ?? 0xFF0284C7),
    );
  }
}

class ActvStop {
  final String id;
  final String name;
  final double lat;
  final double lon;
  final List<String> availablePiers;
  final bool isFavorite;

  ActvStop({
    required this.id,
    required this.name,
    required this.lat,
    required this.lon,
    required this.availablePiers,
    this.isFavorite = false,
  });

  ActvStop copyWith({bool? isFavorite}) {
    return ActvStop(
      id: id,
      name: name,
      lat: lat,
      lon: lon,
      availablePiers: availablePiers,
      isFavorite: isFavorite ?? this.isFavorite,
    );
  }
}
