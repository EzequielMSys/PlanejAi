const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { authRateLimit } = require("../middlewares/platformMiddleware");

router.post("/register", authRateLimit, authController.registrar);
router.post("/login", authRateLimit, authController.login);
router.post("/esqueci-senha", authRateLimit, authController.esqueciSenha);
router.post(
  "/trocar-senha-primeiro-acesso",
  authMiddleware,
  authController.trocarSenhaPrimeiroAcesso,
);
router.post("/alterar-senha", authMiddleware, authController.alterarSenha);

module.exports = router;
