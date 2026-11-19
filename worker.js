export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/oauth/')) {
      if (!env.BACKEND_URL) {
        return new Response(
          JSON.stringify({ error: 'BACKEND_URL is not configured in Cloudflare Variables' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const targetBase = new URL(env.BACKEND_URL);
      const targetUrl = new URL(url.pathname + url.search, targetBase);

      const headers = new Headers(request.headers);
      headers.set('Host', targetBase.host);
      headers.set('X-Forwarded-Host', url.host);
      headers.set('X-Forwarded-Proto', 'https');

      const proxyReq = new Request(targetUrl.toString(), {
        method: request.method,
        headers,
        body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
        redirect: 'manual',
      });

      return fetch(proxyReq);
    }

    return env.ASSETS.fetch(request);
  },
};
