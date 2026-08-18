const usuarioService = require('../services/usuarioService')

function tratarErroUsuario(error, res) {
  if (error.message.includes('não encontrado')) {
    return res.status(404).json({ error: error.message })
  }

  if (
    error.message.includes('Permissão') ||
    error.message.includes('Apenas') ||
    error.message.includes('Não é permitido') ||
    error.message.includes('Você não pode')
  ) {
    return res.status(403).json({ error: error.message })
  }

  if (
    error.message.includes('Email') ||
    error.message.includes('Tipo') ||
    error.message.includes('obrigatório') ||
    error.message.includes('inválido') ||
    error.message.includes('mínimo')
  ) {
    return res.status(400).json({ error: error.message })
  }

  console.error('[USUARIO ERROR]', error)
  return res.status(500).json({ error: 'Erro interno.' })
}

async function listar(req, res) {
  try {
    const usuarios = await usuarioService.listar()

    return res.status(200).json({
      usuarios
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function obterPerfilLogado(req, res) {
  try {
    const usuarioId = req.usuario.id_usuario || req.usuario.id
    const usuario = await usuarioService.obterPerfilLogado(usuarioId)

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuário não encontrado.'
      })
    }

    return res.status(200).json({
      usuario
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function obterPorId(req, res) {
  try {
    const usuario = await usuarioService.obterPorId(req.params.id)

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuário não encontrado.'
      })
    }

    return res.status(200).json({
      usuario
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function atualizar(req, res) {
  try {
    const usuarioId = req.params.id
    const usuarioLogado = req.usuario
    const dados = req.body

    const resultado = await usuarioService.atualizar(
      usuarioId,
      dados,
      usuarioLogado
    )

    return res.status(200).json({
      message: 'Usuário atualizado com sucesso.',
      usuario: resultado
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function uploadFotoPerfil(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Nenhuma imagem enviada.'
      })
    }

    const usuarioId = req.usuario.id_usuario || req.usuario.id
    const fotoUrl = `/uploads/perfis/${req.file.filename}`

    const usuarioAtualizado = await usuarioService.atualizar(
      usuarioId,
      { foto_url: fotoUrl },
      req.usuario
    )

    return res.status(200).json({
      message: 'Foto atualizada com sucesso.',
      usuario: usuarioAtualizado
    })
  } catch (error) {
    console.error('[UPLOAD FOTO ERROR]', error)

    return res.status(500).json({
      error: 'Erro ao atualizar foto.'
    })
  }
}

async function removerFotoPerfil(req, res) {
  try {
    const usuarioId = req.usuario.id_usuario || req.usuario.id
    const usuarioAtualizado = await usuarioService.removerFotoPerfil(usuarioId, req.usuario)
    return res.status(200).json({ message: 'Foto de perfil removida.', usuario: usuarioAtualizado })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function alterarTipo(req, res) {
  try {
    const usuarioId = req.params.id
    const { tipo } = req.body
    const usuarioLogado = req.usuario

    if (!tipo) {
      return res.status(400).json({
        error: 'Campo tipo é obrigatório.'
      })
    }

    const resultado = await usuarioService.alterarTipo(
      usuarioId,
      tipo,
      usuarioLogado
    )

    return res.status(200).json({
      message: 'Tipo de usuário alterado com sucesso.',
      usuario: resultado
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function alterarStatus(req, res) {
  try {
    const usuarioId = req.params.id
    const { ativo } = req.body
    const usuarioLogado = req.usuario

    if (ativo === undefined) {
      return res.status(400).json({
        error: 'Campo ativo é obrigatório.'
      })
    }

    const resultado = await usuarioService.ativarDesativar(
      usuarioId,
      ativo ? 1 : 0,
      usuarioLogado
    )

    return res.status(200).json({
      message: ativo
        ? 'Usuário ativado com sucesso.'
        : 'Usuário desativado com sucesso.',
      usuario: resultado
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function resetarSenha(req, res) {
  try {
    const usuarioId = req.params.id
    const usuarioLogado = req.usuario

    const resultado = await usuarioService.resetarSenha(
      usuarioId,
      usuarioLogado
    )

    return res.status(200).json({
      message: 'Senha redefinida. Usuário deve trocar no próximo login.',
      senha_temporaria: resultado.senha_temporaria
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

async function definirSenha(req, res) {
  try {
    const usuarioId = req.params.id
    const { novaSenha, confirmarSenha } = req.body
    const usuarioLogado = req.usuario

    if (!novaSenha) {
      return res.status(400).json({
        error: 'Campo novaSenha é obrigatório.'
      })
    }

    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({
        error: 'As senhas não coincidem.'
      })
    }

    const resultado = await usuarioService.definirSenha(
      usuarioId,
      novaSenha,
      usuarioLogado
    )

    return res.status(200).json({
      message: resultado.message || 'Senha definida com sucesso.'
    })
  } catch (error) {
    return tratarErroUsuario(error, res)
  }
}

module.exports = {
  listar,
  obterPerfilLogado,
  obterPorId,
  atualizar,
  uploadFotoPerfil,
  removerFotoPerfil,
  alterarTipo,
  alterarStatus,
  resetarSenha,
  definirSenha
}
