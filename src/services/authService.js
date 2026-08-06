const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const usuarioModel = require('../models/usuarioModel');
const {
  gerarSenhaTemporaria,
  validarSenhaForte,
  sanitizeUser
} = require('../utils/authUtils');

class AuthService {
  async registrar(dados) {
    const { nome, email, senha } = dados;

if (!nome || !email) {
      throw new Error('Nome e email são obrigatórios.');
    }

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(nome.trim())) {
      throw new Error('O nome deve conter apenas letras.');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error('Email inválido.');
    }

    const usuarioExistente = await usuarioModel.buscarPorEmail(email);

    if (usuarioExistente) {
      throw new Error('Email já cadastrado.');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

    let senhaHash;
    let senhaTemporariaRetorno = null;
    let senhaTemporariaFlag = 0;

    if (senha) {
      if (!validarSenhaForte(senha)) {
        throw new Error('Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.');
      }

      senhaHash = await bcrypt.hash(senha, saltRounds);
    } else {
      senhaTemporariaRetorno = gerarSenhaTemporaria();
      senhaHash = await bcrypt.hash(senhaTemporariaRetorno, saltRounds);
      senhaTemporariaFlag = 1;
    }

    const novoUsuario = await usuarioModel.criarUsuario({
      nome,
      email,
      senhaHash,
      tipo: 'aluno',
      senha_temporaria: senhaTemporariaFlag,
      ativo: 1
    });

    return {
      usuario: sanitizeUser(novoUsuario),
      senha_temporaria: senhaTemporariaRetorno
    };
  }

  async login(email, senha) {
    if (!email || !senha) {
      throw new Error('Credenciais inválidas.');
    }

    const usuario = await usuarioModel.buscarPorEmail(email);

    if (!usuario) {
      throw new Error('Credenciais inválidas.');
    }

    if (usuario.ativo === 0) {
      const error = new Error('Usuário desativado.');
      error.status = 403;
      throw error;
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      throw new Error('Credenciais inválidas.');
    }

    const usuarioId = usuario.id_usuario || usuario.id;

    await usuarioModel.atualizarUltimoLogin(usuarioId);

    const token = jwt.sign(
      {
        id: usuarioId,
        id_usuario: usuarioId,
        tipo: usuario.tipo
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRATION || '8h' }
    );

    return {
      token,
      usuario: sanitizeUser(usuario),
      primeiro_acesso: usuario.senha_temporaria === 1
    };
  }

  async esqueciSenha(email) {
    const usuario = await usuarioModel.buscarPorEmail(email);

    if (!usuario) {
      throw new Error('Email não encontrado.');
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds);

    const usuarioId = usuario.id_usuario || usuario.id;

    await usuarioModel.resetarSenhaTemporaria(usuarioId, senhaHash);

    return { senha_temporaria: senhaTemporaria };
  }

  async trocarSenhaPrimeiroAcesso(usuarioId, senhaAtual, novaSenha) {
    const usuario = await usuarioModel.buscarPorIdCompleto(usuarioId);

    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      throw new Error('Senha atual incorreta.');
    }

    if (!validarSenhaForte(novaSenha)) {
      throw new Error('Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    await usuarioModel.trocarSenha(usuarioId, novaSenhaHash);

    return { message: 'Senha alterada com sucesso.' };
  }

  async alterarSenha(usuarioId, senhaAtual, novaSenha) {
    const usuario = await usuarioModel.buscarPorIdCompleto(usuarioId);

    if (!usuario) {
      throw new Error('Usuário não encontrado.');
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      throw new Error('Senha atual incorreta.');
    }

    if (!validarSenhaForte(novaSenha)) {
      throw new Error('Senha deve ter no mínimo 8 caracteres, 1 letra maiúscula e 1 número.');
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, saltRounds);

    await usuarioModel.alterarSenha(usuarioId, novaSenhaHash);

    return { message: 'Senha alterada com sucesso.' };
  }
}

module.exports = new AuthService();