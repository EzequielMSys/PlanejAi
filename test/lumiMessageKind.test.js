const test = require('node:test')
const assert = require('node:assert/strict')

test('ordinary Lumi replies can use the smaller renderer while formulas keep math support', async () => {
  const { hasMath } = await import('../frontend/src/utils/lumiMessageKind.mjs')
  assert.equal(hasMath('O resultado é 12. **Confira** cada passo.'), false)
  assert.equal(hasMath('O resultado custa R$ 12,00.'), false)
  assert.equal(hasMath('A função é $f(x)=2x+1$.'), true)
  assert.equal(hasMath('$$\\frac{1}{2}$$'), true)
  assert.equal(hasMath('Use \\(x^2\\).'), true)
})
