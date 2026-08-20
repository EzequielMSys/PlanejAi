const cronogramaService = require('../services/cronogramaService')
const adaptiveScheduleModel = require('../models/adaptiveScheduleModel')
const aprendizagemModel = require('../models/aprendizagemModel')

function tratarErroCronograma(error, res) {
  const mensagensUsuario = [
    'Perfil de estudo não configurado',
    'Disponibilidade semanal não configurada',
    'Nenhum dia disponível para estudo foi configurado',
    'Nenhum conteúdo cadastrado para as áreas de foco informadas'
  ]

  if (mensagensUsuario.includes(error.message) || /Conclua os dias anteriores|ainda está bloqueado|Conclua todos os conteúdos/.test(error.message || '')) {
    return res.status(400).json({
      error: error.message
    })
  }

  console.error('[CRONOGRAMA ERROR]', error)

  return res.status(500).json({
    error: 'Erro interno no cronograma.'
  })
}

async function gerarCronograma(req, res) {
  try {
    const usuarioId = req.usuario.id
    const cronograma = await cronogramaService.gerar(usuarioId)

    console.log(
      `[CRONOGRAMA GERADO] User ${usuarioId} - ${cronograma?.dias?.length || 0} dias`
    )

    return res.status(201).json({
      message: 'Cronograma gerado com sucesso!',
      cronograma
    })
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function listarCronogramas(req, res) {
  try {
    const usuarioId = req.usuario.id
    const cronogramas = await cronogramaService.listar(usuarioId)

    return res.status(200).json(cronogramas)
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function obterCronogramaAtivo(req, res) {
  try {
    const usuarioId = req.usuario.id
    const cronograma = await cronogramaService.obterAtivo(usuarioId)

    return res.status(200).json({
      cronograma
    })
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function concluirDia(req, res) {
  try {
    const { diaId } = req.params

    const resultado = await cronogramaService.marcarConcluido(diaId, req.usuario.id_usuario || req.usuario.id)

    return res.status(200).json({
      message: 'Dia marcado como concluído!',
      dia: resultado
    })
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function reabrirDia(req, res) {
  try {
    const { diaId } = req.params

    const resultado = await cronogramaService.marcarPendente(diaId)

    return res.status(200).json({
      message: 'Dia marcado como pendente!',
      dia: resultado
    })
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function concluirConteudo(req, res) {
  try {
    const { conteudoCronogramaId } = req.params
    const referencia = await cronogramaService.obterConteudoCronogramaPorId(conteudoCronogramaId)

    const conteudo = await cronogramaService.concluirConteudo(
      conteudoCronogramaId, req.usuario.id_usuario || req.usuario.id
    )
    if (referencia?.id_conteudo) {
      try {
        await aprendizagemModel.adicionarRevisao(req.usuario.id_usuario || req.usuario.id, referencia.id_conteudo)
      } catch (reviewError) {
        console.error('[REVISAO AUTOMATICA]', reviewError.message)
      }
    }


    return res.status(200).json({
      message: 'Conteúdo concluído!',
      conteudo
    })
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function reabrirConteudo(req, res) {
  try {
    const { conteudoCronogramaId } = req.params

    const conteudo = await cronogramaService.reabrirConteudo(
      conteudoCronogramaId
    )

    return res.status(200).json({
      message: 'Conteúdo marcado como pendente!',
      conteudo
    })
  } catch (error) {
    return tratarErroCronograma(error, res)
  }
}

async function atualizarConteudoCronograma(req, res) {
  try {
    const { conteudoCronogramaId } = req.params
    const dados = Object.fromEntries(
      Object.entries(req.body || {}).filter(([, valor]) => valor !== undefined)
    )
    const resultado = await cronogramaService.atualizarConteudoCronograma(conteudoCronogramaId, dados)
    return res.status(200).json({ message: 'Conteúdo atualizado.', conteudo: resultado })
  } catch (error) {
    console.error('[CRONOGRAMA]', error)
    return res.status(400).json({ message: error.message || 'Erro ao atualizar conteúdo.' })
  }
}

async function uploadMaterial(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' })
    const url = `/uploads/materiais/${req.file.filename}`
    const conteudoCronogramaId = req.params.conteudoCronogramaId
    const atual = await cronogramaService.obterConteudoCronogramaPorId(conteudoCronogramaId)
    const materiais = Array.isArray(atual?.materiais) ? atual.materiais : []
    materiais.push({ url, nome: req.file.originalname, tipo: req.file.mimetype })
    await cronogramaService.atualizarConteudoCronograma(conteudoCronogramaId, { materiais })
    return res.status(201).json({ url, filename: req.file.filename, materiais })
  } catch (error) {
    console.error('[CRONOGRAMA UPLOAD]', error)
    return res.status(500).json({ message: 'Erro ao enviar material.' })
  }
}

async function moverConteudo(req, res) {
  try {
    const { conteudoCronogramaId } = req.params
    const { idDiaDestino } = req.body
    if (!Number(idDiaDestino)) return res.status(400).json({ message: 'Escolha um dia de destino válido.' })
    const conteudo = await cronogramaService.moverConteudo(conteudoCronogramaId, idDiaDestino, req.usuario.id_usuario || req.usuario.id)
    if (!conteudo) return res.status(404).json({ message: 'Conteúdo ou dia de destino não encontrado neste cronograma.' })
    return res.json({ message: 'Sessão movida para o novo dia.', conteudo })
  } catch (error) {
    console.error('[CRONOGRAMA MOVER]', error)
    return res.status(500).json({ message: 'Não foi possível mover a sessão.' })
  }
}

async function replanejarAtrasados(req, res) {
  try {
    const resultado = await adaptiveScheduleModel.replanejarAtrasados(req.usuario.id_usuario || req.usuario.id)
    return res.json({ message: resultado.reagendados ? `${resultado.reagendados} dia(s) atrasado(s) foram redistribuídos.` : 'Não há pendências atrasadas.', ...resultado })
  } catch (error) {
    console.error('[CRONOGRAMA ADAPTATIVO]', error)
    return res.status(500).json({ message: 'Não foi possível replanejar o cronograma.' })
  }
}

async function analisarAtrasos(req, res) {
  try { return res.json(await adaptiveScheduleModel.analisarAtrasos(req.usuario.id_usuario || req.usuario.id)) }
  catch (error) { return res.status(500).json({ message: 'Não foi possível analisar os atrasos.' }) }
}

async function iniciarDesafio(req, res) {
  try { return res.json(await cronogramaService.iniciarDesafioAdiantamento(req.params.diaId, req.usuario.id_usuario || req.usuario.id)) }
  catch (error) { return res.status(400).json({ message: error.message }) }
}

async function iniciarProvaFinal(req, res) {
  try { return res.json(await cronogramaService.iniciarProvaFinal(req.params.cronogramaId, req.usuario.id_usuario || req.usuario.id)) }
  catch (error) { return res.status(400).json({ message: error.message }) }
}

async function enviarAvaliacao(req, res) {
  try { return res.json(await cronogramaService.enviarAvaliacao(req.params.avaliacaoId, req.usuario.id_usuario || req.usuario.id, req.body.respostas)) }
  catch (error) { return res.status(400).json({ message: error.message }) }
}

async function retomarAvaliacao(req, res) {
  try { return res.json(await cronogramaService.retomarAvaliacao(req.params.avaliacaoId, req.usuario.id_usuario || req.usuario.id)) }
  catch (error) { return res.status(400).json({ message: error.message }) }
}

async function abandonarAvaliacao(req, res) {
  try { return res.json(await cronogramaService.abandonarAvaliacao(req.params.avaliacaoId, req.usuario.id_usuario || req.usuario.id)) }
  catch (error) { return res.status(400).json({ message: error.message }) }
}

module.exports = {
  gerarCronograma,
  listarCronogramas,
  obterCronogramaAtivo,
  concluirDia,
  reabrirDia,
  concluirConteudo,
  reabrirConteudo,
  atualizarConteudoCronograma,
  uploadMaterial,
  replanejarAtrasados,
  analisarAtrasos,
  moverConteudo,
  iniciarDesafio,
  iniciarProvaFinal,
  enviarAvaliacao,
  retomarAvaliacao,
  abandonarAvaliacao
}
