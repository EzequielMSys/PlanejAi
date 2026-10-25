# Etapas 42 e 43 — Revisar por intenção e conectar a identidade das telas

## Revisão por intenção

O estúdio de redação e a oficina de versões têm uma seção **Revisar um trecho com a Lumi**. O estudante escolhe uma intenção: fortalecer o argumento, melhorar a ligação entre parágrafos ou usar melhor o repertório. Pode selecionar diretamente no editor por mouse/teclado ou escolher um parágrafo e, opcionalmente, incluir o seguinte. O trecho aparece para conferência antes do pedido.

A consulta explícita envia somente `intencao` e `trecho` à API autenticada `POST /api/redacao/revisar-intencao`. O backend aceita as três intenções e trechos entre 30 e 3.000 caracteres. Não busca redações de outras contas nem recebe o texto inteiro automaticamente, tema, perfil ou histórico. O texto fornecido pelo cliente é tratado como material de estudo, nunca como instrução para a Lumi.

A resposta traz observação, intervenção localizada, motivo e uma pergunta de reescrita. O prompt pede para manter a tese e a voz do estudante, evitar reescritas completas e não fabricar referências, autores, dados ou citações. A resposta estruturada é validada e renderizada como texto; não é executada como HTML. A consulta não atribui nota.

O trecho original permanece ao lado da sugestão, sem botão para substituir automaticamente a autoria. Há retorno ao editor e download opcional da revisão. Nenhum pedido é feito ao abrir a seção, selecionar texto ou mudar a intenção. A ferramenta não salva respostas no histórico nem altera a redação, suas versões ou o rascunho. Alterar o texto/intenção invalida respostas anteriores, inclusive as que ainda estão em trânsito. Trocas de conta são verificadas no envio e no retorno.

Falhas de provedor, limite ou formato não apagam o texto, não anunciam revisão concluída e permitem nova tentativa explícita. Não há fila offline para consultas. A interface informa o destino do trecho e os limites antes do pedido. O servidor usa os contadores persistentes já existentes: quatro pedidos por minuto e vinte por dia por conta. O provedor tem timeout de 45 segundos e repetição automática desativada; o cliente aguarda até 55 segundos. Tentativas que chegam ao provedor contam no limite mesmo quando falham.

## Identidade visual

Um novo motivo vetorial de páginas ligadas por um fio aparece na entrada, no acesso à conta, na navegação e nas assinaturas das áreas. É um elemento de interface; o logotipo principal não foi substituído. As propostas anteriores de logotipo continuam separadas.

- Hoje, estudo, prática/revisões, redação e Lumi compartilham a construção de páginas conectadas, mantendo suas assinaturas e organização próprias.
- Mesa, Meu entendimento, busca, fontes, cronograma e provas também recebem assinaturas contextualizadas.
- A mesa usa cantos de folha e margens; o percurso de entendimento tem uma linha cronológica. A decoração não cria relações conceituais entre itens fixados sem relação confirmada.
- Títulos compartilham uma família editorial, enquanto textos de estudo e escrita seguem fonte e espaçamento escolhidos pelo usuário. A preferência de fonte para dislexia é respeitada.
- O estúdio oferece uma coluna de escrita mais larga, apoio abaixo do texto, contraste corrigido com tokens da paleta e uma revisão que se adapta à largura da coluna. O modo foco continua rolável até as ações finais.
- Os movimentos novos se limitam a uma entrada curta da assinatura e transições de borda/cor. A preferência do sistema ou do usuário por movimento reduzido os desativa. Não há animação contínua nem nova biblioteca ou fonte remota.
- Os títulos de documento e anúncios acessíveis de Minha mesa e Meu entendimento agora distinguem as duas páginas.

## Verificação

- Testes do backend: limites de entrada e intenções, recorte exato enviado ao provedor, instruções distintas, preservação de autoria, ausência de contexto não escolhido, limites persistentes, indisponibilidade e rejeição de resposta malformada.
- Fluxos React: envio somente por ação explícita, inclusão de parágrafo vizinho, rascunho e redação preservados, falha e repetição, descarte de resposta atrasada, foco de retorno, motivos decorativos e títulos acessíveis. Axe verifica os controles e a resposta expandida.
- MySQL real: os limites de quatro pedidos/minuto e vinte/dia foram exercitados com provedor fictício e contadores fictícios dentro de uma transação revertida. Nenhum usuário real ou texto de produção foi alterado. A funcionalidade reaproveita `limites_requisicao`, sem migration nova. A estrutura dessa tabela também foi conferida no Aiven por consulta somente de metadados, sem alteração de dados.
- Suíte completa local: 428 testes, além de lint e build. Os checks remotos são conferidos na publicação.
- Prévia isolada com layout/componentes reais, texto e resposta fictícios: desktop de 1280 px e celular de 390 px, modo escuro, fonte máxima do controle atual (140%, 22,4 px) e movimento reduzido. Seleção nativa pelo teclado foi conferida. A revisão não apresentou rolagem horizontal; a assinatura teve `animation-name: none` com movimento reduzido. O modo foco manteve rolagem e o envio acessível.
- As capturas da prévia estão em `backups/visual-etapas42-43/`: `redacao-intencao-desktop.png`, `redacao-celular-escuro-ampliado.png`, `identidade-mesa-desktop.png` e `identidade-entrada-desktop.png`. Os arquivos temporários da prévia foram removidos.

A integração de IA foi validada com provedor simulado; estas capturas não representam uma resposta gerada pelo serviço de IA em produção. A disponibilidade real continua dependendo do provedor já configurado para a Lumi.
