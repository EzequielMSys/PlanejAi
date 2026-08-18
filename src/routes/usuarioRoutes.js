const express = require('express')

const router = express.Router()

const usuarioController = require('../controllers/usuarioController')

const {
  authMiddleware,
  isAdminOrDono,
  isDono
} = require('../middlewares/authMiddleware')

const {
  uploadPerfil
} = require('../middlewares/uploadMiddleware')

/**
 * Perfil do usuário logado
 */
router.delete(
  '/me/foto',
  authMiddleware,
  usuarioController.removerFotoPerfil
)

router.get(
  '/me',
  authMiddleware,
  usuarioController.obterPerfilLogado
)

/**
 * Upload foto perfil
 */
router.patch(
  '/me/foto',
  authMiddleware,
  uploadPerfil.single('foto'),
  usuarioController.uploadFotoPerfil
)

/**
 * Listar usuários
 */
router.get(
  '/',
  authMiddleware,
  isAdminOrDono,
  usuarioController.listar
)

/**
 * Buscar usuário por ID
 */
router.get(
  '/:id',
  authMiddleware,
  isAdminOrDono,
  usuarioController.obterPorId
)

/**
 * Atualizar usuário
 */
router.put(
  '/:id',
  authMiddleware,
  usuarioController.atualizar
)

/**
 * Alterar tipo
 * Apenas dono
 */
router.patch(
  '/:id/tipo',
  authMiddleware,
  isDono,
  usuarioController.alterarTipo
)

/**
 * Ativar/desativar
 * Apenas dono
 */
router.patch(
  '/:id/status',
  authMiddleware,
  isDono,
  usuarioController.alterarStatus
)

/**
 * Resetar senha temporária
 * Admin e dono
 */
router.patch(
  '/:id/resetar-senha',
  authMiddleware,
  isAdminOrDono,
  usuarioController.resetarSenha
)

/**
 * Definir senha diretamente
 * Apenas dono
 */
router.patch(
  '/:id/definir-senha',
  authMiddleware,
  isDono,
  usuarioController.definirSenha
)

module.exports = router
