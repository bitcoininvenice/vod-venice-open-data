import { describe, expect, it } from 'vitest';
import { MAX_TOOL_INPUT_ELEMENTS } from '@/lib/mcp/server';
import { POST } from './route';

const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
  'MCP-Protocol-Version': '2025-06-18',
};

function rpc(method: string, params: unknown, id = 1): Request {
  return new Request('http://localhost/api/mcp', {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
  });
}

describe('limiti del server MCP', () => {
  it('rifiuta con 413 un corpo grande inviato a pezzi, senza Content-Length', async () => {
    const chunk = new TextEncoder().encode('x'.repeat(64_000));
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (sent >= 5) return controller.close();
        sent += 1;
        controller.enqueue(chunk);
      },
    });
    const request = new Request('http://localhost/api/mcp', { method: 'POST', headers: HEADERS, body, duplex: 'half' } as RequestInit);
    expect(request.headers.get('content-length')).toBeNull();
    const res = await POST(request);
    expect(res.status).toBe(413);
  });

  it('respinge gli argomenti di un tool con troppi campi prima di validarli', async () => {
    const args: Record<string, string> = { query: 'Rialto' };
    for (let i = 0; i <= MAX_TOOL_INPUT_ELEMENTS; i += 1) args[`k${i}`] = 'x';
    const res = await POST(rpc('tools/call', { name: 'find_place', arguments: args }));
    const text = await res.text();
    expect(text).toContain('"isError":true');
  });

  it('una chiamata normale passa', async () => {
    const res = await POST(rpc('tools/call', { name: 'find_place', arguments: { query: 'Rialto' } }));
    expect(res.ok).toBe(true);
    expect(await res.text()).not.toContain('"isError":true');
  });
});
