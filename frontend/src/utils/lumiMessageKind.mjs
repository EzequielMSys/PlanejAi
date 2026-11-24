export function hasMath(content) {
  return /\$\$|\$[^$\n]+\$|\\\(|\\\[|\\ce\{/.test(String(content || ''))
}
