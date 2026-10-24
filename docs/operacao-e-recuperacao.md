# Operação do PlanejAI

## Rotina do responsável

- Consulte `/dono`: falhas de escrita HTTP 5xx nas últimas 24 horas, uso diário da Lumi e pedidos de atendimento. O histórico vem do MySQL e permanece entre execuções do Vercel. Mensagens contam envios, inclusive tentativas sem resposta; não representam tokens ou saldo do provedor.
- Confira os logs de funções no Vercel para falhas de leitura, inicialização, indisponibilidade do banco e falhas do provedor de IA. O painel da aplicação também depende do banco e não substitui um monitor externo de disponibilidade.
- Confira diariamente no Aiven a existência, retenção e possibilidade de restauração dos backups gerenciados do plano contratado. Não considere um banco online automaticamente protegido. O agendador em memória não é executado no Vercel.
- Atenda os pedidos em `/dono`. Os usuários acessam o atendimento em Preferências. Não há envio automático de e-mail nem promessa de atendimento em tempo real.

## Cópia portátil e teste de restauração

1. Em um terminal privado, configure `DATABASE_URL`, CA/TLS e `BACKUP_ENCRYPTION_KEY` (32 bytes aleatórios representados por 64 caracteres hexadecimais). Não coloque esses valores em comandos compartilhados, Git ou relatórios. Guarde a chave em um gerenciador de senhas, separada dos arquivos.
2. Execute `node src/scripts/portableBackup.js export backups/copia-AAAA-MM-DD.pnai`. O arquivo é criptografado com AES-256-GCM, comprimido e autenticado depois de gravado. Não sobrescreve arquivos existentes. Preserve o resumo com data, contagens e SHA-256.
3. Copie o arquivo criptografado para armazenamento privado fora deste computador, com controle de acesso e retenção. Esta cópia manual não estabelece agendamento automático.
4. Crie uma base **vazia e isolada**, com prefixo `planejai_restore_`. Configure `RESTORE_DATABASE_URL` para ela e execute `node src/scripts/portableBackup.js restore backups/copia-AAAA-MM-DD.pnai`. O comando recusa outras bases e bases já preenchidas. Em caso de falha, descarte apenas essa base isolada e repita com uma nova base vazia.
5. Confira as contagens de tabelas e registros, depois teste login e fluxos críticos em uma instância isolada apontada para essa base. Registre a data do exercício. Não direcione a produção para a restauração antes da validação e de um plano de recuperação aprovado pelo responsável.

O exportador usa uma transação com snapshot consistente para dados InnoDB; não execute migrações durante a cópia. Inclui tabelas e registros; não inclui usuários MySQL, eventos, rotinas, views nem arquivos externos. Anexos e fotos no Vercel Blob/`uploads` precisam de proteção e retenção próprias. A chave criptográfica é indispensável para recuperar a cópia. O exportador mantém os dados em memória: use uma ferramenta especializada para bancos grandes.

## Pedidos de exclusão

O pedido confirmado em Preferências entra na fila do dono; **não apaga automaticamente a conta**. A resposta fica visível ao solicitante. Confirme identidade e escopo no canal autenticado antes da execução. Ofereça a exportação existente no Perfil. Considere vínculos legados sem `ON DELETE CASCADE`, turmas, atividades compartilhadas, auditoria, arquivos e cópias de segurança. Remova ou anonimize apenas os dados do solicitante, preservando registros de terceiros; valide em transação e teste antes. Não marque como resolvido antes da conclusão. Informe ao usuário a conclusão e o tratamento dos backups conforme a política de retenção aplicável. Não prometa exclusão imediata de cópias históricas.

## Incidentes da Lumi

Confira configuração no servidor, códigos HTTP e limites no console do provedor. Nunca exponha chave no frontend. O limite mostrado no painel é por usuário/dia segundo o relógio do banco. Chave presente não comprova saldo ou disponibilidade. Se o provedor falhar, mantenha estudo e cronograma acessíveis e comunique pelo atendimento. Não inclua texto de redações ou conversas em relatórios de incidente.
