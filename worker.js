export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/oauth/')) {
      if (!env.BACKEND_URL || env.BACKEND_URL.includes('YOUR-LIBRECHAT-BACKEND-URL')) {
        return new Response(
          JSON.stringify({ error: 'BACKEND_URL is not configured on this Worker.' }),
          { status: 502, headers: { 'Content-Type': 'application/json' } },
        );
      }

      const targetUrl = new URL(url.pathname + url.search, env.BACKEND_URL);
      const headers = new Headers(request.headers);
      headers.set('X-Forwarded-Host', url.host);
      headers.set('X-Forwarded-Proto', 'https');

      return fetch(
        new Request(targetUrl, {
          method: request.method,
          headers,
          body: request.body,
          redirect: 'manual',
        }),
      );
    }

    return env.ASSETS.fetch(request);
  },
};
