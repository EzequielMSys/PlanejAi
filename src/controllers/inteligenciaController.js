const model = require('../models/inteligenciaModel')
const iaService = require('../services/iaService')
const { contextoDisponivel } = require('../services/tutorContextService')
const idUsuario = (req) => req.usuario.id_usuario || req.usuario.id
const responder = (res, tarefa) => tarefa.then((dados) => res.json(dados)).catch((error) => res.status(400).json({ message: error.message || 'Não foi possível concluir a operação.' }))
exports.diagnostico = (req, res) => responder(res, model.diagnostico(idUsuario(req), String(req.query.disciplinas || '').split(',').filter(Boolean)))
exports.salvarDiagnostico = (req, res) => responder(res, model.salvarDiagnostico(idUsuario(req), req.body.respostas))
exports.metas = (req, res) => responder(res, model.metas(idUsuario(req)))
exports.salvarMeta = (req, res) => responder(res, model.salvarMeta(idUsuario(req), req.body))
exports.privacidade = (req, res) => responder(res, model.privacidade(idUsuario(req), req.method === 'PUT' ? req.body.visibilidade : null))
exports.flashcards = (req, res) => responder(res, model.listarFlashcards(idUsuario(req)))
exports.criarFlashcard = (req, res) => responder(res, model.criarFlashcard(idUsuario(req), req.body))
exports.avaliarFlashcard = (req, res) => responder(res, model.avaliarFlashcard(idUsuario(req), req.params.idFlashcard, req.body.resultado))
exports.buscar = (req, res) => responder(res, model.buscar(idUsuario(req), req.query.q))
exports.provas = (req, res) => responder(res, model.provas(idUsuario(req)))
exports.criarProva = (req, res) => responder(res, model.criarProva(idUsuario(req), req.body))
exports.catalogoProvas = (req, res) => responder(res, model.catalogoProvas())
exports.gerarSimulado = (req, res) => responder(res, model.gerarSimulado(idUsuario(req), req.body))
exports.obterSimulado = (req, res) => responder(res, model.obterSimulado(idUsuario(req), req.params.idSimulado))
exports.salvarProgressoSimulado = (req, res) => responder(res, model.salvarProgressoSimulado(idUsuario(req), req.params.idSimulado, req.body))
exports.concluirSimulado = (req, res) => responder(res, model.concluirSimulado(idUsuario(req), req.params.idSimulado, req.body))
exports.historicoSimulados = (req, res) => responder(res, model.historicoSimulados(idUsuario(req)))
exports.trilhas = (req, res) => responder(res, model.trilhas(idUsuario(req)))
exports.chat = (req, res) => responder(res, iaService.listarConversa(idUsuario(req), req.query.limite))
exports.contextoChat = (req, res) => responder(res, contextoDisponivel(idUsuario(req)).then((dados) => dados || {}))
// Status HTTP por tipo de falha: entrada inválida fica em 400; limite diário
// do usuário em 429; indisponibilidade do provedor de IA (saldo esgotado,
// erro de API, chave ausente) em 503 — é o servidor que precisa agir, não o
// cliente que enviou algo errado.
const STATUS_CHAT = {
  ERR_DAILY_LIMIT: 429,
  ERR_QUOTA: 503,
  ERR_API: 503,
  ERR_CLIENT: 503,
}
exports.enviarMensagem = async (req, res) => { try { const result = await iaService.enviarMensagem(idUsuario(req), req.body.mensagem, req.body.disciplina, req.usuario.nome); res.json(result) } catch (error) { const status = STATUS_CHAT[error.code] || 400; res.status(status).json({ message: error.message, code: error.code }) } }
exports.limparChat = (req, res) => responder(res, iaService.limparConversa(idUsuario(req)).then(() => ({ ok: true })))
