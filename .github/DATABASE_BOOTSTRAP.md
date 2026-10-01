# Banco, seeds e backup

Ao iniciar, o backend aplica todas as migrations antes de liberar a API. Por padrão,
ele também insere conteúdos e questões essenciais de maneira idempotente. Para
desativar os dados iniciais, use `AUTO_SEED_DATABASE=false`.

Para atualizar o schema manualmente:

```powershell
npm run migrate:all
```

Para copiar schema e dados para um segundo banco MySQL, configure
`BACKUP_DATABASE_URL`. O destino precisa estar vazio. Caso seja uma base exclusiva
de backup que já contenha uma cópia anterior, configure também
`BACKUP_ALLOW_REPLACE=true` e execute:

```powershell
node src/scripts/backupDatabase.js
```

O comando recusa usar o banco principal como destino, desabilita chaves estrangeiras
durante a cópia e confere a quantidade de tabelas ao final. A URL contém credenciais e
nunca deve ser versionada.

## Recuperação de senha

Configure `APP_URL` e as variáveis `SMTP_*` do `.env.example`. Os tokens enviados por
email expiram em 30 minutos, são armazenados somente como hash e deixam de funcionar
imediatamente após a troca da senha.
