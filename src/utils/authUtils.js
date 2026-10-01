const crypto = require('crypto');

/**
 * Gera senha temporária aleatória para fluxos administrativos controlados.
 */
function gerarSenhaTemporaria() {
  return crypto.randomBytes(18).toString('base64url');
}

// Requisito de senha em um único lugar. A regra estava duplicada em três
// arquivos e com textos conflitantes (o frontend dizia 12, o backend 8 em
// algumas mensagens), então o usuário podia receber uma mensagem e o cadastro
// ser recusado pelo servidor. Fonte única resolve isso e deixa a regra fácil de
// mudar no futuro.
const SENHA_MINIMA = 8;
const SENHA_MAXIMA = 128;

const REGRA_SENHA = {
  minimo: SENHA_MINIMA,
  maximo: SENHA_MAXIMA,
  maiuscula: true,
  minuscula: true,
  numero: true,
};

const REGEX_SENHA = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{${SENHA_MINIMA},${SENHA_MAXIMA}}$`,
);

// Texto único exibido ao usuário, para não haver divergência entre o que a
// tela promete e o que o servidor exige.
const REQUISITOS_SENHA = `Mín. ${SENHA_MINIMA} caracteres, com maiúscula, minúscula e número`;

/**
 * Valida se senha atende critérios de força.
 */
function validarSenhaForte(senha) {
  if (typeof senha !== 'string') return false;
  return REGEX_SENHA.test(senha);
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
  getBcryptRounds,
  REGRA_SENHA,
  REQUISITOS_SENHA,
  SENHA_MINIMA,
};

