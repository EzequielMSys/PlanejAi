import { onCLS, onINP, onLCP } from 'web-vitals'
import { apiUrl } from '../config/api'

const endpoint = apiUrl('/api/operacoes/vitals')
const knownRoutes = new Set(['/', '/login', '/register', '/esqueci-senha', '/redefinir-senha', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/lumi', '/chat', '/estudar', '/planejamento-inteligente', '/minha-jornada', '/perfil', '/preferencias', '/status', '/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono', '/dono/usuarios', '/onboarding', '/primeiro-acesso', '/alterar-senha', '/minhas-atividades', '/minhas-turmas', '/avisos', '/minhas-turmas/:id'])

function routeFromHash() {
  const route = window.location.hash.slice(1).split('?')[0] || '/'
  if (/^\/minhas-turmas\/\d+$/.test(route)) return '/minhas-turmas/:id'
  return knownRoutes.has(route) ? route : null
}

function report(name, route, value) {
  if (!route || !Number.isFinite(value)) return
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, route, value: Number(value.toFixed(name === 'CLS' ? 4 : 0)) }),
    keepalive: true,
    credentials: 'omit',
  }).catch(() => {})
}

function trackRouteReady() {
  let cancelCurrent = () => {}
  const onNavigation = () => {
    cancelCurrent()
    const route = routeFromHash()
    if (!route) return
    const oldMain = document.querySelector('main')
    const start = performance.now()
    let frame = 0
    const check = () => {
      const main = document.querySelector('main')
      if (main && main !== oldMain && main.querySelector('h1')) {
        requestAnimationFrame(() => report('ROUTE_READY', route, performance.now() - start))
        return
      }
      if (performance.now() - start < 10000) frame = requestAnimationFrame(check)
    }
    frame = requestAnimationFrame(check)
    cancelCurrent = () => window.cancelAnimationFrame(frame)
  }
  window.addEventListener('hashchange', onNavigation)
}

export function startFieldMetrics() {
  const initialRoute = routeFromHash()
  if (initialRoute) {
    onLCP((metric) => report('LCP', initialRoute, metric.value))
    onCLS((metric) => report('CLS', initialRoute, metric.value))
    onINP((metric) => report('INP', initialRoute, metric.value))
  }
  trackRouteReady()
}
