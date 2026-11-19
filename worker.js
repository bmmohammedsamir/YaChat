import { DurableObject } from 'cloudflare:workers';

export class LibreChatBackend extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.env = env;
  }

  async ensureRunning() {
    const container = this.ctx.container;
    if (!container.running) {
      container.start({
        enableInternet: true,
        env: {
          HOST: '0.0.0.0',
          PORT: '3080',
          NODE_ENV: 'production',
          DOMAIN_CLIENT: 'https://yachat.bm-mohammed-samir.workers.dev',
          DOMAIN_SERVER: 'https://yachat.bm-mohammed-samir.workers.dev',
          MONGO_URI: this.env.MONGO_URI,
          CREDS_KEY: this.env.CREDS_KEY,
          CREDS_IV: this.env.CREDS_IV,
          JWT_SECRET: this.env.JWT_SECRET,
          JWT_REFRESH_SECRET: this.env.JWT_REFRESH_SECRET,
          ALLOW_REGISTRATION: 'true',
          SEARCH: 'false',
        },
      });
    }
    await container.setInactivityTimeout(10 * 60 * 1000);

    const port = container.getTcpPort(3080);
    for (let i = 0; i < 60; i++) {
      try {
        const res = await port.fetch('http://container/api/config', {
          signal: AbortSignal.timeout(1000),
        });
        await res.body?.cancel();
        return port;
      } catch {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw new Error('LibreChat backend container failed to start on port 3080');
  }

  async fetch(request) {
    const port = await this.ensureRunning();
    const url = new URL(request.url);
    url.protocol = 'http:';
    url.host = 'container';
    const forwarded = new Request(url, request);
    forwarded.headers.set('X-Forwarded-Host', new URL(request.url).host);
    forwarded.headers.set('X-Forwarded-Proto', 'https');
    return port.fetch(forwarded);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/oauth/')) {
      const stub = env.BACKEND.getByName('primary');
      return stub.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
