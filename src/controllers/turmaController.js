const model=require('../models/turmaModel');
const uid=req=>req.usuario.id_usuario||req.usuario.id;
// Erro com status explícito. Antes o controller adivinhava o código HTTP
// procurando a palavra "gerencia" na mensagem, o que quebrava assim que uma
// nova mensagem de permissão fosse escrita sem essa palavra.
class ErroDeNegocio extends Error{constructor(mensagem,status=400){super(mensagem);this.status=status}}
const handle=(res,p)=>p.then(x=>res.json(x)).catch(e=>res.status(e.status||400).json({message:e.message}));
const negado=mensagem=>{throw new ErroDeNegocio(mensagem,403)};
exports.listar=(req,res)=>handle(res,model.listar(uid(req),req.usuario.tipo));
exports.criar=(req,res)=>handle(res,model.criar(uid(req),req.body));
exports.detalhes=(req,res)=>handle(res,model.detalhes(uid(req),req.usuario.tipo,req.params.id));
exports.adicionar=(req,res)=>handle(res,model.adicionar(uid(req),req.usuario.tipo,req.params.id,req.body));
exports.candidatos=(req,res)=>handle(res,model.candidatos());
exports.entrar=(req,res)=>handle(res,model.entrarPorCodigo(uid(req),req.usuario.tipo,req.body?.codigo));
exports.usarConvite=(req,res)=>handle(res,model.usarConvite(uid(req),req.usuario.tipo,req.body?.codigo));
exports.sair=(req,res)=>handle(res,model.sair(uid(req),req.usuario.tipo,req.params.id));
exports.minhas=(req,res)=>handle(res,model.minhasTurmas(uid(req)));
exports.minhaTurma=(req,res)=>handle(res,model.detalheDoAluno(uid(req),req.params.id).then(t=>{if(!t)negado('Você não participa desta turma.');return t}));
exports.criarConvite=(req,res)=>handle(res,model.criarConvite(uid(req),req.usuario.tipo,req.params.id));
exports.listarConvites=(req,res)=>handle(res,model.listarConvites(uid(req),req.usuario.tipo,req.params.id));
exports.cancelarConvite=(req,res)=>handle(res,model.cancelarConvite(uid(req),req.usuario.tipo,req.params.id,req.params.idConvite));
