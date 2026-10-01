const model=require('../models/collaborativeLearningModel');
const id=(req)=>req.usuario.id_usuario||req.usuario.id;
const fail=(res,e)=>res.status(400).json({message:e.message||'Dados inválidos.'});
async function projetos(req,res){try{res.json(await model.listarProjetos(id(req)));}catch(e){fail(res,e)}}
async function salvarProjeto(req,res){try{res.status(201).json(await model.salvarProjeto(id(req),req.body));}catch(e){fail(res,e)}}
async function evolucao(req,res){try{res.json(await model.evolucaoEnem(id(req)));}catch(e){fail(res,e)}}
async function alertas(req,res){try{res.json(await model.alertasPedagogicos());}catch(e){fail(res,e)}}
async function intervencoes(req,res){try{res.json(await model.listarIntervencoes());}catch(e){fail(res,e)}}
async function criarIntervencao(req,res){try{res.status(201).json(await model.criarIntervencao(id(req),req.body));}catch(e){fail(res,e)}}
async function grupos(req,res){try{res.json(await model.sugerirGrupos());}catch(e){fail(res,e)}}
async function criarGrupo(req,res){try{res.status(201).json(await model.criarGrupo(id(req),req.body));}catch(e){fail(res,e)}}
async function atribuirPar(req,res){try{res.status(201).json(await model.atribuirRevisaoPar(req.body.idRedacao,req.body.idRevisor));}catch(e){fail(res,e)}}
async function disponibilizarPar(req,res){try{res.status(201).json(await model.disponibilizarUltimaRedacao(id(req)));}catch(e){fail(res,e)}}
async function revisoesPar(req,res){try{res.json(await model.listarRevisoesPar(id(req)));}catch(e){fail(res,e)}}
async function responderPar(req,res){try{res.json(await model.responderRevisaoPar(id(req),req.params.id,req.body));}catch(e){fail(res,e)}}
async function moderacao(req,res){try{res.json(await model.moderacao());}catch(e){fail(res,e)}}
async function denunciar(req,res){try{res.status(201).json(await model.denunciarRevisao(id(req),req.params.id,req.body));}catch(e){fail(res,e)}}
async function moderar(req,res){try{res.json(await model.moderar(id(req),req.params.id,req.body));}catch(e){fail(res,e)}}
module.exports={projetos,salvarProjeto,evolucao,alertas,intervencoes,criarIntervencao,grupos,criarGrupo,atribuirPar,disponibilizarPar,revisoesPar,responderPar,denunciar,moderacao,moderar};
