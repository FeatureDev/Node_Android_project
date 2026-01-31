// PWA install functionality
console.log('PWA install script loaded');

// Clear all caches on load
if ('caches' in window) {
    caches.keys().then((names) => {
        for (const name of names) {
            caches.delete(name);
        }
    });
    console.log('All caches cleared');
}

// Service worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Unregister old service workers first
        navigator.serviceWorker.getRegistrations().then((registrations) => {
            for (const registration of registrations) {
                registration.unregister();
            }
        }).then(() => {
            // Register new service worker
            navigator.serviceWorker.register('js/service-worker.js')
                .then(registration => {
                    console.log('SW registered:', registration);
                })
                .catch(err => console.log('SW registration failed:', err));
        });
    });
}
