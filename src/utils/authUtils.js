const crypto = require('crypto');

/**
 * Gera senha temporária aleatória para fluxos administrativos controlados.
 */
function gerarSenhaTemporaria() {
  return crypto.randomBytes(18).toString('base64url');
}

/**
 * Valida se senha atende critérios de força
 * Mín. 12 caracteres, com maiúscula, minúscula e número.
 */
function validarSenhaForte(senha) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{12,128}$/;
  return regex.test(senha);
}

function getBcryptRounds() {
  const requested = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  return Math.min(15, Math.max(12, Number.isFinite(requested) ? requested : 12));
}

/**
 * Remove campos sensíveis do usuário
 */
function sanitizeUser(usuario) {
  const { senha, senha_temporaria, token_recuperacao, token_expiracao, ...safe } = usuario;
  return safe;
}

module.exports = {
  gerarSenhaTemporaria,
  validarSenhaForte,
  sanitizeUser,
  getBcryptRounds
};

