# Validação da jornada de estudo — etapa 20

Data: 24/10/2026. Código corrigido: `c7b0cdf`.
Ambiente online: https://planej-ai-dusky.vercel.app/, API no Vercel e MySQL no Aiven.

## Resultado

319 testes automatizados passaram, além do lint e do build do frontend. Os checks do GitHub e a publicação do Vercel foram aprovados. A API de saúde respondeu HTTP 200.

O teste integrado das APIs em produção concluiu nove verificações às 17:31 UTC. Foram usadas duas contas de estudante temporárias, com endereços sintéticos. As contas e seus dados de teste foram removidos ao final; não foram usadas contas de estudantes reais.

| Verificação online | Resultado |
| --- | --- |
| Cadastro e login de duas contas | Aprovado |
| Perfil com ano escolar não informado e sete dias de disponibilidade | Aprovado |
| Geração de cronograma com conteúdo disponível | Aprovado |
| Sessão em andamento e anotação; outra conta não recebe a anotação | Aprovado |
| Novo login recupera perfil, horários, sessão e anotação | Aprovado |
| Conclusão do conteúdo atualiza o progresso e remove a sessão concluída da retomada | Aprovado |
| Registro de estudo, agendamento e avaliação de revisão | Aprovado |
| Lumi responde a uma pergunta sintética pela API de produção | Aprovado |
| Estudante recebe HTTP 403 ao tentar acessar indicadores exclusivos do dono | Aprovado |

## Problemas encontrados e corrigidos

- **Ano escolar opcional:** o frontend enviava uma string vazia, rejeitada pelo ENUM do MySQL em modo estrito. Criação e atualização agora convertem o campo não informado em NULL. A gravação online foi repetida com sucesso depois da publicação.
- **Cronograma:** uma falha de consulta podia aparecer como ausência de plano. Agora há recuperação explícita e nova tentativa, sem oferecer a criação de um plano como resposta ao erro.
- **Provas:** uma falha ao carregar catálogo ou histórico podia parecer um histórico vazio. Agora é apresentada uma mensagem de recuperação. Um resultado de simulado já aberto não é substituído por essa mensagem.
- **Hoje:** falhas no resumo não são apresentadas como progresso zerado ou revisões em dia. O estudante pode continuar a sessão e consultar os indicadores novamente.
- **Atalhos internos:** âncoras comuns em Provas, Redações e na visão do gestor conflitavam com o HashRouter. Agora preservam a rota, rolam até a seção e transferem o foco para ela, respeitando a preferência por movimento reduzido.

## Interface e falhas simuladas

No navegador integrado, em uma janela de 390 × 844 px, foram conferidos o estado de erro do cronograma e sua recuperação pelo botão “Tentar novamente”. A recuperação do catálogo de provas e o atalho “Montar meu simulado” também foram executados no navegador, preservando a rota e o foco na seção correta. Essas conferências usaram respostas simuladas, separadas do teste das APIs online.

A suíte automatizada cobre ainda rascunhos por conta, falhas de salvamento, fila offline, cancelamento de requisições, respostas tardias, timeout, carregamento lento, navegação por teclado, rotas por perfil e tratamento de falhas do provedor da Lumi. A regressão do teclado móvel usa simulação de visualViewport; não substitui teste em aparelho físico.

## Limites da validação

Esta rodada não foi um teste de carga, uma auditoria completa de segurança nem uma homologação em todos os navegadores ou aparelhos físicos. Não foram enviados e-mails reais de recuperação de senha. A verificação de API com novo login confirma persistência entre sessões, mas não representa passagem física de um dia para outro.

O limite de cadastros foi respeitado: as repetições acionaram HTTP 429 e a validação aguardou a próxima janela. Não foram desativadas proteções para executar os testes.

O backup automático externo continua sendo uma pendência operacional já identificada na etapa 15. Consulte `operacao-e-recuperacao.md`; o teste de jornada não configura agendamento nem retenção de backups.

## Repetição dos checks locais

```text
node --test test/*.test.js
npm run lint --prefix frontend
npm run build --prefix frontend
```

Os relatórios locais detalhados e os scripts que acessam credenciais de produção permanecem na pasta ignorada `backups/`. Não publique esses arquivos nem as credenciais.
