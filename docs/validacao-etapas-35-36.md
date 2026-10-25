# Etapas 35 e 36 — Minhas palavras e caminhos das dúvidas

Disponíveis na sala de estudo e em **Aprendizagem → Minhas palavras e dúvidas**.

## Experiência

- Uma explicação cria um registro privado. Novas tentativas acrescentam versões imutáveis, com data, sem substituir a primeira.
- A tentativa começa com as versões anteriores ocultas. É possível consultá-las e compará-las; a lista sugere retomar três dias após a última explicação, com cálculo no MySQL. Não há notificação automática.
- Dúvidas acompanham diferentes sessões e aceitam tentativas, anotações e exemplos/referências em texto. Na sala, o estudante pode copiar suas anotações, revisar o trecho e salvar uma fotografia daquele texto. Alterações posteriores na anotação não modificam o histórico.
- Resolver exige registrar o que fez a diferença. Reabrir exige explicar o que ainda precisa de investigação. A Lumi não resolve nem avalia domínio automaticamente.
- Os registros são opcionais. Se o estudante começar um rascunho vinculado ao conteúdo da sessão, precisa salvá-lo ou descartá-lo antes de concluir a sessão.

## Persistência, privacidade e operação

- Migration aditiva `learning_journal_v24.sql`: `diario_aprendizagem`, `diario_passos`, `diario_lumi_uso`. Aplicada e verificada no MySQL local e no Aiven antes da publicação; sem alteração de registros existentes.
- Todas as operações usam o usuário autenticado. Conteúdos vinculados são reautorizados na criação; explicações e dúvidas sem conteúdo também são permitidas.
- Escritas transacionais, chave por tentativa e hash do conteúdo: reenvios idênticos retornam o registro original; mudanças com a mesma chave são recusadas. Textos limitados a 4.000 caracteres; assunto a 160; listas paginadas (20), histórico por cursor (50).
- Rascunhos separados por conta e conteúdo/registro, com cópia local explícita, alternativa em memória se o armazenamento falhar, aviso ao fechar e opção de baixar texto. Uma cópia local nunca é apresentada como salva na conta. Nenhum rascunho é enviado automaticamente.
- Consulta da Lumi separada do chat: exige selecionar de um a quatro passos (ao menos dois para comparar explicações) e clicar para enviar. O servidor reautoriza cada passo e envia somente texto, tipo e data; não acrescenta perfil, título, anotações não escolhidas ou conversa geral.
- Limite independente e atômico de 20 consultas ao diário por dia/conta. Falhas do provedor consomem uma tentativa, evitando repetição sem limite. Prazo de 45 segundos para o provedor, 55 segundos no cliente.
- Feedback da Lumi é transitório e pode ser baixado; não é armazenado no chat nem nas versões. Testes do provedor usam resposta simulada, sem enviar dados reais de estudantes à IA.
- Registros e passos integram a exportação de dados pessoais. Excluir um registro exige confirmação na interface e remove seus passos por cascata. Exclusão da conta também remove os novos dados por chaves estrangeiras.
- Leituras pessoais usam `Cache-Control: no-store` e não recorrem ao cache offline para anunciar sucesso. Componentes são carregados sob demanda; a seção recolhida da sala não consulta o diário.

## Validação

- Testes automatizados: isolamento de conta, validação de limites, idempotência, conflito de payload, preservação de versões, resolução/reabertura, seleção explícita e limite atômico da Lumi, exportação pessoal, falha/reenvio de rascunho, comparação sem envio automático, acessibilidade e proteção da conclusão da sessão.
- MySQL local real: criação, reenvio, versões, isolamento, retomada após três dias, resolução/reabertura e cascata, dentro de transação revertida. Contas e textos de teste não foram mantidos.
- Lint e build de produção do frontend, mais a suíte completa do projeto.
- Conferência visual em navegador com dados fictícios: comparação em duas colunas no desktop, linha do tempo e formulários no celular (390 px), sem transbordamento horizontal. Cores seguem a personalização existente.

As propostas de logo da pasta de identidade permanecem separadas desta entrega.
