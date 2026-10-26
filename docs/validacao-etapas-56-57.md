# Etapas 56 e 57 — biblioteca de cartões e revisão curta

## Entregas
- Biblioteca em Ferramentas de estudo / Cartões e pesquisa: criar, editar pergunta/resposta/matéria, filtrar por matéria (inclusive sem matéria), ativos/arquivados e pendentes para hoje. Paginação de 12 cartões, com consulta atualizada ao reabrir a biblioteca.
- Arquivar é reversível e tira o cartão das filas e da pesquisa legada. Restaurar mantém a data previamente marcada. Cartões confirmados mantêm sua origem mesmo após edição.
- Editor com rascunho por conta/cartão, confirmação de envio, repetição segura da criação e visualização da versão da conta em caso de edição concorrente. Edição não altera o agendamento.
- Revisão curta no Hoje com opções de 3, 5 e 10 minutos, limitadas a 2, 3 e 5 cartões pendentes. A estimativa usa 1,5 minuto por cartão e não força um cronômetro.
- Prioridade para a data de revisão mais antiga; cartões futuros ou arquivados ficam fora. Resposta oculta até o estudante conferir. Avaliação confirma cada cartão separadamente e mantém os intervalos existentes: errei 1 dia, difícil 3, lembrei 7 e dominei 15.
- Deixar para depois não envia avaliação nem modifica a data. Encerrar preserva as confirmações anteriores e deixa o restante pendente. Falha de conexão mantém a pergunta aberta, sem anunciar confirmação indevida.
- Datas da fila usam America/Sao_Paulo. Novos cartões ficam disponíveis na data local, inclusive quando o servidor já virou o dia em UTC.

## Integridade e compatibilidade
Migração aditiva flashcard_library_v57.sql aplicada ao Aiven e ao banco local. Adiciona arquivamento, versão, chave/hash de criação e identificador da última avaliação. Preserva todos os cartões existentes; nenhum registro de usuário removido.

Todas as consultas e gravações usam a conta autenticada. Edição, arquivamento e avaliação usam versão para evitar sobrescritas. Repetir uma avaliação com a mesma chave retorna sua confirmação sem novo reagendamento; um envio diferente com versão antiga retorna conflito. Respostas privadas não são armazenadas em cache HTTP.

As rotas legadas continuam disponíveis, com cartões arquivados excluídos e agendamento compartilhado com o novo serviço. A exportação pessoal já contempla flashcards_estudo e suas novas colunas.

## Validação
- Suíte completa: 497 testes aprovados; dois testes adicionais de recuperação de criação e interrupção de rodada aprovados em execução direcionada posterior.
- ESLint, sintaxe do backend e build de produção aprovados.
- Testes reais no Aiven e local com dois usuários fictícios, dentro de transações revertidas: criação/repetição, edição/conflito, isolamento entre contas, filtros, arquivamento/restauração, limites/prioridade da fila curta, repetição de avaliação e origem preservada. Ausência dos usuários fictícios confirmada após rollback.
- Navegador com dados fictícios: biblioteca, editor com foco de escrita, rodada de 3 minutos, revelação e confirmação/avanço. Nenhum envio real à IA.
- 320 px e fonte em 140%: sem rolagem horizontal nos novos fluxos; campos do editor com cerca de 225 px. Não representa teste de teclado em um aparelho físico.
- Evidências locais: backups/visual-etapas56-57/. Fixtures temporários removidos; credenciais, scripts de operação e logs permanecem ignorados pelo Git.
