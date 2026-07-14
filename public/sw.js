const CACHE_NAME = "lecturametrica-v2";

const STATIC_FILES = [
  "/",
  "/IconoLecturaMetrica.svg",
  "/IconoLecturaMetrica.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of STATIC_FILES) {
        try {
          await cache.add(url);
        } catch (error) {
          console.warn("No se pudo guardar en caché:", url, error);
        }
      }
    }),
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      ),
    ),
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      const cached = await caches.match(event.request);
      return cached ?? caches.match("/");
    }),
  );
});