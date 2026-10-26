# Etapas 58 e 59 — busca de cartões e histórico de revisões

## Entregas
- Busca unificada inclui Cartões de revisão e pesquisa na pergunta, resposta e matéria, com trecho encontrado destacado. Somente cartões ativos da própria conta, inclusive para docentes e administradores.
- Abrir cartão leva ao registro exato na biblioteca, com nova conferência de acesso e foco no cartão. O filtro também participa das buscas recentes isoladas por conta.
- Histórico individual disponível sob demanda em cada cartão, inclusive arquivados. Consulta não registra avaliações nem altera datas.
- Linha do tempo com avaliação, horário de Brasília, intervalo e próxima revisão que foram marcados naquela tentativa. Resumo de Errei, Foi difícil, Lembrei e Dominei.
- Cada tentativa preserva a pergunta e resposta que estavam salvas no servidor naquele momento. Quando diferem do cartão atual, a interface avisa e permite conferir os textos anteriores.
- Nas cinco avaliações mais recentes da primeira página, duas ou mais marcações de Errei/Foi difícil mostram uma sugestão de conferir o foco e o exemplo da pergunta. São autoavaliações, sem inferir uma nota ou domínio do conteúdo.
- Histórico começa com as avaliações registradas após esta atualização. Não há reconstrução de tentativas antigas a partir do último resultado disponível. Uma repetição de confirmação antiga continua válida sem inventar seu texto anterior.

## Persistência e privacidade
Migração aditiva flashcard_history_v59.sql aplicada ao Aiven e ao banco local, com registro de hash. Tabela pessoal flashcard_revisoes incluída na exportação de dados da conta.

Avaliação, novo agendamento e inserção no histórico são uma única transação, sob bloqueio do cartão e conferência de versão. Falha ao gravar o histórico reverte o agendamento. Uma chave repetida retorna a confirmação original, inclusive após revisões posteriores, sem duplicar registros. O texto da tentativa vem do banco, não de campos enviados pelo cliente.

Histórico consultado por conta autenticada e cartão, paginado em 20 registros. Respostas privadas usam Cache-Control private, no-store. Arquivar mantém o histórico; a busca não retorna cartões arquivados. Exclusão de conta/cartão segue as chaves estrangeiras existentes e o histórico acompanha essa exclusão.

## Verificações
- Suíte completa: 509 testes aprovados. Após ampliação da verificação HTTP de autorização e cache do histórico, os 13 testes do serviço de cartões passaram novamente.
- ESLint e build de produção aprovados; sintaxe do backend validada.
- Verificação real no Aiven e local: usuários fictícios em transações revertidas, busca pela resposta e sem acentos, isolamento de contas (incluindo dono), arquivamento, histórico vazio, duas avaliações com edição entre elas, preservação do texto original, repetição de avaliação anterior e reversão de agendamento diante de falha simulada do histórico. Ausência dos usuários fictícios confirmada após rollback.
- Navegador com dados fictícios: busca pela resposta, abertura direta, resumo do histórico, consulta ao texto anterior e leitura com 320 px/fonte de 140%, sem rolagem horizontal. Não representa teste em aparelho físico.
- Nenhuma chamada real à IA. Fixtures temporários removidos; evidências, logs e credenciais de operação ficam ignorados em backups/.
