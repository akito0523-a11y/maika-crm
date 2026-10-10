'use strict';
// Change VERSION whenever any shell asset changes. Waiting workers activate only
// after the old app is closed, so an open form is never forcibly reloaded.
const VERSION = '1.0.1';
const PREFIX = 'maika-crm:' + self.registration.scope + ':';
const CACHE = PREFIX + VERSION;
const ASSETS = ['./', './index.html', './app.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
const URLS = new Set(ASSETS.map(asset => new URL(asset, self.registration.scope).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(
    [...URLS].map(url => new Request(url, {cache: 'reload'}))
  )));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  // Cache only the public app shell. No customer records, backups, or TXT files.
  if (!URLS.has(url.href)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.href);
    return cached || fetch(event.request);
  }));
});
