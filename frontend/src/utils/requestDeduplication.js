// Compartilha apenas leituras simultâneas. Não guarda resultados e não
// reaproveita uma resposta entre sessões, filtros ou operações de escrita.
export function deduplicateReads(adapter) {
  const pending = new Map()
  let generation = 0
  return (config) => {
    if (config.method !== 'get') {
      generation += 1
      return adapter(config)
    }
    if (config.signal || config.cancelToken || config.deduplicate === false) return adapter(config)
    const key = JSON.stringify([
      generation, config.baseURL, config.url, config.params,
      config.headers?.toJSON?.() || config.headers,
      config.responseType, config.timeout,
    ])
    if (!pending.has(key)) {
      const request = Promise.resolve().then(() => adapter(config))
      pending.set(key, request)
      request.then(() => pending.delete(key), () => pending.delete(key))
    }
    return pending.get(key).then((response) => ({ ...response, config }))
  }
}
