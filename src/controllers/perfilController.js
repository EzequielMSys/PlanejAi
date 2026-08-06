const perfilModel = require('../models/perfilEstudoModel')
const dispModel = require('../models/disponibilidadeSemanaModel')

function validarAreasFoco(areasFoco) {
  if (!areasFoco || typeof areasFoco !== 'string') return false

  const itens = areasFoco.split(',').map((a) => a.trim()).filter(Boolean)

  if (itens.length === 0) return false

  return itens.every((item) => /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(item))
}

async function salvarPerfil(req, res) {
  try {
    const usuarioId = req.usuario.id
    const perfil = req.body

    if (!validarAreasFoco(perfil.areas_foco)) {
      return res.status(400).json({
        message: 'As áreas de foco devem conter apenas letras.'
      })
    }

    const perfilSalvo =
      await perfilModel.criarOuAtualizarPerfil(usuarioId, perfil)

    return res.status(201).json({
      message: 'Perfil salvo com sucesso.',
      perfil: perfilSalvo
    })
  } catch (error) {
    console.error('Erro ao salvar perfil de estudo:', error)

    return res.status(500).json({
      message: 'Erro interno ao salvar perfil de estudo.'
    })
  }
}

async function atualizarPerfil(req, res) {
  try {
    const usuarioId = req.usuario.id
    const perfil = req.body

    if (!validarAreasFoco(perfil.areas_foco)) {
      return res.status(400).json({
        message: 'As áreas de foco devem conter apenas letras.'
      })
    }

    const perfilAtualizado =
      await perfilModel.criarOuAtualizarPerfil(usuarioId, perfil)

    return res.json({
      message: 'Perfil atualizado com sucesso.',
      perfil: perfilAtualizado
    })
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error)

    return res.status(500).json({
      message: 'Erro interno ao atualizar perfil.'
    })
  }
}

async function salvarDisponibilidade(req, res) {
  try {
    const usuarioId = req.usuario.id
    const { dias } = req.body

    await dispModel.salvarDisponibilidade(usuarioId, dias || [])

    return res.status(201).json({
      message: 'Disponibilidade salva com sucesso.'
    })
  } catch (error) {
    console.error('Erro ao salvar disponibilidade:', error)

    return res.status(500).json({
      message: 'Erro interno ao salvar disponibilidade.'
    })
  }
}

async function obterDisponibilidade(req, res) {
  try {
    const usuarioId = req.usuario.id

    const disponibilidade =
      await dispModel.obterDisponibilidade(usuarioId)

    return res.json(disponibilidade)
  } catch (error) {
    console.error('Erro ao obter disponibilidade:', error)

    return res.status(500).json({
      message: 'Erro interno.'
    })
  }
}

async function obterPerfilCompleto(req, res) {
  try {
    const usuarioId = req.usuario.id

    const perfil =
      await perfilModel.obterPerfilPorUsuario(usuarioId)

    const disponibilidade =
      await dispModel.obterDisponibilidade(usuarioId)

    return res.json({
      perfil,
      disponibilidade
    })
  } catch (error) {
    console.error('Erro ao obter perfil completo:', error)

    return res.status(500).json({
      message: 'Erro interno.'
    })
  }
}

module.exports = {
  salvarPerfil,
  atualizarPerfil,
  salvarDisponibilidade,
  obterDisponibilidade,
  obterPerfilCompleto
}