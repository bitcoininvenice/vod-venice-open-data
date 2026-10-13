import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Marchio di VOD (sagoma bianca della laguna), incorporato nell'immagine
const LOGO = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public', 'logo-mark.png')).toString('base64')}`;

// Anteprima per social e messaggistica (1200×630), generata durante il build
export const alt = 'VOD – Venice Open Data: mappa di Venezia con vaporetti in tempo reale, marea e open data';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: 'linear-gradient(135deg, #0b1620 0%, #0f2a3a 55%, #134e5e 100%)',
          color: '#e6f4f1',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: '#0a0f1d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={LOGO} width={62} height={62} alt="" />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: -0.5 }}>VOD – Venice Open Data</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 64, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>La mappa aperta di Venezia</div>
          <div style={{ fontSize: 30, color: '#a5d8e2', lineHeight: 1.35 }}>
            Vaporetti in tempo reale · marea e acqua alta · come arrivare · numeri civici · open data con fonte e licenza
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          {['#FF0000', '#B43B96', '#8FD2BF', '#DAD635', '#006BB7', '#009366'].map((c) => (
            <div key={c} style={{ width: 90, height: 10, borderRadius: 5, background: c }} />
          ))}
        </div>
      </div>
    ),
    size,
  );
}
