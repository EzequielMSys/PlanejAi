const crypto = require('crypto');
// Evita que instalações locais compartilhem uma chave JWT pública. Em
// desenvolvimento a chave muda quando o processo reinicia, invalidando apenas
// sessões locais antigas; em produção JWT_SECRET continua obrigatório.
const DEVELOPMENT_SECRET = crypto.randomBytes(48).toString('base64url');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres em produção.');
  return DEVELOPMENT_SECRET;
}

module.exports = { getJwtSecret };
