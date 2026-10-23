# Migração do banco local para Aiven — 23/10/2026

- Origem preservada: MariaDB 10.4.32, banco local `tcc`.
- Exportação consistente: `backups/tcc-antes-migracao-2026-10-23-bf792e38.sql` (333.858 bytes).
- SHA-256: `BA18D27F3D9980D2C909A001AC57EE3DB09BEF0B4F72589E10CBED76034D3338`.
- Destino: serviço MySQL gratuito existente da conta Aiven, reativado nesta sessão; banco novo `planejai_tcc_online`.
- Foram importadas e conferidas 61 tabelas e 5.511 registros. As contagens de todas as tabelas coincidem com o banco local.
- Compatibilidade: duas ocorrências de `DEFAULT curdate()` foram importadas como `DEFAULT (curdate())`, exigido pela sintaxe do MySQL 8.4. A exportação original não foi alterada.
- TLS foi verificado usando a CA do serviço. Nenhum certificado foi ignorado na conexão de migração.
- A tentativa incompleta foi removida após a validação do destino final. Bancos anteriores do Aiven não foram substituídos.
- Credenciais e detalhes de validação estão somente em `backups/`, ignorado pelo Git; este relatório não contém segredos.
- Variáveis foram cadastradas somente em Production no Vercel: DATABASE_URL, DB_SSL_CA_BASE64, DB_SSL_MODE, JWT_SECRET, AUDIT_HASH_SALT, APP_URL, CORS_ORIGIN, TRUST_PROXY, DB_CONNECTION_LIMIT e DB_MAX_IDLE.
- Node.js do projeto foi atualizado de 20.x para 24.x para permitir novos builds.
- O redeploy usa a mesma revisão que já estava em produção, com as novas configurações. Alterações locais de código não foram publicadas por esse procedimento.

## Validação pública

Deploy de produção concluído: https://vercel.com/moises-company/planej-ai/9WsUh1NwCk3hSs6TwEhm2ZvfAh3T

No domínio https://planej-ai-dusky.vercel.app:

- `GET /api/health`: HTTP 200, `database: "connected"`.
- `GET /api-docs.json`: HTTP 200.
- Preflight `OPTIONS /api/auth/login`: HTTP 204 e a origem pública autorizada em `Access-Control-Allow-Origin`.

O banco local foi mantido para desenvolvimento. O backend publicado usa o banco separado no Aiven. O plano gratuito pode ser desligado pelo provedor após inatividade, conforme a política do serviço; se isso ocorrer, será necessário religá-lo no painel.
