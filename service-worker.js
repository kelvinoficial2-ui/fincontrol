// ============================================================
//  service-worker.js — Fin.Control PWA
// ============================================================

var CACHE_NAME = 'fincontrol-v3'; // ← versão atualizada
var BASE = '/fincontrol';

var ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/css/style.css',
  BASE + '/js/credores.js',
  BASE + '/js/data.js',
  BASE + '/js/ui.js',
  BASE + '/js/gerencial.js',
  BASE + '/js/mensal.js',
  BASE + '/js/ticker.js',
  BASE + '/js/firebase.js',
  BASE + '/js/app.js',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('script.google.com')) return;
  if (e.request.url.includes('firebase')) return; // Firebase sempre online
  if (e.request.url.includes('brapi.dev')) return;
  if (e.request.url.includes('gstatic.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(e.request, clone);
        });
        return response;
      })
      .catch(function() {
        return caches.match(e.request);
      })
  );
});
