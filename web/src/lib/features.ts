/**
 * Funzionalità di VOD mostrate nella pagina /features: gruppo, icona, link «Prova» (la mappa già nello
 * stato giusto: ?open= apre uno strumento, ?preset= / ?layers= accendono i livelli) ed eventuale link
 * di approfondimento. Titoli e descrizioni sono in ui.featuresPage.<id>_title / <id>_desc.
 */
export type FeatureIcon =
  | 'route' | 'radio' | 'navigation' | 'anchor' | 'palette' | 'ship' | 'waves' | 'droplets' | 'search' | 'mapPin'
  | 'clock' | 'layers' | 'sun' | 'box' | 'thermometer' | 'share' | 'chart' | 'users' | 'construction' | 'download'
  | 'activity' | 'code' | 'bot' | 'package' | 'shield' | 'alert';

export interface Feature {
  id: string;
  icon: FeatureIcon;
  /** link «Prova» */
  href: string;
  /** link di approfondimento facoltativo (pagina o documentazione) */
  more?: string;
}

export interface FeatureGroup {
  id: 'move' | 'water' | 'search' | 'explore' | 'data' | 'developers' | 'trust';
  features: Feature[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'move',
    features: [
      { id: 'planner', icon: 'route', href: '/?open=planner' },
      { id: 'realtime', icon: 'radio', href: '/?layers=vaporetti_realtime', more: '/layers#vaporetti_realtime' },
      { id: 'tripHighlight', icon: 'navigation', href: '/?layers=vaporetti_realtime,vaporetti_live,rotte_actv' },
      { id: 'arrivals', icon: 'anchor', href: '/?layers=fermate_actv' },
      { id: 'lineColors', icon: 'palette', href: '/?layers=rotte_actv,vaporetti_live' },
      { id: 'fleet', icon: 'ship', href: '/?layers=alilaguna,navi_ais,voli_vce' },
    ],
  },
  {
    id: 'water',
    features: [
      { id: 'tide', icon: 'waves', href: '/?preset=acqua-alta' },
      { id: 'floodSim', icon: 'droplets', href: '/?open=tide' },
    ],
  },
  {
    id: 'search',
    features: [
      { id: 'globalSearch', icon: 'search', href: '/?open=search' },
      { id: 'civic', icon: 'mapPin', href: '/?open=search&q=Cannaregio%203450' },
    ],
  },
  {
    id: 'explore',
    features: [
      { id: 'layers', icon: 'layers', href: '/?preset=citta', more: '/layers' },
      { id: 'timeline', icon: 'clock', href: '/?layers=vaporetti_live,rotte_actv' },
      { id: 'themes', icon: 'sun', href: '/' },
      { id: 'view3d', icon: 'box', href: '/' },
      { id: 'weather', icon: 'thermometer', href: '/' },
      { id: 'share', icon: 'share', href: '/?preset=servizi' },
    ],
  },
  {
    id: 'data',
    features: [
      { id: 'metrics', icon: 'chart', href: '/metrics' },
      { id: 'residents', icon: 'users', href: '/metrics' },
      { id: 'spatial', icon: 'construction', href: '/?open=spatial' },
      { id: 'export', icon: 'download', href: '/?open=export' },
      { id: 'sources', icon: 'activity', href: '/sources' },
    ],
  },
  {
    id: 'developers',
    features: [
      { id: 'api', icon: 'code', href: '/api/datasets', more: '/llms.txt' },
      { id: 'mcp', icon: 'bot', href: '/mcp' },
      { id: 'skill', icon: 'package', href: '/downloads/venice-open-data-skill.zip', more: '/mcp' },
    ],
  },
  {
    id: 'trust',
    features: [
      { id: 'provenance', icon: 'shield', href: '/layers' },
      { id: 'curated', icon: 'alert', href: '/layers' },
    ],
  },
];

export const FEATURE_COUNT = FEATURE_GROUPS.reduce((n, g) => n + g.features.length, 0);
