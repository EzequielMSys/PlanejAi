let csrfToken = null
let generation = 0
export function setCsrfToken(value) { csrfToken = value || null; generation += 1 }
export function getCsrfToken() { return csrfToken }
export function sessionGeneration() { return generation }
