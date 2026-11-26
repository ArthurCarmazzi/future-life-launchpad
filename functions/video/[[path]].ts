/**
 * GET /video/*  (Cloudflare Pages Function)
 *
 * Cloudflare's static hosting always returns a whole file, so browsers could play the videos but never
 * jump around in them (no "Range" support). This function serves the same files with byte-range support,
 * so the timeline can be scrubbed and playback starts without downloading the entire video first.
 */

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const CACHE = 'public, max-age=86400, stale-while-revalidate=604800';

export async function onRequest({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  // Always fetch the whole file from the static assets; a ranged request is answered from it below
  const asset = await env.ASSETS.fetch(new Request(request.url, { method: 'GET' }));
  if (!asset.ok) return asset;

  const data = await asset.arrayBuffer();
  const size = data.byteLength;
  const base: Record<string, string> = {
    'Content-Type': asset.headers.get('Content-Type') ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
    'Cache-Control': CACHE,
  };
  const etag = asset.headers.get('ETag');
  if (etag) base.ETag = etag;

  const header = request.headers.get('Range');
  const m = header ? /^bytes=(\d*)-(\d*)$/.exec(header.trim()) : null;

  // No (usable) Range header: the whole file
  if (!m || (m[1] === '' && m[2] === '')) {
    return new Response(request.method === 'HEAD' ? null : data, {
      status: 200,
      headers: { ...base, 'Content-Length': String(size) },
    });
  }

  let start: number;
  let end: number;
  if (m[1] === '') {
    // "bytes=-N": the last N bytes
    const n = Number(m[2]);
    start = Math.max(size - n, 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === '' ? size - 1 : Math.min(Number(m[2]), size - 1);
  }

  if (start >= size || start > end) {
    return new Response(null, { status: 416, headers: { ...base, 'Content-Range': `bytes */${size}` } });
  }

  const slice = data.slice(start, end + 1);
  return new Response(request.method === 'HEAD' ? null : slice, {
    status: 206,
    headers: { ...base, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(slice.byteLength) },
  });
}
