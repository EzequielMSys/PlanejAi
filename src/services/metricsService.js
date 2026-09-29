const startedAt = Date.now();
const counters = new Map();
let inFlight = 0;
let totalRequests = 0;
let totalDurationMs = 0;

function beginRequest() {
  inFlight += 1;
}

function finishRequest({ method, route, status, durationMs }) {
  inFlight = Math.max(0, inFlight - 1);
  totalRequests += 1;
  totalDurationMs += durationMs;
  const key = `${method} ${route} ${status}`;
  counters.set(key, (counters.get(key) || 0) + 1);
}

function snapshot() {
  const memory = process.memoryUsage();
  const errors = [...counters.entries()]
    .filter(([key]) => /\s[45]\d\d$/.test(key))
    .reduce((sum, [, value]) => sum + value, 0);
  return {
    started_at: new Date(startedAt).toISOString(),
    uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
    requests: {
      total: totalRequests,
      in_flight: inFlight,
      errors,
      average_duration_ms: totalRequests
        ? Number((totalDurationMs / totalRequests).toFixed(2))
        : 0,
      by_route_status: Object.fromEntries(counters),
    },
    memory: {
      rss_mb: Number((memory.rss / 1024 / 1024).toFixed(2)),
      heap_used_mb: Number((memory.heapUsed / 1024 / 1024).toFixed(2)),
      heap_total_mb: Number((memory.heapTotal / 1024 / 1024).toFixed(2)),
    },
  };
}

module.exports = { beginRequest, finishRequest, snapshot };
