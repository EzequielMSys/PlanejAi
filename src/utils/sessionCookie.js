const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/jwtConfig');

const COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-planejai_session' : 'planejai_session';
const unsafe = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function cookieToken(req) {
  const raw = req.headers.cookie || '';
  const match = raw.split(';').map(part => part.trim()).find(part => part.startsWith(`${COOKIE_NAME}=`));
  if (!match) return null;
  try { return decodeURIComponent(match.slice(COOKIE_NAME.length + 1)); } catch { return null; }
}

function csrfFor(token) {
  return crypto.createHmac('sha256', getJwtSecret()).update(`csrf:${token}`).digest('hex');
}

function verifyCsrf(req, token) {
  if (!unsafe.has(req.method)) return true;
  const supplied = req.get('x-csrf-token') || '';
  if (!/^[a-f0-9]{64}$/.test(supplied)) return false;
  return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(csrfFor(token)));
}

function setSession(res, token) {
  res.set('Cache-Control', 'private, no-store');
  const decoded = jwt.decode(token);
  const maxAge = Math.max(0, (decoded.exp * 1000) - Date.now());
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge,
  });
  return csrfFor(token);
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
  });
}

module.exports = { cookieToken, csrfFor, verifyCsrf, setSession, clearSession };
