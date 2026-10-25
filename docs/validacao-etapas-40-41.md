# Etapas 40 e 41 — Mesa pessoal e Meu entendimento

## Mesa organizada pelo estudante

`/mesa` reúne até seis atalhos para anotações salvas, dúvidas, materiais autorizados e redações próprias. A ordem fica na conta; os botões de subir e descer funcionam por teclado e no celular. Retirar um atalho preserva o original. Os itens não expiram automaticamente ao mudar a semana.

O botão **Fixar na minha mesa** aparece nos resultados da busca, nas anotações confirmadas da sala, no material da sessão, nas redações pessoais e no detalhe de uma dúvida do diário. Não se fixa um rascunho local como se já estivesse salvo na conta. A confirmação só aparece após resposta do servidor; uma repetição do mesmo item não duplica o atalho.

Uma transação com bloqueio da linha da conta serializa as fixações e a ordenação, inclusive entre aparelhos. A referência é única por conta/tipo/origem. O servidor reautoriza o original na fixação, na consulta da mesa e na abertura. Uma anotação própria não concede acesso a materiais ou arquivos de um catálogo indisponível. Títulos e trechos não são copiados para a tabela de atalhos: se o original sumir ou a permissão mudar, o cartão aparece como indisponível sem revelar metadados antigos.

## Progresso que abre o registro original

`/meu-entendimento` apresenta um percurso pessoal em ordem do registro mais recente:

- Versões de explicações a partir da segunda tentativa, com comparação da versão escolhida e da imediatamente anterior.
- Passos de resolução de dúvidas atualmente marcadas como resolvidas pelo próprio estudante.
- Exemplos explicitamente escritos como exemplos nos caminhos das dúvidas.

Cada cartão abre o texto completo do passo exato. A comparação busca a versão anterior por identificador no banco, independentemente do limite de cinquenta passos do histórico do diário. O link para continuar escrevendo abre o diário correspondente. Os textos continuam sendo os originais do estudante; não há avaliação automática de correção, pontuação de domínio, envio à Lumi ou extração automática de exemplos de textos livres. Reabrir uma dúvida a retira dos cartões de resolução na próxima consulta, preservando o histórico.

O percurso carrega vinte cartões por página e seus trechos curtos. Os textos completos são buscados somente ao expandir um cartão. As duas rotas usam carregamento separado do restante da aplicação. As cores seguem a personalização existente, inclusive contraste do texto sobre a cor primária. Os estados de falha são distintos de uma conta sem registros.

## Dados, autorização e publicação

- Migration aditiva `personal_desk_v26.sql`, aplicada e verificada no MySQL local e no Aiven antes da publicação; dados anteriores preservados.
- `mesa_estudo` integra a exportação pessoal e tem exclusão por cascata com a conta. Não há compartilhamento entre estudantes.
- Endpoints dentro de `/api/aprendizagem`, após autenticação, com `Cache-Control: no-store`. O usuário é obtido do token; o cliente não escolhe o proprietário.
- Leituras pessoais não recorrem a cache offline. Escritas não são enfileiradas automaticamente. Os envios conferem a conta no interceptor e as respostas antigas são ignoradas após troca de conta.

## Validação

- Testes de autorização, limite de seis com bloqueio transacional, repetição, ordenação, referências indisponíveis, separação entre anotação/material e consulta da evidência exata.
- Fluxos React de ordenação, retirada preservando o original, abertura das anotações, falha e repetição da fixação, comparação carregada sob demanda e recuperação após indisponibilidade. Axe verifica a navegação e os estados renderizados das novas páginas.
- Integração com MySQL real usando contas e textos fictícios em uma transação revertida: fixação, repetição, ordem, acesso cruzado negado, remoção do original, comparação e preservação da anotação.
- 418 testes passaram na suíte completa local, além do lint e do build de produção. Os checks do GitHub são conferidos antes de encerrar a entrega.
- Prévia isolada com páginas e layout reais e dados fictícios: desktop de 1280 px e celular de 390 px. No modo escuro, a comparação também foi conferida com o maior tamanho de fonte do controle atual (140%, 22,4 px). Não houve rolagem horizontal; versões ficam em uma coluna no celular.
- Capturas locais em `backups/visual-etapas40-41/`: `mesa-desktop.png`, `entendimento-desktop.png`, `mesa-celular.png` e `entendimento-celular-escuro-ampliado.png`. A prévia temporária foi removida do projeto.
