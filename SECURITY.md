# Segurança

Não publique vulnerabilidades, senhas, tokens ou credenciais em issues públicas.

Ao relatar um problema, informe a rota afetada, impacto esperado, passos mínimos para reprodução e versão do commit. Remova dados pessoais e substitua tokens por valores fictícios.

Em produção, configure obrigatoriamente `JWT_SECRET` com pelo menos 32 caracteres, `CORS_ORIGIN` com a origem exata do frontend e uma conexão de banco remota protegida. Nunca envie `.env` ao Git.

Uploads são limitados por tamanho, extensão e MIME. Ainda assim, execute o backend com um usuário sem privilégios administrativos e mantenha a pasta de uploads fora de qualquer diretório executável.
