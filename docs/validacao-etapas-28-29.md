# Acessibilidade e carregamento — 24/10/2026

## Etapa 28

- Trocas de rota passam o foco para o título visível quando a página termina de carregar, incluindo rotas lazy. A rotina ignora títulos antigos ocultos, é cancelada ao navegar novamente e não interrompe o preenchimento de um campo que já recebeu foco. Mantém o foco inicial automático dos formulários.
- Cadastro associa instruções e erros aos respectivos campos e foca o primeiro campo inválido após envio. Corrige referências de descrição que antes desapareciam quando surgia um erro.
- Campo de matérias personalizadas recebe nome acessível. Cada horário do planejamento informa início/fim e dia da semana, inclusive na árvore de acessibilidade. Planejamento ganha landmark `main`.
- Com fonte a 200% em 390px, foram identificados controles cortados no planejamento. Horários passam a se reorganizar com rótulos visíveis, ações empilham quando necessário e etapas podem quebrar linha. Nenhuma mudança nas regras do plano.

Verificações: teclado no cadastro e nos horários; nome/descrição dos campos na árvore de acessibilidade; foco após navegação; visual claro/escuro e fonte ampliada por CSS a 200%. Testes axe das rotas existentes e das duas etapas do planejamento, com campos expandidos. O teste axe em JSDOM não mede contraste; cores foram conferidas no navegador e continuam usando os tokens existentes. Não houve ensaio manual com NVDA/VoiceOver, zoom nativo ou aparelho físico; não se trata de certificação integral de acessibilidade.

## Etapa 29

Consultadas métricas agregadas dos últimos sete dias no MySQL, sem dados pessoais. A página inicial pública tinha 20 amostras LCP; Hoje e Aprendizagem, apenas duas cada. Os valores altos nessas duas páginas merecem acompanhamento, mas a amostra não sustenta uma conclusão geral ou uma promessa de melhoria de LCP.

Otimizações verificáveis no código:

1. Conteúdos de um cronograma são buscados em lote e agrupados por dia, preservando ordem e dias sem conteúdo. Antes havia uma consulta por dia.
2. Aprovações de desafios de adiantamento são consultadas uma vez por cronograma e usuário, preservando o bloqueio sequencial das etapas. A validação individual ao abrir uma atividade continua disponível.
3. Formatação Markdown da Lumi só é importada quando uma resposta do assistente precisa ser exibida. Mensagens do estudante e boas-vindas não carregam esse código. Texto simples permanece legível enquanto carrega e se o módulo não puder ser baixado.

### Comparação de leitura, somente consultas

Mesmo cronograma online de **26 dias**, mesma conexão TLS, antes/depois:

| Leitura de estrutura e conteúdos | Antes | Depois |
| --- | ---: | ---: |
| Consultas SQL | 28 | 3 |
| Tempo da execução observada | 5.789 ms | 747 ms |

Resposta JSON idêntica. É uma execução sequencial controlada; não é um percentil de usuários, nem o tempo total de todas as páginas. O teste automatizado com 60 dias também exige três consultas e confere agrupamento e ordem.

No build, o módulo de Markdown fica separado em aproximadamente **159 kB de JavaScript (48 kB gzip)**, carregados sob demanda. O módulo compartilhado de chat passa a aproximadamente 14 kB, mais o pequeno módulo da página; o código ainda será necessário ao exibir respostas formatadas. Não foram adicionadas bibliotecas ou serviços para estas etapas.

## Continuidade

Manter o acompanhamento em `/dono`, observando número de amostras antes de comparar percentis. A coleta com estudantes da etapa 22 permanece com o responsável. Validados testes de bloqueio, isolamento das aprovações por usuário e cronograma, recuperação de foco e regressões dos fluxos principais. Sem migração de banco ou alteração em dados de estudantes.
