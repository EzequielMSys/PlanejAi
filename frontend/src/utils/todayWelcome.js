import { scopedCacheKey } from './offlineStore'

export function readTodayVisit() {
  try { return localStorage.getItem(scopedCacheKey('today-last-visit:v1')) } catch { return null }
}
export function rememberTodayVisit() {
  try { localStorage.setItem(scopedCacheKey('today-last-visit:v1'), new Date().toISOString()) } catch { /* Personalização opcional; não impede estudar. */ }
}
export function todayWelcome({firstStudy, resume, lastVisit, now = Date.now()}) {
  if (firstStudy) return {kind:'first',title:'Seu espaço começa com uma escolha.',text:'Escolha um primeiro passo. Você pode ajustar o caminho conforme descobrir o que funciona para você.'}
  if (resume) return {kind:'ongoing',title:'Seu fio de estudo está aqui.',text:'Há uma sessão aberta. Retome o material e as anotações sem precisar começar de novo.'}
  const previous = lastVisit ? Date.parse(lastVisit) : NaN
  if (Number.isFinite(previous) && now - previous >= 3 * 86400000 && previous <= now) return {kind:'return',title:'Bom ter você de volta.',text:'Faz alguns dias desde seu último acesso a esta tela neste aparelho. Escolha um passo possível para hoje, sem tentar compensar tudo.'}
  return {kind:'daily',title:'Um próximo passo, no seu ritmo.',text:'Seu plano e seus registros ajudam a escolher por onde começar hoje.'}
}
