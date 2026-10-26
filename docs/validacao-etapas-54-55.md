# Validação das etapas 54 e 55

## Busca do acervo
- Novos filtros Destaques e Conversas da Lumi, também incluídos em Tudo e nas buscas recentes por conta.
- Destaques: pesquisa em título, seção, trecho e anotação. Abertura do registro completo sem conceder acesso a arquivos do catálogo; o guia original exige nova conferência de acesso.
- Conversas: pesquisa em objetivo, matéria, mensagens e títulos/textos do contexto escolhido. Abertura por link em /lumi?conversa=ID, com prévia do contexto antes da retomada, sem chamada ao provedor de IA.
- Registros retirados/arquivados ficam fora da busca. Paginação e trechos curtos mantidos. Conta docente/administrativa não ganha acesso a registros pessoais de outras contas.
- Pesquisa nas mensagens e no contexto ignora diferença entre maiúsculas e acentos, validada no banco local e no Aiven.

## Perguntas a partir dos destaques
- Seleção de até cinco destaques de um guia, ou preparação a partir de um destaque encontrado na busca.
- Rascunho inicial determinístico e editável, sem geração de IA. Pergunta e resposta devem ser conferidas pelo estudante; salvar é uma ação explícita por cartão.
- Pergunta, resposta e matéria opcional usam rascunho por conta e destaque; falhas preservam o texto e permitem repetir o envio.
- Gravação atômica de um flashcard existente e de sua origem. Chave de envio evita duplicação por repetição; alteração de um envio já confirmado retorna conflito e oferece criar outra pergunta com confirmação.
- Link abre o cartão exato em Ferramentas de estudo, incluindo o trecho original, mesmo fora dos cinco primeiros cartões. Avaliação usa os intervalos de revisão já existentes.
- Retirar o destaque não apaga o cartão confirmado: a origem é preservada como cópia do trecho no momento da criação. A exportação pessoal inclui essa origem.

## Banco de dados e verificações
Migração aditiva highlight_reviews_v55.sql aplicada ao banco online e ao local, com registro de hash. Nenhuma tabela existente removida.

Verificação real em ambos os bancos com dois usuários fictícios, dentro de transações revertidas: isolamento de conta, pesquisa em mensagem e contexto, acentos, arquivamento, criação de pergunta editada, repetição idempotente, conflito e consulta da origem. Ausência dos usuários de teste confirmada ao final. Nenhuma chamada real à IA.

Navegador com dados fictícios: abertura do destaque, edição de pergunta, navegação da busca até a prévia da conversa. Largura de 320 px com fonte em 140% sem rolagem horizontal; campos de escrita com aproximadamente 232 px. Evidências locais em backups/visual-etapas54-55/; arquivos temporários de demonstração removidos.

Testes cobrem validação e limites, transação/rollback, autorização e ausência de cache privado, buscas recentes, fluxo de edição/falha/repetição, seleção de cinco destaques, acessibilidade automatizada e abertura/avaliação do cartão exato. Logs locais em backups/stage55-*.
