const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const usuarioModel = require("../models/usuarioModel");
const {
  validarSenhaForte,
  sanitizeUser,
  getBcryptRounds,
  REQUISITOS_SENHA,
} = require("../utils/authUtils");
const { getJwtSecret } = require("../config/jwtConfig");
const { enviarRecuperacaoSenha } = require("./emailService");
const jobQueue = require("./jobQueue");

class AuthService {
  async registrar(dados) {
    const nome = String(dados.nome || "").trim();
    const email = String(dados.email || "")
      .trim()
      .toLowerCase();
    const { senha, website } = dados;

    if (!nome || !email || !senha) {
      throw new Error("Nome, email e senha são obrigatórios.");
    }

    if (String(website || '').trim()) throw new Error('Cadastro inválido.');

    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(nome.trim())) {
      throw new Error("O nome deve conter apenas letras.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      throw new Error("Email inválido.");
    }

    const usuarioExistente = await usuarioModel.buscarPorEmail(email);

    if (usuarioExistente) {
      throw new Error("Email já cadastrado.");
    }

    if (!validarSenhaForte(senha)) {
      throw new Error(`Senha deve ter ${REQUISITOS_SENHA.toLowerCase()}.`);
    }
    const senhaHash = await bcrypt.hash(senha, getBcryptRounds());

    const novoUsuario = await usuarioModel.criarUsuario({
      nome,
      email,
      senhaHash,
      tipo: "aluno",
      senha_temporaria: 0,
      ativo: 1,
    });

    return {
      usuario: sanitizeUser(novoUsuario),
      senha_temporaria: null,
    };
  }

  async login(email, senha) {
    email = String(email || "")
      .trim()
      .toLowerCase();
    if (!email || !senha) {
      throw new Error("Credenciais inválidas.");
    }

    const usuario = await usuarioModel.buscarPorEmail(email);

    if (!usuario) {
      await bcrypt.compare(
        String(senha),
        "$2b$10$7EqJtq98hPqEX7fNZaFWoO5uQZt0gVQvJ6QpQn2K4VQd7h6gQ8n7K",
      );
      throw new Error("Credenciais inválidas.");
    }

    if (usuario.ativo === 0) {
      const error = new Error("Usuário desativado.");
      error.status = 403;
      throw error;
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      throw new Error("Credenciais inválidas.");
    }

    const usuarioId = usuario.id_usuario || usuario.id;

    // O carimbo de auditoria é secundário: uma falha transitória nesta atualização
    // não deve invalidar credenciais que já foram verificadas com sucesso.
    try {
      await usuarioModel.atualizarUltimoLogin(usuarioId);
    } catch (error) {
      console.warn("[LOGIN AUDIT WARNING] Não foi possível atualizar ultimo_login:", error.message);
    }

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      {
        id: usuarioId,
        id_usuario: usuarioId,
        tipo: usuario.tipo,
        sv: Number(usuario.versao_sessao || 0),
      },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRATION || "8h" },
    );

    return {
      token,
      usuario: sanitizeUser(usuario),
      primeiro_acesso: usuario.senha_temporaria === 1,
    };
  }

  async esqueciSenha(email) {
    const usuario = await usuarioModel.buscarPorEmail(
      String(email || "")
        .trim()
        .toLowerCase(),
    );

    if (!usuario) {
      crypto.randomBytes(32);
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiracao = new Date(Date.now() + 30 * 60 * 1000);
    const usuarioId = usuario.id_usuario || usuario.id;
    await usuarioModel.salvarTokenRecuperacao(usuarioId, tokenHash, expiracao);

    // APP_URL é a fonte de verdade para domínio próprio. VERCEL_URL permite
    // que links de recuperação também funcionem nos deployments de preview.
    const hostedUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";
    const appUrl = String(process.env.APP_URL || hostedUrl || "http://localhost:5173").replace(/\/$/, "");
    jobQueue.enqueue("PASSWORD_RECOVERY_EMAIL", () =>
      enviarRecuperacaoSenha({
        email: usuario.email,
        nome: usuario.nome,
        resetUrl: `${appUrl}/redefinir-senha?token=${encodeURIComponent(token)}`,
      }),
    );
  }

  async redefinirSenha(token, novaSenha) {
    if (!/^[a-f0-9]{64}$/i.test(String(token || ""))) {
      throw new Error("Token inválido ou expirado.");
    }
    if (!validarSenhaForte(novaSenha)) {
      throw new Error(`A nova senha deve ter ${REQUISITOS_SENHA.toLowerCase()}.`);
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const usuario = await usuarioModel.buscarPorTokenRecuperacao(tokenHash);
    if (!usuario || usuario.ativo === 0) throw new Error("Token inválido ou expirado.");

    const senhaHash = await bcrypt.hash(novaSenha, getBcryptRounds());
    const updated = await usuarioModel.redefinirSenhaComToken(usuario.id_usuario, tokenHash, senhaHash);
    if (!updated) throw new Error("Token inválido ou expirado.");
    return { message: "Senha redefinida com sucesso." };
  }

  async trocarSenhaPrimeiroAcesso(usuarioId, senhaAtual, novaSenha) {
    const usuario = await usuarioModel.buscarPorIdCompleto(usuarioId);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      throw new Error("Senha atual incorreta.");
    }

    if (!validarSenhaForte(novaSenha)) {
      throw new Error(`A nova senha deve ter ${REQUISITOS_SENHA.toLowerCase()}.`);
    }
    if (senhaAtual === novaSenha) {
      throw new Error("A nova senha deve ser diferente da senha atual.");
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, getBcryptRounds());

    await usuarioModel.trocarSenha(usuarioId, novaSenhaHash);

    return { message: "Senha alterada com sucesso." };
  }

  async alterarSenha(usuarioId, senhaAtual, novaSenha) {
    const usuario = await usuarioModel.buscarPorIdCompleto(usuarioId);

    if (!usuario) {
      throw new Error("Usuário não encontrado.");
    }

    const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

    if (!senhaCorreta) {
      throw new Error("Senha atual incorreta.");
    }
    if (senhaAtual === novaSenha) {
      throw new Error("A nova senha deve ser diferente da senha atual.");
    }

    if (!validarSenhaForte(novaSenha)) {
      throw new Error(`A nova senha deve ter ${REQUISITOS_SENHA.toLowerCase()}.`);
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, getBcryptRounds());

    await usuarioModel.alterarSenha(usuarioId, novaSenhaHash);

    return { message: "Senha alterada com sucesso." };
  }
}

module.exports = new AuthService();
