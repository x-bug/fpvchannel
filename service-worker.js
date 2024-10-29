self.addEventListener('install', function(event) {
    console.log('Service Worker installiert.');
});

self.addEventListener('activate', function(event) {
    console.log('Service Worker aktiviert.');
});