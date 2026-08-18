const model = require('../models/aprendizagemModel');

const idUsuario = (req) => req.usuario.id_usuario || req.usuario.id;
const erro = (res, error) => { console.error('[APRENDIZAGEM]', error); return res.status(500).json({ message: 'Não foi possível atualizar sua aprendizagem agora.' }); };

async function resumo(req, res) { try { return res.json(await model.obterResumo(idUsuario(req))); } catch (error) { return erro(res, error); } }
async function simulado(req, res) { try { return res.json(await model.gerarSimulado(idUsuario(req), req.query)); } catch (error) { return erro(res, error); } }
async function responder(req, res) { try { const resultado = await model.responderQuestao(idUsuario(req), req.params.idQuestao, req.body.resposta, req.body.duracaoSegundos, req.body.embaralhamento); return resultado ? res.json(resultado) : res.status(404).json({ message: 'Questão não encontrada.' }); } catch (error) { return res.status(400).json({ message: error.message || 'Resposta inválida.' }); } }
async function erros(req, res) { try { return res.json(await model.listarCadernoErros(idUsuario(req))); } catch (error) { return erro(res, error); } }
async function atualizarErro(req, res) { try { return res.json(await model.atualizarErro(idUsuario(req), req.params.idErro, req.body)); } catch (error) { return erro(res, error); } }
async function revisoes(req, res) { try { return res.json(await model.listarRevisoes(idUsuario(req))); } catch (error) { return erro(res, error); } }
async function adicionarRevisao(req, res) { try { return res.status(201).json(await model.adicionarRevisao(idUsuario(req), req.params.idConteudo)); } catch (error) { return erro(res, error); } }
async function avaliarRevisao(req, res) { try { return res.json(await model.avaliarRevisao(idUsuario(req), req.params.idConteudo, req.body.resultado)); } catch (error) { return res.status(400).json({ message: error.message }); } }
async function versoes(req, res) { try { return res.json(await model.listarVersoesRedacao(idUsuario(req), req.params.idRedacao)); } catch (error) { return erro(res, error); } }
async function criarVersao(req, res) { try { const resultado = await model.criarVersaoRedacao(idUsuario(req), req.params.idRedacao, req.body); return resultado ? res.status(201).json(resultado) : res.status(404).json({ message: 'Redação não encontrada.' }); } catch (error) { return erro(res, error); } }

module.exports = { resumo, simulado, responder, erros, atualizarErro, revisoes, adicionarRevisao, avaliarRevisao, versoes, criarVersao };

