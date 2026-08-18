export function registerServiceWorker() {
  if (!('serviceWorker' in window.navigator) || import.meta.env.DEV) return
  window.addEventListener('load', () => {
    window.navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch((error) => console.warn('[PWA] Service worker não registrado:', error.message))
  })
}
