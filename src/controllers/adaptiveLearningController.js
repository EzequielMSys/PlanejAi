const model = require('../models/adaptiveLearningModel');
const aprendizagem = require('../models/aprendizagemModel');
const idUsuario = (req) => req.usuario.id_usuario || req.usuario.id;
const fail = (res, error) => res.status(400).json({ message: error.message || 'Dados inválidos.' });

async function competencias(req, res) { try { res.json(await model.listarCompetencias(idUsuario(req))); } catch (e) { fail(res, e); } }
async function proximaAcao(req, res) { try { res.json(await model.proximaAcao(idUsuario(req))); } catch (e) { fail(res, e); } }
async function iniciarSessao(req, res) { try { res.status(201).json(await model.iniciarSessao(idUsuario(req), req.body)); } catch (e) { fail(res, e); } }
async function concluirSessao(req, res) { try { res.json(await model.concluirSessao(idUsuario(req), req.params.id, req.body)); } catch (e) { fail(res, e); } }
async function checkin(req, res) { try { res.status(201).json(await model.salvarCheckin(idUsuario(req), req.body)); } catch (e) { fail(res, e); } }
async function rotinas(req, res) { try { res.json(await model.listarRotinas(idUsuario(req))); } catch (e) { fail(res, e); } }
async function salvarRotina(req, res) { try { res.json(await model.salvarRotina(idUsuario(req), req.body)); } catch (e) { fail(res, e); } }
async function missoes(req, res) { try { res.json(await model.listarMissoes(idUsuario(req))); } catch (e) { fail(res, e); } }
async function sequencia(req, res) { try { res.json(await model.obterSequencia(idUsuario(req))); } catch (e) { fail(res, e); } }
async function pistas(req, res) { try { const data = await model.obterPistas(req.params.idQuestao); data ? res.json(data) : res.status(404).json({ message: 'Questão não encontrada.' }); } catch (e) { fail(res, e); } }
async function simuladoAdaptativo(req, res) {
  try {
    const competencias = await model.listarCompetencias(idUsuario(req));
    const foco = competencias.find((item) => Number(item.evidencias) > 0) || competencias[0];
    const questoes = await aprendizagem.gerarSimulado(idUsuario(req), {
      quantidade: req.query.quantidade || 8,
      disciplina: req.query.disciplina || foco?.disciplina,
      dificuldade: foco?.dificuldadeRecomendada
    });
    res.json({ foco: foco || null, questoes });
  } catch (e) { fail(res, e); }
}

module.exports = { competencias, proximaAcao, iniciarSessao, concluirSessao, checkin, rotinas, salvarRotina, missoes, sequencia, pistas, simuladoAdaptativo };
