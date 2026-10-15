/// Sistema di internazionalizzazione leggero per Venice Open Data Mobile.
/// Supporta Italiano (predefinito) e Inglese.
class AppLocalizations {
  final String locale;

  AppLocalizations(this.locale);

  static final Map<String, Map<String, String>> _localizedValues = {
    'it': {
      // Navigazione
      'tab_today': 'Oggi',
      'tab_move': 'Muoviti',
      'tab_water': 'Acqua',
      'tab_more': 'Altro',

      // Schermata Oggi (Home)
      'today_title': 'Oggi a Venezia',
      'tide_salute_label': 'Punta della Salute',
      'next_peak': 'Prossimo colmo',
      'next_minimum': 'Minimo successivo',
      'feet_dry_all': 'Tutte le calli e piazze sono all asciutto.',
      'feet_wet_warning': 'Attenzione a Piazza San Marco: marea sostenuta.',
      'passerelle_active_notice': 'Passerelle comunali montate nelle tratte critiche.',
      'open_passerelle_map': 'Vedi passerelle',
      'my_stops': 'Le mie fermate',
      'no_favorites_hint': 'Aggiungi fino a 2 approdi preferiti da Muoviti per vederli qui.',
      'see_all_departures': 'Tutte le partenze',
      'live_indicator': 'Tempo reale',
      'scheduled_indicator': 'Programmato',
      'min_remaining': 'min',
      'now_arriving': 'In arrivo',

      // Schermata Muoviti
      'move_title': 'Muoviti',
      'subtab_route': 'Come arrivare',
      'subtab_stops': 'Battelli e bus',
      'origin_hint': 'Partenza (es. Posizione attuale)',
      'destination_hint': 'Destinazione (es. Piazza San Marco)',
      'mode_boat_walk': 'Vaporetto + Piedi',
      'mode_walk_only': 'Solo a piedi',
      'mode_no_steps': 'Evita gradini',
      'route_safe_tide': 'Percorso all asciutto alla quota di marea attuale.',
      'route_wet_tide_warning': 'Attenzione: un tratto del percorso potrebbe essere allagato.',
      'search_stop_placeholder': 'Cerca approdo (es. Ferrovia, Rialto, Lido)...',
      'pier_label': 'Approdo',
      'direction_to': 'Direzione',

      // Schermata Acqua (Marea + Passerelle + MOSE)
      'water_title': 'Marea e Laguna',
      'tide_level_current': 'Livello attuale',
      'tide_category_normal': 'Marea Normale',
      'tide_category_sustained': 'Marea Sostenuta',
      'tide_category_very_sustained': 'Marea Molto Sostenuta',
      'tide_category_exceptional': 'Marea Eccezionale',
      'tide_forecast_title': 'Previsione 48 ore (CPSM)',
      'flooded_ground_label': 'Suolo allagato',
      'passerelle_section_title': 'Passerelle e percorsi pedonali',
      'passerelle_status_dismantled': 'Non montate (livello ordinario)',
      'passerelle_status_mounted': 'Montate sui tracciati principali',
      'mose_section_title': 'Barriere MOSE',
      'mose_status_rest': 'A riposo (Bocche aperte)',
      'mose_status_active': 'Attivo (Bocche chiuse)',
      'mose_explanation': 'Le paratoie vengono sollevate quando la marea in mare aperto supera la soglia di allerta (+110/+120 cm).',
      'open_vod_simulator': 'Apri Simulatore MOSE su VOD Web',

      // Schermata Altro (Impostazioni e Fonti)
      'more_title': 'Altro',
      'settings_section': 'Impostazioni',
      'language_label': 'Lingua',
      'tide_alert_toggle': 'Notifica marea alta',
      'tide_alert_threshold': 'Avvisami se marea prevista supera',
      'sources_section': 'Fonti e Open Data',
      'source_cpsm': 'Dati Marea: Comune di Venezia - CPSM',
      'source_actv': 'Trasporti: AVM / ACTV SpA (Open Data GTFS)',
      'source_passerelle': 'Passerelle: Comune di Venezia (Lavori Pubblici)',
      'open_source_notice': 'Progetto open source Venice Open Data',
      'safety_disclaimer': 'Venice Open Data non e un canale ufficiale di emergenza. In caso di allerta fare sempre riferimento ai canali ufficiali della Citta di Venezia e del CPSM.',
      'offline_banner': 'Modalita non in linea. Dati aggiornati all ultima sincronizzazione.',
    },
    'en': {
      // Navigation
      'tab_today': 'Today',
      'tab_move': 'Move',
      'tab_water': 'Water',
      'tab_more': 'More',

      // Today Screen
      'today_title': 'Today in Venice',
      'tide_salute_label': 'Punta della Salute',
      'next_peak': 'Next high tide',
      'next_minimum': 'Next low tide',
      'feet_dry_all': 'All streets and squares are completely dry.',
      'feet_wet_warning': 'Watch out in St. Mark square: sustained high tide.',
      'passerelle_active_notice': 'Elevated walkways installed on critical routes.',
      'open_passerelle_map': 'View walkways',
      'my_stops': 'My Saved Docks',
      'no_favorites_hint': 'Save up to 2 favorite docks in Move to see them here.',
      'see_all_departures': 'All departures',
      'live_indicator': 'Real-time',
      'scheduled_indicator': 'Scheduled',
      'min_remaining': 'min',
      'now_arriving': 'Arriving',

      // Move Screen
      'move_title': 'Move',
      'subtab_route': 'Directions',
      'subtab_stops': 'Water buses',
      'origin_hint': 'From (e.g. Current location)',
      'destination_hint': 'To (e.g. St. Mark Square)',
      'mode_boat_walk': 'Boat + Walk',
      'mode_walk_only': 'Walk only',
      'mode_no_steps': 'Avoid steps',
      'route_safe_tide': 'Dry route with current tide level.',
      'route_wet_tide_warning': 'Warning: a section may be flooded.',
      'search_stop_placeholder': 'Search dock (e.g. Ferrovia, Rialto, Lido)...',
      'pier_label': 'Pier',
      'direction_to': 'Towards',

      // Water Screen
      'water_title': 'Tide & Lagoon',
      'tide_level_current': 'Current level',
      'tide_category_normal': 'Normal Tide',
      'tide_category_sustained': 'Sustained Tide',
      'tide_category_very_sustained': 'Very Sustained Tide',
      'tide_category_exceptional': 'Exceptional Tide',
      'tide_forecast_title': '48-hour forecast (CPSM)',
      'flooded_ground_label': 'Flooded ground',
      'passerelle_section_title': 'Elevated walkways (Passerelle)',
      'passerelle_status_dismantled': 'Not installed (ordinary level)',
      'passerelle_status_mounted': 'Installed on main routes',
      'mose_section_title': 'MOSE Barriers',
      'mose_status_rest': 'Resting (Open inlets)',
      'mose_status_active': 'Active (Closed inlets)',
      'mose_explanation': 'Barriers are raised when open-sea tide exceeds alert threshold (+110/+120 cm).',
      'open_vod_simulator': 'Open MOSE Simulator on VOD Web',

      // More Screen
      'more_title': 'More',
      'settings_section': 'Preferences',
      'language_label': 'Language',
      'tide_alert_toggle': 'High tide alert',
      'tide_alert_threshold': 'Alert if forecast exceeds',
      'sources_section': 'Data Sources & Open Data',
      'source_cpsm': 'Tide Data: City of Venice - CPSM',
      'source_actv': 'Transit: AVM / ACTV SpA (GTFS Open Data)',
      'source_passerelle': 'Walkways: City of Venice Public Works',
      'open_source_notice': 'Open Source Venice Open Data Project',
      'safety_disclaimer': 'Venice Open Data is not an official emergency channel. During severe weather, always follow City of Venice and CPSM alerts.',
      'offline_banner': 'Offline mode. Displaying last synchronized data.',
    },
  };

  String text(String key) {
    final lang = _localizedValues.containsKey(locale) ? locale : 'it';
    return _localizedValues[lang]?[key] ?? _localizedValues['it']?[key] ?? key;
  }
}
