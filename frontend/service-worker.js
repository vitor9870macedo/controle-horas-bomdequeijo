const CACHE_NAME = 'bom-de-queijo-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/admin.html',
  '/pages/funcionario.html',
  '/css/style.css',
  '/js/app.js',
  '/js/admin.js',
  '/js/supabase-config.js'
];

// Instalação - cacheia arquivos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - tenta rede primeiro, depois cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se resposta válida, clona e atualiza cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Se rede falhar, busca no cache
        return caches.match(event.request);
      })
  );
});
