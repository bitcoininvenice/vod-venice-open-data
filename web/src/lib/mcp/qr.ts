import QRCode from 'qrcode';
import { MCP_QR_URL } from '@/lib/site';

/**
 * QR del server MCP in SVG: moduli neri su fondo bianco anche nel tema scuro (le fotocamere leggono
 * male i QR invertiti), correzione d'errore media e margine di 2 moduli.
 */
export function mcpQrSvg(url: string = MCP_QR_URL): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });
}
