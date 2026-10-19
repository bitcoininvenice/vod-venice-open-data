import { describe, expect, it } from 'vitest';
import { isInVeniceFrame, cleanBivLine, fetchBusitaliaVehicles } from './busoneBiv';

describe('busoneBiv', () => {
  it('isInVeniceFrame filtra correttamente le posizioni', () => {
    // Chioggia / Sottomarina (in laguna sud, dentro frame)
    expect(isInVeniceFrame(12.28, 45.22)).toBe(true);
    // Piazzale Roma / Mestre (dentro frame)
    expect(isInVeniceFrame(12.32, 45.44)).toBe(true);
    // Padova centro (fuori frame a ovest)
    expect(isInVeniceFrame(11.87, 45.40)).toBe(false);
  });

  it('cleanBivLine ripulisce codici linea Busitalia', () => {
    expect(cleanBivLine('BIV_53E', undefined, undefined)).toBe('53E');
    expect(cleanBivLine(undefined, 'LINEA_80E_C01', undefined)).toBe('80E');
    expect(cleanBivLine('54RE', undefined, undefined)).toBe('54RE');
    expect(cleanBivLine(undefined, undefined, 'Bus 58RE')).toBe('58RE');
  });

  it('fetchBusitaliaVehicles gestisce offline senza errori', async () => {
    const res = await fetchBusitaliaVehicles();
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.source).toContain('BusOne');
  });
});
