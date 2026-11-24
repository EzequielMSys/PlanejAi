# Exclusão integral de conta: auditoria inicial

Verificação de esquema em 24/11/2026, apenas metadados do banco configurado localmente; nenhuma conta foi apagada.

O formulário atual registra um pedido de exclusão, mas ainda não executa a remoção. A exclusão direta de `usuarios` não é segura: o esquema em uso possui `RESTRICT` em `redacao_anotacoes.criado_por` e `turmas.criado_por`, além de relações antigas com `NO ACTION` em `perfil_estudo`, `redacoes` e `respostas_usuario`. Há dados com `id_usuario` sem chave estrangeira, incluindo mensagens da IA, limites, cronogramas e registros de aprendizagem. As relações de autoria compartilhada precisam de tratamento separado para não apagar o trabalho de outras contas.

Os arquivos também exigem um inventário por conta antes da remoção. Fotos e banners podem estar no disco ou em Vercel Blob privado. A nova rotina apaga os arquivos de perfil associados ao estudante antes de confirmar a transação; se o armazenamento falhar, o banco é revertido. Uma falha rara no commit após apagar o arquivo exige correção operacional da foto, mas não pode gerar exclusão silenciosa da conta.

## Implementado para contas de estudante

`DELETE /api/usuarios/me` exige sessão autenticada, CSRF, senha e frase de confirmação. A rotina transacional remove planejamento, perfil, redações, respostas, conversas, registros de estudo e relações colaborativas, confere a cobertura das tabelas com `id_usuario` no esquema atual, apaga fotos e banners e só então remove a conta. Contas de gestão ou com turma própria são recusadas para preservar os dados de terceiros; continuam no fluxo assistido.

O teste `node test/accountDeletionIntegration.js` criou um esquema MariaDB temporário, inseriu uma conta descartável com perfil, planejamento, conversa, redação, suporte e foto, verificou senha incorreta e falha de armazenamento com rollback, e confirmou a ausência da conta, das linhas relacionadas e do arquivo. O esquema temporário foi removido. **Ainda falta executar o fluxo pelo navegador na Vercel com conta descartável**, e conferir backups adicionais do provedor.

A rotina de backup externo configurada no GitHub retém artefatos por 14 dias. Antes de informar conclusão integral, confirmar se o banco e o armazenamento possuem cópias adicionais, sua retenção e o procedimento para exclusão ou expiração. Não marcar pedidos assistidos como resolvidos antes dessa verificação.
