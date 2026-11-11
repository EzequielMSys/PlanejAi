const express = require('express')

const router = express.Router()

const usuarioController = require('../controllers/usuarioController')
const accountUsage = require('../services/accountUsageService')

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

router.delete(
  '/me/banner',
  authMiddleware,
  usuarioController.removerBannerPerfil
)

router.get(
  '/me',
  authMiddleware,
  usuarioController.obterPerfilLogado
)

router.get(
  '/me/exportar',
  authMiddleware,
  usuarioController.exportarMeusDados
)

router.post('/me/uso', authMiddleware, async (req, res) => {
  try {
    await accountUsage.record(req.usuario.id_usuario)
    return res.status(204).end()
  } catch (error) {
    console.error('[USO DA CONTA]', error.code || 'RECORD_FAILED')
    return res.status(503).json({ message: 'Não foi possível registrar o uso agora.' })
  }
})

router.get('/:id/uso', authMiddleware, isAdminOrDono, async (req, res) => {
  res.set('Cache-Control', 'private, no-store')
  const id = Number(req.params.id)
  if (!/^\d+$/.test(req.params.id) || id < 1 || id > 2147483647) {
    return res.status(400).json({ message: 'Conta inválida.' })
  }
  try {
    const report = await accountUsage.report(id, req.usuario.tipo)
    if (!report) return res.status(404).json({ message: 'Acompanhamento indisponível para esta conta.' })
    return res.json(report)
  } catch (error) {
    console.error('[USO DA CONTA]', error.code || 'REPORT_FAILED')
    return res.status(503).json({ message: 'Não foi possível consultar o acompanhamento agora.' })
  }
})

/**
 * Upload foto perfil
 */
router.patch(
  '/me/foto',
  authMiddleware,
  uploadPerfil.single('foto'),
  usuarioController.uploadFotoPerfil
)

router.patch(
  '/me/banner',
  authMiddleware,
  uploadPerfil.single('banner'),
  usuarioController.uploadBannerPerfil
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
