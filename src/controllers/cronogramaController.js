const cronogramaService = require('../services/cronogramaService')

function tratarErroCronograma(error, res) {
  const mensagensUsuario = [
    'Perfil de estudo não configurado',
    'Disponibilidade semanal não configurada',
    'Nenhum dia disponível para estudo foi configurado',
    'Nenhum conteúdo cadastrado para as áreas de foco informadas'
  ]

  if (mensagensUsuario.includes(error.message)) {
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

    const resultado = await cronogramaService.marcarConcluido(diaId)

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

    const conteudo = await cronogramaService.concluirConteudo(
      conteudoCronogramaId
    )

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
    const { link, titulo, descricao, materiais } = req.body
    const resultado = await cronogramaService.atualizarConteudoCronograma(conteudoCronogramaId, { link, titulo, descricao, materiais })
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

module.exports = {
  gerarCronograma,
  listarCronogramas,
  obterCronogramaAtivo,
  concluirDia,
  reabrirDia,
  concluirConteudo,
  reabrirConteudo,
  atualizarConteudoCronograma,
  uploadMaterial
}