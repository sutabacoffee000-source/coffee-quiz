/* ブラックエプロン・デイリードリル: 簡易サービスワーカー
   オフラインでも開けるように、主要ファイルをキャッシュしておく。
   問題データは index.html の中に埋め込まれているため、
   index.html をキャッシュすればクイズ自体はオフラインでも遊べる。 */

const CACHE_NAME = 'ba-drill-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

/* ネットワーク優先、失敗したらキャッシュにフォールバック
   （更新は最新を優先しつつ、電波が無い/圏外でも開けるようにする） */
self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        return response;
      })
      .catch(function(){
        return caches.match(event.request).then(function(cached){
          return cached || caches.match('./index.html');
        });
      })
  );
});
