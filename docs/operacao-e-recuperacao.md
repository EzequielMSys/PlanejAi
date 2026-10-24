# Operação do PlanejAI

## Rotina do responsável

- Consulte `/dono`: falhas de escrita HTTP 5xx nas últimas 24 horas, uso diário da Lumi e pedidos de atendimento. O histórico vem do MySQL e permanece entre execuções do Vercel. Mensagens contam envios, inclusive tentativas sem resposta; não representam tokens ou saldo do provedor.
- Confira os logs de funções no Vercel para falhas de leitura, inicialização, indisponibilidade do banco e falhas do provedor de IA. O painel da aplicação também depende do banco e não substitui um monitor externo de disponibilidade.
- Confira diariamente no Aiven a existência, retenção e possibilidade de restauração dos backups gerenciados do plano contratado. Não considere um banco online automaticamente protegido. O agendador em memória não é executado no Vercel.
- Atenda os pedidos em `/dono`. Os usuários acessam o atendimento em Preferências. Não há envio automático de e-mail nem promessa de atendimento em tempo real.

## Cópia portátil e teste de restauração

### Rotina externa (etapa 21)

Os workflows `database-backup.yml` e `availability.yml` executam no GitHub Actions, independentemente deste computador. A cópia diária está programada para **03h17 de Brasília (06h17 UTC)**. Cada execução exporta com TLS/CA verificados, autentica a criptografia AES-256-GCM e restaura em um MySQL 8.4 descartável do runner, conferindo contagens. Só então publica `database.pnai` e `manifest.json`, com retenção de **14 dias**. Não publica SQL, chave, URI ou registros em texto aberto. O repositório é público: os arquivos criptografados podem ser acessíveis a quem tenha acesso aos artefatos; a chave precisa permanecer secreta.

Secrets necessários em Settings → Secrets and variables → Actions: `BACKUP_SOURCE_DATABASE_URL`, `BACKUP_SOURCE_CA_BASE64`, `BACKUP_ENCRYPTION_KEY`. A chave foi guardada também em `backups/external-backup-recovery-key.txt`, ignorado pelo Git. Transfira essa chave para um gerenciador de senhas: perder a chave impede restaurar qualquer cópia. Rotacioná-la exige preservar as anteriores durante a retenção das cópias correspondentes.

Históricos e execução manual:
- [Cópia e restauração](https://github.com/EzequielMSys/PlanejAi/actions/workflows/database-backup.yml)
- [Disponibilidade](https://github.com/EzequielMSys/PlanejAi/actions/workflows/availability.yml)

O monitor consulta `/api/health` a cada 30 minutos e exige banco conectado; repete falhas até três vezes. Ative as notificações de falha de Actions nas preferências do GitHub. Ele não envia mensagens próprias nem reinicia o banco. No painel do dono, “Cópias e disponibilidade” consulta o histórico público sob demanda, sem depender do MySQL e sem tokens no navegador. A página autenticada ainda depende da verificação da conta; durante uma queda, use os links diretos acima.

Os horários não são garantia: execuções podem atrasar. O GitHub desativa agendas de repositórios públicos após 60 dias sem atividade; confira Actions e reative se necessário. Uma falha de exportação ou restauração não substitui a última cópia válida. O objetivo de recuperação é de até um dia de dados **quando a rotina diária estiver saudável**; não há SLA. Revise semanalmente o histórico e o espaço disponível.

### Recuperar uma cópia externa

Abra uma execução bem-sucedida, baixe o artefato e extraia apenas o `.pnai` e o manifesto. Confira SHA-256 e data. Recupere a chave do gerenciador, configure `BACKUP_ENCRYPTION_KEY` e siga os passos de restauração isolada abaixo. Nunca publique a chave ou o arquivo decifrado. O teste automático verifica estrutura executável e contagens, não substitui uma validação funcional da aplicação restaurada.

### Quando o Aiven desligar ou ficar inacessível

1. Confira o workflow de disponibilidade e os logs do Vercel. Um banco inacessível retorna 503; não recrie contas nem limpe sessões dos usuários.
2. No Aiven, confira avisos, estado do serviço e uso de armazenamento. Se estiver desligado, ligue pelo painel e aguarde iniciar. O plano gratuito pode ser desligado por inatividade; monitoramento não garante impedir isso. Confira os e-mails do provedor. Não há religamento automático configurado.
3. Se o endereço mudou, atualize `DATABASE_URL`/CA no Vercel **e** os secrets de origem do backup; refaça o deploy. Nunca troque apenas a configuração local.
4. Confirme `/api/health` com `database: connected`, acesso e cronograma. Execute manualmente a cópia e confira a restauração antes de encerrar o incidente.
5. Se houver perda de dados, restaure a cópia mais recente em uma base isolada, valide os fluxos e só então planeje a troca da produção. Não restaure por cima da base atual.

Referências: [Aiven gratuito e inatividade](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier), [limitações das agendas do GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

### Execução manual

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
