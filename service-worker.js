const CACHE_NAME = 'photo-booth-v1';
const CACHE = [
    'index.html',
    'public/images/android-chrome-192x192.png',
    'public/images/android-chrome-512x512.png',
    'public/images/apple-touch-icon.png',
    'public/images/favicon-32x32.png',
    'public/images/favicon-16x16.png',
    'public/styles/normalize.css',
    'public/styles/global.css',
    'public/scripts/media-capture.js',
    'public/scripts/global.js'
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        // cache files necessary for offline operation
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.addAll(CACHE);
        })
    );
});

// todo: implement cache-update-request strategy
// https://github.com/mdn/serviceworker-cookbook/blob/master/strategy-cache-update-and-refresh/service-worker.js
// todo: include update notification if files are out of date