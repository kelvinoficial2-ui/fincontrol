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
        return caches.match(e.request);a// ============================================================
//  service-worker.js — Fin.Control PWA v4
// ============================================================

var CACHE_NAME = 'fincontrol-v4';
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
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png'
];

// URLs externas que NUNCA devem ser interceptadas
var BYPASS = [
  'firebaseio.com',
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'gstatic.com',
  'googleapis.com',
  'brapi.dev',
  'hgbrasil.com',
  'script.google.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k)   { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;

  var url = e.request.url;

  // Deixa passar sem interceptar URLs externas
  for (var i = 0; i < BYPASS.length; i++) {
    if (url.indexOf(BYPASS[i]) !== -1) return;
  }

  // Para arquivos locais: tenta rede primeiro, cache como fallback
  e.respondWith(
    fetch(e.request)
      .then(function(response) {
        // Atualiza cache com versão mais nova
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(function() {
        // Sem internet — usa cache
        return caches.match(e.request).then(function(cached) {
          return cached || new Response('Offline', { status: 503 });
        });
      })
  );
});
      })
  );
});
