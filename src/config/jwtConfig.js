const DEVELOPMENT_SECRET = 'planejai-dev-local-fallback-change-in-production';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção.');
  return DEVELOPMENT_SECRET;
}

module.exports = { getJwtSecret };
