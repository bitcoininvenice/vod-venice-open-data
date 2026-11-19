import { mcpQrSvg } from '@/lib/mcp/qr';

// Generato una volta in fase di build e servito dalla CDN: l'indirizzo del server non cambia tra le richieste
export const dynamic = 'force-static';

export async function GET() {
  return new Response(await mcpQrSvg(), {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  });
}
