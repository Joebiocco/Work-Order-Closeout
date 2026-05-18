/* ============================================================
   service-worker.js  —  Field Tools Hub offline cache
   Cache-first for local assets; network-first for CDN libs.
   ============================================================ */

const CACHE = 'ft-v1';

// Local assets to pre-cache on install
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './pages/njsearch.html',
  './pages/njfuel.html',
  './pages/WorkOrderCloseout.html',
  './data/njfuel.json',
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(LOCAL_ASSETS).catch(function() {
        // If any asset fails, continue anyway
        return Promise.all(LOCAL_ASSETS.map(function(url) {
          return c.add(url).catch(function() {});
        }));
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  var url = e.request.url;

  // For local pages and data: cache-first (works fully offline)
  var isLocal = url.startsWith(self.location.origin);
  if (isLocal) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(resp) {
          if (resp && resp.ok) {
            var clone = resp.clone();
            caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
          }
          return resp;
        }).catch(function() { return cached; });
      })
    );
    return;
  }

  // For CDN resources (Leaflet, html2canvas, jsPDF, fonts): network-first,
  // fall back to cache so offline use still works after first load.
  var isCDN = url.includes('unpkg.com') || url.includes('cdnjs.cloudflare.com') ||
              url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
  if (isCDN) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        if (resp && resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
  }
});
