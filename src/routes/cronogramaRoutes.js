const express = require('express')

const router = express.Router()

const cronogramaController = require('../controllers/cronogramaController')

const {
  authMiddleware,
  isGestorPedagogico
} = require('../middlewares/authMiddleware')

const { uploadMaterial } = require('../middlewares/uploadMiddleware')
const { idempotency } = require('../middlewares/idempotencyMiddleware')

/**
 * Gerar novo cronograma
 */
router.post(
  '/gerar',
  authMiddleware,
  idempotency('GERAR_CRONOGRAMA'),
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
router.post(
  '/replanejar',
  authMiddleware,
  cronogramaController.replanejarAtrasados
)
router.get('/recuperacao', authMiddleware, cronogramaController.analisarAtrasos)
router.post('/dias/:diaId/ajustar', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.diaId)
    if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: 'Dia inválido.' })
    const result = await require('../services/dailyPlanService').adjustDay(req.usuario.id, id, req.body?.acao)
    return res.json(result)
  } catch (error) {
    if (!error.status) console.error('[AJUSTE DIARIO]', error)
    return res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível ajustar seu dia. Nenhuma alteração foi salva.' })
  }
})
router.post('/dias/:diaId/desafio', authMiddleware, cronogramaController.iniciarDesafio)
router.post('/cronogramas/:cronogramaId/prova-final', authMiddleware, cronogramaController.iniciarProvaFinal)
router.get('/avaliacoes/:avaliacaoId/retomar', authMiddleware, cronogramaController.retomarAvaliacao)
router.put('/avaliacoes/:avaliacaoId/respostas/:questaoId', authMiddleware, cronogramaController.salvarRespostaAvaliacao)
router.post('/avaliacoes/:avaliacaoId/abandonar', authMiddleware, cronogramaController.abandonarAvaliacao)
router.post('/avaliacoes/:avaliacaoId/enviar', authMiddleware, cronogramaController.enviarAvaliacao)

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
  '/conteudos/:conteudoCronogramaId/mover',
  authMiddleware, isGestorPedagogico,
  cronogramaController.moverConteudo
)

router.patch(
  '/conteudos/:conteudoCronogramaId/reabrir',
  authMiddleware,
  cronogramaController.reabrirConteudo
)

/**
 * Atualizar conteúdo do cronograma (gestor)
 */
router.patch(
  '/conteudos/:conteudoCronogramaId',
  authMiddleware,
  isGestorPedagogico,
  cronogramaController.atualizarConteudoCronograma
)

/**
 * Upload de material para conteúdo do cronograma
 */
router.post(
  '/conteudos/:conteudoCronogramaId/upload',
  authMiddleware,
  isGestorPedagogico,
  uploadMaterial.single('file'),
  cronogramaController.uploadMaterial
)

module.exports = router
