# Cronograma transparente e retorno aos estudos — 24/10/2026

## Etapa 24

- Cronograma explica, em uma seção recolhida, como a geração usa áreas de foco, dias livres, blocos aproximados de 30 minutos e possíveis pesos de provas. Distingue o plano da fila de revisões, sem alegar que uma pendência comprova dificuldade. Links levam ao perfil e à fila; os ajustes de rotina existentes continuam disponíveis.
- Cada revisão oferece uma explicação baseada no último resultado realmente registrado. Sem avaliação anterior, informa apenas que a data agendada chegou, sem inventar uma dificuldade.
- O estudante pode confirmar a revisão para amanhã, em 3 ou em 7 dias. A alteração salva apenas `proxima_revisao`, sem registrar resposta, mudar domínio ou concluir a atividade. Disponível somente para a revisão vencida do próprio usuário. Não cria tabela nem exige migração.
- Em caso de falha, não remove o item de forma otimista nem afirma que houve salvamento. Ações não são enfileiradas offline: é preciso confirmar no servidor.

## Etapa 25

- Hoje apresenta a última sessão aberta, a data quando disponível e os conteúdos ainda abertos no plano, sem exigir recuperar tudo de uma vez.
- “Retomar por 5 minutos” abre o conteúdo salvo na conta e um roteiro curto de leitura, explicação e anotação. Abre também as anotações por uma ação explícita. Os cinco minutos são uma sugestão, não tempo contabilizado automaticamente; a duração registrada continua sendo o tempo real da sessão.
- Consultar a sessão anterior não acrescenta requisições à entrada: usa o serviço já existente. Falha ou resposta offline não passam por histórico vazio; oferecem nova consulta. O acesso principal a uma nova lição aguarda a consulta da retomada.
- A etapa 22 permanece com o responsável; não foram atribuídas estas mudanças a feedback de estudantes ainda não coletado.

## Verificações

- Testes de propriedade da revisão, intervalos permitidos, não alteração de domínio e resposta; falha no reagendamento; retomada curta sem conclusão automática; recuperação de indisponibilidade do histórico.
- SQL executado com tabela temporária em uma conexão local isolada: +3 dias confirmado, domínio e resposta preservados, revisão de outro usuário recusada. Nenhum dado de estudante foi usado ou modificado nesse teste.
- Navegador com dados fictícios em 390 × 844: retomada, roteiro curto, anotações e confirmação de reagendamento verificados; sem rolagem horizontal nas telas conferidas. Não substitui testes em aparelhos físicos.
- Sem novas bibliotecas ou imagens no carregamento. Explicações recolhidas evitam alongar a leitura inicial.

Mantidos backups e monitor externo da etapa 21. Publicação segue o fluxo de commits em português e deploy automático do Vercel.
