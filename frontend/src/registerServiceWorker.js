export function registerServiceWorker() {
  if (!('serviceWorker' in window.navigator)) return

  if (import.meta.env.DEV) {
    // Um service worker instalado por uma build anterior pode continuar
    // controlando o localhost e servir JavaScript antigo durante o desenvolvimento.
    window.navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .then(() => window.caches?.keys())
      .then((keys = []) => Promise.all(
        keys
          .filter((key) => key.startsWith('planejai-shell-'))
          .map((key) => window.caches.delete(key)),
      ))
      .catch((error) => console.warn('[PWA] Não foi possível limpar o cache de desenvolvimento:', error.message))
    return
  }

  window.addEventListener('load', () => {
    window.navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => console.warn('[PWA] Service worker não registrado:', error.message))
  })
}
