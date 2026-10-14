/* Service worker do SISTCS Leve.
 * Só guarda arquivos do próprio app (tela inicial, scripts, estilos, imagens) para abrir rápido e sem internet.
 * Nada de dados de saúde é guardado aqui: Supabase, Open Food Facts e fontes passam direto pela rede. */
const VERSION = 'v5';
const SHELL = `sistcs-shell-${VERSION}`;
const RUNTIME = `sistcs-runtime-${VERSION}`;
const MAX_RUNTIME_ENTRIES = 80;
const SHELL_FILES = ['./', './manifest.webmanifest', './icon-192.png', './logo.webp', './emblem.webp'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_FILES)));
  // Sem skipWaiting aqui: a nova versão espera o usuário aceitar a atualização.
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([SHELL, RUNTIME]);
      for (const key of await caches.keys()) if (key.startsWith('sistcs-') && !keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}


/* Push receiver: works while the installed PWA is closed once a valid server-side
 * subscription and VAPID sender are configured. Never put health details in push text. */
self.addEventListener('push', (event) => {
  event.waitUntil((async () => {
    let payload = {};
    try {
      if (event.data) payload = event.data.json();
    } catch {
      payload = { body: event.data ? event.data.text() : '' };
    }
    const title = typeof payload.title === 'string' && payload.title.trim()
      ? payload.title.trim().slice(0, 80)
      : 'SISTCS Leve';
    const body = typeof payload.body === 'string'
      ? payload.body.trim().slice(0, 180)
      : 'Você tem uma notificação.';
    const rawUrl = typeof payload.url === 'string' ? payload.url : './';
    let url = new URL('./', self.registration.scope);
    try {
      const candidate = new URL(rawUrl, self.registration.scope);
      if (candidate.origin === self.location.origin) url = candidate;
    } catch {
      // Invalid destinations fall back to the app home.
    }
    await self.registration.showNotification(title, {
      body,
      icon: new URL('icon-192.png', self.registration.scope).href,
      badge: new URL('icon-192.png', self.registration.scope).href,
      tag: typeof payload.tag === 'string' ? payload.tag.slice(0, 80) : 'sistcs-leve',
      data: { url: url.href },
      renotify: false,
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const rawUrl = event.notification.data && typeof event.notification.data.url === 'string'
      ? event.notification.data.url
      : './';
    let target = new URL('./', self.registration.scope);
    try {
      const candidate = new URL(rawUrl, self.registration.scope);
      if (candidate.origin === self.location.origin) target = candidate;
    } catch {
      // Invalid destinations fall back to the app home.
    }
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin === self.location.origin) {
        await client.navigate(target.href);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target.href);
    return undefined;
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, Open Food Facts, fontes etc.: direto da rede

  // Abrir o app: rede primeiro; sem internet, usa a tela inicial guardada.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh.ok) (await caches.open(SHELL)).put('./', fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match('./', { cacheName: SHELL });
          return cached || new Response('Sem conexão. Abra o app novamente quando estiver online.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
        }
      })(),
    );
    return;
  }

  // Scripts, estilos e imagens do app: usa o guardado e atualiza em segundo plano.
  event.respondWith(
    (async () => {
      const cache = await caches.open(RUNTIME);
      const cached = (await cache.match(req)) || (await caches.match(req, { cacheName: SHELL }));
      const network = fetch(req)
        .then((res) => {
          if (res.ok) {
            cache.put(req, res.clone()).then(() => trim(RUNTIME, MAX_RUNTIME_ENTRIES));
          }
          return res;
        })
        .catch(() => null);
      return cached || (await network) || new Response('', { status: 504 });
    })(),
  );
});
