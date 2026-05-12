const express = require('express')
const router = express.Router()

const perfilController = require('../controllers/perfilController')

const { authMiddleware } =
  require('../middlewares/authMiddleware')

router.post(
  '/',
  authMiddleware,
  perfilController.salvarPerfil
)

router.put(
  '/',
  authMiddleware,
  perfilController.atualizarPerfil
)

router.get(
  '/',
  authMiddleware,
  perfilController.obterPerfilCompleto
)

router.post(
  '/disponibilidade',
  authMiddleware,
  perfilController.salvarDisponibilidade
)

router.get(
  '/disponibilidade',
  authMiddleware,
  perfilController.obterDisponibilidade
)

module.exports = router