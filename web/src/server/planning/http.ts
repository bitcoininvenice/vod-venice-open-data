import 'server-only';
import { NextResponse } from 'next/server';
import type { ServiceResult } from './services';

/** Primo parametro presente tra i nomi indicati (italiano e inglese) */
export function param(url: URL, ...names: string[]): string | null {
  for (const n of names) {
    const v = url.searchParams.get(n);
    if (v !== null && v.trim() !== '') return v.trim().slice(0, 120);
  }
  return null;
}

export function numberParam(url: URL, ...names: string[]): number | null {
  const v = param(url, ...names);
  if (v === null) return null;
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Risposta JSON di un servizio: errori espliciti con stato HTTP, mai cache condivisa (dipende dall'ora) */
export function respond(r: ServiceResult): NextResponse {
  if (!r.ok) return NextResponse.json({ success: false, error: r.error, message: r.message }, { status: r.status, headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ success: true, ...r.body, computedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
