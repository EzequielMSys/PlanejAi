const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { cookieToken, csrfFor, verifyCsrf, setSession, clearSession } = require('../src/utils/sessionCookie');

test('cookie session hides JWT from response body and binds CSRF to the token', () => {
  const token = jwt.sign({ id: 123, sv: 1 }, require('../src/config/jwtConfig').getJwtSecret(), { expiresIn: '1h' });
  let cookie;
  const response = { set() {}, cookie(name, value, options) { cookie = { name, value, options }; }, clearCookie() {} };
  const csrf = setSession(response, token);
  assert.equal(cookie.options.httpOnly, true);
  assert.equal(cookie.options.sameSite, 'lax');
  assert.equal(cookie.options.path, '/');
  assert.ok(cookie.options.maxAge > 0);
  const req = { method: 'POST', headers: { cookie: `${cookie.name}=${cookie.value}` }, get: () => csrf };
  assert.equal(cookieToken(req), token);
  assert.equal(verifyCsrf(req, token), true);
  assert.equal(verifyCsrf({ ...req, get: () => '0'.repeat(64) }, token), false);
  assert.equal(verifyCsrf({ ...req, get: () => csrfFor('other') }, token), false);
  assert.equal(verifyCsrf({ ...req, method: 'GET', get: () => '' }, token), true);
  let cleared;
  clearSession({ clearCookie(name, options) { cleared = { name, options }; } });
  assert.equal(cleared.name, cookie.name);
  assert.equal(cleared.options.path, cookie.options.path);
});
