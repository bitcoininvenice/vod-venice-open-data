import QRCode from 'qrcode';
import { describe, expect, it } from 'vitest';
import { MCP_ENDPOINT, MCP_QR_URL } from '@/lib/site';
import { mcpQrSvg } from './qr';

describe('QR del server MCP', () => {
  it('punta all\'alias /mcp, che fa da server MCP e da pagina di istruzioni', () => {
    expect(MCP_QR_URL).toBe(MCP_ENDPOINT.replace(/\/api\/mcp$/, '/mcp'));
    expect(MCP_QR_URL).toMatch(/^https:\/\//);
  });

  it('codifica esattamente l\'indirizzo, senza parametri aggiunti', () => {
    const qr = QRCode.create(MCP_QR_URL, { errorCorrectionLevel: 'M' });
    // Un URL viene codificato in modalità byte: i dati del segmento sono i byte UTF-8
    const data = qr.segments.map((s) => (typeof s.data === 'string' ? s.data : new TextDecoder().decode(s.data as Uint8Array))).join('');
    expect(data).toBe(MCP_QR_URL);
  });

  it('produce un SVG nero su bianco', async () => {
    const svg = await mcpQrSvg();
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('#ffffff');
    expect(svg).toContain('#000000');
  });
});
