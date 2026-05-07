const express = require('express');

const router = express.Router();

const usuarioController = require('../controllers/usuarioController');

const {
  authMiddleware,
  isAdminOrDono,
  isDono
} = require('../middlewares/authMiddleware');

/**
 * Perfil do usuário logado
 */
router.get(
  '/me',
  authMiddleware,
  usuarioController.obterPerfilLogado
);

/**
 * Buscar usuário por ID
 */
router.get(
  '/:id',
  authMiddleware,
  isAdminOrDono,
  usuarioController.obterPorId
);

/**
 * Listar usuários
 */
router.get(
  '/',
  authMiddleware,
  isAdminOrDono,
  usuarioController.listar
);

/**
 * Atualizar usuário
 * Usuário comum:
 * - apenas própria conta
 *
 * Admin:
 * - pode editar usuários
 *
 * Dono:
 * - controle total
 */
router.put(
  '/:id',
  authMiddleware,
  usuarioController.atualizar
);

/**
 * Alterar tipo de usuário
 * Apenas dono
 */
router.patch(
  '/:id/tipo',
  authMiddleware,
  isDono,
  usuarioController.alterarTipo
);

/**
 * Ativar/desativar usuário
 * Apenas dono
 */
router.patch(
  '/:id/status',
  authMiddleware,
  isDono,
  usuarioController.alterarStatus
);

/**
 * Resetar senha
 * Admin e dono
 */
router.patch(
  '/:id/resetar-senha',
  authMiddleware,
  isAdminOrDono,
  usuarioController.resetarSenha
);

module.exports = router;