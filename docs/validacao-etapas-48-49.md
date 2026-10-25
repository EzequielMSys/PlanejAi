# Etapas 48 e 49 — leitura e contexto escolhido da Lumi

## Leitura

O guia de estudo, inclusive quando aberto no visualizador de material, oferece ajustes de tamanho (16 a 28), largura e espaçamento. A unidade relativa acompanha a ampliação global de acessibilidade. Preferências e ponto de leitura ficam separados por conta e aparelho.

O ponto é registrado por seção após a rolagem e pode ser marcado manualmente. Ao reabrir, o estudante escolhe Continuar de onde parei ou Ler desde o início. O retorno procura o título da seção, em vez de usar um deslocamento fixo que mudaria com a fonte. Se o guia mudou e a seção não existe, começa pela primeira seção.

Os controles ajustam os textos do PlanejAI. PDFs, vídeos e páginas externas conservam os controles de seus próprios visualizadores. Não há acesso ao conteúdo de páginas de terceiros nem promessa de retomada dentro de iframes externos. A posição não é sincronizada entre aparelhos; isso é informado na interface.

Se o armazenamento falhar, o texto e os ajustes continuam utilizáveis na tela, com aviso de que não foi possível guardar a preferência ou posição. O marcador não afirma sucesso quando a gravação falha.

## Lumi

A lista O que a Lumi vai usar mostra a matéria e cada item selecionado. A sessão atual aparece explicitamente no chat da sala de estudo. Anotações da sessão e lições disponíveis podem ser adicionadas; dúvidas, anotações e trechos de redação também podem ser colados e revisados antes de adicionar. Cada trecho é limitado a 1.500 caracteres, com até oito itens. Selecionar uma redação oferece seu tema, sem enviar automaticamente o texto completo.

Adicionar ou retirar contexto reinicia a conversa visível para que respostas antigas não reintroduzam registros removidos. Começar sem contexto anterior retira itens, matéria, mensagens anteriores e a tentativa preparada para a prática. Isso não apaga o histórico salvo. O histórico pode ser consultado separadamente e não é incluído no envio da conversa nova.

O frontend envia um contrato explícito com itens escolhidos e até 12 mensagens da conversa atual. O servidor valida e limita campos, aceita somente os papéis user/assistant e não consulta perfil, redação completa ou histórico da conta nesse fluxo. Identificadores arbitrários não permitem buscar registros. O retorno também não acrescenta histórico antigo à conversa atual. Limites diários, autenticação e persistência de mensagens continuam ativos. Clientes anteriores, sem o novo contrato, mantêm compatibilidade com o comportamento anterior.

O provedor continua recebendo a mensagem digitada e, no treino com pistas, a questão/tentativa que o estudante escolhe enviar. Dados escolhidos são tratados pelo prompt como material de estudo, não como instruções de sistema.

## Verificação

A suíte completa passou com 451 testes; lint, build de produção e checagem de sintaxe do backend também passaram.

- Testes de servidor conferem o payload enviado ao provedor com um cliente substituído: seleção vazia não consulta perfil, redação ou histórico; itens desconhecidos e papéis de sistema não entram; contrato inválido falha antes da persistência.
- Testes React cobrem retirada de trecho, reinício sem sessão/matéria, consulta de histórico sem inclusão no contexto, ajustes de leitura, retomada com foco na seção, isolamento de contas e armazenamento indisponível.
- Verificação em Chromium com dados fictícios: leitura em 390 px e em 320 px/fonte 140%, inclusive texto ajustado para 28 (39,2 px com ampliação), sem rolagem horizontal nos estados conferidos.
- Chat em 390 × 430: resumo de contexto com 44 px e campo de mensagem dentro da área visível. Trata-se de simulação de dimensões, não de teclado físico Android/iOS.
- Logs e capturas locais em backups/stage48-*.log, backups/stage49-*.log e backups/visual-etapas48-49/.
- Nenhuma migração de banco ou alteração de registro real de estudante foi necessária. Os testes do provedor usaram substitutos, sem novas chamadas pagas à IA.
