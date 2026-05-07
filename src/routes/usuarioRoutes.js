const express = require('express')

const router = express.Router()

const usuarioController = require('../controllers/usuarioController')
const { uploadPerfil } = require('../middlewares/uploadMiddleware')

const {
  authMiddleware,
  isAdminOrDono,
  isDono
} = require('../middlewares/authMiddleware')

/**
 * Perfil do usuário logado
 */
router.get(
  '/me',
  authMiddleware,
  usuarioController.obterPerfilLogado
)

/**
 * Upload da foto do perfil do usuário logado
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
 * Alterar tipo de usuário
 * Apenas dono
 */
router.patch(
  '/:id/tipo',
  authMiddleware,
  isDono,
  usuarioController.alterarTipo
)

/**
 * Ativar/desativar usuário
 * Apenas dono
 */
router.patch(
  '/:id/status',
  authMiddleware,
  isDono,
  usuarioController.alterarStatus
)

/**
 * Resetar senha
 * Admin e dono
 */
router.patch(
  '/:id/resetar-senha',
  authMiddleware,
  isAdminOrDono,
  usuarioController.resetarSenha
)

module.exports = router