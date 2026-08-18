const authService = require("../services/authService");

async function registrar(req, res) {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email) {
      return res.status(400).json({
        error: "Nome e email são obrigatórios.",
      });
    }

    const resultado = await authService.registrar({ nome, email, senha });

    return res.status(201).json({
      message: "Usuário criado com sucesso.",
      usuario: resultado.usuario,
      senha_temporaria: resultado.senha_temporaria,
    });
  } catch (error) {
    if (error.message.includes("Email já cadastrado")) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes("Senha deve")) {
      return res.status(400).json({ error: error.message });
    }

    if (
      error.message.includes("nome deve") ||
      error.message.includes("Email inválido")
    ) {
      return res.status(400).json({ error: error.message });
    }

    console.error("[REGISTER ERROR]", error);
    return res.status(500).json({
      error: "Erro interno ao registrar usuário.",
    });
  }
}

async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        error: "Email e senha são obrigatórios.",
      });
    }

    const resultado = await authService.login(email, senha);

    return res.status(200).json({
      token: resultado.token,
      usuario: resultado.usuario,
      primeiro_acesso: resultado.primeiro_acesso,
    });
  } catch (error) {
    if (error.message.includes("Credenciais inválidas")) {
      console.warn("[LOGIN FAIL] Credenciais inválidas.");
      return res.status(401).json({
        error: "Credenciais inválidas.",
      });
    }

    if (error.status === 403 || error.message.includes("Usuário desativado")) {
      return res.status(403).json({
        error: "Usuário desativado.",
      });
    }

    console.error("[LOGIN ERROR]", error);
    return res.status(500).json({
      error: "Erro interno ao autenticar.",
    });
  }
}

async function esqueciSenha(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email é obrigatório.",
      });
    }

    const resultado = await authService.esqueciSenha(email);

    return res.status(200).json({
      message: "Senha temporária gerada com sucesso.",
      senha_temporaria: resultado.senha_temporaria,
    });
  } catch (error) {
    if (error.message.includes("Email não encontrado")) {
      return res.status(404).json({
        error: error.message,
      });
    }

    console.error("[RECOVERY ERROR]", error);
    return res.status(500).json({
      error: "Erro interno ao recuperar senha.",
    });
  }
}

async function trocarSenhaPrimeiroAcesso(req, res) {
  try {
    const usuarioId = req.usuario.id_usuario || req.usuario.id;
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        error: "Senha atual e nova senha são obrigatórias.",
      });
    }
    if (confirmarSenha !== undefined && novaSenha !== confirmarSenha) {
      return res
        .status(400)
        .json({ error: "A confirmação da senha não corresponde." });
    }

    const resultado = await authService.trocarSenhaPrimeiroAcesso(
      usuarioId,
      senhaAtual,
      novaSenha,
    );

    return res.status(200).json(resultado);
  } catch (error) {
    if (
      error.message.includes("Senha atual incorreta") ||
      error.message.includes("Senha deve") ||
      error.message.includes("Usuário não encontrado")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    console.error("[FIRST ACCESS PASSWORD ERROR]", error);
    return res.status(500).json({
      error: "Erro interno ao alterar senha.",
    });
  }
}

async function alterarSenha(req, res) {
  try {
    const usuarioId = req.usuario.id_usuario || req.usuario.id;
    const { senhaAtual, novaSenha, confirmarSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({
        error: "Senha atual e nova senha são obrigatórias.",
      });
    }
    if (confirmarSenha !== undefined && novaSenha !== confirmarSenha) {
      return res
        .status(400)
        .json({ error: "A confirmação da senha não corresponde." });
    }

    const resultado = await authService.alterarSenha(
      usuarioId,
      senhaAtual,
      novaSenha,
    );

    return res.status(200).json(resultado);
  } catch (error) {
    if (
      error.message.includes("Senha atual incorreta") ||
      error.message.includes("Senha deve") ||
      error.message.includes("Usuário não encontrado")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    console.error("[PASSWORD CHANGE ERROR]", error);
    return res.status(500).json({
      error: "Erro interno ao alterar senha.",
    });
  }
}

module.exports = {
  registrar,
  login,
  esqueciSenha,
  trocarSenhaPrimeiroAcesso,
  alterarSenha,
};
