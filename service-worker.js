// ============================================================
//  service-worker.js — Fin.Control PWA
//  Cache offline de todos os assets principais
// ============================================================

var CACHE_NAME = 'fincontrol-v1';

var ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/credores.js',
  '/js/data.js',
  '/js/ui.js',
  '/js/gerencial.js',
  '/js/app.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap'
];

// ── Instala e faz cache dos assets ────────────────────────
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Ativa e limpa caches antigos ──────────────────────────
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// ── Intercepta requisições ────────────────────────────────
// Estratégia: Network first, cache como fallback
self.addEventListener('fetch', function(e) {
  // Ignora requisições não-GET e Apps Script
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Atualiza cache com versão mais recente
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        // Sem internet → usa cache
        return caches.match(e.request);
      })
  );
});
