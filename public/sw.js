self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Try to find an existing window to focus
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/dashboard') || client.url.includes('/casual') || client.url.includes('/naughty') || client.url.includes('/academics')) {
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/dashboard');
      }
    })
  );
});

// We can optionally handle push events here if we add Web Push later
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icon.png', // Add icon if available later
        badge: '/badge.png',
      })
    );
  }
});
