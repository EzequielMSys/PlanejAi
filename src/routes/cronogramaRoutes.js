const express = require('express')

const router = express.Router()

const cronogramaController = require('../controllers/cronogramaController')

const {
  authMiddleware
} = require('../middlewares/authMiddleware')

/**
 * Gerar novo cronograma
 */
router.post(
  '/gerar',
  authMiddleware,
  cronogramaController.gerarCronograma
)

/**
 * Listar cronogramas do usuário
 */
router.get(
  '/',
  authMiddleware,
  cronogramaController.listarCronogramas
)

/**
 * Obter cronograma ativo
 */
router.get(
  '/ativo',
  authMiddleware,
  cronogramaController.obterCronogramaAtivo
)

/**
 * Concluir dia do cronograma
 */
router.patch(
  '/dias/:diaId/concluir',
  authMiddleware,
  cronogramaController.concluirDia
)

/**
 * Reabrir dia do cronograma
 */
router.patch(
  '/dias/:diaId/reabrir',
  authMiddleware,
  cronogramaController.reabrirDia
)

/**
 * Concluir conteúdo específico
 */
router.patch(
  '/conteudos/:conteudoCronogramaId/concluir',
  authMiddleware,
  cronogramaController.concluirConteudo
)

/**
 * Reabrir conteúdo específico
 */
router.patch(
  '/conteudos/:conteudoCronogramaId/reabrir',
  authMiddleware,
  cronogramaController.reabrirConteudo
)

module.exports = router