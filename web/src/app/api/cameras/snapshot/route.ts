import { NextRequest, NextResponse } from 'next/server';
import { VENICE_CAMERAS } from '@/lib/cameras-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const urlParam = searchParams.get('url');

  let targetUrl: string | undefined = undefined;

  if (id) {
    const cam = VENICE_CAMERAS.find((c) => c.id === id);
    if (cam?.snapshotUrl) {
      targetUrl = cam.snapshotUrl;
    }
  } else if (urlParam && urlParam.startsWith('https://cdn.skylinewebcams.com/')) {
    targetUrl = urlParam;
  }

  if (!targetUrl) {
    return new NextResponse('Snapshot not found', { status: 404 });
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        'Referer': 'https://www.skylinewebcams.com/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return new NextResponse(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    if (!contentType.includes('image')) {
      return new NextResponse('Invalid content type from upstream', { status: 502 });
    }

    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=30',
        'Cross-Origin-Resource-Policy': 'cross-origin'
      }
    });
  } catch (error) {
    console.error('Snapshot proxy error:', error);
    return new NextResponse('Internal error fetching snapshot', { status: 500 });
  }
}
