const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const {
  authRateLimit,
  registrationRateLimit,
} = require("../middlewares/platformMiddleware");

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Cadastro]
 *     summary: Cadastra um novo aluno
 *     description: >
 *       Rota principal do PlanejAI. Cria a conta do aluno que será usada nas
 *       etapas seguintes de perfil e geração do cronograma personalizado.
 *       Se a senha não for enviada, o sistema gera uma senha temporária. Use um
 *       email diferente em cada teste; emails já cadastrados retornam HTTP 409.
 *       Por segurança, cada endereço IP pode fazer até 15 tentativas de cadastro
 *       a cada 10 minutos, com no máximo 3 cadastros processados simultaneamente.
 *     operationId: registerStudent
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             comSenha:
 *               summary: Cadastro com senha definida pelo aluno
 *               value:
 *                 nome: Maria Silva
 *                 email: altere.para.um.email.unico@example.com
 *                 senha: PlanejAI2026
 *             comSenhaTemporaria:
 *               summary: Cadastro com senha temporária gerada pelo sistema
 *               value:
 *                 nome: Maria Silva
 *                 email: outro.email.unico@example.com
 *     responses:
 *       '201':
 *         description: Usuário criado e confirmado na tabela usuarios.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterResponse'
 *       '400':
 *         description: Nome, email ou senha inválidos.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '409':
 *         description: O email informado já está cadastrado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       '429':
 *         description: Limite de 15 tentativas em 10 minutos ou limite de processamento simultâneo excedido.
 *         headers:
 *           Retry-After:
 *             description: Segundos até uma nova tentativa ser permitida.
 *             schema:
 *               type: integer
 *       '500':
 *         description: Erro interno ao registrar usuário.
 */
router.post("/register", registrationRateLimit, authController.registrar);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticação]
 *     summary: Autentica um usuário
 *     description: Retorna um token JWT. Copie o token e use o botão Authorize para testar rotas protegidas.
 *     operationId: login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       '200':
 *         description: Login realizado com sucesso.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       '400':
 *         description: Email ou senha ausentes.
 *       '401':
 *         description: Credenciais inválidas.
 *       '403':
 *         description: Usuário desativado.
 *       '429':
 *         description: Limite de tentativas excedido.
 */
router.post("/login", authRateLimit, authController.login);

/**
 * @openapi
 * /api/auth/esqueci-senha:
 *   post:
 *     tags: [Autenticação]
 *     summary: Solicita recuperação de senha
 *     description: Envia o link de recuperação quando o email pertence a uma conta, sem revelar se ela existe.
 *     operationId: forgotPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: aluno@example.com
 *     responses:
 *       '202':
 *         description: Solicitação recebida.
 *       '400':
 *         description: Email não informado.
 *       '429':
 *         description: Limite de tentativas excedido.
 */
router.post("/esqueci-senha", authRateLimit, authController.esqueciSenha);

/**
 * @openapi
 * /api/auth/redefinir-senha:
 *   post:
 *     tags: [Autenticação]
 *     summary: Redefine a senha usando o token de recuperação
 *     operationId: resetPassword
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       '200':
 *         description: Senha redefinida com sucesso.
 *       '400':
 *         description: Dados, token ou senha inválidos.
 *       '429':
 *         description: Limite de tentativas excedido.
 */
router.post("/redefinir-senha", authRateLimit, authController.redefinirSenha);

/**
 * @openapi
 * /api/auth/trocar-senha-primeiro-acesso:
 *   post:
 *     tags: [Autenticação]
 *     summary: Troca a senha temporária no primeiro acesso
 *     operationId: changeFirstAccessPassword
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       '200':
 *         description: Senha alterada com sucesso.
 *       '400':
 *         description: Senhas ausentes, divergentes ou inválidas.
 *       '401':
 *         description: Token ausente, inválido ou expirado.
 */
router.post(
  "/trocar-senha-primeiro-acesso",
  authMiddleware,
  authController.trocarSenhaPrimeiroAcesso,
);

/**
 * @openapi
 * /api/auth/alterar-senha:
 *   post:
 *     tags: [Autenticação]
 *     summary: Altera a senha do usuário autenticado
 *     operationId: changePassword
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       '200':
 *         description: Senha alterada com sucesso.
 *       '400':
 *         description: Senhas ausentes, divergentes ou inválidas.
 *       '401':
 *         description: Token ausente, inválido ou expirado.
 */
router.post("/alterar-senha", authMiddleware, authController.alterarSenha);

module.exports = router;
