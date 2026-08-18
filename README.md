# PlanejAi

Plataforma de estudos com frontend React/Vite, API Node/Express e banco MySQL.

## Desenvolvimento local

1. Copie `.env.example` para `.env` e configure o MySQL e o segredo JWT.
2. Execute `npm ci` na raiz e em `frontend`.
3. Use `npm run dev:all` na raiz.

## Publicação

O GitHub Pages hospeda somente o frontend estático. A API Express e o MySQL precisam ser publicados em um serviço próprio.

1. Publique o backend e configure nele `CORS_ORIGIN=https://ezequielmsys.github.io`.
   Use `DATABASE_URL` para apontar todos os computadores e o backend publicado para a mesma instância MySQL. Localmente, as opções `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` continuam funcionando.
2. No GitHub, abra **Settings > Secrets and variables > Actions > Variables** e crie `VITE_API_URL` com a URL HTTPS pública do backend, sem `/api` e sem barra final.
3. Em **Settings > Pages**, selecione **GitHub Actions** como fonte.
4. Envie a branch `main`. O workflow `.github/workflows/deploy-pages.yml` fará o build e a publicação.

O site será servido em `https://ezequielmsys.github.io/PlanejAi/`. As rotas usam hash (`#/login`, por exemplo), evitando erro 404 ao atualizar páginas internas.

### Banco compartilhado

Não sincronize cópias de bancos locais entre computadores. Crie uma instância MySQL gerenciada e use a mesma `DATABASE_URL` no backend publicado. O frontend nunca deve receber a URL ou a senha do banco: ele conversa exclusivamente com a API. Depois de configurar o banco remoto, execute `npm run migrate:all` uma vez no ambiente do backend.

Para verificar API e banco, abra `/api/health` no backend. A resposta saudável é `{ "status": "OK", "database": "connected" }`.
