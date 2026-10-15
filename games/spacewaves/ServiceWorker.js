const cacheName = "do.Games-Space Waves-1.0-ms";
const contentToCache = [
    "Build/dae5c7bd2b15915f51ae4e56b8f5367d.loader.js",
    "Build/c699bc4c24abfbdb4c8b3e15b0af7d3f.framework.js.unityweb",
    "Build/568ea6b3af616bd57f419c508c933303.data.unityweb",
    "Build/7fb5141de5923189bc1dc5f94eb619f2.wasm.unityweb",
    "TemplateData/style.css"

];

self.addEventListener('install', function (e) {
    console.log('[Service Worker] Install');
    
    e.waitUntil((async function () {
      const cache = await caches.open(cacheName);
      console.log('[Service Worker] Caching all: app shell and content');
      await cache.addAll(contentToCache);
    })());
});

self.addEventListener('fetch', function (e) {
    e.respondWith((async function () {
      let response = await caches.match(e.request);
      console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
      if (response) { return response; }

      response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })());
});
