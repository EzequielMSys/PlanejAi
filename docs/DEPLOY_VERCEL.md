# Deploy na Vercel

O PlanejAI é composto por dois serviços no mesmo domínio:

- `frontend`: aplicação React/Vite pública.
- `api`: API Express pública somente pelos caminhos `/api`, `/uploads` e `/api-docs`.

O arquivo `vercel.json` encaminha as rotas para cada serviço. O frontend
consome a API por caminhos relativos, como `/api/auth/login`; por isso não há
uma URL fixa, CORS adicional ou binding interno entre os dois serviços.

## Preparação do projeto

1. Importe o repositório no painel da Vercel e selecione o framework
   **Services** nas configurações de Build and Deployment.
2. Em Storage, crie e conecte um **Vercel Blob privado**. A conexão cria a
   variável `BLOB_READ_WRITE_TOKEN`. Não use um store público: anexos de
   alunos, docentes e turmas passam pela autorização da API.
3. Use um MySQL externo com TLS. O MySQL instalado no computador não pode ser
   usado pelo ambiente cloud. Defina `DATABASE_URL` ou os valores `DB_HOST`,
   `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`.
4. Cadastre as variáveis abaixo em Production, Preview e Development quando
   aplicável. Segredos nunca começam com `VITE_`.

| Variável | Obrigatória | Observação |
| --- | --- | --- |
| `DATABASE_URL` | Sim | URL do MySQL externo com TLS, preferencialmente. |
| `JWT_SECRET` | Sim | Pelo menos 32 caracteres aleatórios. |
| `AUDIT_HASH_SALT` | Sim | Valor aleatório independente do JWT. |
| `BLOB_READ_WRITE_TOKEN` | Sim | Gerada ao conectar o Blob privado. |
| `APP_URL` | Sim em produção | Domínio final, por exemplo `https://planejai.vercel.app`. |
| `CORS_ORIGIN` | Recomendado | O mesmo domínio público; se houver domínio próprio, inclua-o também. |
| `SMTP_*` | Recomendado | Necessárias para recuperação de senha por e-mail. |
| `BCRYPT_SALT_ROUNDS` | Recomendado | Use 12 ou mais. |
| `TRUST_PROXY` | Sim | `true` na Vercel, para limites por IP funcionarem atrás do proxy. |

Durante o build do serviço `api`, o comando `vercel:prepare-api` aplica as
migrations com lock, insere somente os dados-base ausentes e repara links de
conteúdo. Ele é idempotente e falha se uma migration já aplicada tiver sido
alterada.

## Conferência após o deploy

1. Abra `https://SEU_DOMINIO/api/health`; a resposta deve indicar
   `database: "connected"`.
2. Cadastre ou entre com uma conta de teste.
3. Envie uma foto de perfil e um anexo de atividade; os arquivos devem ser
   lidos pelo Blob privado através da API, sem URL pública do armazenamento.
4. Verifique o fluxo de recuperação de senha se SMTP estiver configurado.

Para simular os serviços localmente depois de instalar a CLI atual da Vercel,
use `vercel dev -L` com as variáveis de ambiente disponíveis.
