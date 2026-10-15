import '../models/actv_departure.dart';
import '../theme/app_theme.dart';

/// Servizio per orari, partenze e approdi ACTV e Alilaguna
class ActvService {
  // Catalogo fermate principali di Venezia
  static final List<ActvStop> curatedStops = [
    ActvStop(
      id: 'ferrovia',
      name: 'Ferrovia (S. Lucia)',
      lat: 45.4410,
      lon: 12.3215,
      availablePiers: ['B', 'C', 'D', 'E'],
    ),
    ActvStop(
      id: 'ple_roma',
      name: 'Piazzale Roma',
      lat: 45.4375,
      lon: 12.3185,
      availablePiers: ['A', 'B', 'C', 'D', 'E', 'F'],
    ),
    ActvStop(
      id: 'rialto',
      name: 'Rialto',
      lat: 45.4380,
      lon: 12.3360,
      availablePiers: ['A', 'B', 'C', 'D'],
    ),
    ActvStop(
      id: 'san_marco',
      name: 'San Marco (Vallaresso)',
      lat: 45.4325,
      lon: 12.3380,
      availablePiers: ['A', 'B'],
    ),
    ActvStop(
      id: 'san_zaccaria',
      name: 'San Zaccaria',
      lat: 45.4340,
      lon: 12.3440,
      availablePiers: ['A', 'B', 'C', 'D', 'E'],
    ),
    ActvStop(
      id: 'zattere',
      name: 'Zattere',
      lat: 45.4290,
      lon: 12.3280,
      availablePiers: ['A', 'B'],
    ),
    ActvStop(
      id: 'fondamente_nove',
      name: 'Fondamente Nove',
      lat: 45.4450,
      lon: 12.3420,
      availablePiers: ['A', 'B', 'C', 'D'],
    ),
    ActvStop(
      id: 'lido_sme',
      name: 'Lido (S.M.E.)',
      lat: 45.4170,
      lon: 12.3680,
      availablePiers: ['A', 'B', 'C'],
    ),
    ActvStop(
      id: 'aeroporto_alilaguna',
      name: 'Aeroporto Marco Polo',
      lat: 45.5030,
      lon: 12.3510,
      availablePiers: ['Darsena'],
    ),
  ];

  /// Restituisce le partenze in tempo reale o programmate per la fermata specificata
  Future<List<ActvDeparture>> getDeparturesForStop(String stopId, {String? pierFilter}) async {
    final allDepartures = _generateMockDepartures(stopId);
    if (pierFilter != null && pierFilter.isNotEmpty && pierFilter != 'TUTTI') {
      return allDepartures.where((d) => d.pier == pierFilter).toList();
    }
    return allDepartures;
  }

  List<ActvDeparture> _generateMockDepartures(String stopId) {
    switch (stopId) {
      case 'ferrovia':
        return [
          ActvDeparture(
            lineCode: '2',
            destination: 'Rialto - San Marco',
            pier: 'D',
            minutesRemaining: 3,
            scheduledTime: '09:44',
            isRealtime: true,
            badgeColor: AppTheme.actvLine2,
          ),
          ActvDeparture(
            lineCode: '1',
            destination: 'Lido (S.M.E.) via C. Grande',
            pier: 'E',
            minutesRemaining: 7,
            scheduledTime: '09:48',
            isRealtime: true,
            badgeColor: AppTheme.actvLine1,
          ),
          ActvDeparture(
            lineCode: '4.2',
            destination: 'Murano - Fondamente Nove',
            pier: 'C',
            minutesRemaining: 11,
            scheduledTime: '09:52',
            isRealtime: false,
            badgeColor: AppTheme.actvLine4,
          ),
          ActvDeparture(
            lineCode: '5.1',
            destination: 'Lido SME via Canale Giudecca',
            pier: 'B',
            minutesRemaining: 15,
            scheduledTime: '09:56',
            isRealtime: true,
            badgeColor: AppTheme.actvLine5,
          ),
        ];

      case 'rialto':
        return [
          ActvDeparture(
            lineCode: '2',
            destination: 'San Marco - Lido',
            pier: 'C',
            minutesRemaining: 4,
            scheduledTime: '09:45',
            isRealtime: true,
            badgeColor: AppTheme.actvLine2,
          ),
          ActvDeparture(
            lineCode: '1',
            destination: 'Piazzale Roma - Ferrovia',
            pier: 'B',
            minutesRemaining: 6,
            scheduledTime: '09:47',
            isRealtime: true,
            badgeColor: AppTheme.actvLine1,
          ),
          ActvDeparture(
            lineCode: '1',
            destination: 'Lido (S.M.E.)',
            pier: 'C',
            minutesRemaining: 12,
            scheduledTime: '09:53',
            isRealtime: true,
            badgeColor: AppTheme.actvLine1,
          ),
        ];

      case 'aeroporto_alilaguna':
        return [
          ActvDeparture(
            lineCode: 'BLU',
            destination: 'F.te Nove - S. Marco - Giudecca',
            pier: 'Darsena',
            minutesRemaining: 18,
            scheduledTime: '10:00',
            isRealtime: false,
            badgeColor: AppTheme.alilagunaBlue,
          ),
          ActvDeparture(
            lineCode: 'ARANCIO',
            destination: 'Rialto - S. Angelo - C. Grande',
            pier: 'Darsena',
            minutesRemaining: 38,
            scheduledTime: '10:20',
            isRealtime: false,
            badgeColor: AppTheme.actvLine4,
          ),
        ];

      default:
        return [
          ActvDeparture(
            lineCode: '1',
            destination: 'P.le Roma - Ferrovia',
            pier: 'A',
            minutesRemaining: 5,
            scheduledTime: '09:46',
            isRealtime: true,
            badgeColor: AppTheme.actvLine1,
          ),
          ActvDeparture(
            lineCode: '2',
            destination: 'Rialto - San Marco',
            pier: 'B',
            minutesRemaining: 9,
            scheduledTime: '09:50',
            isRealtime: true,
            badgeColor: AppTheme.actvLine2,
          ),
        ];
    }
  }
}
