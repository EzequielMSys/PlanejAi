const bcrypt = require('bcrypt')

const usuarioModel = require('../models/usuarioModel')
const { gerarSenhaTemporaria } = require('../utils/authUtils')

const TIPOS_PERMITIDOS = ['dono', 'admin', 'docente', 'aluno']

function obterIdUsuario(usuario) {
  return usuario?.id_usuario || usuario?.id
}

class UsuarioService {
  async listar() {
    return await usuarioModel.listarUsuarios()
  }

  async obterPorId(id) {
    return await usuarioModel.buscarPorId(id)
  }

  async obterPerfilLogado(id) {
    return await usuarioModel.buscarPorId(id)
  }

  async atualizar(id, dados, usuarioLogado) {
    const usuarioLogadoId = obterIdUsuario(usuarioLogado)
    const tipoLogado = usuarioLogado.tipo

    const isDono = tipoLogado === 'dono'
    const isAdmin = tipoLogado === 'admin'
    const isMesmoUsuario = Number(id) === Number(usuarioLogadoId)

    const usuarioAlvo = await usuarioModel.buscarPorId(id)

    if (!usuarioAlvo) throw new Error('Usuário não encontrado.')

    if (!isMesmoUsuario && !isAdmin && !isDono) {
      throw new Error('Permissão negada para editar outro usuário.')
    }

    const dadosAtualizacao = {
      nome: dados.nome,
      email: dados.email,
      apelido: dados.apelido,
      foto_url: dados.foto_url
    }

    if (dados.tipo !== undefined) {
      if (!isDono) throw new Error('Apenas o dono pode alterar tipo de usuário.')

      if (!TIPOS_PERMITIDOS.includes(dados.tipo)) {
        throw new Error('Tipo de usuário inválido.')
      }

      if (usuarioAlvo.tipo === 'dono' && Number(id) !== Number(usuarioLogadoId)) {
        throw new Error('Não é permitido alterar outro usuário dono.')
      }

      dadosAtualizacao.tipo = dados.tipo
    }

    if (dados.email) {
      const usuarioExistente = await usuarioModel.buscarPorEmail(dados.email)
      const usuarioExistenteId = obterIdUsuario(usuarioExistente)

      if (usuarioExistente && Number(usuarioExistenteId) !== Number(id)) {
        throw new Error('Email já em uso.')
      }
    }

    return await usuarioModel.atualizarUsuario(id, dadosAtualizacao)
  }

  async alterarTipo(id, tipo, usuarioLogado) {
    const usuarioLogadoId = obterIdUsuario(usuarioLogado)

    if (usuarioLogado.tipo !== 'dono') {
      throw new Error('Apenas o dono pode alterar tipo de usuário.')
    }

    if (!TIPOS_PERMITIDOS.includes(tipo)) {
      throw new Error('Tipo de usuário inválido.')
    }

    const usuarioAlvo = await usuarioModel.buscarPorId(id)

    if (!usuarioAlvo) throw new Error('Usuário não encontrado.')

    if (usuarioAlvo.tipo === 'dono' && Number(id) !== Number(usuarioLogadoId)) {
      throw new Error('Não é permitido alterar outro usuário dono.')
    }

    return await usuarioModel.atualizarUsuario(id, { tipo })
  }

  async ativarDesativar(id, ativo, usuarioLogado) {
    const usuarioLogadoId = obterIdUsuario(usuarioLogado)

    if (usuarioLogado.tipo !== 'dono') {
      throw new Error('Apenas o dono pode ativar ou desativar usuários.')
    }

    if (Number(id) === Number(usuarioLogadoId)) {
      throw new Error('Você não pode desativar a própria conta.')
    }

    const usuarioAlvo = await usuarioModel.buscarPorId(id)

    if (!usuarioAlvo) throw new Error('Usuário não encontrado.')

    if (usuarioAlvo.tipo === 'dono') {
      throw new Error('Não é permitido desativar uma conta dono.')
    }

    return await usuarioModel.ativarDesativarUsuario(id, ativo)
  }

  async resetarSenha(id, usuarioLogado) {
    if (usuarioLogado.tipo !== 'dono' && usuarioLogado.tipo !== 'admin') {
      throw new Error('Permissão negada para resetar senha.')
    }

    const usuarioAlvo = await usuarioModel.buscarPorId(id)

    if (!usuarioAlvo) throw new Error('Usuário não encontrado.')

    if (usuarioAlvo.tipo === 'dono' && usuarioLogado.tipo !== 'dono') {
      throw new Error('Apenas o dono pode resetar senha de outro dono.')
    }

    const senhaTemporaria = gerarSenhaTemporaria()
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
    const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds)

    await usuarioModel.resetarSenhaTemporaria(id, senhaHash)

    return { senha_temporaria: senhaTemporaria }
  }

  async definirSenha(id, novaSenha, usuarioLogado) {
    const usuarioLogadoId = obterIdUsuario(usuarioLogado)

    if (usuarioLogado.tipo !== 'dono') {
      throw new Error('Apenas o dono pode definir senha de usuários.')
    }

    if (!novaSenha || novaSenha.length < 8) {
      throw new Error('A nova senha deve ter no mínimo 8 caracteres.')
    }

    const usuarioAlvo = await usuarioModel.buscarPorId(id)

    if (!usuarioAlvo) throw new Error('Usuário não encontrado.')

    if (usuarioAlvo.tipo === 'dono' && Number(id) !== Number(usuarioLogadoId)) {
      throw new Error('Não é permitido alterar a senha de outro dono.')
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10)
    const senhaHash = await bcrypt.hash(novaSenha, saltRounds)

    await usuarioModel.definirSenhaUsuario(id, senhaHash)

    return {
      id_usuario: id,
      message: 'Senha definida com sucesso.'
    }
  }
}

module.exports = new UsuarioService()