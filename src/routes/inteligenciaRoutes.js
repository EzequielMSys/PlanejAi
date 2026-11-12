const router = require('express').Router()
const controller = require('../controllers/inteligenciaController')
const { authMiddleware } = require('../middlewares/authMiddleware')
router.use(authMiddleware)
router.get('/diagnostico', controller.diagnostico)
router.post('/diagnostico', controller.salvarDiagnostico)
router.get('/metas', controller.metas)
router.put('/metas', controller.salvarMeta)
router.get('/privacidade', controller.privacidade)
router.put('/privacidade', controller.privacidade)
router.get('/flashcards', controller.flashcards)
router.post('/flashcards', controller.criarFlashcard)
router.post('/flashcards/:idFlashcard/avaliar', controller.avaliarFlashcard)
router.get('/busca', controller.buscar)
router.get('/provas', controller.provas)
router.post('/provas', controller.criarProva)
router.get('/catalogo-provas', controller.catalogoProvas)
router.get('/simulados', controller.historicoSimulados)
router.post('/simulados', controller.gerarSimulado)
router.get('/simulados/:idSimulado', controller.obterSimulado)
router.patch('/simulados/:idSimulado', controller.salvarProgressoSimulado)
router.post('/simulados/:idSimulado/concluir', controller.concluirSimulado)
router.get('/trilhas', controller.trilhas)

// Assistente de IA (chatbot) para dúvidas de matéria.
router.get('/chat', controller.chat)
router.get('/chat/contexto', controller.contextoChat)
router.post('/chat/foto', require('../middlewares/activityPhotoUpload'), controller.lerFoto)
const media = require('../services/lumiMediaService')
const multer = require('multer')
const uploadMedia = multer({ storage: multer.memoryStorage(), limits: { fileSize: media.MAX_BYTES, files: 1, fields: 0, parts: 1 } }).single('arquivo')
router.post('/chat/midia', (req, res) => {
  res.set('Cache-Control', 'no-store')
  uploadMedia(req, res, async error => {
    if (error) return res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ message: 'Envie um único áudio ou vídeo de até 4 MB.' })
    try {
      return res.json(await media.transcribe(req.usuario.id_usuario || req.usuario.id, req.file))
    } catch (failure) {
      return res.status(failure.status || 503).json({ message: failure.status ? failure.message : 'A transcrição está indisponível neste momento.' })
    } finally {
      req.file?.buffer?.fill(0)
    }
  })
})
router.post('/chat', controller.enviarMensagem)
router.delete('/chat', controller.limparChat)

module.exports = router
