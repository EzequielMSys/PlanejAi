const DB = 'planejai-offline-v1', VERSION = 1
const syncs = new Map()

export function currentUser() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null')
    return String(user?.id_usuario || user?.id || 'anonymous')
  } catch { return 'anonymous' }
}
export function scopedCacheKey(key) { return `${currentUser()}:${key}` }
function changed() { window.dispatchEvent(new window.CustomEvent('planejai:offline-change')) }
function open() {
  return new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('cache')) db.createObjectStore('cache', { keyPath: 'key' })
      if (!db.objectStoreNames.contains('queue')) db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
async function store(name, mode, action) {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(name, mode)
    const result = action(tx.objectStore(name))
    tx.oncomplete = () => { db.close(); resolve(result?.result) }
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
export function cachePut(key, data) { return store('cache', 'readwrite', s => s.put({ key, data, savedAt: Date.now() })) }
export function cacheGet(key) { return store('cache', 'readonly', s => s.get(key)) }
export async function enqueue(request) {
  const id = await store('queue', 'readwrite', s => s.add({ ...request, owner: currentUser(), createdAt: Date.now(), status: 'PENDING' }))
  changed()
  return id
}
export function listQueue() { return store('queue', 'readonly', s => s.getAll()) }
export function removeQueue(id) { return store('queue', 'readwrite', s => s.delete(id)) }
export function markConflict(item, message) { return store('queue', 'readwrite', s => s.put({ ...item, status: 'CONFLICT', message })) }
export async function clearOfflineData() {
  const db = await open()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['cache', 'queue'], 'readwrite')
    tx.objectStore('cache').clear()
    tx.objectStore('queue').clear()
    tx.oncomplete = () => { db.close(); changed(); resolve() }
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error) }
  })
}
async function sendQueue(owner) {
  let synced = 0, conflicts = 0
  const items = await listQueue()
  for (const item of items.filter(i => i.status === 'PENDING' && i.owner === owner)) {
    // Never replay another account's work after logout or a switch of account.
    const token = localStorage.getItem('token')
    if (currentUser() !== owner || !token) break
    try {
      const response = await fetch(`${item.baseURL}${item.url}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`,
          ...(item.idempotencyKey ? { 'Idempotency-Key': item.idempotencyKey } : {}) },
        body: item.data === undefined ? undefined : JSON.stringify(item.data),
      })
      if (response.status === 409) {
        const body = await response.json().catch(() => ({}))
        if (body.code === 'IDEMPOTENCY_IN_PROGRESS') continue
        await markConflict(item, 'O servidor possui uma versão diferente. Revise antes de reenviar.')
        conflicts++
        continue
      }
      if (response.status === 401 || response.status === 403) {
        await markConflict(item, 'A sessão ou a permissão mudou. Entre novamente antes de revisar este envio.')
        conflicts++
        continue
      }
      if (!response.ok) continue
      await removeQueue(item.id)
      synced++
    } catch { /* Keep the same item and idempotency key for the next attempt. */ }
  }
  window.dispatchEvent(new window.CustomEvent('planejai:offline-sync', { detail: { synced, conflicts } }))
  changed()
  return { synced, conflicts }
}
export function syncQueue() {
  const owner = currentUser()
  if (!window.navigator.onLine || owner === 'anonymous') return Promise.resolve({ synced: 0, conflicts: 0 })
  if (syncs.has(owner)) return syncs.get(owner)
  // Web Locks serialize across tabs; the shared promise also covers browsers without this API.
  const run = () => currentUser() === owner ? sendQueue(owner) : { synced: 0, conflicts: 0 }
  const task = Promise.resolve().then(() => window.navigator.locks
    ? window.navigator.locks.request(`planejai:sync:${owner}`, run) : run())
    .finally(() => syncs.delete(owner))
  syncs.set(owner, task)
  return task
}
