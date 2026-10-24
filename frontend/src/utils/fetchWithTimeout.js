export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new window.AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  try { return await fetch(url, { ...options, signal: controller.signal }) }
  finally { window.clearTimeout(timer) }
}
