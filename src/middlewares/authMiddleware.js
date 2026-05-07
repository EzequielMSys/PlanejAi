const jwt = require('jsonwebtoken');
const usuarioModel = require('../models/usuarioModel');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Token não fornecido.' });
    }

    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Formato de token inválido.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuarioId = decoded.id || decoded.id_usuario;

    if (!usuarioId) {
      return res.status(401).json({ message: 'Token inválido.' });
    }

    const usuario = await usuarioModel.buscarPorId(usuarioId);

    if (!usuario) {
      return res.status(401).json({ message: 'Usuário não encontrado.' });
    }

    if (usuario.ativo === 0) {
      return res.status(403).json({ message: 'Usuário desativado.' });
    }

    req.usuario = {
      id: usuario.id || usuario.id_usuario,
      id_usuario: usuario.id_usuario || usuario.id,
      tipo: usuario.tipo,
      email: usuario.email,
      nome: usuario.nome
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
}

function permitirTipos(...tiposPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ message: 'Usuário não autenticado.' });
    }

    if (!tiposPermitidos.includes(req.usuario.tipo)) {
      return res.status(403).json({ message: 'Acesso não autorizado.' });
    }

    next();
  };
}

const isAdminOrDono = permitirTipos('admin', 'dono');
const isDono = permitirTipos('dono');

module.exports = {
  authMiddleware,
  permitirTipos,
  isAdminOrDono,
  isDono
};