/**
 * Foto a livello strada di Mapillary (immagini CC BY-SA 4.0, © Mapillary e gli autori). Le posizioni delle foto
 * arrivano dal nostro server (/api/mapillary, con la chiave dell'API e una cache per riquadro); le miniature e il
 * visore si aprono solo quando si sceglie una foto, direttamente da Mapillary.
 */
import { PROVIDERS } from './provenance/providers';

export interface StreetPhoto {
  id: string;
  lon: number;
  lat: number;
  /** data dello scatto (epoch ms) */
  capturedAt: number | null;
  /** direzione della fotocamera in gradi */
  compass: number | null;
}

/** Lato del riquadro di richiesta (gradi): circa 400 m a Venezia */
export const PHOTO_TILE_DEG = 0.004;

export const tileKey = (lon: number, lat: number) => `${Math.floor(lon / PHOTO_TILE_DEG)}:${Math.floor(lat / PHOTO_TILE_DEG)}`;

/** Riquadri che coprono un'area (al massimo `max`, per non chiedere troppo insieme) */
export function tilesFor(w: number, s: number, e: number, n: number, max = 12): string[] {
  const out: string[] = [];
  for (let x = Math.floor(w / PHOTO_TILE_DEG); x <= Math.floor(e / PHOTO_TILE_DEG); x++) {
    for (let y = Math.floor(s / PHOTO_TILE_DEG); y <= Math.floor(n / PHOTO_TILE_DEG); y++) {
      out.push(`${x}:${y}`);
      if (out.length >= max) return out;
    }
  }
  return out;
}

export function tileBbox(key: string): [number, number, number, number] {
  const [x, y] = key.split(':').map(Number);
  return [x * PHOTO_TILE_DEG, y * PHOTO_TILE_DEG, (x + 1) * PHOTO_TILE_DEG, (y + 1) * PHOTO_TILE_DEG];
}

/** Pagina della foto sul sito di Mapillary (visore completo) */
export const mapillaryPhotoUrl = (id: string) => `${PROVIDERS.mapillary.url}/app/?pKey=${encodeURIComponent(id)}&focus=photo`;
