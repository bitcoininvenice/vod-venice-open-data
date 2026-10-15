import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_state_providers.dart';
import '../theme/app_theme.dart';
import '../l10n/app_localizations.dart';
import '../models/route_trip.dart';
import '../models/actv_departure.dart';
import '../widgets/departure_card.dart';
import '../services/actv_service.dart';

/// Schermata "Muoviti": integra Come arrivare (routing pedonale/acqueo)
/// e il tabellone partenze per tutte le fermate ACTV/Alilaguna.
class NavigateScreen extends ConsumerStatefulWidget {
  const NavigateScreen({super.key});

  @override
  ConsumerState<NavigateScreen> createState() => _NavigateScreenState();
}

class _NavigateScreenState extends ConsumerState<NavigateScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Stato per Come Arrivare
  String _origin = 'Stazione S. Lucia';
  String _destination = 'Piazza San Marco';
  String _mode = 'boat_walk'; // 'boat_walk' | 'walk_only' | 'no_steps'
  TripPlan? _calculatedPlan;

  // Stato per Fermate ACTV
  String _selectedStopId = 'ferrovia';
  String? _selectedPier;
  String _searchQuery = '';
  List<ActvDeparture> _departures = [];
  bool _isLoadingDepartures = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _recalculateRoute();
    _loadDepartures();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _recalculateRoute() {
    final routingService = ref.read(routingServiceProvider);
    final tideAsync = ref.read(tideDataProvider);
    final tideCm = tideAsync.value?.reference.levelCm ?? 78;

    routingService
        .calculateRoute(
          origin: _origin,
          destination: _destination,
          mode: _mode,
          currentTideCm: tideCm,
        )
        .then((plan) {
      if (mounted) {
        setState(() => _calculatedPlan = plan);
      }
    });
  }

  void _loadDepartures() {
    setState(() => _isLoadingDepartures = true);
    final actvService = ref.read(actvServiceProvider);
    actvService
        .getDeparturesForStop(_selectedStopId, pierFilter: _selectedPier)
        .then((list) {
      if (mounted) {
        setState(() {
          _departures = list;
          _isLoadingDepartures = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final locale = ref.watch(localeProvider);
    final l10n = AppLocalizations(locale);
    final favorites = ref.watch(favoriteStopsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.text('move_title')),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppTheme.primaryBlue,
          unselectedLabelColor: AppTheme.textMuted,
          indicatorColor: AppTheme.primaryBlue,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
          tabs: [
            Tab(text: l10n.text('subtab_route')),
            Tab(text: l10n.text('subtab_stops')),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // ================= SUBTAB 1: COME ARRIVARE =================
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Box di ricerca Partenza e Destinazione
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                  border: Border.all(color: AppTheme.borderLight),
                  boxShadow: AppTheme.softShadow,
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  children: [
                    // Campo Partenza
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundLight,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Row(
                        children: [
                          Container(width: 8, height: 8, decoration: const BoxDecoration(color: Color(0xFF16A34A), shape: BoxShape.circle)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _origin,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textMain),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Campo Destinazione
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundLight,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.borderLight),
                      ),
                      child: Row(
                        children: [
                          Container(width: 8, height: 8, decoration: const BoxDecoration(color: AppTheme.primaryBlue, shape: BoxShape.circle)),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              _destination,
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textMain),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Selettore Modalità
                    Row(
                      children: [
                        _buildModeChip('boat_walk', l10n.text('mode_boat_walk')),
                        const SizedBox(width: 6),
                        _buildModeChip('walk_only', l10n.text('mode_walk_only')),
                        const SizedBox(width: 6),
                        _buildModeChip('no_steps', l10n.text('mode_no_steps')),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Risultato Calcolo Itinerario
              if (_calculatedPlan != null) ...[
                // Allerta Marea Percorso
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _calculatedPlan!.isDrySafe ? const Color(0xFFF0FDF4) : const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _calculatedPlan!.isDrySafe ? const Color(0xFFBBF7D0) : const Color(0xFFFDE68A),
                    ),
                  ),
                  child: Text(
                    _calculatedPlan!.isDrySafe
                        ? l10n.text('route_safe_tide')
                        : (_calculatedPlan!.floodNotice ?? l10n.text('route_wet_tide_warning')),
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: _calculatedPlan!.isDrySafe ? const Color(0xFF166534) : const Color(0xFF92400E),
                    ),
                  ),
                ),
                const SizedBox(height: 14),

                // Card Riepilogo Itinerario
                Container(
                  decoration: BoxDecoration(
                    color: AppTheme.surfaceLight,
                    borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                    border: Border.all(color: AppTheme.primaryBlue, width: 2),
                    boxShadow: AppTheme.softShadow,
                  ),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${_calculatedPlan!.totalMinutes} min',
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: AppTheme.textMain),
                          ),
                          Text(
                            '${_calculatedPlan!.totalBridges} ponti',
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textMuted),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _calculatedPlan!.title,
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.primaryBlue),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: AppTheme.borderLight),
                      const SizedBox(height: 12),

                      // Step-by-step
                      ..._calculatedPlan!.steps.map((step) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                width: 24,
                                height: 24,
                                decoration: BoxDecoration(
                                  color: step.isBoat ? AppTheme.primaryBlue.withOpacity(0.12) : AppTheme.backgroundLight,
                                  shape: BoxShape.circle,
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  step.isBoat ? 'B' : 'P',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: step.isBoat ? AppTheme.primaryBlue : AppTheme.textMuted,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      step.instruction,
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textMain),
                                    ),
                                    if (step.departurePier != null)
                                      Padding(
                                        padding: const EdgeInsets.only(top: 2),
                                        child: Text(
                                          'Approdo consigliato: ${step.departurePier}',
                                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.actvLine2),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                              Text(
                                '${step.durationMinutes} m',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.w600),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                ),
              ],
            ],
          ),

          // ================= SUBTAB 2: FERMATE ACTV / ALILAGUNA =================
          ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Selettore fermata con Stella Preferito
              Container(
                decoration: BoxDecoration(
                  color: AppTheme.surfaceLight,
                  borderRadius: BorderRadius.circular(AppTheme.cardRadius),
                  border: Border.all(color: AppTheme.borderLight),
                  boxShadow: AppTheme.softShadow,
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        DropdownButton<String>(
                          value: _selectedStopId,
                          underline: const SizedBox.shrink(),
                          icon: const Icon(Icons.arrow_drop_down, color: AppTheme.primaryBlue),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppTheme.textMain),
                          items: ActvService.curatedStops.map((stop) {
                            return DropdownMenuItem<String>(
                              value: stop.id,
                              child: Text(stop.name),
                            );
                          }).toList(),
                          onChanged: (newId) {
                            if (newId != null) {
                              setState(() {
                                _selectedStopId = newId;
                                _selectedPier = null;
                              });
                              _loadDepartures();
                            }
                          },
                        ),
                        // Tasto Preferito
                        IconButton(
                          icon: Icon(
                            favorites.contains(_selectedStopId) ? Icons.star : Icons.star_border,
                            color: favorites.contains(_selectedStopId) ? Colors.amber : AppTheme.textMuted,
                          ),
                          onPressed: () {
                            ref.read(favoriteStopsProvider.notifier).toggle(_selectedStopId);
                          },
                        ),
                      ],
                    ),

                    // Filtro per pontile
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 6,
                      children: [
                        _buildPierChip(null, 'Tutti'),
                        ...ActvService.curatedStops
                            .firstWhere((s) => s.id == _selectedStopId)
                            .availablePiers
                            .map((p) => _buildPierChip(p, '${l10n.text("pier_label")} $p')),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // Lista partenze live
              if (_isLoadingDepartures)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32.0),
                    child: CircularProgressIndicator(color: AppTheme.primaryBlue, strokeWidth: 2),
                  ),
                )
              else if (_departures.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  alignment: Alignment.center,
                  child: const Text('Nessuna corsa programmata per questo approdo.', style: TextStyle(color: AppTheme.textMuted)),
                )
              else
                ..._departures.map((dep) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: DepartureCard(departure: dep, locale: locale),
                  );
                }),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildModeChip(String modeKey, String label) {
    final bool isSelected = _mode == modeKey;
    return GestureDetector(
      onTap: () {
        setState(() => _mode = modeKey);
        _recalculateRoute();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.primaryBlue : AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(AppTheme.chipRadius),
          border: Border.all(color: isSelected ? AppTheme.primaryBlue : AppTheme.borderLight),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppTheme.textMain,
          ),
        ),
      ),
    );
  }

  Widget _buildPierChip(String? pierValue, String label) {
    final bool isSelected = _selectedPier == pierValue;
    return GestureDetector(
      onTap: () {
        setState(() => _selectedPier = pierValue);
        _loadDepartures();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isSelected ? AppTheme.darkBlue : AppTheme.backgroundLight,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: isSelected ? AppTheme.darkBlue : AppTheme.borderLight),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppTheme.textMuted,
          ),
        ),
      ),
    );
  }
}
